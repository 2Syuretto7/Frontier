"use client";

import { useState } from "react";

type Fn = "smooth" | "x2sin" | "xsin" | "abs";

const FNS: Record<Fn, { label: string; q: (h: number) => number; verdict: string }> = {
  smooth: { label: "x² + x", q: (h) => h + 1, verdict: "the quotient tends to 1: f′(0) = 1" },
  x2sin: { label: "x² sin(1/x)", q: (h) => h * Math.sin(1 / h), verdict: "squeezed between ±|h|, the quotient tends to 0: f′(0) = 0" },
  xsin: { label: "x sin(1/x)", q: (h) => Math.sin(1 / h), verdict: "the quotient sin(1/h) keeps sweeping [−1, 1]: not differentiable at 0" },
  abs: { label: "|x|", q: (h) => (h > 0 ? 1 : -1), verdict: "one-sided limits 1 and −1 differ: not differentiable at 0" },
};
const ZOOMS = [1, 0.3, 0.1, 0.03, 0.01];

/** The difference quotient (f(h) − f(0))/h plotted against h, at several zoom levels around h = 0. */
export function DiffQuotientViz() {
  const [fn, setFn] = useState<Fn>("x2sin");
  const [z, setZ] = useState(0);
  const Hm = ZOOMS[z];
  const { q, verdict } = FNS[fn];
  const W = 330, H = 160, ymax = 1.5;
  const X = (h: number) => 14 + ((h + Hm) / (2 * Hm)) * (W - 28);
  const Y = (y: number) => H / 2 - (y / ymax) * (H / 2 - 10);
  const side = (sgn: number) => {
    const pts: string[] = [];
    for (let i = 1; i <= 600; i++) {
      const h = (sgn * Hm * i) / 600;
      pts.push(`${X(h).toFixed(1)},${Y(q(h)).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(FNS) as Fn[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={fn === k} onClick={() => setFn(k)}>{FNS[k].label}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          h from −{Hm} to {Hm}
          <input type="range" min={0} max={ZOOMS.length - 1} value={z} onChange={(e) => setZ(Number(e.target.value))} aria-label="zoom level" style={{ width: 140 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Difference quotient as a function of h">
        <line x1={14} x2={W - 14} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(0)} y1={6} y2={H - 6} stroke="var(--border)" strokeDasharray="3 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.2} points={side(-1)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.2} points={side(1)} />
        <text x={W - 14} y={Y(0) - 4} textAnchor="end" className="viz-label">h</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        The derivative at 0 is the limit of this curve as h → 0, if it exists; the dashed line marks h = 0, where the quotient
        is undefined. Zoom in: {verdict}.
      </figcaption>
    </figure>
  );
}
