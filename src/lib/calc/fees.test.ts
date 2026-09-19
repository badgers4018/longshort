import assert from "node:assert/strict";
import { test } from "node:test";
import { breakEvenAlpha, decompose, type FeeInputs } from "./fees.ts";

const input: FeeInputs = {
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
  mgmtFee: 2,
  incentiveFee: 20,
  podNetting: true,
  passThrough: 1,
  holdingPeriod: 10,
};

test("default book: weighted borrow is 80 bps", () => {
  const d = decompose(input);
  assert.equal(d.weightedBorrowBps, 80);
});

test("default book: short exposure is 0.75", () => {
  const d = decompose(input);
  assert.equal(d.shortExposure, 0.75);
});

test("default book: net geometric trails unlevered beta", () => {
  const d = decompose(input);
  assert.ok(d.netGeo < d.betaGeo, `${d.netGeo} !< ${d.betaGeo}`);
});

test("break-even alpha is above the 6% default", () => {
  const be = breakEvenAlpha(input);
  assert.ok(be > 6, `be=${be}`);
  assert.ok(be < 15, `be=${be}`);
});

test("at break-even alpha, net geo matches beta geo", () => {
  const be = breakEvenAlpha(input);
  const d = decompose({ ...input, grossAlpha: be });
  assert.ok(Math.abs(d.netGeo - d.betaGeo) < 0.02, `${d.netGeo} vs ${d.betaGeo}`);
});

test("no netting raises the incentive bill", () => {
  const netted = decompose(input);
  const open = decompose({ ...input, podNetting: false });
  assert.ok(open.incentive > netted.incentive);
});

test("variance drag is ½σ²", () => {
  const d = decompose(input);
  assert.ok(Math.abs(d.varDrag - 0.5 * 0.08 * 0.08 * 100) < 1e-9);
});
