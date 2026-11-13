"use client";

import { useState } from "react";

type V = [number, number, number];
const TARGETS: { label: string; c: V; star: V }[] = [
  { label: "minimum on an edge", c: [0.8, 0.5, -0.3], star: [0.65, 0.35, 0] },
  { label: "minimum inside", c: [0.5, 0.3, 0.2], star: [0.5, 0.3, 0.2] },
];
const K = 40;

function proj(v: V): V {
  const u = [...v].sort((a, b) => b - a);
  let css = 0, tau = 0;
  for (let j = 0; j < 3; j++) {
    css += u[j];
    const t = (css - 1) / (j + 1);
    if (u[j] - t > 0) tau = t;
  }
  return v.map((x) => Math.max(x - tau, 0)) as V;
}

/** Projected gradient and exponentiated gradient (mirror descent with entropy) minimising ½‖x − c‖² over the probability simplex, drawn as a triangle. */
export function MirrorSimplexViz() {
  const [j, setJ] = useState(0);
  const [t, setT] = useState(0.5);
  const { c, star } = TARGETS[j];
  const f = (x: V) => 0.5 * ((x[0] - c[0]) ** 2 + (x[1] - c[1]) ** 2 + (x[2] - c[2]) ** 2);
  const fs = f(star);
  const pg: V[] = [[1 / 3, 1 / 3, 1 / 3]];
  const eg: V[] = [[1 / 3, 1 / 3, 1 / 3]];
  for (let k = 0; k < K; k++) {
    const a = pg[pg.length - 1];
    pg.push(proj([a[0] - t * (a[0] - c[0]), a[1] - t * (a[1] - c[1]), a[2] - t * (a[2] - c[2])]));
    const b = eg[eg.length - 1];
    const g = [b[0] - c[0], b[1] - c[1], b[2] - c[2]];
    const m = Math.min(...g);
    const w = b.map((x, i) => x * Math.exp(-t * (g[i] - m)));
    const s = w[0] + w[1] + w[2];
    eg.push([w[0] / s, w[1] / s, w[2] / s]);
  }
  const W = 300, H = 270;
  const P = [[W / 2, 14], [14, H - 14], [W - 14, H - 14]];
  const xy = (x: V) => [x[0] * P[0][0] + x[1] * P[1][0] + x[2] * P[2][0], x[0] * P[0][1] + x[1] * P[1][1] + x[2] * P[2][1]];
  const line = (pts: V[]) => pts.map((p) => xy(p).map((v) => v.toFixed(1)).join(",")).join(" ");
  const lastP = pg[K], lastE = eg[K];
  const fmt = (v: number) => (v < 1e-12 ? "0" : v.toExponential(1));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {TARGETS.map((q, i) => (
          <button key={q.label} type="button" className="seg" aria-pressed={j === i} onClick={() => setJ(i)}>{q.label}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          t = {t.toFixed(2)}
          <input type="range" min={0.05} max={1.5} step={0.05} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="step size" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="The probability simplex as a triangle with two optimisation paths">
        <polygon points={P.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--border)" />
        <text x={P[0][0]} y={P[0][1] - 3} textAnchor="middle" className="viz-label">e₁</text>
        <text x={P[1][0]} y={P[1][1] + 12} className="viz-label">e₂</text>
        <text x={P[2][0]} y={P[2][1] + 12} textAnchor="end" className="viz-label">e₃</text>
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.4} points={line(pg)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.6} points={line(eg)} />
        {pg.map((p, i) => <circle key={`p${i}`} cx={xy(p)[0]} cy={xy(p)[1]} r={1.6} fill="var(--text-muted)" />)}
        {eg.map((p, i) => <circle key={`e${i}`} cx={xy(p)[0]} cy={xy(p)[1]} r={1.6} fill="var(--accent)" />)}
        <circle cx={xy(star)[0]} cy={xy(star)[1]} r={4} fill="none" stroke="var(--danger)" strokeWidth={1.5} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        after {K} steps, f − f*: projected {fmt(f(lastP) - fs)}; exponentiated {fmt(f(lastE) - fs)}; x₃ under exponentiated {lastE[2].toExponential(1)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each point of the triangle is a probability vector (x₁, x₂, x₃). The grey path is projected gradient descent, which
        steps in Euclidean space and projects back, landing exactly on an edge when the minimum (red circle) is there. The
        other path is exponentiated gradient, mirror descent with the entropy, which multiplies each weight by e^(−t gᵢ) and
        renormalises: it never leaves the interior, approaching an edge geometrically instead of reaching it.
      </figcaption>
    </figure>
  );
}
