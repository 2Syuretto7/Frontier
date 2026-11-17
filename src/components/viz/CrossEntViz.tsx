"use client";

import { useState } from "react";

const lg = (x: number) => Math.log2(x);
const h = (p: number) => (p <= 0 || p >= 1 ? 0 : -p * lg(p) - (1 - p) * lg(1 - p));
const ce = (p: number, q: number) => -(p > 0 ? p * lg(q) : 0) - (p < 1 ? (1 - p) * lg(1 - q) : 0);

/** Cross-entropy H(p, q) = H(p) + D(p‖q) for a binary outcome, as a function of the predicted probability q. */
export function CrossEntViz() {
  const [p, setP] = useState(0.7);
  const [q, setQ] = useState(0.4);
  const W = 330, H = 200, YM = 3;
  const X = (x: number) => 30 + x * (W - 46);
  const Y = (y: number) => 150 - (Math.min(y, YM) / YM) * 130;
  const qs = Array.from({ length: 199 }, (_, i) => (i + 1) / 200);
  const Hp = h(p), C = ce(p, q), D = C - Hp;
  const BX = (v: number) => 30 + (v / YM) * (W - 46);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          true p = {p.toFixed(2)}
          <input type="range" min={0} max={1} step={0.01} value={p} onChange={(e) => setP(Number(e.target.value))} aria-label="true probability" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          predicted q = {q.toFixed(2)}
          <input type="range" min={0.01} max={0.99} step={0.01} value={q} onChange={(e) => setQ(Number(e.target.value))} aria-label="predicted probability" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Cross-entropy against the predicted probability, with its split into entropy and divergence">
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(1)} y1={Y(Hp)} y2={Y(Hp)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={qs.map((x) => `${X(x).toFixed(1)},${Y(ce(p, x)).toFixed(1)}`).join(" ")} />
        <line x1={X(p)} x2={X(p)} y1={Y(0)} y2={Y(YM)} stroke="var(--accent)" strokeDasharray="2 2" />
        <circle cx={X(q)} cy={Y(C)} r={4.5} fill="var(--danger)" />
        <text x={X(0)} y={Y(0) + 12} className="viz-label">q = 0</text>
        <text x={X(1)} y={Y(0) + 12} textAnchor="end" className="viz-label">q = 1</text>
        <text x={X(1)} y={Y(Hp) - 4} textAnchor="end" className="viz-label">H(p)</text>
        <rect x={BX(0)} y={176} width={BX(Hp) - BX(0)} height={14} fill="var(--text-muted)" opacity={0.6} />
        <rect x={BX(Hp)} y={176} width={Math.max(0, BX(Math.min(C, YM)) - BX(Hp))} height={14} fill="var(--danger)" opacity={0.7} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        H(p, q) = {C.toFixed(3)} = H(p) {Hp.toFixed(3)} + D(p‖q) {D.toFixed(3)} bits
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is the expected log loss of predicting probability q for an event that really has probability p. It never
        drops below the entropy H(p) (dashed), and touches it only at q = p (the vertical line): honest predictions are
        rewarded. The bar splits the loss into the part no model can remove (grey) and the divergence caused by the wrong
        prediction (red). Set p = 1, a one-hot target, and the loss is just −log₂ q.
      </figcaption>
    </figure>
  );
}
