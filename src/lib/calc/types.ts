export type BorrowSpike = "linear" | "convex";

export type AxisKey =
  | "grossAlpha"
  | "totalFeeLoad"
  | "volatility"
  | "netExposure"
  | "borrowCost"
  | "holdingPeriod";

export type TabId = "fees" | "grid" | "wealth" | "cascade" | "history";

export type SharedParams = {
  equityBeta: number;
  equityVol: number;
  riskFree: number;
};

export type BookParams = {
  grossAlpha: number;
  netExposure: number;
  grossExposure: number;
  portfolioVol: number;
  borrowGcBps: number;
  borrowCrowdedBps: number;
  crowdedWeight: number;
  mgmtFee: number;
  incentiveFee: number;
  podNetting: boolean;
  passThrough: number;
  holdingPeriod: number;
};

export type ConvexityParams = {
  skew: number;
  convexityPremium: number;
  payoffMultiple: number;
  triggerSigma: number;
  eventFrequency: number;
};

export type CascadeParams = {
  podCount: number;
  stopOut: number;
  shortCorr: number;
  initialSqueeze: number;
  borrowSpike: BorrowSpike;
};

export type ShillerParams = {
  windowYears: number;
  allInFee: number;
  hedgedVolReduction: number;
  shillerAlpha: number;
};

export type GridParams = {
  gridX: AxisKey;
  gridY: AxisKey;
};

export type AppParams = SharedParams &
  BookParams &
  ConvexityParams &
  CascadeParams &
  ShillerParams &
  GridParams & {
    tab: TabId;
  };

export type FeeBreakdown = {
  shortExposure: number;
  longExposure: number;
  weightedBorrowBps: number;
  borrowCost: number;
  mgmt: number;
  passThrough: number;
  incentive: number;
  totalFeeLoad: number;
  grossReturn: number;
  betaContribution: number;
  netArith: number;
  varDrag: number;
  netGeo: number;
  betaGeo: number;
  betaArith: number;
  breakEvenAlpha: number;
  terminalWealthRatio: number;
  transfer: number;
  deadweight: number;
  fairCompensation: number;
  wealthHf: number;
  wealthBeta: number;
};
