"use client";

import { useState } from "react";

const S = 280, C = S / 2, SC = 85;
const px = (x: number) => C + x * SC;
const py = (y: number) => C - y * SC;
const OPT = Math.atan2(2, 1);

function Arrow({ x, y, dx, dy, color }: { x: number; y: number; dx: number; dy: number; color: string }) {
  const x1 = px(x), y1 = py(y), x2 = px(x + dx), y2 = py(y + dy);
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g stroke={color} strokeWidth={2.2} fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <polyline points={`${x2 - 8 * Math.cos(a - 0.4)},${y2 - 8 * Math.sin(a - 0.4)} ${x2},${y2} ${x2 - 8 * Math.cos(a + 0.4)},${y2 - 8 * Math.sin(a + 0.4)}`} />
    </g>
  );
}

/** Maximising f(x, y) = x + 2y on the unit circle: at the optimum, ∇f is parallel to the constraint's gradient. */
export function LagrangeViz() {
  const [deg, setDeg] = useState(120);
  const t = (deg * Math.PI) / 180;
  const x = Math.cos(t), y = Math.sin(t);
  const f = x + 2 * y;
  const gf = [1, 2].map((v) => v / Math.sqrt(5) * 0.6);
  const gg = [x * 0.6, y * 0.6];
  const cross = 1 * y - 2 * x; // zero when ∇f ∥ (x, y)
  const lines = [-2, -1, 0, 1, 2].map((c) => {
    // x + 2y = c across the box [-1.6, 1.6]
    const xa = -1.6, xb = 1.6;
    return { c, x1: px(xa), y1: py((c - xa) / 2), x2: px(xb), y2: py((c - xb) / 2) };
  });
  const near = Math.abs(cross) < 0.05;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="Level lines of x + 2y and the unit circle">
        {lines.map((l) => (
          <line key={l.c} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="var(--text-faint)" />
        ))}
        <line x1={px(-1.6)} y1={py((f + 1.6) / 2)} x2={px(1.6)} y2={py((f - 1.6) / 2)} stroke="var(--accent)" strokeDasharray="5 4" />
        <circle cx={C} cy={C} r={SC} fill="none" stroke="var(--text)" strokeWidth={1.8} />
        <Arrow x={x} y={y} dx={gf[0]} dy={gf[1]} color="var(--accent)" />
        <Arrow x={x} y={y} dx={gg[0]} dy={gg[1]} color="var(--danger)" />
        <circle cx={px(x)} cy={py(y)} r={5} fill="var(--text)" />
        <circle cx={px(Math.cos(OPT))} cy={py(Math.sin(OPT))} r={3} fill="none" stroke="var(--text-muted)" />
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">point at {deg}°</span>
        <input type="range" min={0} max={360} step={1} value={deg} onChange={(e) => setDeg(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <div className="mono" style={{ fontSize: 13, textAlign: "center" }}>
        f = x + 2y = {f.toFixed(3)} (largest on the circle: √5 ≈ 2.236)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Grey lines are level sets of f; the dashed one passes through the point. The <span style={{ color: "var(--accent)" }}>gradient of f</span>{" "}
        is (1, 2) everywhere, and the <span style={{ color: "var(--danger)" }}>gradient of g = x² + y² − 1</span> points
        outwards.{" "}
        {near
          ? `Here the two are parallel and the level line just touches the circle: a constrained ${f > 0 ? "maximum" : "minimum"}, at ${f > 0 ? "about 63°" : "about 243°"}.`
          : "Where they are not parallel, ∇f has a component along the circle, so moving along the circle in that direction still increases f."}
      </figcaption>
    </figure>
  );
}
