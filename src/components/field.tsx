import { cn } from "@/lib/utils";

function snap(value: number, step: number) {
  const decimals = (String(step).split(".")[1] ?? "").length;
  return Number((Math.round(value / step) * step).toFixed(Math.min(6, decimals)));
}

type RangeProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
};

export function InlineRange({ label, value, min, max, step, onChange, format }: RangeProps) {
  const display = format ? format(value) : String(value);
  return (
    <label className="text-muted flex min-w-[140px] flex-1 items-center gap-3 font-ui text-xs">
      <span className="shrink-0 font-medium">{label}</span>
      <input
        type="range"
        className="cm-range min-w-0 flex-1"
        min={min}
        max={max}
        step={step}
        value={snap(value, step)}
        aria-label={label}
        onChange={(e) => onChange(snap(Number(e.target.value), step))}
      />
      <span className="min-w-[4.75rem] shrink-0 text-right tabular-nums text-navy">{display}</span>
    </label>
  );
}

export function Field({ label, value, min, max, step, onChange, format, hint }: RangeProps) {
  const display = format ? format(value) : String(value);

  return (
    <label className="block">
      <div className="mb-0.5 flex items-baseline justify-between gap-3">
        <span className="text-muted font-ui text-xs font-medium">{label}</span>
        <span className="min-w-[4.75rem] text-right font-ui text-xs tabular-nums text-navy">{display}</span>
      </div>
      <input
        type="range"
        className="cm-range w-full"
        min={min}
        max={max}
        step={step}
        value={snap(value, step)}
        aria-label={label}
        onChange={(e) => onChange(snap(Number(e.target.value), step))}
      />
      {hint ? <div className="text-subtle -mt-2 font-ui text-[10px] tracking-wide">{hint}</div> : null}
    </label>
  );
}

export function Toggle({
  label,
  value,
  onChange,
  yes = "Yes",
  no = "No",
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  yes?: string;
  no?: string;
}) {
  return (
    <div>
      <div className="text-muted mb-2 font-ui text-xs font-medium">{label}</div>
      <div className="inline-flex h-11 items-center rounded-md bg-cream p-0.5">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "h-10 min-w-11 rounded-sm px-3 font-ui text-xs font-semibold transition-[background-color,color] duration-[var(--motion-quick)] ease-[var(--ease-out)]",
            value ? "bg-navy text-cream" : "text-muted hover:text-navy",
          )}
        >
          {yes}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "h-10 min-w-11 rounded-sm px-3 font-ui text-xs font-semibold transition-[background-color,color] duration-[var(--motion-quick)] ease-[var(--ease-out)]",
            !value ? "bg-navy text-cream" : "text-muted hover:text-navy",
          )}
        >
          {no}
        </button>
      </div>
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <span className="text-muted mb-1.5 block font-ui text-xs font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-11 w-full rounded-md bg-surface px-3 font-ui text-sm text-navy shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-navy/35"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
