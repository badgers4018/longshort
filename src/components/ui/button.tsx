import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "gold";

const styles: Record<Variant, string> = {
  primary: "bg-navy text-cream hover:bg-navy-deep",
  secondary: "bg-surface text-navy shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] hover:bg-cream",
  ghost: "bg-transparent text-muted hover:text-navy hover:bg-cream",
  gold: "bg-navy text-cream hover:bg-navy-deep",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 font-ui text-sm font-semibold tracking-tight whitespace-nowrap transition-[background-color,color,box-shadow,transform,opacity] duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:ring-2 focus-visible:ring-navy/35 focus-visible:ring-offset-2 focus-visible:ring-offset-paper focus-visible:outline-none active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-40",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
