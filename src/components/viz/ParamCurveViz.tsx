"use client";

import { useState } from "react";

type Curve = { label: string; p: (t: number) => [number, number]; v: (t: number) => [number, number]; t1: number };
const CURVES: Curve[] = [
  { label: "(cos t, sin t)", p: (t) => [Math.cos(t), Math.sin(t)], v: (t) => [-Math.sin(t), Math.cos(t)], t1: 2 * Math.PI },
  { label: "(cos 2t, sin 2t)", p: (t) => [Math.cos(2 * t), Math.sin(2 * t)], v: (t) => [-2 * Math.sin(2 * t), 2 * Math.cos(2 * t)], t1: Math.PI },
  { label: "(t − 1, (t − 1)²)", p: (t) => [t - 1, (t - 1) ** 2], v: (t) => [1, 2 * (t - 1)], t1: 2 },
  { label: "(sin t, sin 2t)", p: (t) => [Math.sin(t), Math.sin(2 * t)], v: (t) => [Math.cos(t), 2 * Math.cos(2 * t)], t1: 2 * Math.PI },
];
const S = 260, C = S / 2, R = 95;
const X = (x: number) => C + R * x, Y = (y: number) => C - R * y;

/** A parametrised curve, the moving point, its velocity, and the length travelled so far. */
export function ParamCurveViz() {
  const [ci, setCi] = useState(0);
  const [u, setU] = useState(0.3);
  const cv = CURVES[ci];
  const t = u * cv.t1;
  const N = 300;
  const pts = Array.from({ length: N + 1 }, (_, k) => cv.p((k / N) * cv.t1));
  let len = 0;
  for (let k = 1; k <= Math.round(u * N); k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
  const [x, y] = cv.p(t), [vx, vy] = cv.v(t);
  const speed = Math.hypot(vx, vy);
  const k = 0.35;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {CURVES.map((c, i) => (
          <button key={c.label} type="button" className="seg" aria-pressed={ci === i} onClick={() => setCi(i)}>γ(t) = {c.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "8px auto" }} role="img" aria-label="A curve with a moving point and its velocity">
        <defs>
          <marker id="pc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--danger)" />
          </marker>
        </defs>
        <line x1={0} y1={C} x2={S} y2={C} stroke="var(--border)" />
        <line x1={C} y1={0} x2={C} y2={S} stroke="var(--border)" />
        <polyline points={pts.map(([a, b]) => `${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-faint)" strokeWidth={1.5} />
        <polyline points={pts.slice(0, Math.round(u * N) + 1).map(([a, b]) => `${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={3} />
        <line x1={X(x)} y1={Y(y)} x2={X(x + k * vx)} y2={Y(y + k * vy)} stroke="var(--danger)" strokeWidth={2} markerEnd="url(#pc-arrow)" />
        <circle cx={X(x)} cy={Y(y)} r={5} fill="var(--accent)" />
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">t = {t.toFixed(2)}</span>
        <input type="range" min={0} max={1} step={0.005} value={u} onChange={(e) => setU(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <figcaption className="viz-caption" aria-live="polite">
        Velocity γ′(t) = ({vx.toFixed(2)}, {vy.toFixed(2)}), speed {speed.toFixed(2)}, length travelled {len.toFixed(2)}.{" "}
        {ci === 1
          ? "The same circle traced twice as fast: double the speed, the same length, in half the time."
          : ci === 2
            ? "A parabola: the speed changes along the way, so equal steps in t are unequal steps along the curve."
            : "The arrow is the velocity, tangent to the curve; its length is the speed."}
      </figcaption>
    </figure>
  );
}
