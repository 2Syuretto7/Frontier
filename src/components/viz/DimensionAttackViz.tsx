"use client";

import { useState } from "react";

/** Largest change in a linear score w·x from a perturbation with each coordinate at most eps (sign attack), when |w_i| = m. */
export function linfChange(n: number, eps: number, m: number) {
  return eps * m * n;
}

/** Largest change from a perturbation of Euclidean length eps. */
export function l2Change(n: number, eps: number, m: number) {
  return eps * m * Math.sqrt(n);
}

const M = 0.01,
  MARGIN = 5;

export function DimensionAttackViz() {
  const [ei, setEi] = useState(8);
  const eps = ei / 255;
  const W = 330,
    H = 200,
    x0 = 40,
    y0 = 10,
    pw = 270,
    ph = 150;
  const lx0 = 0,
    lx1 = 6,
    ly0 = -4,
    ly1 = 3;
  const sx = (n: number) => x0 + ((Math.log10(n) - lx0) / (lx1 - lx0)) * pw;
  const sy = (v: number) =>
    y0 +
    (1 - (Math.max(ly0, Math.min(ly1, Math.log10(v))) - ly0) / (ly1 - ly0)) *
      ph;
  const ns = Array.from({ length: 61 }, (_, i) => 10 ** (i / 10));
  const path = (fn: (n: number) => number) =>
    ns
      .map(
        (n, i) => `${i ? "L" : "M"}${sx(n).toFixed(1)},${sy(fn(n)).toFixed(1)}`,
      )
      .join(" ");
  const flip = Math.ceil(MARGIN / (eps * M));
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          change per coordinate: {ei}/255{" "}
          <input
            type="range"
            min={1}
            max={32}
            value={ei}
            onChange={(e) => setEi(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="How much a small perturbation can move a linear score as the input dimension grows"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[-4, -2, 0, 2].map((v) => (
          <g key={v}>
            <line
              x1={x0}
              x2={x0 + pw}
              y1={sy(10 ** v)}
              y2={sy(10 ** v)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 4}
              y={sy(10 ** v) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {`1e${v}`}
            </text>
          </g>
        ))}
        {[0, 2, 4, 6].map((v) => (
          <text
            key={v}
            x={sx(10 ** v)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {`1e${v}`}
          </text>
        ))}
        <line
          x1={x0}
          x2={x0 + pw}
          y1={sy(MARGIN)}
          y2={sy(MARGIN)}
          stroke="var(--danger)"
          strokeDasharray="5 3"
        />
        <path
          d={path((n) => linfChange(n, eps, M))}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
        />
        <path
          d={path((n) => l2Change(n, eps, M))}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          input dimension
        </text>
      </svg>
      <div
        style={{
          display: "flex",
          gap: "4px 16px",
          justifyContent: "center",
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--danger)" }}>
          every coordinate moved by ε
        </span>
        <span style={{ color: "var(--accent)" }}>
          a perturbation of total length ε
        </span>
      </div>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        A margin of 5 is crossed from about {flip.toLocaleString("en-IN")}{" "}
        dimensions
      </p>
      <figcaption className="viz-caption">
        A linear score with weights of size 0.01. Moving every coordinate by a
        barely visible amount in the direction of its weight changes the score
        in proportion to the number of coordinates, so in a high-dimensional
        input such as an image it can cross any fixed margin (dashed). A
        perturbation of fixed total length grows only with the square root.
      </figcaption>
    </figure>
  );
}
