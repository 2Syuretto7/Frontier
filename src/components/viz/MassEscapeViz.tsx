"use client";

import { useState } from "react";

type Seq = { label: string; f: (n: number, x: number) => number; integral: (n: number) => number; limit: number; note: string };
export const SEQS: Seq[] = [
  { label: "xⁿ", f: (n, x) => (x <= 1 ? x ** n : 0), integral: (n) => 1 / (n + 1), limit: 0, note: "dominated by 1 on [0, 1]" },
  { label: "tall spike", f: (n, x) => (x > 0 && x < 1 / n ? n : 0), integral: () => 1, limit: 0, note: "envelope 1/x is not integrable" },
  { label: "moving bump", f: (n, x) => (x >= n - 1 && x < n ? 1 : 0), integral: () => 1, limit: 0, note: "envelope 1 on [0, ∞) is not integrable" },
];
export const NS = [1, 2, 4, 8];

export function MassEscapeViz() {
  const [si, setSi] = useState(0);
  const [ni, setNi] = useState(1);
  const s = SEQS[si], n = NS[ni];
  const W = 330, H = 150, X0 = 24, PW = 298, Y0 = 6, PH = 126, XM = si === 2 ? 9 : 1.2, YH = si === 1 ? 9 : 1.2;
  const sx = (x: number) => X0 + (x / XM) * PW, sy = (y: number) => Y0 + PH - (Math.min(YH, y) / YH) * PH;
  const xs = Array.from({ length: 1201 }, (_, i) => (i / 1200) * XM);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Sequence of functions">
          {SEQS.map((q, i) => <button key={q.label} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{q.label}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Index n">
          {NS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ni === i} onClick={() => setNi(i)}>n = {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A sequence of functions and the area under the current one">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        {NS.filter((m) => m < n).map((m) => <path key={m} d={xs.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(s.f(m, x)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text)" strokeOpacity={0.3} strokeWidth={1} />)}
        <path d={`${xs.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(s.f(n, x)).toFixed(1)}`).join(" ")} L${sx(XM).toFixed(1)},${sy(0).toFixed(1)} L${sx(0).toFixed(1)},${sy(0).toFixed(1)} Z`} fill="var(--accent)" fillOpacity={0.25} stroke="var(--accent)" strokeWidth={2} />
        <text x={X0 - 4} y={sy(YH > 2 ? 8 : 1) + 4} textAnchor="end" className="viz-label">{YH > 2 ? 8 : 1}</text>
        <text x={sx(XM)} y={H - 1} textAnchor="end" className="viz-label">x</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        ∫fₙ = {s.integral(n).toFixed(3)}; limit 0 almost everywhere, with ∫ = {s.limit}; {s.note}
      </div>
      <figcaption className="viz-caption">
        Three sequences that tend to 0 almost everywhere (xⁿ fails only at x = 1). For xⁿ on [0, 1] the areas 1/(n + 1) also tend to 0 (0.333 at
        n = 2, 0.111 at n = 8), as dominated convergence promises, since every term lies below the integrable function 1. The
        tall spike and the moving bump keep area exactly 1 for ever: their mass concentrates at a point or escapes to
        infinity. No single integrable function lies above all their terms, so the theorem does not apply, and the
        integral of the limit, 0, is not the limit of the integrals.
      </figcaption>
    </figure>
  );
}
