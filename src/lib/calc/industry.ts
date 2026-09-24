import { INDUSTRY, type IndustryRow } from "../../data/industry.ts";

export type IndustryToggles = {
  showPassiveCore: boolean;
  showCits: boolean;
  showHfEquity: boolean;
  showHfLongs: boolean;
  showHfDerivs: boolean;
  includeDerivsInLeverage: boolean;
};

export type IndustryPoint = {
  date: string;
  year: number;
  q: number;
  marketCap: number;
  passive: number | null;
  citPct: number | null;
  leftover: number;
  hfNavPct: number | null;
  hfLongPct: number | null;
  hfStockPct: number | null;
  hfGrossPct: number | null;
  crowding: number | null;
  leverage: number;
  leverageWithDeriv: number;
};

function citPct(r: IndustryRow) {
  if (r.citEquity == null || r.marketCap <= 0) return null;
  return (100 * r.citEquity) / r.marketCap;
}

export function passiveShare(r: IndustryRow, p: IndustryToggles) {
  let s = 0;
  if (p.showPassiveCore) s += r.passivePct;
  if (p.showCits) {
    const c = citPct(r);
    if (c != null) s += c;
  }
  return s;
}

export function crowdingOccupancy(r: IndustryRow, p: IndustryToggles) {
  const pass = passiveShare(r, p) / 100;
  const residual = r.marketCap * (1 - pass);
  if (residual <= 0) return null;
  let num = 0;
  let any = false;
  if (p.showHfLongs) {
    num += r.hfAssets;
    any = true;
    if (p.showHfDerivs) num += r.hfDeriv;
  } else if (p.showHfEquity) {
    num += r.hfNav;
    any = true;
  }
  if (!any) return null;
  return (100 * num) / residual;
}

export function mapIndustry(p: IndustryToggles): IndustryPoint[] {
  return INDUSTRY.map((r) => {
    const c = citPct(r);
    const pass = passiveShare(r, p);
    return {
      date: r.date,
      year: r.year,
      q: r.q,
      marketCap: r.marketCap,
      passive: p.showPassiveCore ? r.passivePct : null,
      citPct: p.showCits ? c : null,
      leftover: 100 - pass,
      hfNavPct: p.showHfEquity ? (100 * r.hfNav) / r.marketCap : null,
      hfLongPct: p.showHfLongs ? (100 * r.hfAssets) / r.marketCap : null,
      hfStockPct: (100 * r.hfStocks) / r.marketCap,
      hfGrossPct: p.showHfDerivs ? (100 * (r.hfAssets + r.hfDeriv)) / r.marketCap : null,
      crowding: crowdingOccupancy(r, p),
      leverage: r.hfAssets / r.hfNav,
      leverageWithDeriv: (r.hfAssets + r.hfDeriv) / r.hfNav,
    };
  });
}

function zoomFromLow(vals: number[], empty: [number, number]): [number, number] {
  if (!vals.length) return empty;
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const start = Math.max(0, lo * 0.7);
  const pad = Math.max(hi * 0.02, (hi - start) * 0.08);
  return [start, hi + pad];
}

export function crowdingAxis(series: IndustryPoint[]): [number, number] {
  const vals = series.map((p) => p.crowding).filter((n): n is number => n != null && Number.isFinite(n));
  return zoomFromLow(vals, [0, 100]);
}

export function leverageAxis(series: IndustryPoint[], includeDerivs: boolean): [number, number] {
  const vals = series.flatMap((p) =>
    includeDerivs ? [p.leverage, p.leverageWithDeriv] : [p.leverage],
  );
  return zoomFromLow(vals, [0, 3]);
}

export function latestStats(p: IndustryToggles) {
  const series = mapIndustry(p);
  const first = series[0];
  const last = series[series.length - 1];
  const lastRaw = INDUSTRY[INDUSTRY.length - 1];
  const firstRaw = INDUSTRY[0];
  return {
    first,
    last,
    lastRaw,
    firstRaw,
    series,
    crowdingDomain: crowdingAxis(series),
    leverageDomain: leverageAxis(series, p.includeDerivsInLeverage),
    passiveNow: last.passive ?? 0,
    leftoverNow: last.leftover,
    crowdingNow: last.crowding,
    levNow: p.includeDerivsInLeverage ? last.leverageWithDeriv : last.leverage,
    levThen: p.includeDerivsInLeverage ? first.leverageWithDeriv : first.leverage,
  };
}
