"use client";

import { useState } from "react";

const ALPHA = [0.6, 0.2, 1.1, 0.4, 0.9, 0.15, 0.75];

function fill(total: number) {
  let lo = 0, hi = 3 + total;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    const s = ALPHA.reduce((a, al) => a + Math.max(0, m - al), 0);
    if (s > total) hi = m; else lo = m;
  }
  const level = (lo + hi) / 2;
  return { level, x: ALPHA.map((a) => Math.max(0, level - a)) };
}

/** Water-filling: maximise Σ log(αᵢ + xᵢ) with xᵢ ≥ 0 and Σxᵢ = budget; the KKT conditions say xᵢ = max(0, level − αᵢ). */
export function WaterFillViz() {
  const [total, setTotal] = useState(1);
  const { level, x } = fill(total);
  const W = 300, H = 200;
  const bw = (W - 40) / ALPHA.length;
  const Y = (v: number) => H - 16 - (v / 2.6) * (H - 26);
  const active = x.filter((v) => v > 1e-9).length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          budget = {total.toFixed(2)}
          <input type="range" min={0} max={4} step={0.05} value={total} onChange={(e) => setTotal(Number(e.target.value))} aria-label="total budget" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Water-filling allocation over channels of different floor heights">
        {ALPHA.map((a, i) => (
          <g key={i}>
            <rect x={20 + i * bw + 2} y={Y(a)} width={bw - 4} height={Y(0) - Y(a)} fill="var(--text-muted)" opacity={0.45} />
            {x[i] > 0 && <rect x={20 + i * bw + 2} y={Y(a + x[i])} width={bw - 4} height={Y(a) - Y(a + x[i])} fill="var(--accent)" opacity={0.6} />}
            <text x={20 + i * bw + bw / 2} y={H - 3} textAnchor="middle" className="viz-label">{x[i].toFixed(2)}</text>
          </g>
        ))}
        <line x1={16} x2={W - 16} y1={Y(level)} y2={Y(level)} stroke="var(--danger)" strokeDasharray="4 3" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        water level 1/ν = {level.toFixed(3)}; channels in use: {active} of {ALPHA.length}; ν = {(1 / level).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Grey bars are the floors αᵢ, blue is the allocation xᵢ (number below each bar). Stationarity says 1/(αᵢ + xᵢ) = ν − λᵢ,
        and complementary slackness says λᵢ = 0 whenever xᵢ &gt; 0. So every channel in use is filled up to the same level
        1/ν, and channels whose floor is above that level get nothing (there λᵢ = ν − 1/αᵢ ≥ 0). Pouring in more budget
        raises the level and brings in higher floors one at a time.
      </figcaption>
    </figure>
  );
}
