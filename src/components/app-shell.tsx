import { RotateCcw } from "lucide-react";
import { InlineRange } from "@/components/field";
import { CascadeTab } from "@/components/tabs/cascade-tab";
import { FeeTab } from "@/components/tabs/fee-tab";
import { SensitivityTab } from "@/components/tabs/sensitivity-tab";
import { ShillerTab } from "@/components/tabs/shiller-tab";
import { WealthTab } from "@/components/tabs/wealth-tab";
import { Button } from "@/components/ui/button";
import { cn, formatPct } from "@/lib/utils";
import { useParams } from "@/store/use-params";
import type { TabId } from "@/lib/calc/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "fees", label: "Fee decomposition" },
  { id: "grid", label: "Sensitivity" },
  { id: "wealth", label: "Terminal wealth" },
  { id: "cascade", label: "Cascade" },
  { id: "history", label: "Shiller windows" },
];

const tabBtn =
  "min-h-12 px-2 py-3 text-center font-ui text-sm font-semibold leading-tight tracking-tight transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/35 focus-visible:ring-offset-2";

export function AppShell() {
  const p = useParams();

  return (
    <main className="min-h-dvh bg-paper font-ui text-navy">
      <div className="mx-auto w-full max-w-5xl px-5 pt-10 pb-20 sm:px-8 sm:pt-14">
        <header className="mb-10 text-center">
          <img
            src="/logo.png"
            alt=""
            width={320}
            height={320}
            className="mx-auto size-20 select-none sm:size-24"
            draggable={false}
            aria-hidden="true"
          />
          <div className="mt-6 font-ui text-xs font-semibold tracking-mark text-navy uppercase">
            Capital Misallocation
          </div>
          <h1 className="mt-3 font-display text-display font-medium tracking-[-0.025em] text-navy leading-[1.15]">
            The Multiplicative Indictment
          </h1>
          <p className="text-muted mx-auto mt-4 max-w-md text-sm leading-6">
            How much alpha does your hedge fund need to beat the index? You supply the assumptions. The
            arithmetic does not negotiate.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Calculator tabs"
          className="mb-6 grid grid-cols-2 border-2 border-navy sm:grid-cols-5"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={p.tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={p.tab === t.id ? 0 : -1}
              onClick={() => p.setTab(t.id)}
              className={cn(
                tabBtn,
                p.tab === t.id ? "bg-navy text-cream" : "bg-transparent text-navy hover:bg-cream",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mb-8">
          <p className="text-muted mb-1 font-ui text-xs font-medium tracking-kicker uppercase">
            Market — feeds every tab
          </p>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-3">
            <InlineRange
              label="Equity beta return"
              value={p.equityBeta}
              min={4}
              max={14}
              step={0.5}
              onChange={(v) => p.setParam("equityBeta", v)}
              format={(v) => formatPct(v)}
            />
            <InlineRange
              label="Equity beta vol"
              value={p.equityVol}
              min={8}
              max={30}
              step={1}
              onChange={(v) => p.setParam("equityVol", v)}
              format={(v) => formatPct(v, 0)}
            />
            <InlineRange
              label="Risk-free rate"
              value={p.riskFree}
              min={0}
              max={8}
              step={0.25}
              onChange={(v) => p.setParam("riskFree", v)}
              format={(v) => formatPct(v, 2)}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => p.reset()}>
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>
        </div>

        <div role="tabpanel" id={`panel-${p.tab}`} aria-labelledby={`tab-${p.tab}`}>
          {p.tab === "fees" ? <FeeTab /> : null}
          {p.tab === "grid" ? <SensitivityTab /> : null}
          {p.tab === "wealth" ? <WealthTab /> : null}
          {p.tab === "cascade" ? <CascadeTab /> : null}
          {p.tab === "history" ? <ShillerTab /> : null}
        </div>

        <footer className="mt-16 border-t border-line pt-10 text-center">
          <img
            src="/logo.png"
            alt=""
            width={320}
            height={320}
            className="mx-auto mb-5 size-9 select-none opacity-70"
            draggable={false}
            aria-hidden="true"
          />
          <p className="text-muted mx-auto max-w-lg font-display text-base leading-7 italic">
            Nobody can attack assumptions that are yours.
          </p>
          <p className="text-subtle mt-3 font-ui text-xs tracking-footer">
            Capital Misallocation · Monte Carlo seed 20260910 · Shiller real total returns, 1871–2023
          </p>
        </footer>
      </div>
    </main>
  );
}
