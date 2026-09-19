import { MASTER_SEED, mulberry32, randn } from "./rng";
import type { BookParams, ReflexivityParams, SharedParams } from "./types";

export const N_MANAGERS = 100;
export const HORIZON = 240;
const START_AUM = 500_000_000;
const DEATH_AUM = 100_000_000;
const SHARPE_WINDOW = 36;
const PRE_WINDOW = 12;

export type ReflexMonth = {
  month: number;
  sharpe: number;
  alpha: number;
  gamma: number;
  assets: number;
  cfAssets: number;
};

export type ReflexivityResult = {
  months: ReflexMonth[];
  dischargeMonth: number | null;
  preDischargeSharpe: number;
  preDischargeAlpha: number;
  survivors: number;
};

export type ReflexMonteCarlo = {
  monthsToDischarge: number[];
  medianTerminalWealth: number;
  medianCounterfactualWealth: number;
  histogram: { x: number; n: number }[];
};

type Shared = Pick<SharedParams, "equityBeta" | "riskFree"> & Pick<BookParams, "netExposure" | "portfolioVol">;

function mean(xs: number[]) {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function median(xs: number[]) {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function stdev(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  let ss = 0;
  for (const x of xs) ss += (x - m) * (x - m);
  return Math.sqrt(ss / (xs.length - 1));
}

function trailingSharpe(buf: number[], rfM: number) {
  if (buf.length < SHARPE_WINDOW) return 0;
  const s = stdev(buf);
  if (s < 1e-12) return 0;
  return ((mean(buf) - rfM) / s) * Math.sqrt(12);
}

type Noise = { z: number[][]; u: number[] };

function makeNoise(seed: number): Noise {
  const rng = mulberry32(seed >>> 0);
  const z = Array.from({ length: N_MANAGERS }, () =>
    Array.from({ length: HORIZON }, () => randn(rng)),
  );
  const u = Array.from({ length: HORIZON }, () => rng());
  return { z, u };
}

function simulate(noise: Noise, shared: Shared, params: ReflexivityParams, counterfactual: boolean) {
  const n = N_MANAGERS;
  const betaM = (shared.netExposure * shared.equityBeta) / 100 / 12;
  const sigM = shared.portfolioVol / 100 / Math.sqrt(12);
  const rfM = shared.riskFree / 100 / 12;
  const cap = params.capacityConstant * 1e9;

  const assets = new Array<number>(n).fill(START_AUM);
  const gamma = new Array<number>(n).fill(0);
  const alive = new Array<boolean>(n).fill(true);
  const buf: number[][] = Array.from({ length: n }, () => []);
  let alpha = params.baselineAlpha;
  let dischargeMonth: number | null = null;

  const series: { month: number; sharpe: number; alpha: number; gamma: number; assets: number }[] = [];

  for (let t = 0; t < HORIZON; t++) {
    const sharpes: number[] = [];
    for (let i = 0; i < n; i++) {
      if (!alive[i]) continue;
      const r = betaM + alpha / 100 / 12 + sigM * noise.z[i][t];
      assets[i] *= Math.max(1e-8, 1 + r);
      const b = buf[i];
      b.push(r);
      if (b.length > SHARPE_WINDOW) b.shift();
      if (b.length === SHARPE_WINDOW) {
        const sh = trailingSharpe(b, rfM);
        sharpes.push(sh);
        if (!counterfactual) {
          const flow =
            sh >= 0
              ? params.flowSensitivity * Math.pow(sh, params.flowConvexity)
              : -params.flowSensitivity * 0.5;
          assets[i] *= Math.max(0.05, 1 + flow);
        }
      }
    }

    let total = 0;
    for (let i = 0; i < n; i++) {
      if (alive[i]) total += assets[i];
    }

    alpha = counterfactual
      ? params.baselineAlpha
      : params.baselineAlpha / (1 + total / Math.max(1, cap));

    const gammas: number[] = [];
    if (!counterfactual) {
      for (let i = 0; i < n; i++) {
        if (!alive[i]) continue;
        gamma[i] += params.gammaAccrual * (assets[i] / START_AUM);
        gammas.push(gamma[i]);
      }
      const systemGamma = mean(gammas);
      const prob = Math.min(1, systemGamma * systemGamma * params.dischargeSensitivity);
      if (t + 1 >= SHARPE_WINDOW && noise.u[t] < prob) {
        if (dischargeMonth === null) dischargeMonth = t + 1;
        for (let i = 0; i < n; i++) {
          if (!alive[i]) continue;
          const loss = Math.min(0.95, gamma[i] * params.dischargeSeverity);
          assets[i] *= 1 - loss;
          gamma[i] = 0;
          if (assets[i] < DEATH_AUM) alive[i] = false;
        }
        total = 0;
        for (let i = 0; i < n; i++) {
          if (alive[i]) total += assets[i];
        }
      }
    }

    series.push({
      month: t + 1,
      sharpe: median(sharpes),
      alpha,
      gamma: mean(gammas),
      assets: total / 1e9,
    });
  }

  return {
    series,
    dischargeMonth,
    survivors: alive.filter(Boolean).length,
    terminal: series[series.length - 1]?.assets ?? 0,
  };
}

export function runReflexivity(
  shared: Shared,
  params: ReflexivityParams,
  seed = MASTER_SEED,
): ReflexivityResult {
  const noise = makeNoise(seed);
  const ref = simulate(noise, shared, params, false);
  const cf = simulate(noise, shared, params, true);

  const months: ReflexMonth[] = ref.series.map((m, i) => ({
    ...m,
    cfAssets: cf.series[i]?.assets ?? 0,
  }));

  const d = ref.dischargeMonth;
  let preDischargeSharpe = 0;
  let preDischargeAlpha = ref.series[ref.series.length - 1]?.alpha ?? params.baselineAlpha;
  if (d !== null) {
    const from = Math.max(0, d - PRE_WINDOW);
    const slice = ref.series.slice(from, d);
    preDischargeSharpe = mean(slice.map((m) => m.sharpe));
    preDischargeAlpha = ref.series[d - 1]?.alpha ?? preDischargeAlpha;
  } else {
    const slice = ref.series.slice(-PRE_WINDOW);
    preDischargeSharpe = mean(slice.map((m) => m.sharpe));
  }

  return {
    months,
    dischargeMonth: d,
    preDischargeSharpe,
    preDischargeAlpha,
    survivors: ref.survivors,
  };
}

export function runReflexOnce(shared: Shared, params: ReflexivityParams, seed: number) {
  const noise = makeNoise(seed);
  const ref = simulate(noise, shared, params, false);
  const cf = simulate(noise, shared, params, true);
  return {
    dischargeMonth: ref.dischargeMonth,
    refW: ref.terminal,
    cfW: cf.terminal,
  };
}

function dischargeHist(months: number[]) {
  const bins = Array.from({ length: 20 }, (_, i) => ({ x: (i + 1) * 12, n: 0 }));
  let none = 0;
  for (const m of months) {
    if (m > HORIZON || m < 1) {
      none += 1;
      continue;
    }
    const idx = Math.min(19, Math.floor((m - 1) / 12));
    bins[idx].n += 1;
  }
  if (none) bins.push({ x: 252, n: none });
  return bins;
}

export function summarizeReflexMc(
  monthsToDischarge: number[],
  refW: number[],
  cfW: number[],
): ReflexMonteCarlo {
  return {
    monthsToDischarge,
    medianTerminalWealth: median(refW),
    medianCounterfactualWealth: median(cfW),
    histogram: dischargeHist(monthsToDischarge),
  };
}

export function runReflexMonteCarlo(
  shared: Shared,
  params: ReflexivityParams,
  baseSeed = MASTER_SEED,
  runs = 1_000,
  onProgress?: (done: number) => void,
): ReflexMonteCarlo {
  const monthsToDischarge: number[] = [];
  const refW: number[] = [];
  const cfW: number[] = [];
  for (let i = 0; i < runs; i++) {
    const one = runReflexOnce(shared, params, baseSeed + 17 + i);
    monthsToDischarge.push(one.dischargeMonth ?? HORIZON + 12);
    refW.push(one.refW);
    cfW.push(one.cfW);
    if (onProgress && (i + 1) % 20 === 0) onProgress(i + 1);
  }
  return summarizeReflexMc(monthsToDischarge, refW, cfW);
}
