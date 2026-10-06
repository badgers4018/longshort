import type { AppParams, BookParams, FeeBreakdown, SharedParams } from "./types";

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export type FeeInputs = SharedParams & BookParams;

export function shortExposure(net: number, gross: number) {
  return Math.max(0, (gross - net) / 2);
}

export function longExposure(net: number, gross: number) {
  return Math.max(0, (gross + net) / 2);
}

export function weightedBorrowBps(gc: number, crowded: number, weightPct: number) {
  const w = clamp(weightPct / 100, 0, 1);
  return gc * (1 - w) + crowded * w;
}

/** Borrow cost as percent of NAV: short exposure × weighted bps / 100. */
export function borrowCostPct(input: FeeInputs) {
  const short = shortExposure(input.netExposure, input.grossExposure);
  const bps = weightedBorrowBps(
    input.borrowGcBps,
    input.borrowCrowdedBps,
    input.crowdedWeight,
  );
  return (short * bps) / 100;
}

export function marginDebit(net: number, gross: number) {
  return Math.max(0, longExposure(net, gross) - 1);
}

/** Mode (c): no idle cash. Rebate on short proceeds, financing on the debit. */
export function carryPct(input: FeeInputs) {
  const s = shortExposure(input.netExposure, input.grossExposure);
  const d = marginDebit(input.netExposure, input.grossExposure);
  const b = weightedBorrowBps(input.borrowGcBps, input.borrowCrowdedBps, input.crowdedWeight) / 100;
  const rebateRate = input.riskFree - b - input.rebateSpreadBps / 100;
  const financingRate = input.riskFree + input.debitSpreadBps / 100;
  return {
    short: s,
    debit: d,
    borrowPct: b,
    rebateRate,
    financingRate,
    rebateIncome: s * rebateRate,
    financingCost: d * financingRate,
  };
}

export function grossReturnPct(input: FeeInputs) {
  const beta = input.netExposure * input.equityBeta;
  if (!input.showShortRebate) return beta + input.grossAlpha;
  const c = carryPct(input);
  return beta + input.grossAlpha + c.rebateIncome - c.financingCost;
}

export function incentivePct(input: FeeInputs, gross: number, fixedCosts: number) {
  const r = clamp(input.incentiveFee / 100, 0, 1);
  if (input.podNetting) {
    return r * Math.max(0, gross - fixedCosts);
  }
  // No fund-level netting: winning sleeves pay even when losers offset.
  // Charge the incentive on alpha, on the positive beta contribution, and on
  // a positive short rebate, without deducting costs. Strictly ≥ the netted bill.
  const rebate = input.showShortRebate ? Math.max(0, carryPct(input).rebateIncome) : 0;
  return (
    r * Math.max(0, input.grossAlpha) +
    r * Math.max(0, input.netExposure * input.equityBeta) +
    r * rebate
  );
}

function wealthFromGeo(geoPct: number, years: number) {
  return Math.exp((geoPct / 100) * years);
}

function transferOfFees(feeLoadPct: number, netGeoPct: number, years: number) {
  const f = feeLoadPct / 100;
  const g = netGeoPct / 100;
  if (Math.abs(g) < 1e-12) return f * years * 100;
  return f * ((Math.exp(g * years) - 1) / g) * 100;
}

function feesCompoundedAtBeta(
  feeLoadPct: number,
  netGeoPct: number,
  betaGeoPct: number,
  years: number,
) {
  const f = feeLoadPct / 100;
  const g = netGeoPct / 100;
  const b = betaGeoPct / 100;
  const d = g - b;
  if (Math.abs(d) < 1e-12) return f * years * Math.exp(b * years) * 100;
  return ((f * (Math.exp(g * years) - Math.exp(b * years))) / d) * 100;
}

