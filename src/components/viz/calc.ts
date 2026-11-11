import { scales, type View } from "./Plot";

/** A closed path for the region between the graph of f and the x-axis, from a to b. */
export function areaPath(v: View, f: (x: number) => number, a: number, b: number, samples = 200) {
  const { X, Y } = scales(v);
  const clamp = (y: number) => Math.max(v.ymin - 1, Math.min(v.ymax + 1, y));
  let d = `M${X(a).toFixed(1)} ${Y(0).toFixed(1)} `;
  for (let i = 0; i <= samples; i++) {
    const x = a + ((b - a) * i) / samples;
    const y = f(x);
    d += `L${X(x).toFixed(1)} ${Y(Number.isFinite(y) ? clamp(y) : 0).toFixed(1)} `;
  }
  return d + `L${X(b).toFixed(1)} ${Y(0).toFixed(1)} Z`;
}

/** Composite Simpson's rule with n (even) intervals, accurate enough to stand in for an exact integral in a visualisation. */
export function simpson(f: (x: number) => number, a: number, b: number, n = 2000) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** log of n!, by summing logarithms. */
export function logFactorial(n: number) {
  let s = 0;
  for (let k = 2; k <= n; k++) s += Math.log(k);
  return s;
}
