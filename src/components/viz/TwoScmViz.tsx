"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// model A: X = U, Y = 0.8 X + 0.6 V.  model B: Y = V, X = 0.8 Y + 0.6 U.  U, V standard normal.
const XS = [-2, -1, 0, 1, 2];

const gauss = (r: () => number) =>
  Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

/** Samples of (X, Y) from model m (0 or 1), observationally or with X set to xSet. */
export function sampleScm(m: number, xSet: number | null, n = 300, seed = 5) {
  const r = rand(seed + m);
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const u = gauss(r),
      v = gauss(r);
    if (m === 0) {
      const x = xSet ?? u;
      out.push([x, 0.8 * x + 0.6 * v]);
    } else {
      const y = v;
      out.push([xSet ?? 0.8 * y + 0.6 * u, y]);
    }
  }
  return out;
}

export function TwoScmViz() {
  const [k, setK] = useState(-1);
  const xSet = k < 0 ? null : XS[k];
  const panel = (m: number, ox: number) => {
    const pts = sampleScm(m, xSet);
    const meanY = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const P = (x: number, y: number) => [ox + 75 + x * 22, 95 - y * 22];
    return (
      <g>
        <rect
          x={ox}
          y={20}
          width={150}
          height={150}
          fill="none"
          stroke="var(--border)"
        />
        <line x1={ox} y1={95} x2={ox + 150} y2={95} stroke="var(--grid-line)" />
        <line
          x1={ox + 75}
          y1={20}
          x2={ox + 75}
          y2={170}
          stroke="var(--grid-line)"
        />
        {pts.map(([x, y], i) => {
          const [a, b] = P(x, y);
          return a > ox && a < ox + 150 && b > 20 && b < 170 ? (
            <circle
              key={i}
              cx={a}
              cy={b}
              r={1.6}
              fill="var(--accent)"
              fillOpacity={0.5}
            />
          ) : null;
        })}
        {xSet !== null && (
          <line
            x1={ox + 4}
            y1={P(0, meanY)[1]}
            x2={ox + 146}
            y2={P(0, meanY)[1]}
            stroke="var(--danger)"
            strokeDasharray="4 3"
          />
        )}
        <text x={ox} y={14} className="viz-label">
          {m === 0 ? "A: X causes Y" : "B: Y causes X"}
        </text>
        <text x={ox} y={186} className="viz-label">
          {xSet === null ? "observed" : `mean Y = ${meanY.toFixed(2)}`}
        </text>
      </g>
    );
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Setting of X">
          <button
            type="button"
            className="seg"
            aria-pressed={k < 0}
            onClick={() => setK(-1)}
          >
            observe
          </button>
          {XS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              set X = {v}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 192"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Samples from two structural causal models with the same observational distribution, observed or with X set by intervention"
      >
        {panel(0, 10)}
        {panel(1, 180)}
      </svg>
      <figcaption className="viz-caption">
        Two structural causal models. In A, Y = 0.8X + 0.6V; in B, X = 0.8Y +
        0.6U; the noises are independent standard normals. Observed, both
        produce the same cloud: a bivariate normal with correlation 0.8. Setting
        X by hand replaces its equation. In A the mean of Y follows 0.8 times
        the setting; in B it stays at 0.
      </figcaption>
    </figure>
  );
}
