"use client";

import { useState } from "react";

type Fn = "sqrt" | "sq" | "inv";

const INF = Number.POSITIVE_INFINITY;
const FNS: Record<Fn, { label: string; lo: number; hi: number; delta: (c: number, e: number) => number; uniform: boolean }> = {
  sqrt: {
    label: "√x on [0, 1]", lo: 0, hi: 1, uniform: true,
    delta: (c, e) => {
      const r = Math.sqrt(c);
      const left = r >= e ? c - (r - e) * (r - e) : INF;
      const right = r + e <= 1 ? (r + e) * (r + e) - c : INF;
      return Math.min(left, right);
    },
  },
  sq: {
    label: "x² on [0, 4]", lo: 0, hi: 4, uniform: true,
    delta: (c, e) => {
      const left = c * c - e >= 0 ? c - Math.sqrt(c * c - e) : INF;
      const right = c * c + e <= 16 ? Math.sqrt(c * c + e) - c : INF;
      return Math.min(left, right);
    },
  },
  inv: {
    label: "1/x on (0, 1]", lo: 0.004, hi: 1, uniform: false,
    delta: (c, e) => {
      const left = c - 1 / (1 / c + e);
      const t = 1 / c - e;
      const right = t > 0 && 1 / t <= 1 ? 1 / t - c : INF;
      return Math.min(left, right);
    },
  },
};

/** The largest δ that works at each point c for a fixed ε: uniform continuity means this curve stays above some positive level. */
export function DeltaCurveViz() {
  const [fn, setFn] = useState<Fn>("sqrt");
  const [k, setK] = useState(2);
  const eps = k / 20;
  const { lo, hi, delta, uniform } = FNS[fn];
  const cs = Array.from({ length: 241 }, (_, i) => lo + ((hi - lo) * i) / 240);
  const ds = cs.map((c) => delta(c, eps));
  const finite = ds.filter((d) => d < INF);
  const top = Math.max(...finite, 1e-6) * 1.1;
  const inf = Math.min(...ds);
  const W = 330, H = 160;
  const X = (c: number) => 24 + ((c - lo) / (hi - lo)) * (W - 40);
  const Y = (d: number) => H - 18 - (Math.min(d, top) / top) * (H - 34);
  const pts = cs.map((c, i) => `${X(c).toFixed(1)},${Y(ds[i]).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(FNS) as Fn[]).map((key) => (
          <button key={key} type="button" className="seg" aria-pressed={fn === key} onClick={() => setFn(key)}>{FNS[key].label}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          ε = {eps.toFixed(2)}
          <input type="range" min={1} max={10} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="epsilon" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Largest working delta plotted against the point c">
        <line x1={20} x2={W - 12} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={24} x2={24} y1={10} y2={H - 14} stroke="var(--border)" />
        <line x1={24} x2={W - 16} y1={Y(inf)} y2={Y(inf)} stroke="var(--danger)" strokeDasharray="3 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={pts} />
        <text x={W - 16} y={H - 4} textAnchor="end" className="viz-label">c</text>
        <text x={28} y={14} className="viz-label">δ(c)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        smallest δ(c) over the plotted points: {inf.toFixed(5)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is the largest δ that works at c for this ε; where it is cut off at the top, every δ works. The dashed line is
        its lowest value. {uniform
          ? "Here it stays at a positive level for every ε, so one δ serves every point: the function is uniformly continuous."
          : "Here the curve drops towards 0 as c approaches 0, and the plotted minimum only stays positive because the plot stops short of 0: no single δ works everywhere."}
      </figcaption>
    </figure>
  );
}
