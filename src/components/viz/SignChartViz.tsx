"use client";

import { useState } from "react";
import { fmtNum } from "./format";

/** The sign of (x − p)(x − q) along the line: each factor changes sign once, at its own root. */
export function SignChartViz() {
  const [p, setP] = useState(1);
  const [q, setQ] = useState(4);
  const lo = Math.min(p, q), hi = Math.max(p, q);
  const W = 620, x0 = 20, span = 580, X = (v: number) => x0 + ((v + 6) / 12) * span;
  const f = (x: number) => (x - p) * (x - q);
  // Scale the parabola so its lowest point and the edges fit.
  const ys = Array.from({ length: 121 }, (_, i) => f(-6 + i / 10));
  const top = Math.max(...ys), bottom = Math.min(...ys, -1);
  const Y = (v: number) => 20 + ((top - v) / (top - bottom)) * 120;
  const path = ys.map((y, i) => `${i ? "L" : "M"}${X(-6 + i / 10).toFixed(1)} ${Y(y).toFixed(1)}`).join(" ");

  const sign = (a: number, b: number) => f((a + b) / 2) > 0 ? "+" : f((a + b) / 2) < 0 ? "−" : "0";
  const zones = lo === hi ? [[-6, lo], [lo, 6]] : [[-6, lo], [lo, hi], [hi, 6]];

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} 200`} role="img" aria-label={`Graph and sign chart of (x − ${p})(x − ${q})`}>
        <line x1={x0} y1={Y(0)} x2={x0 + span} y2={Y(0)} className="viz-axis" />
        <path d={path} fill="none" className="viz-link" strokeWidth={2} />
        {zones.map(([a, b], i) => {
          const s = sign(a, b);
          return (
            <g key={i}>
              <rect x={X(a)} y={164} width={X(b) - X(a)} height={18} className={s === "−" ? "viz-region" : "viz-cell"} />
              <text x={(X(a) + X(b)) / 2} y={177} textAnchor="middle" className="viz-label">{s === "−" ? "negative" : "positive"}</text>
            </g>
          );
        })}
        {[p, q].map((r, i) => (
          <g key={i}>
            <line x1={X(r)} y1={Y(0) - 6} x2={X(r)} y2={182} className="viz-axis" strokeDasharray="3 3" />
            <circle cx={X(r)} cy={Y(0)} r={5} className="viz-node is-paired" />
            <text x={X(r)} y={198} textAnchor="middle" className="viz-label is-on">{fmtNum(r)}</text>
          </g>
        ))}
      </svg>
      <div className="viz-controls" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <label className="viz-stepper" style={{ display: "grid" }}>
          <span className="viz-stepper-label">p = {fmtNum(p)}</span>
          <input className="viz-range" type="range" min={-5} max={5} step={0.5} value={p} onChange={(e) => setP(Number(e.target.value))} />
        </label>
        <label className="viz-stepper" style={{ display: "grid" }}>
          <span className="viz-stepper-label">q = {fmtNum(q)}</span>
          <input className="viz-range" type="range" min={-5} max={5} step={0.5} value={q} onChange={(e) => setQ(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono">(x − {fmtNum(p)})(x − {fmtNum(q)}) &lt; 0</span>{" "}
        {lo === hi
          ? "has no solutions: a square is never negative."
          : <>exactly when <span className="mono">{fmtNum(lo)} &lt; x &lt; {fmtNum(hi)}</span>, where the two factors have opposite signs.</>}
      </figcaption>
    </figure>
  );
}
