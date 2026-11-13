"use client";

import { useState } from "react";

const RULES = [
  { name: "log", color: "var(--accent)", f: (q: number, p: number) => -p * Math.log(q) - (1 - p) * Math.log(1 - q) },
  { name: "Brier", color: "var(--text)", f: (q: number, p: number) => 2 * (p * (1 - q) ** 2 + (1 - p) * q * q) },
  { name: "absolute", color: "var(--danger)", f: (q: number, p: number) => 2 * (p * (1 - q) + (1 - p) * q) },
];

/** Expected score of reporting q when the event has probability p, minus its smallest value, for the log, Brier and absolute-error scores. */
export function ExpectedScoreViz() {
  const [p, setP] = useState(0.7);
  const qs = Array.from({ length: 397 }, (_, i) => 0.005 + (0.99 * i) / 396);
  const W = 330, H = 170, ymax = 0.6;
  const X = (q: number) => 24 + q * (W - 40);
  const Y = (v: number) => H - 18 - (Math.min(v, ymax) / ymax) * (H - 30);
  const curves = RULES.map((r) => {
    const vals = qs.map((q) => r.f(q, p));
    const mn = Math.min(...vals);
    const arg = qs[vals.indexOf(mn)];
    return { ...r, pts: qs.map((q, i) => `${X(q).toFixed(1)},${Y(vals[i] - mn).toFixed(1)}`).join(" "), arg };
  });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          true probability p = {p.toFixed(2)}
          <input type="range" min={0.05} max={0.95} step={0.05} value={p} onChange={(e) => setP(Number(e.target.value))} aria-label="true probability" style={{ width: 130 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Expected excess score against the reported probability for three scoring rules">
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(p)} x2={X(p)} y1={8} y2={Y(0)} stroke="var(--text-muted)" strokeDasharray="2 3" />
        {curves.map((c) => (
          <g key={c.name}>
            <polyline fill="none" stroke={c.color} strokeWidth={1.8} points={c.pts} />
            <circle cx={X(c.arg)} cy={Y(0)} r={3.5} fill={c.color} />
          </g>
        ))}
        <text x={X(0)} y={H - 4} className="viz-label">q = 0</text>
        <text x={X(1)} y={H - 4} textAnchor="end" className="viz-label">q = 1</text>
        {curves.map((c, i) => (
          <text key={c.name} x={W - 14} y={14 + i * 13} textAnchor="end" className="viz-label" fill={c.color}>{c.name}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        best report: log {curves[0].arg.toFixed(2)}, Brier {curves[1].arg.toFixed(2)}, absolute {curves[2].arg.toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each curve is the expected penalty for announcing probability q when the event really has probability p (dotted
        line), shifted so its minimum is 0; dots mark the best report. The log and Brier scores are minimised exactly at
        q = p, so honesty pays. The absolute error is linear in q, so it is minimised at an extreme: it rewards rounding a
        70% belief up to certainty.
      </figcaption>
    </figure>
  );
}
