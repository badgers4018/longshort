import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function formatPct(n: number, digits = 1) {
  if (!Number.isFinite(n)) return "—";
  const d = Math.min(2, Math.max(0, digits));
  const shown = Math.abs(n) >= 10 ? Math.max(0, d - 1) : d;
  return `${n.toFixed(shown)}%`;
}

export function formatNum(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(Math.min(3, Math.max(0, digits)));
}

export function formatChartNum(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  const d = Math.min(3, Math.max(0, digits));
  let s = n.toFixed(d);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

export function formatRatio(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}×`;
}

export function formatBps(n: number) {
  return `${Math.round(n)} bps`;
}
