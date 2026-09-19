import { useEffect, useMemo, useRef, useState } from "react";
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
import { Pause, Play } from "lucide-react";
import { Field, Toggle } from "@/components/field";
import { TabHeader, Stat } from "@/components/headline";
import { Button } from "@/components/ui/button";
import { ChartTip } from "@/components/charts/chart-tip";
import { cascadeCurve, runCascade, type CascadeResult } from "@/lib/calc/cascade";
import { fromApp } from "@/lib/calc/fees";
import { formatChartNum, formatPct } from "@/lib/utils";
import { useParams } from "@/store/use-params";

import { GOLD, LINE, CHART_TICK, NAVY, OX, CHART_LEGEND } from "@/lib/palette";

export function CascadeTab() {
  const p = useParams();
  const rootRef = useRef<HTMLElement>(null);
  const [result, setResult] = useState<CascadeResult | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const params = {
    podCount: p.podCount,
    stopOut: p.stopOut,
    shortCorr: p.shortCorr,
    initialSqueeze: p.initialSqueeze,
    borrowSpike: p.borrowSpike,
  };

  function run() {
    const r = runCascade(fromApp(p), params);
    setResult(r);
    setStep(r.rounds.length);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || !result) return;
    const id = window.setInterval(() => {
      setStep((s) => {
        if (s >= result.rounds.length) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 500);
    return () => window.clearInterval(id);
  }, [playing, result]);

  const visible = useMemo(() => {
    if (!result) return [];
    const all = cascadeCurve(result);
    return all.slice(0, Math.max(1, step + 1));
  }, [result, step]);

  const borrowSeries = useMemo(() => {
    if (!result) return [];
    return result.rounds.slice(0, Math.max(1, step)).map((r) => ({
      round: r.round,
      squeeze: r.squeeze,
      borrow: r.borrowBps,
      covered: r.cumulativeCovered,
    }));
  }, [result, step]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section ref={rootRef} className="space-y-6">
        <TabHeader
          kicker="Tab 4 · Crowding & liquidation"
          text={result ? result.headline : "A shared short book, hard stops, and a squeeze."}
          filename="liquidation-cascade.png"
          targetRef={rootRef}
        />

        {!result ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg bg-cream px-6 text-center">
            <p className="text-muted max-w-md text-sm">
              Mechanical, single-event. No time series. Run to see how a 3% squeeze becomes something else
              once pods with correlated shorts hit their stops.
            </p>
            <Button onClick={run}>
              Run simulation
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep(0);
                  setPlaying(true);
                }}
              >
                {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                {playing ? "Playing" : "Play cascade"}
              </Button>
              <Button variant="ghost" onClick={() => { setStep(result.rounds.length); setPlaying(false); }}>
                Jump to end
              </Button>
              <Button variant="ghost" onClick={run}>
                Re-run
              </Button>
              <span className="text-muted text-sm">
                Round {Math.min(step, result.rounds.length)} / {result.rounds.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="Amplification" value={`${result.amplification.toFixed(1)}×`} tone="oxblood" />
              <Stat label="Final squeeze" value={formatPct(result.finalSqueeze)} />
              <Stat label="Pods liquidated" value={`${result.covered} / ${result.pods.length}`} />
              <Stat
                label="Borrow, last print"
                value={`${(result.rounds[Math.min(step, result.rounds.length) - 1] ?? result.rounds[0]).borrowBps.toFixed(0)} bps`}
              />
            </div>

            <div>
              <h3 className="text-muted mb-3 font-ui text-sm font-medium tracking-kicker uppercase">Cascade curve</h3>
              <div className="h-56 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)] md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visible} margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
                    <CartesianGrid stroke={LINE} />
                    <XAxis dataKey="squeeze" tickFormatter={(v) => `${Number(v).toFixed(1)}%`} tick={CHART_TICK} />
                    <YAxis tick={CHART_TICK} tickFormatter={(v) => formatChartNum(Number(v), 0)} />
                    <Tooltip content={<ChartTip format={(n) => formatChartNum(n, 1)} />} />
                    <Line type="monotone" dataKey="covered" name="Pods liquidated" stroke={OX} strokeWidth={2.5} dot={{ r: 3, fill: GOLD }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="text-muted mb-3 font-ui text-sm font-medium tracking-kicker uppercase">Borrow trajectory</h3>
              <div className="h-44 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={borrowSeries} margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
                    <CartesianGrid stroke={LINE} />
                    <XAxis dataKey="round" tick={CHART_TICK} />
                    <YAxis yAxisId="l" tick={CHART_TICK} tickFormatter={(v) => formatChartNum(Number(v), 0)} />
                    <YAxis yAxisId="r" orientation="right" tick={CHART_TICK} tickFormatter={(v) => formatChartNum(Number(v), 1)} />
                    <Legend iconSize={CHART_LEGEND.iconSize} wrapperStyle={CHART_LEGEND.wrapperStyle} />
                    <Tooltip content={<ChartTip format={(n) => formatChartNum(n, 1)} />} />
                    <Line yAxisId="l" type="monotone" dataKey="borrow" name="Borrow bps" stroke={GOLD} strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line yAxisId="r" type="monotone" dataKey="squeeze" name="Squeeze %" stroke={NAVY} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </section>

      <aside className="space-y-4 rounded-lg bg-cream p-5">
        <h3 className="font-display text-title font-medium text-navy">The squeeze</h3>
        <Field label="Number of pods" value={p.podCount} min={10} max={200} step={10} onChange={(v) => p.setParam("podCount", v)} />
        <Field label="Stop-out threshold" value={p.stopOut} min={-10} max={-2} step={0.5} onChange={(v) => p.setParam("stopOut", v)} format={(v) => formatPct(v)} />
        <Field label="Short-book correlation" value={p.shortCorr} min={0.1} max={0.95} step={0.05} onChange={(v) => p.setParam("shortCorr", v)} format={(v) => v.toFixed(2)} />
        <Field label="Initial squeeze" value={p.initialSqueeze} min={1} max={10} step={0.5} onChange={(v) => p.setParam("initialSqueeze", v)} format={(v) => formatPct(v)} />
        <Toggle
          label="Borrow spike function"
          value={p.borrowSpike === "convex"}
          yes="Convex"
          no="Linear"
          onChange={(v) => p.setBorrowSpike(v ? "convex" : "linear")}
        />
        <p className="text-muted text-sm leading-relaxed">
          Price impact is square-root in newly covered notional. Tighter stops and more pods both raise
          amplification — the industry's own growth is the cascade.
        </p>
        <Button onClick={run} className="w-full">
          Run simulation
        </Button>
      </aside>
    </div>
  );
}
