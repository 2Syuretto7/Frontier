"use client";

import { useState } from "react";

type Seq = "spike" | "wiggle" | "good";

const SEQS: Record<Seq, { label: string; f: (n: number, x: number) => number; d: (n: number, x: number) => number; ymax: number; lim: (x: number) => number; limInt: number; limD: number; note: string }> = {
  spike: {
    label: "spike of area 1", ymax: 12, lim: () => 0, limInt: 0, limD: 0,
    f: (n, x) => (x <= 1 / n ? n * n * x : x <= 2 / n ? n * n * (2 / n - x) : 0),
    d: (n, x) => (x < 1 / n ? n * n : x < 2 / n ? -n * n : 0),
    note: "fₙ → 0 at every point, but every integral is 1: pointwise convergence does not carry integrals",
  },
  wiggle: {
    label: "sin(n²x)/n", ymax: 1.2, lim: () => 0, limInt: 0, limD: 0,
    f: (n, x) => Math.sin(n * n * x) / n,
    d: (n, x) => n * Math.cos(n * n * x),
    note: "fₙ → 0 uniformly, and the integrals converge, but fₙ′(0) = n: uniform convergence does not carry derivatives",
  },
  good: {
    label: "(1 + x/n)ⁿ", ymax: 3, lim: (x) => Math.exp(x), limInt: Math.E - 1, limD: 1,
    f: (n, x) => Math.pow(1 + x / n, n),
    d: (n, x) => Math.pow(1 + x / n, n - 1),
    note: "fₙ and fₙ′ both converge uniformly on [0, 1], so integrals and derivatives at 0 converge to those of eˣ",
  },
};

/** Three sequences of functions on [0, 1], showing when the limit of the integrals and the limit of the derivatives agree with those of the limit. */
export function SwapLimitViz() {
  const [s, setS] = useState<Seq>("spike");
  const [n, setN] = useState(6);
  const { f, d, ymax, lim, limInt, limD, note } = SEQS[s];
  const m = 2000;
  const xs = Array.from({ length: m + 1 }, (_, i) => i / m);
  const integral = xs.slice(1).reduce((acc, x, i) => acc + ((f(n, xs[i]) + f(n, x)) / 2) / m, 0);
  const W = 330, H = 160;
  const X = (x: number) => 16 + x * (W - 32);
  const Y = (y: number) => H - 14 - ((y + (s === "wiggle" ? 1.2 : 0)) / (s === "wiggle" ? 2.4 : ymax)) * (H - 24);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(SEQS) as Seq[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={s === k} onClick={() => setS(k)}>{SEQS[k].label}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          n = {n}
          <input type="range" min={2} max={12} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="index n" style={{ width: 160 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The n-th function and the limit function on [0, 1]">
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.4} strokeDasharray="4 3" points={xs.filter((_, i) => i % 5 === 0).map((x) => `${X(x).toFixed(1)},${Y(lim(x)).toFixed(1)}`).join(" ")} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.6} points={xs.map((x) => `${X(x).toFixed(1)},${Y(f(n, x)).toFixed(1)}`).join(" ")} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        ∫fₙ = {integral.toFixed(4)} vs ∫f = {limInt.toFixed(4)}; fₙ′(0) = {d(n, 0).toFixed(3)} vs f′(0) = {limD.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The solid curve is fₙ and the dashed curve the pointwise limit f. For this sequence {note}.
      </figcaption>
    </figure>
  );
}
