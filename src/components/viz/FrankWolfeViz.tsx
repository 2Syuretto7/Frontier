"use client";

import { useState } from "react";

type P = [number, number];
const VERTS: P[] = Array.from({ length: 5 }, (_, i) => {
  const a = Math.PI / 2 + (2 * Math.PI * i) / 5;
  return [Math.cos(a), Math.sin(a)];
});
const K = 50;

/** Frank-Wolfe on a pentagon: each step finds the vertex that minimises the linear model and moves part way towards it, so iterates stay feasible without projection, zigzagging when the minimum lies on an edge. */
export function FrankWolfeViz() {
  const [ang, setAng] = useState(20);
  const [rad, setRad] = useState(1.2);
  const [ls, setLs] = useState(false);
  const c: P = [rad * Math.cos((ang * Math.PI) / 180), rad * Math.sin((ang * Math.PI) / 180)];
  const xs: P[] = [[0, 0]];
  const ss: P[] = [];
  const gaps: number[] = [];
  for (let k = 0; k < K; k++) {
    const x = xs[xs.length - 1];
    const g = [x[0] - c[0], x[1] - c[1]];
    let s = VERTS[0], best = Infinity;
    for (const v of VERTS) { const val = g[0] * v[0] + g[1] * v[1]; if (val < best) { best = val; s = v; } }
    const gap = g[0] * (x[0] - s[0]) + g[1] * (x[1] - s[1]);
    gaps.push(gap);
    const d = [s[0] - x[0], s[1] - x[1]];
    const dd = d[0] * d[0] + d[1] * d[1];
    const gam = ls ? (dd > 0 ? Math.max(0, Math.min(1, gap / dd)) : 0) : 2 / (k + 2);
    ss.push(s);
    xs.push([x[0] + gam * d[0], x[1] + gam * d[1]]);
  }
  const W = 300, H = 300, R = 1.6;
  const X = (u: number) => W / 2 + (u / R) * (W / 2 - 6);
  const Y = (v: number) => H / 2 - (v / R) * (H / 2 - 6);
  const last = xs[K];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={!ls} onClick={() => setLs(false)}>γ = 2/(k + 2)</button>
        <button type="button" className="seg" aria-pressed={ls} onClick={() => setLs(true)}>line search</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          target {ang}°
          <input type="range" min={0} max={359} value={ang} onChange={(e) => setAng(Number(e.target.value))} aria-label="direction of the target" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          distance {rad.toFixed(1)}
          <input type="range" min={0} max={1.5} step={0.1} value={rad} onChange={(e) => setRad(Number(e.target.value))} aria-label="distance of the target" style={{ width: 80 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 360, display: "block", margin: "0 auto" }} role="img" aria-label="A pentagon with Frank-Wolfe iterates moving towards vertices">
        <polygon points={VERTS.map(([a, b]) => `${X(a)},${Y(b)}`).join(" ")} fill="var(--accent)" opacity={0.15} stroke="var(--accent)" />
        {ss.slice(0, 8).map((s, i) => (
          <line key={i} x1={X(xs[i][0])} y1={Y(xs[i][1])} x2={X(s[0])} y2={Y(s[1])} stroke="var(--text-muted)" strokeDasharray="2 3" opacity={0.7} />
        ))}
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.4} points={xs.map(([a, b]) => `${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join(" ")} />
        {xs.map(([a, b], i) => <circle key={i} cx={X(a)} cy={Y(b)} r={1.6} fill="var(--danger)" />)}
        <circle cx={X(c[0])} cy={Y(c[1])} r={3.5} fill="none" stroke="var(--text)" strokeWidth={1.5} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        after {K} steps x = ({(last[0] + 0).toFixed(3)}, {(last[1] + 0).toFixed(3)}); smallest Frank-Wolfe gap {Math.max(0, Math.min(...gaps)).toExponential(1)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The objective is the squared distance to the open circle, minimised over the pentagon. At each iterate the method
        minimises the linear approximation over the pentagon, which picks a vertex (dotted lines, first 8 steps), and moves
        a fraction γ of the way there. Every iterate is an average of vertices, so it is always feasible. With line search
        and the minimum strictly inside, the iterates close in quickly; when it lies in the middle of an edge they zigzag
        between that edge&apos;s two vertices and the gap falls only like 1/k. The gap gᵀ(x − s) is a free upper bound on f(x) − f*.
      </figcaption>
    </figure>
  );
}
