"use client";

import { useState } from "react";

/** Two intervals that may or may not touch: when their union is not an interval, two disjoint open half-lines separate it. */
export function SeparationViz() {
  const [g, setG] = useState(4);
  const [incL, setIncL] = useState(true);
  const [incR, setIncR] = useState(false);
  const gap = g / 20;
  const a1 = 0, b1 = 1, a2 = 1 + gap, b2 = 2 + gap;
  const connected = gap === 0 && (incL || incR);
  const c = 1 + gap / 2;
  const W = 330, H = 110;
  const X = (v: number) => 20 + (v / 3.2) * (W - 40);
  const dot = (v: number, filled: boolean) => (
    <circle cx={X(v)} cy={56} r={4.5} fill={filled ? "var(--accent)" : "var(--bg)"} stroke="var(--accent)" strokeWidth={1.8} />
  );
  const toggle = (label: string, on: boolean, set: (v: boolean) => void) => (
    <button type="button" className="seg" aria-pressed={on} onClick={() => set(!on)}>{label}</button>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {toggle("include 1 in the left piece", incL, setIncL)}
        {toggle("include the left end of the right piece", incR, setIncR)}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          gap = {gap.toFixed(2)}
          <input type="range" min={0} max={20} value={g} onChange={(e) => setG(Number(e.target.value))} aria-label="gap between the pieces" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Two intervals on a line and, when they are separated, two open sets splitting them">
        {!connected && (
          <g>
            <rect x={X(0) - 14} y={30} width={X(c) - X(0) + 14} height={52} fill="var(--accent)" opacity={0.08} />
            <rect x={X(c)} y={30} width={X(3.2) - X(c)} height={52} fill="var(--danger)" opacity={0.08} />
            <line x1={X(c)} x2={X(c)} y1={26} y2={86} stroke="var(--text-muted)" strokeDasharray="3 3" />
            <text x={X(c)} y={20} textAnchor="middle" className="viz-label">c = {c.toFixed(3)}</text>
            <text x={X(0.4)} y={96} textAnchor="middle" className="viz-label">U = (−∞, c)</text>
            <text x={X(2.3)} y={96} textAnchor="middle" className="viz-label">V = (c, ∞)</text>
          </g>
        )}
        <line x1={X(0) - 14} x2={X(3.2)} y1={56} y2={56} stroke="var(--border)" />
        <line x1={X(a1)} x2={X(b1)} y1={56} y2={56} stroke="var(--accent)" strokeWidth={4} />
        <line x1={X(a2)} x2={X(b2)} y1={56} y2={56} stroke="var(--accent)" strokeWidth={4} />
        {dot(a1, true)}
        {dot(b1, incL)}
        {dot(a2, incR)}
        {dot(b2, true)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {connected ? "the union is an interval: connected" : "U and V are disjoint open sets, each meets the union, and together they cover it: disconnected"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The left piece runs from 0 to 1 and the right piece from 1 + gap to 2 + gap; a filled endpoint is included, a hollow one
        is not. With any gap, or with no gap but the point 1 missing from both, a point c not in the set splits it into the parts
        left and right of c. Only when the pieces share a point does the union become an interval, and then no such c exists.
      </figcaption>
    </figure>
  );
}
