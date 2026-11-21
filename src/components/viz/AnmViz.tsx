"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// Y = X + noise, with X and noise both Gaussian or both uniform; fit in both directions
const N = 400;

const gauss = (r: () => number) =>
  Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

/** Samples and least-squares residuals in both directions. */
export function fits(uniform: boolean, seed = 3) {
  const r = rand(seed);
  const draw = () => (uniform ? (2 * r() - 1) * Math.sqrt(3) : gauss(r));
  const x: number[] = [],
    y: number[] = [];
  for (let i = 0; i < N; i++) {
    const a = draw();
    x.push(a);
    y.push(a + draw());
  }
  const resid = (u: number[], v: number[]) => {
    const mu = u.reduce((s, t) => s + t, 0) / N,
      mv = v.reduce((s, t) => s + t, 0) / N;
    let c = 0,
      w = 0;
    for (let i = 0; i < N; i++) {
      c += (u[i] - mu) * (v[i] - mv);
      w += (u[i] - mu) ** 2;
    }
    return v.map((t, i) => t - mv - (c / w) * (u[i] - mu));
  };
  const corr = (u: number[], v: number[]) => {
    const mu = u.reduce((s, t) => s + t, 0) / N,
      mv = v.reduce((s, t) => s + t, 0) / N;
    let c = 0,
      a = 0,
      b = 0;
    for (let i = 0; i < N; i++) {
      c += (u[i] - mu) * (v[i] - mv);
      a += (u[i] - mu) ** 2;
      b += (v[i] - mv) ** 2;
    }
    return c / Math.sqrt(a * b);
  };
  const dep = (u: number[], v: number[]) =>
    Math.abs(
      corr(
        u.map((t) => t * t),
        v.map((t) => t * t),
      ),
    );
  const ry = resid(x, y),
    rx = resid(y, x);
  return { x, y, ry, rx, fwd: dep(x, ry), bwd: dep(y, rx) };
}

export function AnmViz() {
  const [u, setU] = useState(true);
  const { x, y, ry, rx, fwd, bwd } = fits(u);
  const panel = (
    a: number[],
    b: number[],
    ox: number,
    title: string,
    d: number,
  ) => (
    <g>
      <rect
        x={ox}
        y={22}
        width={150}
        height={130}
        fill="none"
        stroke="var(--border)"
      />
      <line x1={ox} y1={87} x2={ox + 150} y2={87} stroke="var(--grid-line)" />
      {a.map((t, i) => {
        const px = ox + 75 + t * 20,
          py = 87 - b[i] * 20;
        return px > ox && px < ox + 150 && py > 22 && py < 152 ? (
          <circle
            key={i}
            cx={px}
            cy={py}
            r={1.5}
            fill="var(--accent)"
            fillOpacity={0.5}
          />
        ) : null;
      })}
      <text x={ox} y={14} className="viz-label">
        {title}
      </text>
      <text x={ox} y={168} className="viz-label">
        dependence {d.toFixed(2)}
      </text>
    </g>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Noise distribution">
          {["uniform noise", "Gaussian noise"].map((name, j) => (
            <button
              key={name}
              type="button"
              className="seg"
              aria-pressed={u === (j === 0)}
              onClick={() => setU(j === 0)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 176"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Residuals of regressions in the causal and anti-causal directions, plotted against the regressor"
      >
        {panel(x, ry, 10, "residual of Y on X, against X", fwd)}
        {panel(y, rx, 180, "residual of X on Y, against Y", bwd)}
      </svg>
      <figcaption className="viz-caption">
        Data from Y = X + N with X and N independent. In both directions the
        least-squares residual is uncorrelated with the regressor. With uniform
        noise, only the causal direction gives a residual that is independent of
        it: the backward residual is squeezed at the ends (dependence is the
        correlation of squares). With Gaussian noise both directions look alike,
        and the direction cannot be told.
      </figcaption>
    </figure>
  );
}
