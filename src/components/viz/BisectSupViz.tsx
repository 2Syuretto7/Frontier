"use client";

import { useState } from "react";

const PTS: number[] = [];
for (let n = 1; n <= 60; n++) PTS.push(1 - 1 / n);
const isUpper = (x: number) => x >= 1;

/** Finding the supremum of {1 − 1/n} by bisection: keep a point that is not an upper bound and one that is, and halve the gap. */
export function BisectSupViz() {
  const [k, setK] = useState(3);
  const hist: [number, number][] = [[0, 1.6]];
  for (let i = 0; i < 14; i++) {
    const [a, b] = hist[hist.length - 1];
    const m = (a + b) / 2;
    hist.push(isUpper(m) ? [a, m] : [m, b]);
  }
  const W = 330, H = 70 + 14 * 9;
  const X = (v: number) => 14 + ((v + 0.05) / 1.7) * (W - 28);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          steps = {k}
          <input type="range" min={0} max={14} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="bisection steps" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Points of the set and the shrinking bisection intervals">
        <line x1={14} x2={W - 14} y1={30} y2={30} stroke="var(--border)" />
        {PTS.map((p, i) => <circle key={i} cx={X(p)} cy={30} r={2.2} fill="var(--text-muted)" />)}
        {[0, 0.5, 1, 1.5].map((t) => <text key={t} x={X(t)} y={50} textAnchor="middle" className="viz-label">{t}</text>)}
        {hist.slice(0, k + 1).map(([a, b], i) => (
          <g key={i} opacity={i === k ? 1 : 0.4}>
            <line x1={X(a)} x2={X(b)} y1={64 + i * 9} y2={64 + i * 9} stroke="var(--accent)" strokeWidth={3} />
            <circle cx={X(a)} cy={64 + i * 9} r={2.6} fill="var(--danger)" />
            <circle cx={X(b)} cy={64 + i * 9} r={2.6} fill="var(--accent)" />
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        not an upper bound: {hist[k][0].toFixed(6)}; upper bound: {hist[k][1].toFixed(6)}; width {(hist[k][1] - hist[k][0]).toFixed(6)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The grey dots are 1 − 1/n. Each row is one step: the red end is never an upper bound of the set and the other end
        always is, and the midpoint replaces whichever end it agrees with. The intervals are nested and their widths halve,
        so by the nested interval property they close in on one point, the supremum 1, which is not in the set.
      </figcaption>
    </figure>
  );
}
