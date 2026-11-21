"use client";

import { useState } from "react";

/** Evaluation error after k rounds: each round adds the human's own error eh and inherits a fraction alpha of the assistant's. */
export function levelError(eh: number, alpha: number, e0: number, k: number) {
  let e = e0;
  for (let i = 0; i < k; i++) e = eh + alpha * e;
  return e;
}

const E0 = 0.3,
  K = 10;

export function OversightErrorViz() {
  const [hi, setHi] = useState(5);
  const [ai, setAi] = useState(60);
  const eh = hi / 100,
    alpha = ai / 100;
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150,
    ymax = 0.6;
  const sx = (k: number) => x0 + (k / K) * pw;
  const sy = (v: number) => y0 + (1 - Math.min(v, ymax) / ymax) * ph;
  const ks = Array.from({ length: K + 1 }, (_, k) => k);
  const limit = alpha < 1 ? eh / (1 - alpha) : Infinity;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          human&apos;s own error: {eh.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={20}
            value={hi}
            onChange={(e) => setHi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          share of the assistant&apos;s error passed on: {alpha.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={110}
            value={ai}
            onChange={(e) => setAi(+e.target.value)}
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
        aria-label="Evaluation error across rounds of assisted oversight"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 0.2, 0.4, 0.6].map((v) => (
          <g key={v}>
            <line
              x1={x0}
              x2={x0 + pw}
              y1={sy(v)}
              y2={sy(v)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 4}
              y={sy(v) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {v}
            </text>
          </g>
        ))}
        {[0, 5, 10].map((k) => (
          <text
            key={k}
            x={sx(k)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {k}
          </text>
        ))}
        {limit <= ymax && (
          <line
            x1={x0}
            x2={x0 + pw}
            y1={sy(limit)}
            y2={sy(limit)}
            stroke="var(--danger)"
            strokeDasharray="5 3"
          />
        )}
        <path
          d={ks
            .map(
              (k, i) =>
                `${i ? "L" : "M"}${sx(k).toFixed(1)},${sy(levelError(eh, alpha, E0, k)).toFixed(1)}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        {ks.map((k) => (
          <circle
            key={k}
            cx={sx(k)}
            cy={sy(levelError(eh, alpha, E0, k))}
            r={3}
            fill="var(--accent)"
          />
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          rounds of training the next assistant
        </text>
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Long-run error:{" "}
        {Number.isFinite(limit) ? limit.toFixed(3) : "grows without limit"}
      </p>
      <figcaption className="viz-caption">
        Each round, a human assisted by the previous model evaluates the next
        one. The evaluation inherits part of the assistant&apos;s error and adds
        the human&apos;s own. If less than all of the assistant&apos;s error is
        passed on, the error settles at the human&apos;s error divided by one
        minus that share; if errors are passed on in full or amplified, they
        accumulate round after round.
      </figcaption>
    </figure>
  );
}
