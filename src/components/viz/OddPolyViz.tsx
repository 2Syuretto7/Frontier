"use client";

import { useState } from "react";

const POLYS = [
  { name: "cubic", c: [1.5, -0.5, 0] },
  { name: "Muon quintic", c: [3.4445, -4.775, 2.0315] },
];
const NS = 9, KMAX = 12;
const SIGMAS = Array.from({ length: NS }, (_, i) => 10 ** (-3 + (3 * i) / (NS - 1)));

/** Odd polynomial iterations act on each singular value separately: the cubic converges to 1 slowly from small σ, the Muon quintic rises fast but settles in a band. */
export function OddPolyViz() {
  const [pi, setPi] = useState(1);
  const [k, setK] = useState(5);
  const [a, b, c] = POLYS[pi].c;
  const p = (x: number) => a * x + b * x ** 3 + c * x ** 5;
  const now = SIGMAS.map((s) => { let x = s; for (let j = 0; j < k; j++) x = p(x); return x; });
  const W = 330, H = 220, XM = 1.3;
  const PX = (x: number) => 30 + (x / XM) * (W - 44);
  const PY = (y: number) => 10 + ((XM - Math.max(0, Math.min(XM, y))) / XM) * 130;
  const grid = Array.from({ length: 131 }, (_, i) => (XM * i) / 130);
  const lo = Math.min(...now), hi = Math.max(...now);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        {POLYS.map((q, i) => (
          <button key={q.name} type="button" className="seg" aria-pressed={i === pi} onClick={() => setPi(i)}>{q.name}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          steps = {k}
          <input type="range" min={0} max={KMAX} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="number of steps" style={{ width: 120 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The scalar polynomial map and the singular values after several steps">
        <line x1={PX(0)} x2={PX(XM)} y1={PY(0)} y2={PY(0)} stroke="var(--border)" />
        <line x1={PX(0)} x2={PX(0)} y1={PY(0)} y2={PY(XM)} stroke="var(--border)" />
        <line x1={PX(0)} x2={PX(XM)} y1={PY(1)} y2={PY(1)} stroke="var(--border)" strokeDasharray="3 3" />
        <line x1={PX(0)} x2={PX(XM)} y1={PY(0)} y2={PY(XM)} stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="2 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={grid.map((x) => `${PX(x).toFixed(1)},${PY(p(x)).toFixed(1)}`).join(" ")} />
        <text x={PX(0) - 4} y={PY(1) + 3} textAnchor="end" className="viz-label">1</text>
        <text x={PX(1)} y={PY(0) + 12} textAnchor="middle" className="viz-label">1</text>
        <text x={PX(XM)} y={PY(0) + 12} textAnchor="end" className="viz-label">σ</text>
        <text x={PX(0) + 4} y={PY(XM) + 8} className="viz-label">p(σ)</text>
        <text x={PX(0)} y={180} className="viz-label">singular values after {k} steps</text>
        <line x1={PX(0)} x2={PX(XM)} y1={198} y2={198} stroke="var(--border)" />
        <line x1={PX(1)} x2={PX(1)} y1={190} y2={206} stroke="var(--text-muted)" strokeDasharray="2 2" />
        {now.map((x, i) => (
          <circle key={i} cx={PX(Math.max(0, Math.min(XM, x)))} cy={198} r={4} fill="var(--danger)" opacity={0.6} />
        ))}
        <text x={PX(0)} y={H - 2} className="viz-label">0</text>
        <text x={PX(XM)} y={H - 2} textAnchor="end" className="viz-label">{XM}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        p′(0) = {a}; p(1) = {p(1).toFixed(4)}; singular values now in [{lo.toFixed(3)}, {hi.toFixed(3)}]
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The top panel is the scalar map p, with the diagonal dotted and the target 1 dashed. The dots below start at
        singular values from 0.001 to 1, spread on a log scale, and each step applies p to every one of them. The cubic
        fixes 1 and pulls everything to it, but small values grow only by a factor of 1.5 per step. The quintic has slope
        3.4445 at 0, so small values grow quickly; it does not fix 1, and the values end up bouncing within roughly 0.68 to
        1.2, which is close enough to orthogonal for an optimiser.
      </figcaption>
    </figure>
  );
}
