"use client";

import { useState } from "react";

/** Stylised accuracy of answering directly: exact up to d serial steps, a guess among k beyond. */
export function directAcc(n: number, d: number, k: number) {
  return n <= d ? 1 : 1 / k;
}

/** Stylised accuracy with a chain of thought: every step must be right, otherwise a guess. */
export function cotAcc(n: number, eps: number, k: number) {
  const p = (1 - eps) ** n;
  return p + (1 - p) / k;
}

export function CotDepthViz() {
  const [d, setD] = useState(8);
  const [e, setE] = useState(2);
  const eps = e / 100,
    k = 3,
    N = 60;
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150;
  const sx = (n: number) => x0 + ((n - 1) / (N - 1)) * pw;
  const sy = (a: number) => y0 + (1 - a) * ph;
  const ns = Array.from({ length: N }, (_, i) => i + 1);
  const line = (f: (n: number) => number) =>
    ns
      .map(
        (n, i) => `${i ? "L" : "M"}${sx(n).toFixed(1)},${sy(f(n)).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          serial steps per token = {d}{" "}
          <input
            type="range"
            min={2}
            max={24}
            value={d}
            onChange={(ev) => setD(+ev.target.value)}
          />
        </label>
        <label className="viz-label">
          error per written step = {e}%{" "}
          <input
            type="range"
            min={0}
            max={10}
            value={e}
            onChange={(ev) => setE(+ev.target.value)}
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
        aria-label="Accuracy against number of steps, direct and with a chain of thought"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 1 / 3, 1].map((a) => (
          <g key={a}>
            <line
              x1={x0}
              x2={x0 + pw}
              y1={sy(a)}
              y2={sy(a)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 4}
              y={sy(a) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {a === 1 / 3 ? "⅓" : a}
            </text>
          </g>
        ))}
        <path
          d={line((n) => directAcc(n, d, k))}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
        />
        <path
          d={line((n) => cotAcc(n, eps, k))}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        {[1, 20, 40, 60].map((n) => (
          <text
            key={n}
            x={sx(n)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {n}
          </text>
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          swaps to track
        </text>
      </svg>
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--danger)" }}>answer directly</span>
        <span style={{ color: "var(--accent)" }}>chain of thought</span>
      </div>
      <figcaption className="viz-caption">
        A stylised model of tracking a ball under three cups through n swaps.
        Answering at once, a network can carry out only as many sequential steps
        as its depth allows, and beyond that it guesses. Writing the position
        after every swap needs one step per token, so length is no longer the
        limit, but each written step can be wrong and the errors compound.
      </figcaption>
    </figure>
  );
}
