"use client";

import { useState } from "react";

/** Surprise −log₂ p of an event of probability p, and the additivity of surprise for two independent events. */
export function SurpriseViz() {
  const [lp, setLp] = useState(-1);
  const [lq, setLq] = useState(-2.585);
  const p = 2 ** lp, q = 2 ** lq;
  const sp = -lp, sq = -lq;
  const W = 330, H = 220, PMIN = 1 / 1024, SMAX = 10;
  const PX = (x: number) => 34 + x * (W - 50);
  const PY = (s: number) => 10 + (1 - Math.min(s, SMAX) / SMAX) * 120;
  const xs = Array.from({ length: 300 }, (_, i) => PMIN + ((1 - PMIN) * i) / 299);
  const BX = (s: number) => 34 + (s / (2 * SMAX)) * (W - 50);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          P(A) = {p < 0.01 ? p.toExponential(1) : p.toFixed(3)}
          <input type="range" min={-10} max={0} step={0.01} value={lp} onChange={(e) => setLp(Number(e.target.value))} aria-label="log probability of A" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          P(B) = {q < 0.01 ? q.toExponential(1) : q.toFixed(3)}
          <input type="range" min={-10} max={0} step={0.01} value={lq} onChange={(e) => setLq(Number(e.target.value))} aria-label="log probability of B" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The surprise curve and the surprise of two independent events adding up">
        <line x1={PX(0)} x2={PX(1)} y1={PY(0)} y2={PY(0)} stroke="var(--border)" />
        <line x1={PX(0)} x2={PX(0)} y1={PY(0)} y2={PY(SMAX)} stroke="var(--border)" />
        {[0, 5, 10].map((s) => <text key={s} x={PX(0) - 4} y={PY(s) + 3} textAnchor="end" className="viz-label">{s}</text>)}
        <text x={PX(1)} y={PY(0) + 12} textAnchor="end" className="viz-label">p = 1</text>
        <text x={PX(0) + 4} y={PY(SMAX) + 8} className="viz-label">bits</text>
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.6} points={xs.map((x) => `${PX(x).toFixed(1)},${PY(-Math.log2(x)).toFixed(1)}`).join(" ")} />
        <circle cx={PX(p)} cy={PY(sp)} r={4.5} fill="var(--accent)" />
        <circle cx={PX(q)} cy={PY(sq)} r={4.5} fill="var(--danger)" />
        <text x={34} y={160} className="viz-label">surprise of A, of B, and of both (independent)</text>
        <rect x={BX(0)} y={168} width={BX(sp) - BX(0)} height={12} fill="var(--accent)" opacity={0.7} />
        <rect x={BX(0)} y={184} width={BX(sq) - BX(0)} height={12} fill="var(--danger)" opacity={0.7} />
        <rect x={BX(0)} y={200} width={BX(sp) - BX(0)} height={12} fill="var(--accent)" opacity={0.7} />
        <rect x={BX(sp)} y={200} width={BX(sp + sq) - BX(sp)} height={12} fill="var(--danger)" opacity={0.7} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        −log₂ P(A) = {sp.toFixed(3)}, −log₂ P(B) = {sq.toFixed(3)}, −log₂ P(A)P(B) = {(sp + sq).toFixed(3)} bits
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is the surprise −log₂ p: zero for a certain event, one bit for a fair coin, and growing without bound
        as p shrinks. Each halving of p adds exactly one bit, which is why the slider moves in powers of 2. For independent
        events the probabilities multiply, so the surprises add: the bottom bar is the two above it laid end to end.
      </figcaption>
    </figure>
  );
}
