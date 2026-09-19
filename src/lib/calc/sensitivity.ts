import { fullBreakdown, type FeeInputs } from "./fees";
import type { AxisKey } from "./types";

export type { AxisKey };

export const AXIS_LABEL: Record<AxisKey, string> = {
  grossAlpha: "Gross alpha",
  totalFeeLoad: "Fee scale",
  volatility: "Book vol",
  netExposure: "Net exposure",
  borrowCost: "Crowded borrow",
  holdingPeriod: "Holding period",
};

export const AXIS_UNIT: Record<AxisKey, string> = {
  grossAlpha: "%",
  totalFeeLoad: "×",
  volatility: "%",
  netExposure: "×",
  borrowCost: "bps",
  holdingPeriod: "yr",
};

const AXIS_VALUES: Record<AxisKey, number[]> = {
  grossAlpha: [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, 12],
  totalFeeLoad: [0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2],
  volatility: [4, 6, 8, 10, 12, 14, 16, 20, 24],
  netExposure: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1],
  borrowCost: [50, 100, 150, 200, 300, 400, 500, 700, 1000],
  holdingPeriod: [3, 5, 7, 10, 12, 15, 20, 25, 30],
};

export function axisValues(key: AxisKey) {
  return AXIS_VALUES[key];
}

export function applyAxis(input: FeeInputs, key: AxisKey, value: number): FeeInputs {
  switch (key) {
    case "grossAlpha":
      return { ...input, grossAlpha: value };
    case "totalFeeLoad":
      return {
        ...input,
        mgmtFee: input.mgmtFee * value,
        passThrough: input.passThrough * value,
        incentiveFee: input.incentiveFee * value,
      };
    case "volatility":
      return { ...input, portfolioVol: value };
    case "netExposure":
      return {
        ...input,
        netExposure: Math.min(value, input.grossExposure),
      };
    case "borrowCost":
      return { ...input, borrowCrowdedBps: value };
    case "holdingPeriod":
      return { ...input, holdingPeriod: value };
  }
}

export type GridCell = {
  x: number;
  y: number;
  breakEven: number;
  spread: number;
  wealthRatio: number;
  tone: "win" | "near" | "lose";
};

export function currentAxisValue(input: FeeInputs, key: AxisKey): number {
  switch (key) {
    case "grossAlpha":
      return input.grossAlpha;
    case "totalFeeLoad":
      return 1;
    case "volatility":
      return input.portfolioVol;
    case "netExposure":
      return input.netExposure;
    case "borrowCost":
      return input.borrowCrowdedBps;
    case "holdingPeriod":
      return input.holdingPeriod;
  }
}

export function nearestIndex(values: number[], target: number) {
  let best = 0;
  let dist = Infinity;
  for (let i = 0; i < values.length; i++) {
    const d = Math.abs(values[i] - target);
    if (d < dist) {
      dist = d;
      best = i;
    }
  }
  return best;
}

export function buildGrid(input: FeeInputs, xKey: AxisKey, yKey: AxisKey): GridCell[][] {
  const xs = axisValues(xKey);
  const ys = axisValues(yKey);
  return ys.map((y) =>
    xs.map((x) => {
      const patched = applyAxis(applyAxis(input, yKey, y), xKey, x);
      const d = fullBreakdown(patched);
      const spread = input.grossAlpha - d.breakEvenAlpha;
      const tone: GridCell["tone"] =
        Math.abs(spread) <= 0.5 ? "near" : spread > 0 ? "win" : "lose";
      return {
        x,
        y,
        breakEven: d.breakEvenAlpha,
        spread,
        wealthRatio: d.terminalWealthRatio,
        tone,
      };
    }),
  );
}
