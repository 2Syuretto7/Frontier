"use client";

import { useState } from "react";

const XS = [-2.4, -1.6, -1.1, -0.5, 0.3, 0.6, 1.2, 1.9, 2.5, -0.2];
const YS = [0, 0, 0, 1, 0, 1, 1, 1, 1, 0];
const sig = (z: number) => 1 / (1 + Math.exp(-z));
const nllAt = (w: number) => XS.map((x, i) => {
  const p = sig(w * x);
  return -Math.log(Math.max(YS[i] ? p : 1 - p, 1e-12));
});
const WS = Array.from({ length: 81 }, (_, i) => -2 + i * 0.1);

/** A one-parameter logistic model p(y = 1 | x) = σ(wx) on ten labelled points: each bar is a point's negative log-likelihood, and the curve is the total as a function of w. */
export function NllBarViz() {
  const [k, setK] = useState(35);
  const w = WS[k];
  const parts = nllAt(w);
  const total = parts.reduce((a, b) => a + b, 0);
  const totals = WS.map((v) => nllAt(v).reduce((a, b) => a + b, 0));
  const best = totals.indexOf(Math.min(...totals));
  const W = 330, H = 130;
  const bw = (W - 40) / XS.length;
  const bmax = 4;
  const BY = (v: number) => H - 18 - (Math.min(v, bmax) / bmax) * (H - 34);
  const H2 = 110, tmax = 16;
  const CX = (v: number) => 20 + ((v + 2) / 8) * (W - 40);
  const CY = (v: number) => H2 - 14 - (Math.min(v, tmax) / tmax) * (H2 - 24);
  const order = XS.map((x, i) => i).sort((a, b) => XS[a] - XS[b]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          w = {w.toFixed(1)}
          <input type="range" min={0} max={WS.length - 1} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="weight w" style={{ width: 160 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Per-point negative log-likelihood bars">
        {order.map((i, j) => (
          <g key={i}>
            <rect x={20 + j * bw + 2} y={BY(parts[i])} width={bw - 4} height={BY(0) - BY(parts[i])} fill={YS[i] ? "var(--accent)" : "var(--danger)"} opacity={0.65} />
            <text x={20 + j * bw + bw / 2} y={H - 4} textAnchor="middle" className="viz-label">{YS[i]}</text>
          </g>
        ))}
        <line x1={20} x2={W - 20} y1={BY(0)} y2={BY(0)} stroke="var(--border)" />
      </svg>
      <svg viewBox={`0 0 ${W} ${H2}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Total negative log-likelihood against w">
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.6} points={WS.map((v, i) => `${CX(v).toFixed(1)},${CY(totals[i]).toFixed(1)}`).join(" ")} />
        <line x1={CX(WS[best])} x2={CX(WS[best])} y1={8} y2={H2 - 14} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <circle cx={CX(w)} cy={CY(total)} r={4} fill="var(--accent)" />
        <line x1={20} x2={W - 20} y1={CY(0)} y2={CY(0)} stroke="var(--border)" />
        <text x={20} y={H2 - 2} className="viz-label">w = −2</text>
        <text x={W - 20} y={H2 - 2} textAnchor="end" className="viz-label">w = 6</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        total NLL = {total.toFixed(3)}; minimum {Math.min(...totals).toFixed(3)} at w ≈ {WS[best].toFixed(1)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The top panel shows −log p(yᵢ | xᵢ) for each of ten points, sorted by x and labelled with their class, under the model
        p(y = 1 | x) = σ(wx). A confident correct prediction costs almost nothing; a confident wrong one costs a lot, and there
        is no upper limit. The bottom curve is the total, the negative log-likelihood of the whole dataset, with the dashed
        line at its minimum. Large w makes the model certain, so the few points on the wrong side of 0 dominate the total.
      </figcaption>
    </figure>
  );
}
