"use client";

import { useState } from "react";

/** Chance that m steps all eventually succeed when each attempt fails with probability eps and a failure is noticed and retried with probability r. */
export function chainSuccess(eps: number, r: number, m: number) {
  return ((1 - eps) / (1 - eps * r)) ** m;
}

export function StepRecoveryViz() {
  const [ei, setEi] = useState(5);
  const [ri, setRi] = useState(80);
  const eps = ei / 100,
    r = ri / 100;
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150,
    M = 200;
  const sx = (m: number) => x0 + (m / M) * pw;
  const sy = (v: number) => y0 + (1 - v) * ph;
  const path = (rr: number) =>
    Array.from({ length: 51 }, (_, i) => i * 4)
      .map(
        (m, i) =>
          `${i ? "L" : "M"}${sx(m).toFixed(1)},${sy(chainSuccess(eps, rr, m)).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          error rate per step: {eps.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={15}
            value={ei}
            onChange={(e) => setEi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          errors noticed and retried: {r.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={100}
            value={ri}
            onChange={(e) => setRi(+e.target.value)}
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
        aria-label="Task success against the number of steps, with and without recovery"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 0.5, 1].map((v) => (
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
        {[0, 100, 200].map((m) => (
          <text
            key={m}
            x={sx(m)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {m}
          </text>
        ))}
        <path
          d={path(0)}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <path d={path(r)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          steps in the task
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
        <span style={{ color: "var(--danger)" }}>no recovery</span>
        <span style={{ color: "var(--accent)" }}>with recovery</span>
      </div>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Success over 50 steps: {chainSuccess(eps, 0, 50).toFixed(3)} without
        recovery, {chainSuccess(eps, r, 50).toFixed(3)} with it
      </p>
      <figcaption className="viz-caption">
        If every step must go right, success decays geometrically with the
        length of the task. An agent that notices a failed step and tries again
        only loses the errors it misses, so the rate that matters is the rate of
        unnoticed errors. Raising the share of errors noticed can do more for
        long tasks than lowering the error rate itself.
      </figcaption>
    </figure>
  );
}
