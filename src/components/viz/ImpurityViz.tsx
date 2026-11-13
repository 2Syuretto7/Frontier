"use client";

import { useState } from "react";

type Imp = "gini" | "entropy" | "error";
const FN: Record<Imp, (p: number) => number> = {
  gini: (p) => 2 * p * (1 - p),
  entropy: (p) => (p <= 0 || p >= 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p))),
  error: (p) => Math.min(p, 1 - p),
};
const LABEL: Record<Imp, string> = { gini: "Gini", entropy: "entropy", error: "misclassification" };

/** Impurity as a function of the class-1 fraction: the gain of a split is the gap between the curve at the parent and the chord joining the children, positive for strictly concave impurities. */
export function ImpurityViz() {
  const [imp, setImp] = useState<Imp>("gini");
  const [l, setL] = useState(10);
  const [r, setR] = useState(40);
  const pl = l / 100, pr = r / 100, wl = 0.6;
  const pp = wl * pl + (1 - wl) * pr;
  const f = FN[imp];
  const chord = wl * f(pl) + (1 - wl) * f(pr);
  const gain = f(pp) - chord;
  const W = 320, H = 190;
  const X = (p: number) => 20 + p * (W - 40);
  const Y = (v: number) => H - 20 - (v / 1.05) * (H - 34);
  const grid = Array.from({ length: 201 }, (_, i) => i / 200);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {(Object.keys(FN) as Imp[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={imp === k} onClick={() => setImp(k)}>{LABEL[k]}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          left child p = {pl.toFixed(2)}
          <input type="range" min={0} max={100} value={l} onChange={(e) => setL(Number(e.target.value))} aria-label="class-1 fraction in the left child" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          right child p = {pr.toFixed(2)}
          <input type="range" min={0} max={100} value={r} onChange={(e) => setR(Number(e.target.value))} aria-label="class-1 fraction in the right child" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Impurity curve with the parent value and the chord between the children">
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={grid.map((p) => `${X(p).toFixed(1)},${Y(f(p)).toFixed(1)}`).join(" ")} />
        <line x1={X(pl)} x2={X(pr)} y1={Y(f(pl))} y2={Y(f(pr))} stroke="var(--accent)" strokeWidth={1.5} />
        <circle cx={X(pl)} cy={Y(f(pl))} r={4} fill="var(--accent)" />
        <circle cx={X(pr)} cy={Y(f(pr))} r={4} fill="var(--accent)" />
        <line x1={X(pp)} x2={X(pp)} y1={Y(chord)} y2={Y(f(pp))} stroke="var(--danger)" strokeWidth={2.5} />
        <circle cx={X(pp)} cy={Y(f(pp))} r={4} fill="var(--danger)" />
        <text x={X(0)} y={H - 4} className="viz-label">p = 0</text>
        <text x={X(1)} y={H - 4} textAnchor="end" className="viz-label">p = 1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        parent p = {pp.toFixed(3)}; impurity {f(pp).toFixed(4)} − weighted children {chord.toFixed(4)} = gain {Math.abs(gain) < 5e-5 ? "0.0000" : gain.toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A parent node splits into a left child holding 60% of its points and a right child holding 40%; p is the fraction of
        class 1. The parent&apos;s p is the weighted average of the children&apos;s, so the weighted child impurity is the
        point on the chord above it. The gain is the vertical gap, marked in the parent&apos;s colour. Gini and entropy are
        strictly concave, so any split that changes the class mix gains something. Misclassification error is linear on
        each side of 0.5, so when both children lean the same way the gain is exactly zero and a greedy search cannot see
        progress.
      </figcaption>
    </figure>
  );
}
