import { borrowCostPct, shortExposure, weightedBorrowBps, type FeeInputs } from "./fees";
import { MASTER_SEED, mulberry32, randn } from "./rng";
import type { CascadeParams } from "./types";

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

const IMPACT_K = 0.09;
const BORROW_HORIZON = 0.25;

export type Pod = {
  corr: number;
  gross: number;
  net: number;
  short: number;
  pnl: number;
  covered: boolean;
  coverRound: number | null;
};

export type CascadeRound = {
  round: number;
  squeeze: number;
  newlyCovered: number;
  cumulativeCovered: number;
  borrowBps: number;
};

export type CascadeResult = {
  seed: number;
  pods: Pod[];
  rounds: CascadeRound[];
  initialSqueeze: number;
  finalSqueeze: number;
  amplification: number;
  covered: number;
  headline: string;
};

function borrowBpsAt(base: number, frac: number, shape: CascadeParams["borrowSpike"]) {
  if (shape === "linear") return base * (1 + 6 * frac);
  return base * (1 + 12 * frac * frac);
}

export function makePods(
  n: number,
  corrMean: number,
  book: FeeInputs,
  rng: () => number,
): Pod[] {
  const pods: Pod[] = [];
  for (let i = 0; i < n; i++) {
    const corr = clamp(corrMean + 0.14 * randn(rng), 0.1, 0.95);
    const gross = clamp(book.grossExposure * Math.exp(0.55 * randn(rng)), 1.1, 6);
    const net = clamp(book.netExposure + 0.18 * randn(rng), 0, Math.min(1.2, gross - 0.2));
    const short = shortExposure(net, gross);
    pods.push({
      corr,
      gross,
      net,
      short,
      pnl: 0,
      covered: false,
      coverRound: null,
    });
  }
  return pods;
}

export function runCascade(
  book: FeeInputs,
  params: CascadeParams,
  seed = MASTER_SEED + 3,
): CascadeResult {
  const rng = mulberry32(seed);
  const pods = makePods(params.podCount, params.shortCorr, book, rng);
  const totalShort = pods.reduce((s, p) => s + p.short, 0) || 1;
  const baseBorrow = weightedBorrowBps(
    book.borrowGcBps,
    book.borrowCrowdedBps,
    book.crowdedWeight,
  );
  const stop = params.stopOut / 100;
  let squeeze = params.initialSqueeze / 100;
  const rounds: CascadeRound[] = [];
  let coveredNotional = 0;
  let round = 0;
  const maxRounds = Math.max(8, params.podCount);

  while (round < maxRounds) {
    round += 1;
    const frac = coveredNotional / totalShort;
    const bps = borrowBpsAt(baseBorrow, frac, params.borrowSpike);
    const borrow0 = baseBorrow / 10000;
    const borrowNow = bps / 10000;
    let newly = 0;
    let newlyNotional = 0;

    for (const pod of pods) {
      if (pod.covered) continue;
      const pricePnl = -pod.corr * squeeze * pod.gross;
      const borrowPnl = -pod.short * (borrowNow - borrow0) * BORROW_HORIZON;
      pod.pnl = pricePnl + borrowPnl;
      if (pod.pnl <= stop) {
        pod.covered = true;
        pod.coverRound = round;
        newly += 1;
        newlyNotional += pod.short;
      }
    }

    coveredNotional += newlyNotional;
    const coveredFrac = coveredNotional / totalShort;
    rounds.push({
      round,
      squeeze: squeeze * 100,
      newlyCovered: newly,
      cumulativeCovered: pods.filter((p) => p.covered).length,
      borrowBps: borrowBpsAt(baseBorrow, coveredFrac, params.borrowSpike),
    });

    if (newly === 0) break;
    const impact = IMPACT_K * Math.sqrt(Math.max(0, newlyNotional / totalShort));
    squeeze += impact;
  }

  const covered = pods.filter((p) => p.covered).length;
  const finalSqueeze = squeeze * 100;
  const amplification = params.initialSqueeze > 0 ? finalSqueeze / params.initialSqueeze : 0;

  return {
    seed,
    pods,
    rounds,
    initialSqueeze: params.initialSqueeze,
    finalSqueeze,
    amplification,
    covered,
    headline: `A ${params.initialSqueeze.toFixed(1)}% initial move becomes ${finalSqueeze.toFixed(1)}% after cascade with ${params.podCount} pods`,
  };
}

export function amplificationSweep(
  book: FeeInputs,
  params: CascadeParams,
  counts: number[],
) {
  return counts.map((n) => {
    const r = runCascade(book, { ...params, podCount: n }, MASTER_SEED + n);
    return { n, amplification: r.amplification, finalSqueeze: r.finalSqueeze };
  });
}

export function stopSweep(
  book: FeeInputs,
  params: CascadeParams,
  stops: number[],
) {
  return stops.map((stopOut) => {
    const r = runCascade(book, { ...params, stopOut }, MASTER_SEED + 17);
    return { stopOut, amplification: r.amplification, finalSqueeze: r.finalSqueeze };
  });
}

export function cascadeCurve(result: CascadeResult) {
  const points = [{ squeeze: 0, covered: 0 }];
  for (const r of result.rounds) {
    points.push({ squeeze: r.squeeze, covered: r.cumulativeCovered });
  }
  return points;
}

/** Used by Tab 1 to keep borrow cost visible; cascade imports the same helper. */
export function bookBorrowCost(book: FeeInputs) {
  return borrowCostPct(book);
}
