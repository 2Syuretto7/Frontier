"use client";

import { useState } from "react";

type Ser = "mixed" | "geo" | "harm";
const A: Record<Ser, (k: number) => number> = {
  mixed: (k) => (k % 2 === 0 ? Math.pow(2, -k) : Math.pow(3, -k)),
  geo: (k) => k * Math.pow(0.7, k),
  harm: (k) => 1 / k,
};
const LABEL: Record<Ser, string> = { mixed: "2⁻ᵏ or 3⁻ᵏ", geo: "k · 0.7ᵏ", harm: "1/k" };
const N = 40;

/** The root test sequence |aₖ|^(1/k) and the ratio test sequence |aₖ₊₁/aₖ| for three series. */
export function RootRatioViz() {
  const [ser, setSer] = useState<Ser>("mixed");
  const root = Array.from({ length: N }, (_, i) => Math.pow(Math.abs(A[ser](i + 1)), 1 / (i + 1)));
  const ratio = Array.from({ length: N }, (_, i) => Math.abs(A[ser](i + 2) / A[ser](i + 1)));
  const W = 330, H = 190, top = 2;
  const X = (i: number) => 26 + (i / (N - 1)) * (W - 34);
  const Y = (v: number) => 8 + ((top - Math.min(top, v)) / top) * (H - 30);
  const line = (arr: number[]) => arr.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const tailMax = (arr: number[]) => Math.max(...arr.slice(-10));
  const verdict = ser === "harm" ? "both tend to 1: the tests say nothing, and Σ1/k diverges" : ser === "geo" ? "both tend to 0.7 < 1: the series converges" : "the root sequence has limsup 1/2 < 1, so the series converges; the ratios swing above and below 1, so the ratio test cannot decide";
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(A) as Ser[]).map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={ser === s} onClick={() => setSer(s)}>aₖ = {LABEL[s]}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Root and ratio sequences against k">
        <line x1={26} x2={W - 8} y1={Y(1)} y2={Y(1)} stroke="var(--border)" strokeDasharray="4 3" />
        <text x={22} y={Y(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={22} y={Y(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={22} y={Y(2) + 8} textAnchor="end" className="viz-label">2</text>
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.4} points={line(ratio)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(root)} />
        {[1, 10, 20, 30, 40].map((k) => <text key={k} x={X(k - 1)} y={H - 6} textAnchor="middle" className="viz-label">{k}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        largest of the last ten: root {tailMax(root).toFixed(3)}, ratio {tailMax(ratio) > 99 ? tailMax(ratio).toExponential(1) : tailMax(ratio).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The thicker curve is |aₖ|^(1/k), the thinner one |aₖ₊₁/aₖ| (clipped at 2). Here {verdict}. The root test is
        stronger: whenever the ratio test proves convergence, so does the root test.
      </figcaption>
    </figure>
  );
}
