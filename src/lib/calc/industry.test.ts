import assert from "node:assert/strict";
import { test } from "node:test";
import { INDUSTRY } from "../../data/industry.ts";
import { crowdingOccupancy, latestStats, mapIndustry } from "./industry.ts";

const defaults = {
  showPassiveCore: true,
  showCits: false,
  showHfEquity: true,
  showHfLongs: true,
  showHfDerivs: false,
  includeDerivsInLeverage: false,
};

test("frozen series runs 2012Q4–2025Q4", () => {
  assert.equal(INDUSTRY[0].date, "2012Q4");
  assert.equal(INDUSTRY.at(-1)?.date, "2025Q4");
  assert.ok(INDUSTRY.length >= 50);
});

test("ICI passive share rose; residual shrank", () => {
  const s = latestStats(defaults);
  assert.ok(s.passiveNow > (s.first.passive ?? 0));
  assert.ok(s.leftoverNow < s.first.leftover);
});

test("crowding is longs over leftover cap", () => {
  const r = INDUSTRY[0];
  const c = crowdingOccupancy(r, defaults);
  const expect = (100 * r.hfAssets) / (r.marketCap * (1 - r.passivePct / 100));
  assert.ok(c != null && Math.abs(c - expect) < 1e-9);
});

test("CIT toggle raises crowding", () => {
  const off = latestStats(defaults).crowdingNow ?? 0;
  const on = latestStats({ ...defaults, showCits: true }).crowdingNow ?? 0;
  assert.ok(on > off);
});

test("asset leverage at end is above 2×", () => {
  const s = latestStats(defaults);
  assert.ok(s.levNow > 2 && s.levNow < 3);
  const withD = latestStats({ ...defaults, includeDerivsInLeverage: true });
  assert.ok(withD.levNow > s.levNow);
});

test("map drops hidden series", () => {
  const hidden = mapIndustry({ ...defaults, showHfLongs: false, showPassiveCore: false });
  assert.equal(hidden[0].hfLongPct, null);
  assert.equal(hidden[0].passive, null);
});
