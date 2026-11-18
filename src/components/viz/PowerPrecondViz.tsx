"use client";

import { useMemo, useState } from "react";

const THETA = Math.PI / 6;
const LAM = [50, 1];
const C = Math.cos(THETA), S = Math.sin(THETA);

/** Apply V diag(d) Vᵀ, where V rotates by THETA, to a 2-vector. */
function apply(d: number[], x: number[]) {
  const a = C * x[0] + S * x[1], b = -S * x[0] + C * x[1];
  const p = d[0] * a, q = d[1] * b;
  return [C * p - S * q, S * p + C * q];
}

/** Gradient descent preconditioned by H^α on ½xᵀHx, with the best fixed step for the preconditioned spectrum. */
export function powerPath(alpha: number, steps = 400) {
  const pl = LAM.map((l) => l ** (1 - alpha));
  const lr = 2 / (Math.min(...pl) + Math.max(...pl));
  let x = [-1.2, 0.9];
  const path = [x];
  let hit: number | null = null;
  for (let t = 1; t <= steps; t++) {
    const step = apply(LAM.map((l) => l ** (1 - alpha)), apply([1, 1], x));
    x = [x[0] - lr * step[0], x[1] - lr * step[1]];
    path.push(x);
    const hx = apply(LAM, x);
    if (hit === null && 0.5 * (x[0] * hx[0] + x[1] * hx[1]) < 1e-6) hit = t;
  }
  return { path, hit, kappa: Math.max(...pl) / Math.min(...pl) };
}

export function PowerPrecondViz() {
  const [alpha, setAlpha] = useState(0);
  const r = useMemo(() => powerPath(alpha), [alpha]);
  const W = 300, H = 200, R = 1.6;
  const sx = (v: number) => W / 2 + (v / R) * (H / 2 - 6);
  const sy = (v: number) => H / 2 - (v / R) * (H / 2 - 6);
  const ellipse = (c: number) =>
    Array.from({ length: 73 }, (_, i) => {
      const t = (2 * Math.PI * i) / 72;
      const p = apply([1, 1], [Math.sqrt(2 * c / LAM[0]) * Math.cos(t), Math.sqrt(2 * c / LAM[1]) * Math.sin(t)]);
      const q = [C * p[0] - S * p[1], S * p[0] + C * p[1]];
      return `${sx(q[0])},${sy(q[1])}`;
    }).join(" ");
  const shown = r.path.slice(0, 60);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">preconditioner H^α, α =</span>
        {[0, 0.25, 0.5, 1].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={alpha === v} onClick={() => setAlpha(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Paths of preconditioned gradient descent on a tilted quadratic">
        {[0.05, 0.4, 1.5, 5, 15].map((c) => (
          <polyline key={c} fill="none" stroke="var(--border)" points={ellipse(c)} />
        ))}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.5} points={shown.map((p) => `${sx(p[0])},${sy(p[1])}`).join(" ")} />
        {shown.map((p, i) => (
          <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r={2} fill="var(--accent)" />
        ))}
        <circle cx={sx(0)} cy={sy(0)} r={3} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`κ after preconditioning = ${r.kappa.toFixed(2)}; steps to loss < 1e-6: ${r.hit ?? "> 400"}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Gradient descent on a tilted quadratic with curvatures 50 and 1, preconditioned by H^α and run with the best fixed
        step for the preconditioned problem (first 60 steps shown). Plain gradient descent (α = 0) zigzags across the
        valley; the square root (α = 1/2) turns κ = 50 into about 7; α = 1 is Newton&apos;s method and lands on the minimum
        in one step. Each increase of α shrinks the condition number to κ^(1 − α).
      </figcaption>
    </figure>
  );
}
