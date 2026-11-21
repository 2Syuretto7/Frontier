"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 400; // steps on [0, 1]
const r0 = rand(1913);
const gauss = () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const walk = () => {
  const p = [0];
  for (let i = 0; i < N; i++) p.push(p[i] + gauss() / Math.sqrt(N));
  return p;
};
const SHOWN = walk();
const MANY = Array.from({ length: 2000 }, walk);
const LEVELS = [0.75, 1.25, 1.75];

const erf = (x: number) => {
  // Abramowitz and Stegun 7.1.26
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return x >= 0 ? y : -y;
};

/** Share of simulated paths whose maximum on [0, 1] reaches a, against 2 P(B_1 >= a), and the reflected display path. */
export function reflection(a: number) {
  const hitShare = MANY.filter((p) => Math.max(...p) >= a).length / MANY.length;
  const endShare = MANY.filter((p) => p[N] >= a).length / MANY.length;
  const k = SHOWN.findIndex((v) => v >= a);
  const refl = k < 0 ? null : SHOWN.map((v, i) => (i > k ? 2 * a - v : v));
  return { hitShare, endShare, exact: 1 - erf(a / Math.SQRT2), k, refl };
}

export function ReflectionViz() {
  const [ai, setAi] = useState(0);
  const a = LEVELS[ai];
  const { hitShare, endShare, exact, k, refl } = reflection(a);
  const W = 340,
    H = 200,
    X0 = 30,
    X1 = W - 8,
    Y0 = 8,
    Y1 = H - 22,
    LO = -0.7,
    HI = 2.4;
  const sx = (i: number) => X0 + (i / N) * (X1 - X0);
  const sy = (v: number) =>
    Y1 - ((Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * (Y1 - Y0);
  const d = (p: number[], from: number) =>
    p
      .slice(from)
      .map((v, i) => `${i ? "L" : "M"}${sx(i + from)},${sy(v)}`)
      .join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Level a">
          {LEVELS.map((l, j) => (
            <button
              key={l}
              type="button"
              className="seg"
              aria-pressed={ai === j}
              onClick={() => setAi(j)}
            >
              a = {l}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A Brownian path and its reflection in a level after first reaching it"
      >
        <line x1={X0} y1={sy(0)} x2={X1} y2={sy(0)} stroke="var(--border)" />
        <line
          x1={X0}
          y1={sy(a)}
          x2={X1}
          y2={sy(a)}
          stroke="var(--danger)"
          strokeDasharray="4 3"
        />
        <path
          d={d(SHOWN, 0)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.4}
        />
        {refl ? (
          <path
            d={d(refl, k)}
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth={1.2}
          />
        ) : null}
        {k >= 0 ? (
          <circle
            cx={sx(k)}
            cy={sy(a)}
            r={4}
            style={{ fill: "var(--danger)" }}
          />
        ) : null}
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">
          0
        </text>
        <text x={X0 - 4} y={sy(a) + 4} textAnchor="end" className="viz-label">
          a
        </text>
        {[0, 0.5, 1].map((t) => (
          <text
            key={t}
            x={sx(t * N)}
            y={H - 6}
            textAnchor={t === 1 ? "end" : "middle"}
            className="viz-label"
          >
            {t}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        of 2,000 paths: max reaches a {(100 * hitShare).toFixed(1)}%, end above
        a {(100 * endShare).toFixed(1)}%; 2P(B₁ ≥ a) ={" "}
        {(100 * exact).toFixed(1)}%
      </div>
      <figcaption className="viz-caption">
        A Brownian path (colour) on [0, 1] and a level a. After the path first
        reaches a (red dot), the grey path mirrors it in the level. By the
        strong Markov property the mirrored path is again a Brownian motion, so
        paths that reach a and end below it are exactly as common as those that
        end above it. That doubles the chance of ending above a to give the
        chance of ever reaching it, as the 2,000 simulated paths confirm; the
        simulation, on a grid of 400 steps, slightly undercounts paths that
        touch a between grid points.
      </figcaption>
    </figure>
  );
}
