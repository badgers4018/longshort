import { MASTER_SEED, mulberry32, randn, skewNormal } from "./rng";
import type { EstimatorParams, ReturnDist, SharedParams } from "./types";

export const N_MANAGERS = 1_000;
export const MAX_MONTHS = 240;
export const SWEEP_MIN = 24;
export const SWEEP_STEP = 6;
const SKEW_ALPHA = -3;
const T_DF = 5;
const FP_CUT = 0.5;
const BIN_LO = -0.5;
const BIN_HI = 3;
const BIN_W = 0.1;

export type EstimatorResult = {
  selected: number;
  total: number;
  falsePositiveRate: number;
  medianTrueSharpe: number;
  trueDistribution: { bin: number; count: number }[];
};

export type SweepPoint = {
  months: number;
  normalFPR: number;
  skewFPR: number;
  studentFPR: number;
};

function randt(rng: () => number, df: number) {
  const x = randn(rng);
  let c = 0;
  for (let i = 0; i < df; i++) {
    const z = randn(rng);
    c += z * z;
  }
  return x / Math.sqrt(c / df);
}

function drawReturn(rng: () => number, dist: ReturnDist, mu: number, sigma: number) {
  if (dist === "normal") return mu + sigma * randn(rng);
  if (dist === "skew-normal") return skewNormal(rng, mu, sigma, SKEW_ALPHA);
  const t = randt(rng, T_DF);
  return mu + sigma * (t / Math.sqrt(T_DF / (T_DF - 2)));
}

function meanStd(xs: number[]) {
  const n = xs.length;
  let m = 0;
  for (const x of xs) m += x;
  m /= Math.max(1, n);
  let ss = 0;
  for (const x of xs) ss += (x - m) * (x - m);
  return { mean: m, std: Math.sqrt(ss / Math.max(1, n - 1)) };
}

function sampleSharpe(rets: number[], rfMonthly: number) {
  const { mean, std } = meanStd(rets);
  if (std < 1e-12) return 0;
  return ((mean - rfMonthly) / std) * Math.sqrt(12);
}

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
}

function histogram(values: number[]) {
  const nBins = Math.round((BIN_HI - BIN_LO) / BIN_W);
  const bins = Array.from({ length: nBins }, (_, i) => ({
    bin: BIN_LO + (i + 0.5) * BIN_W,
    count: 0,
  }));
  for (const v of values) {
    const idx = Math.min(nBins - 1, Math.max(0, Math.floor((v - BIN_LO) / BIN_W)));
    bins[idx].count += 1;
  }
  return bins;
}

function distSeed(seed: number, dist: ReturnDist) {
  if (dist === "normal") return seed;
  if (dist === "skew-normal") return seed + 1;
  return seed + 2;
}

function simulateManagers(
  params: EstimatorParams,
  shared: Pick<SharedParams, "equityVol" | "riskFree">,
  dist: ReturnDist,
  seed: number,
) {
  const rng = mulberry32(distSeed(seed, dist) >>> 0);
  const volA = shared.equityVol / 100;
  const sigM = volA / Math.sqrt(12);
  const rfM = shared.riskFree / 100 / 12;
  const trueS = new Array<number>(N_MANAGERS);
  const rets: number[][] = new Array(N_MANAGERS);
  for (let i = 0; i < N_MANAGERS; i++) {
    const S = params.trueSharpeM + params.trueSharpeS * randn(rng);
    trueS[i] = S;
    const mu = rfM + (S * volA) / 12;
    const path = new Array<number>(MAX_MONTHS);
    for (let t = 0; t < MAX_MONTHS; t++) path[t] = drawReturn(rng, dist, mu, sigM);
    rets[i] = path;
  }
  return { trueS, rets, rfM };
}

function fprAt(
  trueS: number[],
  rets: number[][],
  rfM: number,
  months: number,
  threshold: number,
) {
  let selected = 0;
  let falsePos = 0;
  for (let i = 0; i < trueS.length; i++) {
    const sh = sampleSharpe(rets[i].slice(0, months), rfM);
    if (sh >= threshold) {
      selected += 1;
      if (trueS[i] < FP_CUT) falsePos += 1;
    }
  }
  return selected === 0 ? 0 : (falsePos / selected) * 100;
}

export function runEstimator(
  params: EstimatorParams,
  shared: Pick<SharedParams, "equityVol" | "riskFree">,
  seed = MASTER_SEED,
): EstimatorResult {
  const { trueS, rets, rfM } = simulateManagers(params, shared, params.returnDist, seed);
  const months = Math.max(SWEEP_MIN, Math.min(MAX_MONTHS, Math.round(params.trackRecord)));
  const selectedTrue: number[] = [];
  for (let i = 0; i < N_MANAGERS; i++) {
    const sh = sampleSharpe(rets[i].slice(0, months), rfM);
    if (sh >= params.screenThreshold) selectedTrue.push(trueS[i]);
  }
  const sorted = [...selectedTrue].sort((a, b) => a - b);
  const fp = selectedTrue.filter((s) => s < FP_CUT).length;
  return {
    selected: selectedTrue.length,
    total: N_MANAGERS,
    falsePositiveRate: selectedTrue.length ? (fp / selectedTrue.length) * 100 : 0,
    medianTrueSharpe: percentile(sorted, 0.5),
    trueDistribution: histogram(selectedTrue),
  };
}

export function sweepTrackRecord(
  params: EstimatorParams,
  shared: Pick<SharedParams, "equityVol" | "riskFree">,
  seed = MASTER_SEED,
): SweepPoint[] {
  const dists: ReturnDist[] = ["normal", "skew-normal", "student-t"];
  const sims = dists.map((d) => simulateManagers(params, shared, d, seed));
  const out: SweepPoint[] = [];
  for (let months = SWEEP_MIN; months <= MAX_MONTHS; months += SWEEP_STEP) {
    out.push({
      months,
      normalFPR: fprAt(sims[0].trueS, sims[0].rets, sims[0].rfM, months, params.screenThreshold),
      skewFPR: fprAt(sims[1].trueS, sims[1].rets, sims[1].rfM, months, params.screenThreshold),
      studentFPR: fprAt(sims[2].trueS, sims[2].rets, sims[2].rfM, months, params.screenThreshold),
    });
  }
  return out;
}

export function distLabel(d: ReturnDist) {
  if (d === "normal") return "normal returns";
  if (d === "skew-normal") return "skew-normal returns (α = −3)";
  return "Student-t returns (df = 5)";
}
