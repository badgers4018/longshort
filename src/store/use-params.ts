import { create } from "zustand";
import type { AppParams, AxisKey, BorrowSpike, TabId } from "@/lib/calc/types";

export const DEFAULTS: AppParams = {
  equityBeta: 9,
  equityVol: 16,
  riskFree: 4,
  grossAlpha: 6,
  netExposure: 0.5,
  grossExposure: 2,
  portfolioVol: 8,
  borrowGcBps: 25,
  borrowCrowdedBps: 300,
  crowdedWeight: 20,
  mgmtFee: 1.5,
  incentiveFee: 20,
  podNetting: true,
  passThrough: 0,
  showPassThrough: false,
  holdingPeriod: 10,
  skew: -0.5,
  convexityPremium: 1.5,
  payoffMultiple: 8,
  triggerSigma: 2,
  eventFrequency: 0.08,
  podCount: 50,
  stopOut: -5,
  shortCorr: 0.6,
  initialSqueeze: 3,
  borrowSpike: "convex",
  windowYears: 10,
  allInFee: 5,
  hedgedVolReduction: 50,
  shillerAlpha: 2,
  gridX: "totalFeeLoad",
  gridY: "volatility",
  trackRecord: 60,
  screenThreshold: 1.5,
  trueSharpeM: 0.1,
  trueSharpeS: 0.3,
  returnDist: "skew-normal",
  baselineAlpha: 4,
  capacityConstant: 200,
  flowSensitivity: 0.02,
  flowConvexity: 2,
  gammaAccrual: 0.005,
  dischargeSensitivity: 0.8,
  dischargeSeverity: 3,
  showCounterfactual: true,
  showPassiveCore: true,
  showCits: false,
  showHfEquity: true,
  showHfLongs: true,
  showHfDerivs: false,
  includeDerivsInLeverage: false,
  tab: "fees",
};

type Store = AppParams & {
  setParam: <K extends keyof AppParams>(key: K, value: AppParams[K]) => void;
  setTab: (tab: TabId) => void;
  setAxes: (x: AxisKey, y: AxisKey) => void;
  setBorrowSpike: (v: BorrowSpike) => void;
  reset: () => void;
};

export const useParams = create<Store>((set) => ({
  ...DEFAULTS,
  setParam: (key, value) => set({ [key]: value } as Partial<AppParams>),
  setTab: (tab) => set({ tab }),
  setAxes: (gridX, gridY) => set({ gridX, gridY: gridX === gridY ? DEFAULTS.gridY : gridY }),
  setBorrowSpike: (borrowSpike) => set({ borrowSpike }),
  reset: () => set({ ...DEFAULTS }),
}));
