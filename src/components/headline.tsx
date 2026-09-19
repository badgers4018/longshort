import type { RefObject } from "react";
import { CopyPng } from "@/components/copy-png";

export function TabHeader({
  kicker,
  text,
  filename,
  targetRef,
}: {
  kicker: string;
  text: string;
  filename: string;
  targetRef: RefObject<HTMLElement | null>;
}) {
  return (
    <div className="rounded-lg bg-cream px-5 py-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        {kicker ? (
          <p className="text-muted pt-1 font-ui text-sm font-semibold tracking-kicker uppercase">{kicker}</p>
        ) : (
          <span />
        )}
        <div className="no-export shrink-0">
          <CopyPng targetRef={targetRef} filename={filename} />
        </div>
      </div>
      <p className="font-display text-title font-medium tracking-[-0.02em] text-navy leading-[1.3]">{text}</p>
    </div>
  );
}

export function Headline({ kicker, text }: { kicker?: string; text: string }) {
  return (
    <div className="rounded-lg bg-cream px-5 py-4">
      {kicker ? (
        <p className="text-muted mb-2 font-ui text-sm font-semibold tracking-kicker uppercase">{kicker}</p>
      ) : null}
      <p className="font-display text-title font-medium tracking-[-0.02em] text-navy leading-[1.3]">{text}</p>
    </div>
  );
}

export function Stat({
  label,
  value,
  tone = "ink",
  hint,
}: {
  label: string;
  value: string;
  tone?: "ink" | "gold" | "oxblood" | "win";
  hint?: string;
}) {
  const color =
    tone === "gold"
      ? "text-gold-deep"
      : tone === "oxblood"
        ? "text-ox"
        : tone === "win"
          ? "text-win"
          : "text-navy";
  return (
    <div className="min-w-0">
      <div className="text-muted font-ui text-sm font-medium tracking-kicker uppercase">{label}</div>
      <div className={`tabular mt-1 font-display text-2xl font-medium tracking-tight ${color}`}>{value}</div>
      {hint ? <div className="text-muted mt-1 text-sm leading-snug">{hint}</div> : null}
    </div>
  );
}
