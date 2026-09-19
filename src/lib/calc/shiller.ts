import {
  SHILLER_END,
  SHILLER_RETURNS,
  SHILLER_START_MONTH,
  SHILLER_START_YEAR,
} from "../../data/shiller-returns";
import type { BookParams } from "./types";

export type WindowResult = {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  betaGeo: number;
  hedgedGeo: number;
  betaArith: number;
  betaVol: number;
  hedgedVol: number;
  ratio: number;
  hedgedWins: boolean;
};

export type ShillerResult = {
  windows: WindowResult[];
  n: number;
  winRate: number;
  feeExceededRate: number;
  medianRatio: number;
  winningVol: number;
  losingVol: number;
  winningReturn: number;
  losingReturn: number;
  start: string;
  end: string;
  windowYears: number;
};

function monthIndexToDate(i: number) {
  const abs = (SHILLER_START_YEAR * 12 + (SHILLER_START_MONTH - 1)) + i;
  const year = Math.floor(abs / 12);
  const month = (abs % 12) + 1;
  return { year, month };
}

function mean(xs: number[]) {
  if (xs.length === 0) return 0;
  return xs.reduce((s, v) => s + v, 0) / xs.length;
}

function stdev(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  let ss = 0;
  for (const x of xs) ss += (x - m) * (x - m);
  return Math.sqrt(ss / (xs.length - 1));
}

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
}

export function runShillerWindows(
  book: Pick<BookParams, "netExposure">,
  windowYears: number,
  allInFee: number,
  hedgedVolReduction: number,
  alpha: number,
): ShillerResult {
  const m = Math.max(12, Math.round(windowYears * 12));
  const rets = SHILLER_RETURNS;
  const windows: WindowResult[] = [];

  for (let i = 0; i + m <= rets.length; i += 3) {
    // step 3 months: denser than annual, cheaper than every month
    const slice = rets.slice(i, i + m);
    const arithM = mean(slice);
    const volM = stdev(slice);
    const betaArith = arithM * 12 * 100;
    const betaVol = volM * Math.sqrt(12) * 100;
    let logSum = 0;
    for (const r of slice) logSum += Math.log(Math.max(1e-8, 1 + r));
    const betaGeo = (logSum / windowYears) * 100;
    const hedgedVol = betaVol * (1 - hedgedVolReduction / 100);
    const hedgedGeo =
      book.netExposure * betaArith + alpha - allInFee - 0.5 * (hedgedVol / 100) ** 2 * 100;
    const ratio = Math.exp(((hedgedGeo - betaGeo) / 100) * windowYears);
    windows.push({
      ...(() => {
        const s = monthIndexToDate(i);
        const e = monthIndexToDate(i + m - 1);
        return {
          startYear: s.year,
          startMonth: s.month,
          endYear: e.year,
          endMonth: e.month,
        };
      })(),
      betaGeo,
      hedgedGeo,
      betaArith,
      betaVol,
      hedgedVol,
      ratio,
      hedgedWins: hedgedGeo > betaGeo,
    });
  }

  const winning = windows.filter((w) => w.hedgedWins);
  const losing = windows.filter((w) => !w.hedgedWins);
  const ratios = windows.map((w) => w.ratio).sort((a, b) => a - b);

  return {
    windows,
    n: windows.length,
    winRate: windows.length ? winning.length / windows.length : 0,
    feeExceededRate: windows.length ? losing.length / windows.length : 0,
    medianRatio: percentile(ratios, 0.5),
    winningVol: mean(winning.map((w) => w.betaVol)),
    losingVol: mean(losing.map((w) => w.betaVol)),
    winningReturn: mean(winning.map((w) => w.betaGeo)),
    losingReturn: mean(losing.map((w) => w.betaGeo)),
    start: `${SHILLER_START_YEAR}-${String(SHILLER_START_MONTH).padStart(2, "0")}`,
    end: SHILLER_END,
    windowYears,
  };
}

export function ratioHistogram(windows: WindowResult[], bins = 24) {
  if (windows.length === 0) return [];
  const xs = windows.map((w) => w.ratio);
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  const width = Math.max(1e-6, (hi - lo) / bins);
  const counts = Array.from({ length: bins }, (_, i) => ({
    x: lo + (i + 0.5) * width,
    n: 0,
  }));
  for (const x of xs) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((x - lo) / width)));
    counts[idx].n += 1;
  }
  return counts;
}