export function decompose(input: FeeInputs): FeeBreakdown {
  const short = shortExposure(input.netExposure, input.grossExposure);
  const long = longExposure(input.netExposure, input.grossExposure);
  const wBps = weightedBorrowBps(
    input.borrowGcBps,
    input.borrowCrowdedBps,
    input.crowdedWeight,
  );
  const borrow = borrowCostPct(input);
  const carry = carryPct(input);
  const rebateOn = input.showShortRebate;
  const rebateIncome = rebateOn ? carry.rebateIncome : 0;
  const financingCost = rebateOn ? carry.financingCost : 0;
  const mgmt = input.mgmtFee;
  const pass = input.passThrough;
  const betaContribution = input.netExposure * input.equityBeta;
  const gross = betaContribution + input.grossAlpha + rebateIncome - financingCost;
  const stockLoan = rebateOn ? 0 : borrow;
  const fixed = mgmt + pass + stockLoan;
  const incentive = incentivePct(input, gross, fixed);
  const totalFeeLoad = mgmt + incentive + pass + stockLoan;
  const netArith = gross - totalFeeLoad;
  const sig = input.portfolioVol / 100;
  const varDrag = 0.5 * sig * sig * 100;
  const netGeo = netArith - varDrag;
  const betaSig = input.equityVol / 100;
  const betaArith = input.equityBeta;
  const betaGeo = betaArith - 0.5 * betaSig * betaSig * 100;
  const T = input.holdingPeriod;
  const wealthHf = wealthFromGeo(netGeo, T);
  const wealthBeta = wealthFromGeo(betaGeo, T);
  const terminalWealthRatio = wealthBeta > 0 ? wealthHf / wealthBeta : 0;
  const transfer = transferOfFees(totalFeeLoad, netGeo, T);
  const fvFees = feesCompoundedAtBeta(totalFeeLoad, netGeo, betaGeo, T);
  const excessDelivered = (wealthHf - wealthBeta) * 100;
  const fairCompensation = Math.max(0, Math.min(fvFees, Math.max(0, excessDelivered)));
  const deadweight = Math.max(0, fvFees - fairCompensation);

  return {
    shortExposure: short,
    longExposure: long,
    weightedBorrowBps: wBps,
    borrowCost: borrow,
    rebateIncome,
    financingCost,
    marginDebit: carry.debit,
    mgmt,
    passThrough: pass,
    incentive,
    totalFeeLoad,
    grossReturn: gross,
    betaContribution,
    netArith,
    varDrag,
    netGeo,
    betaGeo,
    betaArith,
    breakEvenAlpha: 0,
    terminalWealthRatio,
    transfer,
    deadweight,
    fairCompensation,
    wealthHf,
    wealthBeta,
  };
}

export function breakEvenAlpha(input: FeeInputs): number {
  const target = decompose(input).betaGeo;
  let lo = -10;
  let hi = 50;
  const geoAt = (alpha: number) => decompose({ ...input, grossAlpha: alpha }).netGeo;
  let guard = 0;
  while (geoAt(lo) > target && guard++ < 40) lo -= 5;
  guard = 0;
  while (geoAt(hi) < target && guard++ < 40) hi += 5;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (geoAt(mid) >= target) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export function fullBreakdown(input: FeeInputs): FeeBreakdown {
  const d = decompose(input);
  return { ...d, breakEvenAlpha: breakEvenAlpha(input) };
}

export function fromApp(p: AppParams): FeeInputs {
  return {
    equityBeta: p.equityBeta,
    equityVol: p.equityVol,
    riskFree: p.riskFree,
    grossAlpha: p.grossAlpha,
    netExposure: p.netExposure,
    grossExposure: p.grossExposure,
    portfolioVol: p.portfolioVol,
    borrowGcBps: p.borrowGcBps,
    borrowCrowdedBps: p.borrowCrowdedBps,
    crowdedWeight: p.crowdedWeight,
    mgmtFee: p.mgmtFee,
    incentiveFee: p.incentiveFee,
    podNetting: p.podNetting,
    passThrough: p.passThrough,
    holdingPeriod: p.holdingPeriod,
    showShortRebate: p.showShortRebate,
    rebateSpreadBps: p.rebateSpreadBps,
    debitSpreadBps: p.debitSpreadBps,
  };
}

/** Fully invested long: net 1.0, no short, so borrow is zero. Same fee contract. */
export function unleveredBook(input: FeeInputs): FeeInputs {
  return { ...input, netExposure: 1, grossExposure: 1 };
}
