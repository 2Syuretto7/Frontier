"use client";

import { useState } from "react";

// f(x, y) = x² + 3y², at the point a = (1, 0.6).
const A: [number, number] = [1, 0.6];
const G: [number, number] = [2 * A[0], 6 * A[1]];
const GN = Math.hypot(G[0], G[1]);
const GT = Math.atan2(G[1], G[0]);
const S = 280, C = S / 2, SC = 55;
const px = (x: number) => C + x * SC;
const py = (y: number) => C - y * SC;
const ellipse = (c: number) => {
  const pts: string[] = [];
  for (let k = 0; k <= 64; k++) {
    const t = (2 * Math.PI * k) / 64;
    pts.push(`${px(Math.sqrt(c) * Math.cos(t)).toFixed(1)},${py(Math.sqrt(c / 3) * Math.sin(t)).toFixed(1)}`);
  }
  return pts.join(" ");
};
const LEVELS = [0.25, 0.75, 1.5, 2.08, 3, 4.5];
const PW = 280, PH = 110;
const qx = (t: number) => 10 + (t / 360) * (PW - 20);
const qy = (d: number) => PH / 2 - (d / GN) * (PH / 2 - 10);
const CURVE = Array.from({ length: 73 }, (_, k) => {
  const t = k * 5;
  return `${qx(t).toFixed(1)},${qy(GN * Math.cos((t * Math.PI) / 180 - GT)).toFixed(1)}`;
}).join(" ");

function Arrow({ dx, dy, color }: { dx: number; dy: number; color: string }) {
  const x2 = px(A[0] + dx), y2 = py(A[1] + dy);
  const ang = Math.atan2(y2 - py(A[1]), x2 - px(A[0]));
  const h1 = `${(x2 - 9 * Math.cos(ang - 0.4)).toFixed(1)},${(y2 - 9 * Math.sin(ang - 0.4)).toFixed(1)}`;
  const h2 = `${(x2 - 9 * Math.cos(ang + 0.4)).toFixed(1)},${(y2 - 9 * Math.sin(ang + 0.4)).toFixed(1)}`;
  return (
    <g stroke={color} strokeWidth={2.2} fill="none">
      <line x1={px(A[0])} y1={py(A[1])} x2={x2} y2={y2} />
      <polyline points={`${h1} ${x2.toFixed(1)},${y2.toFixed(1)} ${h2}`} />
    </g>
  );
}

/** Contours of f(x, y) = x² + 3y², the gradient at a point, and the slope of f in a chosen direction. */
export function DirectionalDerivViz() {
  const [deg, setDeg] = useState(0);
  const th = (deg * Math.PI) / 180;
  const u: [number, number] = [Math.cos(th), Math.sin(th)];
  const d = G[0] * u[0] + G[1] * u[1];
  const gs = 1 / GN;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="Contours, gradient and a direction">
        <line x1={0} y1={py(0)} x2={S} y2={py(0)} stroke="var(--border)" />
        <line x1={px(0)} y1={0} x2={px(0)} y2={S} stroke="var(--border)" />
        {LEVELS.map((c) => (
          <polyline key={c} points={ellipse(c)} fill="none" stroke={c === 2.08 ? "var(--text-muted)" : "var(--text-faint)"} strokeWidth={c === 2.08 ? 1.6 : 1} />
        ))}
        <Arrow dx={G[0] * gs * 1.2} dy={G[1] * gs * 1.2} color="var(--danger)" />
        <Arrow dx={u[0] * 0.9} dy={u[1] * 0.9} color="var(--accent)" />
        <circle cx={px(A[0])} cy={py(A[1])} r={4} fill="var(--text)" />
      </svg>
      <svg viewBox={`0 0 ${PW} ${PH}`} style={{ width: "100%", maxWidth: 340, display: "block", margin: "6px auto 0" }} role="img" aria-label="Directional derivative against direction angle">
        <line x1={10} y1={qy(0)} x2={PW - 10} y2={qy(0)} stroke="var(--border)" />
        <polyline points={CURVE} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} />
        <circle cx={qx(deg)} cy={qy(d)} r={5} fill="var(--accent)" />
        <text x={12} y={14} className="viz-label">slope in direction u, against angle</text>
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">angle {deg}°</span>
        <input type="range" min={0} max={360} step={5} value={deg} onChange={(e) => setDeg(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <figcaption className="viz-caption" aria-live="polite">
        At a = (1, 0.6), the <span style={{ color: "var(--danger)" }}>gradient</span> is (2, 3.6), of length{" "}
        <span className="mono">{GN.toFixed(2)}</span>. In the <span style={{ color: "var(--accent)" }}>direction u</span> the
        slope is ∇f · u = <span className="mono">{d.toFixed(2)}</span>.{" "}
        {Math.abs(d) < 0.25
          ? "Almost zero: u runs along the level curve, at right angles to the gradient."
          : d > GN - 0.05
            ? "The largest possible slope: u points along the gradient."
            : d < -GN + 0.05
              ? "The steepest descent: u points against the gradient."
              : "The slope is |∇f| cos of the angle between u and the gradient."}
      </figcaption>
    </figure>
  );
}
