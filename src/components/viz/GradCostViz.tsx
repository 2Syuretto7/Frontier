"use client";

import { useState } from "react";

const W = 320, BAR = 26, LEFT = 112, MAXLOG = 7;
const bx = (c: number) => LEFT + (Math.log10(Math.max(1, c)) / MAXLOG) * (W - LEFT - 10);
const fmt = (c: number) => (c >= 1e6 ? `${(c / 1e6).toFixed(c >= 1e7 ? 0 : 1)}M` : c >= 1e3 ? `${(c / 1e3).toFixed(c >= 1e4 ? 0 : 1)}k` : `${Math.round(c)}`);

/** Cost of a gradient, in units of one evaluation of f, for a function of n inputs. */
export function GradCostViz() {
  const [e, setE] = useState(3);
  const n = Math.round(10 ** e);
  const rows = [
    { label: "finite differences", cost: n + 1, color: "var(--text-muted)" },
    { label: "forward mode", cost: 2.5 * n, color: "var(--danger)" },
    { label: "reverse mode", cost: 3, color: "var(--accent)" },
  ];
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${rows.length * (BAR + 10) + 26}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Cost of a gradient by three methods, on a log scale">
        {[0, 2, 4, 6].map((k) => (
          <g key={k}>
            <line x1={bx(10 ** k)} y1={4} x2={bx(10 ** k)} y2={rows.length * (BAR + 10)} stroke="var(--border)" strokeDasharray="3 3" />
            <text x={bx(10 ** k)} y={rows.length * (BAR + 10) + 16} textAnchor="middle" className="viz-label">{fmt(10 ** k)}</text>
          </g>
        ))}
        {rows.map((r, i) => (
          <g key={r.label}>
            <text x={LEFT - 6} y={i * (BAR + 10) + 8 + BAR / 2 + 4} textAnchor="end" className="viz-label">{r.label}</text>
            <rect x={LEFT} y={i * (BAR + 10) + 8} width={Math.max(2, bx(r.cost) - LEFT)} height={BAR} rx={4} fill={r.color} opacity={0.85} />
          </g>
        ))}
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">n = {fmt(n)}</span>
        <input type="range" min={0} max={6} step={0.5} value={e} onChange={(ev) => setE(Number(ev.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <figcaption className="viz-caption" aria-live="polite">
        Cost of the full gradient of f : ℝ<sup>n</sup> → ℝ, in evaluations of f, on a log scale. Finite differences need about
        n + 1 = {fmt(n + 1)}; forward mode about {fmt(2.5 * n)}; reverse mode a small constant, here 3, whatever n is.{" "}
        {n >= 1e5 ? "At this size the gap is a factor of hundreds of thousands, the difference between training a network and not." : "Increase n to see the gap open."}
      </figcaption>
    </figure>
  );
}
