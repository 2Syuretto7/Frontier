"use client";

import { useState } from "react";

const S_MIN = 1000, E_MIN = 1e5;

/** Steps and examples needed to reach a target loss as the batch size grows, around the critical batch size. */
export function BatchTradeoffViz() {
  const [bExp, setBExp] = useState(2.5);
  const [nExp, setNExp] = useState(3);
  const B = 10 ** bExp, Bn = 10 ** nExp;
  const steps = (b: number) => S_MIN * (1 + Bn / b);
  const ex = (b: number) => E_MIN * (1 + b / Bn);
  const W = 320, H = 180, bLo = 0, bHi = 6, yLo = 3, yHi = 10;
  const px = (e: number) => 38 + ((e - bLo) / (bHi - bLo)) * (W - 48);
  const py = (v: number) => 10 + ((yHi - Math.max(yLo, Math.min(yHi, Math.log10(v)))) / (yHi - yLo)) * (H - 34);
  const curve = (f: (b: number) => number) => {
    const pts: string[] = [];
    for (let e = bLo; e <= bHi + 1e-9; e += 0.05) pts.push(`${px(e).toFixed(1)},${py(f(10 ** e)).toFixed(1)}`);
    return pts.join(" ");
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          batch {Math.round(B)}
          <input type="range" min={bLo} max={bHi} step={0.1} value={bExp} onChange={(e) => setBExp(Number(e.target.value))} aria-label="batch size, log scale" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          B_noise {Math.round(Bn)}
          <input type="range" min={1} max={5} step={0.1} value={nExp} onChange={(e) => setNExp(Number(e.target.value))} aria-label="critical batch size, log scale" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Steps and examples to target against batch size, log-log">
        {[4, 6, 8, 10].map((e) => (
          <g key={e}>
            <line x1={38} x2={W - 10} y1={py(10 ** e)} y2={py(10 ** e)} stroke="var(--border)" />
            <text x={34} y={py(10 ** e) + 4} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        {[0, 2, 4, 6].map((e) => <text key={e} x={px(e)} y={H - 8} textAnchor="middle" className="viz-label">B=1e{e}</text>)}
        <line x1={px(nExp)} x2={px(nExp)} y1={10} y2={H - 24} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve(steps)} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={curve(ex)} />
        <circle cx={px(bExp)} cy={py(steps(B))} r={4} fill="var(--accent)" />
        <circle cx={px(bExp)} cy={py(ex(B))} r={4} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        steps {Math.round(steps(B)).toLocaleString("en-IN")} (blue), examples {Math.round(ex(B)).toLocaleString("en-IN")} (red)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The model S = S_min(1 + B_noise/B), E = E_min(1 + B/B_noise). Below the critical batch size B_noise (dashed),
        doubling the batch nearly halves the steps at almost no extra data: gradient noise was the bottleneck. Above it,
        steps stop falling and the data used grows in proportion to the batch: each step is already nearly noise-free.
      </figcaption>
    </figure>
  );
}
