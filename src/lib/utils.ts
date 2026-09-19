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
  const abs = Math.abs(n);
  const d = abs >= 10 ? Math.max(0, digits - 1) : digits;
  return `${n.toFixed(d)}%`;
}

export function formatNum(n: number, digits = 2) {
  return n.toFixed(digits);
}

export function formatRatio(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}×`;
}

export function formatBps(n: number) {
  return `${Math.round(n)} bps`;
}
