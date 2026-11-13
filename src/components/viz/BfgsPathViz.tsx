"use client";

import { useMemo, useState } from "react";

type P = [number, number];
const f = (p: P) => (1 - p[0]) ** 2 + 100 * (p[1] - p[0] ** 2) ** 2;
const g = (p: P): P => [-2 * (1 - p[0]) - 400 * p[0] * (p[1] - p[0] ** 2), 200 * (p[1] - p[0] ** 2)];
const STARTS: P[] = [[-1.2, 1], [0, 0], [-0.5, 1.5], [1.5, 0.5]];
const MAX = 5000;

function search(x: P, d: P, gx: P) {
  let t = 1;
  const slope = gx[0] * d[0] + gx[1] * d[1];
  while (t > 1e-12 && f([x[0] + t * d[0], x[1] + t * d[1]]) > f(x) + 1e-4 * t * slope) t *= 0.5;
  return t;
}

function run(x0: P, quasi: boolean) {
  let x: P = [...x0] as P;
  let gx = g(x);
  let H = [1, 0, 0, 1];
  const path: P[] = [x];
  let k = 0;
  while (k < MAX && Math.hypot(gx[0], gx[1]) > 1e-6) {
    const d: P = quasi ? [-(H[0] * gx[0] + H[1] * gx[1]), -(H[2] * gx[0] + H[3] * gx[1])] : [-gx[0], -gx[1]];
    const t = search(x, d, gx);
    const xn: P = [x[0] + t * d[0], x[1] + t * d[1]];
    const gn = g(xn);
    if (quasi) {
      const s = [xn[0] - x[0], xn[1] - x[1]], y = [gn[0] - gx[0], gn[1] - gx[1]];
      const sy = s[0] * y[0] + s[1] * y[1];
      if (sy > 1e-14) {
        const r = 1 / sy;
        const V = [1 - r * y[0] * s[0], -r * y[0] * s[1], -r * y[1] * s[0], 1 - r * y[1] * s[1]];
        const HV = [H[0] * V[0] + H[1] * V[2], H[0] * V[1] + H[1] * V[3], H[2] * V[0] + H[3] * V[2], H[2] * V[1] + H[3] * V[3]];
        H = [
          V[0] * HV[0] + V[2] * HV[2] + r * s[0] * s[0],
          V[0] * HV[1] + V[2] * HV[3] + r * s[0] * s[1],
          V[1] * HV[0] + V[3] * HV[2] + r * s[1] * s[0],
          V[1] * HV[1] + V[3] * HV[3] + r * s[1] * s[1],
        ];
      }
    }
    x = xn;
    gx = gn;
    path.push(x);
    k++;
  }
  return { path, k };
}

/** Gradient descent and BFGS, both with backtracking, on the Rosenbrock function: BFGS learns the curvature of the bent valley from gradient differences and needs a few dozen steps where gradient descent needs thousands. */
export function BfgsPathViz() {
  const [j, setJ] = useState(0);
  const x0 = STARTS[j];
  const gd = useMemo(() => run(x0, false), [x0]);
  const qn = useMemo(() => run(x0, true), [x0]);
  const xl = -2, xh = 2, yl = -1, yh = 3;
  const W = 300, H = 300;
  const X = (x: number) => 10 + ((x - xl) / (xh - xl)) * (W - 20);
  const Y = (y: number) => H - 10 - ((y - yl) / (yh - yl)) * (H - 20);
  const levels = [0.5, 4, 25, 100, 300];
  const branch = (c: number, sign: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 400; i++) {
      const x = 1 - Math.sqrt(c) + (2 * Math.sqrt(c) * i) / 400;
      const r = c - (1 - x) ** 2;
      if (r < 0 || x < xl || x > xh) continue;
      const y = x * x + sign * Math.sqrt(r / 100);
      pts.push(`${X(x).toFixed(1)},${Y(y).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const line = (p: P[]) => p.map(([a, b]) => `${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="mono" style={{ fontSize: 13 }}>start</span>
        {STARTS.map((s, i) => (
          <button key={i} type="button" className="seg" aria-pressed={j === i} onClick={() => setJ(i)}>({s[0]}, {s[1]})</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Level sets of the Rosenbrock function with gradient descent and BFGS paths">
        <defs>
          <clipPath id="bf-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#bf-clip)">
          {levels.map((c) => (
            <g key={c}>
              <polyline fill="none" stroke="var(--border)" points={branch(c, 1)} />
              <polyline fill="none" stroke="var(--border)" points={branch(c, -1)} />
            </g>
          ))}
          <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.1} points={line(gd.path)} />
          <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={line(qn.path)} />
        </g>
        <circle cx={X(x0[0])} cy={Y(x0[1])} r={3.5} fill="var(--text)" />
        <circle cx={X(1)} cy={Y(1)} r={3} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        steps to ‖∇f‖ &lt; 10⁻⁶: gradient descent {gd.k >= MAX ? `more than ${MAX}` : gd.k}; BFGS {qn.k}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The Rosenbrock function (1 − x)² + 100(y − x²)² has a curved, narrow valley whose floor leads to the minimum at
        (1, 1), the red point. Gradient descent with backtracking, the grey path, bounces off the walls and creeps along
        the floor. BFGS starts out as gradient descent but updates an estimate of the inverse Hessian from each pair of
        steps and gradient changes, so its steps soon follow the valley and its last steps are almost Newton steps.
      </figcaption>
    </figure>
  );
}
