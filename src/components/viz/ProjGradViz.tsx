"use client";

import { useState } from "react";

type P = [number, number];
const SETS: { label: string; proj: (v: P) => P }[] = [
  { label: "box", proj: (v) => [Math.max(-1, Math.min(1, v[0])), Math.max(-1, Math.min(1, v[1]))] },
  { label: "disc", proj: (v) => { const n = Math.hypot(v[0], v[1]); return n <= 1 ? v : [v[0] / n, v[1] / n]; } },
  { label: "half-plane", proj: (v) => { const s = v[0] + v[1] - 0.5; return s <= 0 ? v : [v[0] - s / 2, v[1] - s / 2]; } },
];
const Q = [[1, 0.8], [0.8, 3]];

/** Projected gradient descent: a gradient step that may leave the set (dashed), followed by the projection back onto it (solid). */
export function ProjGradViz() {
  const [k, setK] = useState(0);
  const [ang, setAng] = useState(40);
  const [t, setT] = useState(0.25);
  const c: P = [2.2 * Math.cos((ang * Math.PI) / 180), 2.2 * Math.sin((ang * Math.PI) / 180)];
  const grad = (x: P): P => {
    const d = [x[0] - c[0], x[1] - c[1]];
    return [Q[0][0] * d[0] + Q[0][1] * d[1], Q[1][0] * d[0] + Q[1][1] * d[1]];
  };
  const { proj } = SETS[k];
  const steps: { from: P; mid: P; to: P }[] = [];
  let x: P = proj([-0.8, -0.6]);
  for (let i = 0; i < 60; i++) {
    const g = grad(x);
    const mid: P = [x[0] - t * g[0], x[1] - t * g[1]];
    const to = proj(mid);
    steps.push({ from: x, mid, to });
    x = to;
  }
  const W = 300, H = 300, R = 2.6;
  const X = (u: number) => W / 2 + (u / R) * (W / 2 - 6);
  const Y = (v: number) => H / 2 - (v / R) * (H / 2 - 6);
  const g = grad(x);
  const resid = Math.hypot(x[0] - proj([x[0] - g[0], x[1] - g[1]])[0], x[1] - proj([x[0] - g[0], x[1] - g[1]])[1]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {SETS.map((s, i) => (
          <button key={s.label} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{s.label}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          target {ang}°
          <input type="range" min={0} max={359} value={ang} onChange={(e) => setAng(Number(e.target.value))} aria-label="direction of the unconstrained minimum" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          t = {t.toFixed(2)}
          <input type="range" min={0.05} max={0.75} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="step size" style={{ width: 90 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 360, display: "block", margin: "0 auto" }} role="img" aria-label="A convex set with projected gradient steps towards a constrained minimum">
        <defs>
          <clipPath id="pg-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#pg-clip)">
          {k === 0 ? <rect x={X(-1)} y={Y(1)} width={X(1) - X(-1)} height={Y(-1) - Y(1)} fill="var(--accent)" opacity={0.15} stroke="var(--accent)" /> : null}
          {k === 1 ? <circle cx={X(0)} cy={Y(0)} r={X(1) - X(0)} fill="var(--accent)" opacity={0.15} stroke="var(--accent)" /> : null}
          {k === 2 ? <polygon points={`${X(-R)},${Y(R + 0.5)} ${X(R + 0.5)},${Y(-R)} ${X(-R)},${Y(-R)}`} fill="var(--accent)" opacity={0.15} stroke="var(--accent)" /> : null}
          {steps.slice(0, 12).map((s, i) => (
            <g key={i}>
              <line x1={X(s.from[0])} y1={Y(s.from[1])} x2={X(s.mid[0])} y2={Y(s.mid[1])} stroke="var(--text-muted)" strokeDasharray="3 2" />
              <line x1={X(s.mid[0])} y1={Y(s.mid[1])} x2={X(s.to[0])} y2={Y(s.to[1])} stroke="var(--danger)" strokeWidth={1.2} />
              <circle cx={X(s.to[0])} cy={Y(s.to[1])} r={2} fill="var(--text)" />
            </g>
          ))}
        </g>
        <circle cx={X(c[0])} cy={Y(c[1])} r={3.5} fill="none" stroke="var(--text)" strokeWidth={1.5} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        after 60 steps x = ({(x[0] + 0).toFixed(3)}, {(x[1] + 0).toFixed(3)}); fixed-point residual {resid.toExponential(1)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The open circle is the unconstrained minimum of a quadratic. Each iteration takes a gradient step (dashed), which
        may leave the shaded set, and then projects back to the nearest point of the set (red). Only the first 12
        iterations are drawn. The limit is a point where the negative gradient points straight out of the set, so a further
        gradient step followed by projection returns to the same point. Raise t past 2/L, here about 0.61, and the steps
        stop settling.
      </figcaption>
    </figure>
  );
}
