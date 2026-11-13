"use client";

import { useState } from "react";

/** Gradient descent with the best fixed step on f(x) = ½(κx₁² + x₂²): the error shrinks by (κ − 1)/(κ + 1) per step. */
export function CondGdViz() {
  const [k, setK] = useState(10);
  const eta = 2 / (k + 1);
  const pts: [number, number][] = [];
  let x = 1 / Math.sqrt(k), y = 1;
  let steps = 0;
  for (let i = 0; i < 400; i++) {
    pts.push([x, y]);
    if (Math.hypot(x, y) < 1e-3) break;
    x = x - eta * k * x;
    y = y - eta * y;
    steps = i + 1;
  }
  const W = 320, H = 200, Cx = 160, Cy = 100, S = 80;
  const ells = [0.25, 0.5, 0.75, 1].map((r) => {
    const a = (r * 1.2) / Math.sqrt(k), b = r * 1.2;
    return <ellipse key={r} cx={Cx} cy={Cy} rx={a * S} ry={b * S} fill="none" stroke="var(--border)" />;
  });
  const rate = (k - 1) / (k + 1);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          κ = {k}
          <input type="range" min={1} max={60} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="condition number" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Gradient descent path on an elongated quadratic">
        {ells}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.4} points={pts.map(([a, b]) => `${(Cx + a * S).toFixed(1)},${(Cy - b * S).toFixed(1)}`).join(" ")} />
        {pts.slice(0, 40).map(([a, b], i) => <circle key={i} cx={Cx + a * S} cy={Cy - b * S} r={2} fill="var(--accent)" />)}
        <circle cx={Cx} cy={Cy} r={3} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        rate (κ − 1)/(κ + 1) = {rate.toFixed(3)}, steps to reach error 0.001: {steps}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Level sets of f(x) = ½(κx₁² + x₂²), whose Hessian has condition number κ. With the best constant step 2/(κ + 1),
        both coordinates of the error are multiplied by ±(κ − 1)/(κ + 1) each step: the steep direction overshoots and
        zig-zags while the shallow one creeps. The number of steps grows roughly in proportion to κ.
      </figcaption>
    </figure>
  );
}
