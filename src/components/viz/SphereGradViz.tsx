"use client";

import { useState } from "react";

// minimise f(x) = x^T A x on the unit circle by projected gradient steps followed by normalisation
const A = [
  [2.2, 0.9],
  [0.9, 0.8],
];
const X0: [number, number] = [Math.cos(1.2), Math.sin(1.2)];
const LRS = [0.05, 0.15, 0.35];

const f = (x: [number, number]) =>
  A[0][0] * x[0] * x[0] + 2 * A[0][1] * x[0] * x[1] + A[1][1] * x[1] * x[1];
const grad = (x: [number, number]): [number, number] => [
  2 * (A[0][0] * x[0] + A[0][1] * x[1]),
  2 * (A[1][0] * x[0] + A[1][1] * x[1]),
];

/** One Riemannian gradient step: project the gradient onto the tangent line, step, renormalise. */
export function step(x: [number, number], lr: number) {
  const g = grad(x);
  const dot = g[0] * x[0] + g[1] * x[1];
  const t: [number, number] = [g[0] - dot * x[0], g[1] - dot * x[1]];
  const y: [number, number] = [x[0] - lr * t[0], x[1] - lr * t[1]];
  const n = Math.hypot(y[0], y[1]);
  return { g, t, y, next: [y[0] / n, y[1] / n] as [number, number] };
}

export function SphereGradViz() {
  const [li, setLi] = useState(1);
  const [path, setPath] = useState<[number, number][]>([X0]);
  const lr = LRS[li];
  const x = path[path.length - 1];
  const { g, t, y } = step(x, lr);
  const cx = 95,
    cy = 100,
    R = 62,
    a = 4;
  const P = (p: [number, number]) => [cx + p[0] * R, cy - p[1] * R];
  const [px, py] = P(x);
  const vals = path.map(f);
  const lo = 0.3,
    hi = 2.7;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button
          type="button"
          className="btn"
          onClick={() => setPath([...path, step(x, lr).next].slice(-40))}
        >
          step
        </button>
        <button type="button" className="btn" onClick={() => setPath([X0])}>
          reset
        </button>
        <div className="segmented" role="group" aria-label="Step size">
          {LRS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={li === j}
              onClick={() => setLi(j)}
            >
              η = {v}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 200"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Gradient descent on the unit circle, with the Euclidean gradient, its tangent projection and the renormalised step"
      >
        <defs>
          <marker
            id="sgv-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="var(--border-strong)"
        />
        {path.map((p, i) => {
          const [qx, qy] = P(p);
          return (
            <circle key={i} cx={qx} cy={qy} r={2} fill="var(--text-faint)" />
          );
        })}
        <line
          x1={px}
          y1={py}
          x2={px - (g[0] * R) / a}
          y2={py + (g[1] * R) / a}
          stroke="var(--text-muted)"
          strokeWidth={1.3}
          markerEnd="url(#sgv-arrow)"
        />
        <line
          x1={px}
          y1={py}
          x2={px - lr * t[0] * R}
          y2={py + lr * t[1] * R}
          stroke="var(--accent)"
          strokeWidth={2}
          markerEnd="url(#sgv-arrow)"
        />
        <circle
          cx={P(y)[0]}
          cy={P(y)[1]}
          r={3}
          fill="none"
          stroke="var(--danger)"
        />
        <circle cx={px} cy={py} r={4} fill="var(--text)" />
        <text x={200} y={16} className="viz-label">
          f along the path
        </text>
        <line x1={200} y1={170} x2={330} y2={170} stroke="var(--border)" />
        <path
          d={vals
            .map(
              (v, i) =>
                `${i ? "L" : "M"}${200 + i * 3.2},${170 - ((v - lo) / (hi - lo)) * 140}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.6}
        />
        <circle
          cx={200 + (vals.length - 1) * 3.2}
          cy={170 - ((vals[vals.length - 1] - lo) / (hi - lo)) * 140}
          r={2.5}
          fill="var(--accent)"
        />
        <line
          x1={200}
          y1={170 - ((0.36 - lo) / (hi - lo)) * 140}
          x2={330}
          y2={170 - ((0.36 - lo) / (hi - lo)) * 140}
          stroke="var(--success)"
          strokeDasharray="3 3"
        />
        <text x={330} y={186} textAnchor="end" className="viz-label">
          smallest eigenvalue 0.36
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        step {path.length - 1}: f = {f(x).toFixed(4)}
      </div>
      <figcaption className="viz-caption">
        Grey arrow: minus the ordinary gradient of f (shortened), which points
        partly off the circle. Colour: its projection onto the tangent line,
        scaled by the step size. The red ring is where that step lands, just off
        the circle, and renormalising pulls it back. Repeated steps descend to
        the eigenvector of A with the smallest eigenvalue, where the tangent
        projection of the gradient vanishes.
      </figcaption>
    </figure>
  );
}
