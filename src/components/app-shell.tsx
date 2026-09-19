import { useNavigate } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { InlineRange } from "@/components/field";
import { CascadeTab } from "@/components/tabs/cascade-tab";
import { EstimatorTab } from "@/components/tabs/estimator-tab";
import { FeeTab } from "@/components/tabs/fee-tab";
import { IndustryTab } from "@/components/tabs/industry-tab";
import { ReflexivityTab } from "@/components/tabs/reflexivity-tab";
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
  { id: "estimator", label: "Estimator" },
  { id: "reflexivity", label: "Reflexivity" },
  { id: "industry", label: "Industry" },
];

const tabBtn =
  "min-h-12 px-2 py-3 text-center font-ui text-[15px] font-semibold leading-snug tracking-tight sm:text-sm transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/35 focus-visible:ring-offset-2";

const TAB_IDS = new Set(TABS.map((t) => t.id));

export function AppShell({ urlTab }: { urlTab?: TabId }) {
  const p = useParams();
  const navigate = useNavigate();
  const tab = urlTab && TAB_IDS.has(urlTab) ? urlTab : p.tab;

  useEffect(() => {
    if (tab !== p.tab) p.setTab(tab);
    const label = TABS.find((t) => t.id === tab)?.label ?? "Calculator";
    document.title = `${label} · The Multiplicative Indictment`;
  }, [tab]);

  function setTab(id: TabId) {
    p.setTab(id);
    void navigate({
      to: "/",
      search: id === "fees" ? {} : { tab: id },
    });
  }

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
          <p className="text-muted mx-auto mt-4 max-w-md text-base leading-7">
            How much alpha does your hedge fund need to beat the index? You supply the assumptions. The
            arithmetic does not negotiate.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Calculator tabs"
          className="mb-6 grid grid-cols-2 border-2 border-navy sm:grid-cols-4 xl:grid-cols-8"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={cn(
                tabBtn,
                tab === t.id ? "bg-navy text-cream" : "bg-transparent text-navy hover:bg-cream",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mb-8">
          <p className="text-muted mb-1 font-ui text-sm font-medium tracking-kicker uppercase">
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
          <details className="mt-4 rounded-lg bg-cream px-5">
            <summary className="min-h-11 cursor-pointer py-3 font-ui text-sm font-semibold tracking-kicker text-navy uppercase">
              Defaults
            </summary>
            <p className="text-muted pb-2 text-sm leading-6">
              These are starting values. Move any slider; the indictment is yours.
            </p>
            <ul className="text-muted list-disc pb-4 pl-5 text-sm leading-6">
              <li>10-year hold</li>
              <li>1.5-and-20, pod-level netting on, pass-through skipped</li>
              <li>½σ² variance drag — conservative if the book is left-tailed</li>
              <li>Monte Carlo seed 20260910, 10,000 shared draws</li>
              <li>Cascade impact k = 0.09</li>
              <li>Shiller real total returns, 1871–2023</li>
            </ul>
          </details>
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "fees" ? <FeeTab /> : null}
          {tab === "grid" ? <SensitivityTab /> : null}
          {tab === "wealth" ? <WealthTab /> : null}
          {tab === "cascade" ? <CascadeTab /> : null}
          {tab === "history" ? <ShillerTab /> : null}
          {tab === "estimator" ? <EstimatorTab /> : null}
          {tab === "reflexivity" ? <ReflexivityTab /> : null}
          {tab === "industry" ? <IndustryTab /> : null}
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
          <p className="text-subtle mt-3 font-ui text-sm tracking-footer">
            Capital Misallocation · Monte Carlo seed 20260910 · Shiller real total returns, 1871–2023
          </p>
        </footer>
      </div>
    </main>
  );
}
