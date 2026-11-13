"use client";

import { useState } from "react";

const FS: Record<string, { f: (x: number) => number; lo: number; hi: number; ylo: number; yhi: number }> = {
  "x²": { f: (x) => x * x, lo: -2, hi: 3, ylo: -1, yhi: 9 },
  "eˣ": { f: Math.exp, lo: -2, hi: 2.5, ylo: -1, yhi: 12 },
  "−log x": { f: (x) => -Math.log(x), lo: 0.1, hi: 4, ylo: -1.6, yhi: 2.4 },
};

/** Jensen's inequality for a two-point distribution: the chord point (E X, E f(X)) lies above the curve point (E X, f(E X)). */
export function JensenViz() {
  const [name, setName] = useState("x²");
  const [a, setA] = useState(20), [b, setB] = useState(85), [w, setW] = useState(50);
  const F = FS[name];
  const x1 = F.lo + ((F.hi - F.lo) * a) / 100, x2 = F.lo + ((F.hi - F.lo) * b) / 100, p = w / 100;
  const ex = (1 - p) * x1 + p * x2, efx = (1 - p) * F.f(x1) + p * F.f(x2), fex = F.f(ex);
  const W = 320, H = 180;
  const X = (x: number) => 30 + ((x - F.lo) / (F.hi - F.lo)) * (W - 40);
  const Y = (y: number) => H - 20 - ((Math.min(F.yhi, Math.max(F.ylo, y)) - F.ylo) / (F.yhi - F.ylo)) * (H - 30);
  const curve = Array.from({ length: 201 }, (_, i) => F.lo + ((F.hi - F.lo) * i) / 200).map((x) => `${X(x).toFixed(1)},${Y(F.f(x)).toFixed(1)}`).join(" ");
  const slider = (label: string, v: number, set: (n: number) => void) => (
    <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
      {label}
      <input type="range" min={0} max={100} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} style={{ width: 80 }} />
    </label>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {Object.keys(FS).map((n) => (
          <button key={n} type="button" className="seg" aria-pressed={name === n} onClick={() => setName(n)}>f = {n}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 12 }}>
        {slider(`x₁ = ${x1.toFixed(2)}`, a, setA)}
        {slider(`x₂ = ${x2.toFixed(2)}`, b, setB)}
        {slider(`P(x₂) = ${p.toFixed(2)}`, w, setW)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A convex curve, a chord, and the two sides of Jensen's inequality">
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve} />
        <line x1={X(x1)} y1={Y(F.f(x1))} x2={X(x2)} y2={Y(F.f(x2))} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <circle cx={X(x1)} cy={Y(F.f(x1))} r={4} fill="var(--text-muted)" />
        <circle cx={X(x2)} cy={Y(F.f(x2))} r={4} fill="var(--text-muted)" />
        <line x1={X(ex)} x2={X(ex)} y1={Y(efx)} y2={Y(fex)} stroke="var(--danger)" strokeWidth={2.5} />
        <circle cx={X(ex)} cy={Y(efx)} r={4} fill="var(--danger)" />
        <circle cx={X(ex)} cy={Y(fex)} r={4} fill="var(--accent)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        E[f(X)] = {efx.toFixed(4)} ≥ f(E[X]) = {fex.toFixed(4)}; gap {(efx - fex).toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        X takes the values x₁ and x₂. The point (E[X], E[f(X)]) lies on the chord between the two grey points, and for a
        convex f the chord lies above the curve, so E[f(X)] ≥ f(E[X]); the red segment is the gap. It closes when the two
        points merge (X constant) or when f is straight between them. With f = x² the gap is exactly Var(X).
      </figcaption>
    </figure>
  );
}
