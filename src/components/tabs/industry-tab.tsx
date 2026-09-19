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
import { CHART_TICK, GOLD, LINE, MUTED, NAVY, OX, CHART_LEGEND } from "@/lib/palette";
import { formatChartNum, formatPct } from "@/lib/utils";
import { useParams } from "@/store/use-params";

function trillions(b: number) {
  return `$${(b / 1000).toFixed(1)}T`;
}

export function IndustryTab() {
  const p = useParams();
  const rootRef = useRef<HTMLElement>(null);
  const toggles: IndustryToggles = {
    showPassiveCore: p.showPassiveCore,
    showCits: p.showCits,
    showHfEquity: p.showHfEquity,
    showHfLongs: p.showHfLongs,
    showHfDerivs: p.showHfDerivs,
    includeDerivsInLeverage: p.includeDerivsInLeverage,
  };
  const s = useMemo(() => latestStats(toggles), [
    p.showPassiveCore,
    p.showCits,
    p.showHfEquity,
    p.showHfLongs,
    p.showHfDerivs,
    p.includeDerivsInLeverage,
  ]);

  const set = p.setParam;
  const crowding = s.crowdingNow;
  const leftoverDrop = s.first.leftover - s.leftoverNow;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section ref={rootRef} className="space-y-6">
        <TabHeader
          kicker="Tab 8 · Industry float"
          text={`Price-insensitive capital is ${formatPct(s.passiveNow, 0)} of listed US equity, up from ${formatPct(s.firstRaw.passivePct, 0)} in 2012. Residual float shrank ${formatPct(leftoverDrop, 0)}. Form PF books are ${s.levNow.toFixed(1)}× levered.`}
          filename="industry-float.png"
          targetRef={rootRef}
        />

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          <Stat label="Passive share" value={formatPct(s.passiveNow, 0)} tone="gold" hint="ICI index domestic equity funds + ETFs" />
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
              <LineChart data={s.series} margin={{ top: 8, right: 8, left: -8, bottom: 36 }}>
                <CartesianGrid stroke={LINE} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={CHART_TICK}
                  interval={3}
                  tickFormatter={(v) => (String(v).endsWith("Q4") ? String(v).slice(0, 4) : "")}
                />
                <YAxis
                  yAxisId="l"
                  tick={CHART_TICK}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${formatChartNum(Number(v), 0)}%`}
                />
                <YAxis
                  yAxisId="r"
                  orientation="right"
                  tick={CHART_TICK}
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
            Residual is listed US equity minus whichever passive lines are on. Hedge-fund equity capital and longs are not slices of that pie — they include credit, cash, and global. Crowding is longs sitting on the leftover cap. Toggle CITs on and the red line should jump.
          </p>
        </div>

        <div>
          <h3 className="text-muted mb-3 font-ui text-sm font-medium tracking-kicker uppercase">
            Form PF asset leverage
          </h3>
          <div className="h-48 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)] md:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={s.series} margin={{ top: 8, right: 8, left: -8, bottom: 32 }}>
                <CartesianGrid stroke={LINE} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={CHART_TICK}
                  interval={3}
                  tickFormatter={(v) => (String(v).endsWith("Q4") ? String(v).slice(0, 4) : "")}
                />
                <YAxis tick={CHART_TICK} tickFormatter={(v) => `${formatChartNum(Number(v), 1)}×`} />
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
          Passive is ICI Fig 2.6 (domestic index MF + ETF). CITs are 60% of ICI total CIT AUM, annual, interpolated — off until you want the wider pile. Market cap is Fed L.224 public corporate equities (listed-US, Wilshire universe).
        </p>
      </aside>
    </div>
  );
}
