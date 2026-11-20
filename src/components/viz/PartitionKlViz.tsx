"use client";

import { useState } from "react";
import { cantorF } from "./MixedLawViz";

export const QS = [
  { label: "density 2x", F: (x: number) => x * x, kl: Math.log(2) - 0.5 },
  { label: "density 3x²", F: (x: number) => x ** 3, kl: Math.log(3) - 2 / 3 },
  { label: "Cantor law", F: cantorF, kl: Infinity },
];

/** KL divergence between Q and the uniform law P after both are coarse-grained to the 2^k dyadic cells. */
export function levelKl(qi: number, k: number) {
  const n = 2 ** k, F = QS[qi].F;
  let s = 0;
  for (let j = 0; j < n; j++) {
    const q = F((j + 1) / n) - F(j / n);
    if (q > 1e-15) s += q * Math.log(q * n);
  }
  return s;
}

export function PartitionKlViz() {
  const [qi, setQi] = useState(0);
  const [k, setK] = useState(2);
  const n = 2 ** k, F = QS[qi].F;
  const cells = Array.from({ length: n }, (_, j) => F((j + 1) / n) - F(j / n));
  const W = 330, H = 176, X0 = 14, PW = 304;
  const top = Math.max(...cells) * n;
  const hs = (v: number) => (v / Math.max(top, 1)) * 60;
  const levels = Array.from({ length: 11 }, (_, j) => levelKl(qi, j));
  const lmax = Math.max(...levels, 0.25);
  const cur = levels[k];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Law Q" style={{ flexWrap: "wrap" }}>
          {QS.map((q, i) => (
            <button key={q.label} type="button" className="seg" aria-pressed={qi === i} onClick={() => setQi(i)}>{q.label}</button>
          ))}
        </div>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          level k = {k}
          <input type="range" min={0} max={10} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="Partition level" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of Q on dyadic cells against the uniform law, and the coarse KL divergence at each level">
        <text x={X0} y={10} className="viz-label">Q(cell)/λ(cell) on {n} cells; dashed line: uniform P</text>
        {cells.map((c, j) => (
          <rect key={j} x={X0 + (j * PW) / n} y={78 - hs(c * n)} width={Math.max(0.5, PW / n - (n <= 64 ? 1 : 0))} height={hs(c * n)} fill="var(--accent)" />
        ))}
        <line x1={X0} x2={X0 + PW} y1={78 - hs(1)} y2={78 - hs(1)} stroke="var(--code-function)" strokeDasharray="4 3" />
        <line x1={X0} x2={X0 + PW} y1={78} y2={78} stroke="var(--border)" />
        <text x={X0} y={98} className="viz-label">coarse KL(Q ‖ P) at levels 0 to 10</text>
        <line x1={X0} x2={X0 + PW} y1={170} y2={170} stroke="var(--border)" />
        {levels.map((v, j) => (
          <rect key={j} x={X0 + j * (PW / 11) + 2} y={170 - (v / lmax) * 62} width={PW / 11 - 4} height={(v / lmax) * 62} fill={j === k ? "var(--accent)" : "var(--border)"} />
        ))}
        {Number.isFinite(QS[qi].kl) && <line x1={X0} x2={X0 + PW} y1={170 - (QS[qi].kl / lmax) * 62} y2={170 - (QS[qi].kl / lmax) * 62} stroke="var(--code-function)" strokeDasharray="4 3" />}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        KL at level {k} = {cur.toFixed(4)}; KL(Q ‖ P) = {Number.isFinite(QS[qi].kl) ? QS[qi].kl.toFixed(4) : "∞"}
      </div>
      <figcaption className="viz-caption">
        Coarse-graining Q and the uniform law P onto the dyadic cells of level k gives two finite distributions, and their KL
        divergence never decreases as the cells are refined. For a density it climbs to the true value (dashed line), ln 2 −
        1/2 for density 2x. The Cantor law is singular with respect to P, so its divergence is infinite, and the coarse values
        grow without bound, by about 0.26 per level on average.
      </figcaption>
    </figure>
  );
}
