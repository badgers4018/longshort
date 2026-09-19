import { decompose, type FeeInputs } from "./fees";
import { MASTER_SEED, mulberry32, randn, skewNormal } from "./rng";
import type { ConvexityParams } from "./types";

export const MC_PATHS = 10_000;

export type StrategyId = "beta" | "longshort" | "convex";

export type McSummary = {
  id: StrategyId;
  label: string;
  median: number;
  p5: number;
  p25: number;
  p75: number;
  p95: number;
  winRate: number;
  medianLog: number;
  sharpe: number;
  trueDrag: number;
  approxDrag: number;
  histogram: { x: number; y: number }[];
};

export type McResult = {
  seed: number;
  years: number;
  paths: number;
  summaries: McSummary[];
  crossoverYear: number | null;
  headlineId: StrategyId;
  bins: number[];
  beatBetaRate: number;
};

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
}

function histogram(values: number[], bins: number[], bandwidth = 1) {
  const counts = bins.map(() => 0);
  if (values.length === 0) return counts.map((y, i) => ({ x: bins[i], y }));
  for (const v of values) {
    let best = 0;
    let dist = Infinity;
    for (let i = 0; i < bins.length; i++) {
      const d = Math.abs(v - bins[i]);
      if (d < dist) {
        dist = d;
        best = i;
      }
    }
    counts[best] += 1;
  }
  const max = Math.max(...counts, 1);
  return counts.map((c, i) => ({ x: bins[i], y: (c / max) * bandwidth }));
}

function sharpeOf(mean: number, vol: number, rf: number) {
  if (vol <= 1e-9) return 0;
  return (mean - rf) / vol;
}

export function runMonteCarlo(
  book: FeeInputs,
  convex: ConvexityParams,
  seed = MASTER_SEED,
  paths = MC_PATHS,
): McResult {
  const d = decompose(book);
  const years = Math.max(1, Math.round(book.holdingPeriod));
  const rng = mulberry32(seed);

  const muB = book.equityBeta / 100;
  const sigB = book.equityVol / 100;
  const muLs = d.netArith / 100;
  const sigLs = book.portfolioVol / 100;
  const premium = convex.convexityPremium / 100;
  const rf = book.riskFree / 100;

  const logW: [number[], number[], number[]] = [[], [], []];
  const termW: [number[], number[], number[]] = [[], [], []];
  const arithLs: number[] = [];
  const logLs: number[] = [];
  const wins = [0, 0, 0];
  let beatsBeta = 0;
  const medianPath2: number[] = new Array(years + 1).fill(0);
  const medianPath3: number[] = new Array(years + 1).fill(0);
  // Store yearly log-wealth snapshots for crossover (accumulate then percentile each year).
  const yearLogs2: number[][] = Array.from({ length: years + 1 }, () => []);
  const yearLogs3: number[][] = Array.from({ length: years + 1 }, () => []);

  for (let p = 0; p < paths; p++) {
    let w1 = 1;
    let w2 = 1;
    let w3 = 1;
    yearLogs2[0].push(0);
    yearLogs3[0].push(0);
    let sumR2 = 0;
    let sumLog2 = 0;
    for (let t = 0; t < years; t++) {
      const z = randn(rng);
      const r1 = muB + sigB * z;
      w1 *= Math.max(1e-8, 1 + r1);

      const r2 = skewNormal(rng, muLs, sigLs, convex.skew);
      const clipped2 = Math.max(-0.95, r2);
      w2 *= Math.max(1e-8, 1 + clipped2);
      sumR2 += clipped2;
      sumLog2 += Math.log(Math.max(1e-8, 1 + clipped2));

      let r3 = muB + sigB * z - premium;
      const crash = z < -convex.triggerSigma;
      const extra = rng() < convex.eventFrequency && z < 0;
      if (crash || extra) r3 += convex.payoffMultiple * premium;
      w3 *= Math.max(1e-8, 1 + r3);

      yearLogs2[t + 1].push(Math.log(w2));
      yearLogs3[t + 1].push(Math.log(w3));
    }
    logW[0].push(Math.log(w1));
    logW[1].push(Math.log(w2));
    logW[2].push(Math.log(w3));
    termW[0].push(w1);
    termW[1].push(w2);
    termW[2].push(w3);
    arithLs.push(sumR2 / years);
    logLs.push(sumLog2 / years);
    const trio = [w1, w2, w3];
    const best = trio[0] >= trio[1] && trio[0] >= trio[2] ? 0 : trio[1] >= trio[2] ? 1 : 2;
    wins[best] += 1;
    if (w2 > w1) beatsBeta += 1;
  }

  for (let t = 0; t <= years; t++) {
    yearLogs2[t].sort((a, b) => a - b);
    yearLogs3[t].sort((a, b) => a - b);
    medianPath2[t] = percentile(yearLogs2[t], 0.5);
    medianPath3[t] = percentile(yearLogs3[t], 0.5);
  }

  let crossoverYear: number | null = null;
  for (let t = 1; t <= years; t++) {
    if (medianPath3[t] > medianPath2[t]) {
      crossoverYear = t;
      break;
    }
  }

  const allLogs = logW.flat();
  const lo = percentile([...allLogs].sort((a, b) => a - b), 0.02);
  const hi = percentile([...allLogs].sort((a, b) => a - b), 0.98);
  const binCount = 36;
  const bins = Array.from({ length: binCount }, (_, i) => lo + ((hi - lo) * i) / (binCount - 1));

  const labels: [StrategyId, string][] = [
    ["beta", "Unlevered beta"],
    ["longshort", "Long-short net of fees"],
    ["convex", "Long equity + convexity"],
  ];

  const trueDrag = (arithLs.reduce((s, v) => s + v, 0) / paths - logLs.reduce((s, v) => s + v, 0) / paths) * 100;
  const approxDrag = d.varDrag;

  const means = [muB, muLs, muB - premium];
  const vols = [sigB, sigLs, sigB];

  const summaries: McSummary[] = labels.map(([id, label], i) => {
    const sortedLog = [...logW[i]].sort((a, b) => a - b);
    const sortedW = [...termW[i]].sort((a, b) => a - b);
    return {
      id,
      label,
      median: percentile(sortedW, 0.5),
      p5: percentile(sortedW, 0.05),
      p25: percentile(sortedW, 0.25),
      p75: percentile(sortedW, 0.75),
      p95: percentile(sortedW, 0.95),
      winRate: wins[i] / paths,
      medianLog: percentile(sortedLog, 0.5),
      sharpe: sharpeOf(means[i], vols[i], rf),
      trueDrag: i === 1 ? trueDrag : approxDrag,
      approxDrag,
      histogram: histogram(logW[i], bins),
    };
  });

  const headlineId = summaries.reduce((best, s) => (s.winRate > best.winRate ? s : best)).id;

  return { seed, years, paths, summaries, crossoverYear, headlineId, bins, beatBetaRate: beatsBeta / paths };
}
