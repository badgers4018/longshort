import { useMemo, useRef } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Toggle } from "@/components/field";
import { TabHeader, Stat } from "@/components/headline";
import { ChartTip } from "@/components/charts/chart-tip";
import { latestStats, type IndustryToggles } from "@/lib/calc/industry";
import { INDUSTRY_VINTAGE } from "@/data/industry";
import { CHART_TICK, GOLD, LINE, MUTED, NAVY, OX, WIN, CHART_LEGEND } from "@/lib/palette";
import { formatChartNum, formatPct } from "@/lib/utils";
import { useParams } from "@/store/use-params";

function trillions(b: number) {
  return `$${(b / 1000).toFixed(1)}T`;
}

const YEAR_TICKS = ["2012Q4", "2015Q4", "2018Q4", "2021Q4", "2025Q4"];

export function IndustryTab() {
  const p = useParams();
  const rootRef = useRef<HTMLElement>(null);
  const toggles: IndustryToggles = {
    showPassiveCore: p.showPassiveCore,
    showCits: p.showCits,
    showWiderPassive: p.showWiderPassive,
    showHfEquity: p.showHfEquity,
    showHfLongs: p.showHfLongs,
    showHfDerivs: p.showHfDerivs,
    includeDerivsInLeverage: p.includeDerivsInLeverage,
  };
  const s = useMemo(() => latestStats(toggles), [
    p.showPassiveCore,
    p.showCits,
    p.showWiderPassive,
    p.showHfEquity,
    p.showHfLongs,
    p.showHfDerivs,
    p.includeDerivsInLeverage,
  ]);

  const set = p.setParam;
  const crowding = s.crowdingNow;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section ref={rootRef} className="space-y-6">
        <TabHeader
          kicker="Appendix · not one of the essay's seven"
          text={`Registered index funds are ${formatPct(s.passiveNow, 0)}. Doubling that book for separate accounts and adding CITs is ${formatPct(s.widerNow, 0)}. Green's ~54% still includes index derivatives this estimate does not.`}
          filename="industry-float.png"
          targetRef={rootRef}
        />

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          <Stat
            label="Wider passive (est.)"
            value={formatPct(s.widerNow, 0)}
            tone="win"
            hint="Registered × 2 for separate accounts, plus CITs. Not Green's 54%."
          />
          <Stat label="Residual float" value={formatPct(s.leftoverNow, 0)} hint="Wilshire-comparable listed US minus passive on" />
          <Stat
            label="HF occupancy of residual"
            value={crowding == null ? "—" : formatPct(crowding, 0)}
            tone="oxblood"
            hint="Form PF longs ÷ leftover cap"
          />
          <Stat
            label="Asset leverage"
            value={`${s.levNow.toFixed(2)}×`}
            tone="oxblood"
            hint={p.includeDerivsInLeverage ? "Longs + derivative notionals / equity capital" : "Long assets / equity capital"}
          />
        </div>

        <div>
          <h3 className="text-muted mb-3 font-ui text-sm font-medium tracking-kicker uppercase">
            Share of listed US equity · crowding on the right axis
          </h3>
          <div className="h-72 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)] md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={s.series} margin={{ top: 12, right: 8, left: 4, bottom: 28 }}>
                <CartesianGrid stroke={LINE} vertical={false} />
                <XAxis
                  dataKey="date"
                  ticks={YEAR_TICKS}
                  interval={0}
                  tick={CHART_TICK}
                  tickMargin={6}
                  padding={{ left: 12, right: 28 }}
                  tickFormatter={(v) => String(v).slice(0, 4)}
                />
                <YAxis
                  yAxisId="l"
                  width={36}
                  tick={CHART_TICK}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${formatChartNum(Number(v), 0)}%`}
                />
                <YAxis
                  yAxisId="r"
                  orientation="right"
                  width={36}
                  tick={CHART_TICK}
                  domain={s.crowdingDomain}
                  allowDataOverflow
                  tickFormatter={(v) => `${formatChartNum(Number(v), 0)}%`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(28,28,28,0.04)" }}
                  content={<ChartTip format={(n) => `${formatChartNum(n, 1)}%`} />}
                />
                <Legend iconSize={CHART_LEGEND.iconSize} wrapperStyle={CHART_LEGEND.wrapperStyle} />
                <Line yAxisId="l" type="monotone" dataKey="leftover" name="Residual float" stroke={MUTED} strokeDasharray="6 4" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
                {p.showPassiveCore ? (
                  <Line yAxisId="l" type="monotone" dataKey="passive" name="Index funds + ETFs" stroke={GOLD} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                ) : null}
                {p.showWiderPassive ? (
                  <Line yAxisId="l" type="monotone" dataKey="wider" name="Registered ×2 + CITs" stroke={WIN} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                ) : null}
                {p.showCits ? (
                  <Line yAxisId="l" type="monotone" dataKey="citPct" name="CIT equity (est.)" stroke={GOLD} strokeDasharray="4 3" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
                ) : null}
                {p.showHfEquity ? (
                  <Line yAxisId="l" type="monotone" dataKey="hfNavPct" name="HF equity capital" stroke={NAVY} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                ) : null}
                {p.showHfLongs ? (
                  <Line yAxisId="l" type="monotone" dataKey="hfLongPct" name="HF long assets" stroke={NAVY} strokeDasharray="3 3" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
                ) : null}
                {p.showHfDerivs ? (
                  <Line yAxisId="l" type="monotone" dataKey="hfGrossPct" name="Longs + deriv notionals" stroke={OX} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
                ) : null}
                <Line yAxisId="r" type="monotone" dataKey="crowding" name="HF / residual" stroke={OX} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            The green line doubles the registered book for separate accounts and adds CITs once. It ends near {formatPct(s.widerNow, 0)}. It is an estimate, not a measured series, and it is still short of Green's ~54% because index futures, swaps, and options are not in it. When that line is on, residual uses it instead of the gold line so the registered book is not counted twice.
          </p>
        </div>

        <div>
          <h3 className="text-muted mb-3 font-ui text-sm font-medium tracking-kicker uppercase">
            Form PF asset leverage
          </h3>
          <div className="h-48 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)] md:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={s.series} margin={{ top: 12, right: 12, left: 4, bottom: 28 }}>
                <CartesianGrid stroke={LINE} vertical={false} />
                <XAxis
                  dataKey="date"
                  ticks={YEAR_TICKS}
                  interval={0}
                  tick={CHART_TICK}
                  tickMargin={6}
                  padding={{ left: 12, right: 28 }}
                  tickFormatter={(v) => String(v).slice(0, 4)}
                />
                <YAxis
                  width={36}
                  tick={CHART_TICK}
                  domain={s.leverageDomain}
                  allowDataOverflow
                  tickFormatter={(v) => `${formatChartNum(Number(v), 1)}×`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(28,28,28,0.04)" }}
                  content={<ChartTip format={(n) => `${formatChartNum(n, 2)}×`} />}
                />
                <Legend iconSize={CHART_LEGEND.iconSize} wrapperStyle={CHART_LEGEND.wrapperStyle} />
                <Line type="monotone" dataKey="leverage" name="Long assets / equity" stroke={NAVY} strokeWidth={2} dot={false} isAnimationActive={false} />
                {p.includeDerivsInLeverage ? (
                  <Line type="monotone" dataKey="leverageWithDeriv" name="Including deriv longs" stroke={OX} strokeWidth={2} dot={false} isAnimationActive={false} />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Total assets here are Form PF longs excluding derivatives. Turn the toggle to add notional derivative longs — that is not the Tab 1 gross slider.
          </p>
        </div>
      </section>

      <aside className="space-y-4 rounded-lg bg-cream p-5">
        <h3 className="font-display text-title font-medium text-navy">Industry</h3>
        <Toggle label="Index funds + equity ETFs" value={p.showPassiveCore} onChange={(v) => set("showPassiveCore", v)} yes="On" no="Off" />
        <Toggle label="401(k) CIT equity" value={p.showCits} onChange={(v) => set("showCits", v)} yes="On" no="Off" />
        <Toggle label="Registered ×2 + CITs" value={p.showWiderPassive} onChange={(v) => set("showWiderPassive", v)} yes="On" no="Off" />
        <Toggle label="HF equity capital" value={p.showHfEquity} onChange={(v) => set("showHfEquity", v)} yes="On" no="Off" />
        <Toggle label="HF long assets" value={p.showHfLongs} onChange={(v) => set("showHfLongs", v)} yes="On" no="Off" />
        <Toggle label="HF + derivative notionals" value={p.showHfDerivs} onChange={(v) => set("showHfDerivs", v)} yes="On" no="Off" />
        <Toggle
          label="Leverage includes derivatives"
          value={p.includeDerivsInLeverage}
          onChange={(v) => set("includeDerivsInLeverage", v)}
          yes="On"
          no="Off"
        />
        <p className="text-muted text-sm leading-relaxed">
          Listed US equity {trillions(s.last.marketCap)} · HF equity capital {trillions(s.lastRaw.hfNav)} · longs{" "}
          {trillions(s.lastRaw.hfAssets)}. {INDUSTRY_VINTAGE}.
        </p>
        <p className="text-muted text-sm leading-relaxed">
          Passive on this chart is ICI Fig 2.6 (domestic index mutual funds + ETFs) — about 19% of the market. Mike Green’s ~54% (Excess Returns, January 2026) is a different object: separate accounts he treats as roughly the same size as that registered book, plus CITs and index derivatives. CITs here are 60% of ICI total CIT assets, annual, interpolated. Market cap is Fed L.224 public corporate equities.
        </p>
      </aside>
    </div>
  );
}
