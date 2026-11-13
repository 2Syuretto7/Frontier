"use client";

import { useState } from "react";

const S = 280, C = S / 2, SC = 100;
const px = (x: number) => C + x * SC;
const py = (y: number) => C - y * SC;

/** The circle F(x, y) = x² + y² − 1 = 0, and the local function y = g(x) the implicit function theorem gives at a point. */
export function ImplicitBranchViz() {
  const [deg, setDeg] = useState(50);
  const t = (deg * Math.PI) / 180;
  const a = [Math.cos(t), Math.sin(t)];
  const Fx = 2 * a[0], Fy = 2 * a[1];
  const ok = Math.abs(Fy) > 0.12;
  const sign = a[1] >= 0 ? 1 : -1;
  // local graph y = g(x) on an interval around a[0] that stays inside (-1, 1)
  const w = Math.min(0.45, Math.max(0, 1 - Math.abs(a[0])) * 0.95);
  const branch: string[] = [];
  if (ok) {
    for (let k = 0; k <= 30; k++) {
      const x = a[0] - w + (2 * w * k) / 30;
      if (Math.abs(x) < 1) branch.push(`${px(x).toFixed(1)},${py(sign * Math.sqrt(1 - x * x)).toFixed(1)}`);
    }
  }
  const slope = ok ? -Fx / Fy : Infinity;
  const L = 0.6;
  const dir = ok ? [1 / Math.hypot(1, slope), slope / Math.hypot(1, slope)] : [0, 1];
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="The unit circle with a local branch and tangent">
        <line x1={0} y1={C} x2={S} y2={C} stroke="var(--border)" />
        <line x1={C} y1={0} x2={C} y2={S} stroke="var(--border)" />
        <circle cx={C} cy={C} r={SC} fill="none" stroke="var(--text-faint)" strokeWidth={1.5} />
        {ok && <polyline points={branch.join(" ")} fill="none" stroke="var(--accent)" strokeWidth={4} opacity={0.8} />}
        <line x1={px(a[0] - L * dir[0])} y1={py(a[1] - L * dir[1])} x2={px(a[0] + L * dir[0])} y2={py(a[1] + L * dir[1])} stroke={ok ? "var(--text)" : "var(--danger)"} strokeDasharray="5 4" />
        <circle cx={px(a[0])} cy={py(a[1])} r={5} fill={ok ? "var(--accent)" : "var(--danger)"} />
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">point at {deg}°</span>
        <input type="range" min={0} max={360} step={2} value={deg} onChange={(e) => setDeg(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <div className="mono" style={{ fontSize: 13, textAlign: "center", overflowWrap: "anywhere" }}>
        (x, y) = ({a[0].toFixed(2)}, {a[1].toFixed(2)}), F_x = {Fx.toFixed(2)}, F_y = {Fy.toFixed(2)}
        {ok ? `, g′(x) = −F_x/F_y = ${slope.toFixed(2)}` : ""}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {ok
          ? `Since F_y ≠ 0, near this point the circle is the graph of one function y = g(x) (thick), here y = ${sign > 0 ? "+" : "−"}√(1 − x²), with slope −F_x/F_y, found without solving for y.`
          : "Here F_y = 0: the tangent is vertical, and near the point the circle is not the graph of any function of x (each x near 1 or −1 has two y values, or none). But F_x ≠ 0, so it is locally a graph x = h(y)."}
      </figcaption>
    </figure>
  );
}
