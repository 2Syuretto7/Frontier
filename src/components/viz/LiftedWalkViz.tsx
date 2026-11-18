"use client";

import { useEffect, useState } from "react";

const SIZES = [10, 20, 40, 60];

export function curves(n: number, T: number) {
  let d = Array(n).fill(0); d[0] = 1;
  let e = Array(2 * n).fill(0); e[0] = 0.5; e[n] = 0.5;
  const q = 1 / n, a: number[] = [], b: number[] = [];
  for (let t = 0; t <= T; t++) {
    a.push(0.5 * d.reduce((s, v) => s + Math.abs(v - 1 / n), 0));
    b.push(0.5 * Array.from({ length: n }, (_, x) => e[x] + e[x + n]).reduce((s, v) => s + Math.abs(v - 1 / n), 0));
    const nd = Array(n).fill(0);
    for (let x = 0; x < n; x++) { nd[x] += 0.5 * d[x]; nd[(x + 1) % n] += 0.25 * d[x]; nd[(x + n - 1) % n] += 0.25 * d[x]; }
    const ne = Array(2 * n).fill(0);
    for (let x = 0; x < n; x++) {
      ne[(x + 1) % n] += (1 - q) * e[x]; ne[x + n] += q * e[x];
      ne[((x + n - 1) % n) + n] += (1 - q) * e[x + n]; ne[x] += q * e[x + n];
    }
    d = nd; e = ne;
  }
  return { a, b };
}

export const firstBelow = (c: number[], eps: number) => c.findIndex((v) => v < eps);

/** A reversible lazy walk on a cycle against a non-reversible lifted walk that keeps its direction. */
export function LiftedWalkViz() {
  const [n, setN] = useState(40);
  const [c, setC] = useState<{ a: number[]; b: number[] } | null>(null);
  const T = Math.round(0.25 * n * n);
  useEffect(() => setC(curves(n, T)), [n, T]);
  const W = 330, H = 160, X0 = 30, PW = W - 40, PH = 130;
  const sx = (t: number) => X0 + (t / T) * PW, sy = (v: number) => 10 + (1 - v) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {SIZES.map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={s === n} onClick={() => setN(s)}>n = {s}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Total variation distance to uniform against time for the two walks">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} y1={sy(0.25)} x2={X0 + PW} y2={sy(0.25)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {c && <polyline fill="none" stroke="var(--text-muted)" strokeWidth={2} points={c.a.map((v, t) => `${sx(t)},${sy(v)}`).join(" ")} />}
        {c && <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={c.b.map((v, t) => `${sx(t)},${sy(v)}`).join(" ")} />}
        <text x={X0 - 4} y={sy(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={X0 - 4} y={sy(0.25) + 4} textAnchor="end" className="viz-label">¼</text>
        <text x={X0 + PW} y={H + 12} textAnchor="end" className="viz-label">t = {T}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {c ? `steps to reach distance ¼: reversible ${firstBelow(c.a, 0.25)}, lifted ${firstBelow(c.b, 0.25)}` : "computing"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Grey: the lazy walk on a cycle of n sites, which is reversible and spreads diffusively, needing about n² steps. Colour:
        the lifted walk, which carries a direction, keeps moving that way and reverses only with probability 1/n per step. It
        breaks detailed balance yet keeps the uniform distribution stationary, and needs only about n steps. Doubling n
        quadruples one count and doubles the other.
      </figcaption>
    </figure>
  );
}
