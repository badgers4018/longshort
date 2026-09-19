/** Mulberry32 — small, seedable, published with every run. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randn(rng: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Azzalini skew-normal, calibrated to mean `loc` and sd `scale`.
 * `alpha` is the shape (negative = left tail).
 */
export function skewNormal(
  rng: () => number,
  loc: number,
  scale: number,
  alpha: number,
) {
  const u0 = randn(rng);
  const u1 = randn(rng);
  const delta = alpha / Math.sqrt(1 + alpha * alpha);
  const z = delta * Math.abs(u0) + Math.sqrt(Math.max(0, 1 - delta * delta)) * u1;
  const meanZ = delta * Math.sqrt(2 / Math.PI);
  const varZ = Math.max(1e-12, 1 - (2 * delta * delta) / Math.PI);
  const standardized = (z - meanZ) / Math.sqrt(varZ);
  return loc + scale * standardized;
}

export const MASTER_SEED = 20260910;
