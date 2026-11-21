"use client";

import { useState } from "react";

const ALPHA = 4,
  BETA = 10,
  T = 60,
  L0 = 0,
  L1 = 14;

/** True capability score as a linear function of log2 effective compute. */
export function capability(l: number) {
  return ALPHA * l + BETA;
}

export function EvalScheduleViz() {
  const [ki, setKi] = useState(2);
  const [bi, setBi] = useState(11);
  const k = 2 ** ki,
    gap = 3,
    buffer = bi;
  const needed = ALPHA * ki + gap;
  const warn = T - buffer;
  const evals: number[] = [];
  for (let l = L0; l <= L1 + 1e-9; l += ki) evals.push(l);
  const trigger = evals.find((l) => capability(l) - gap >= warn);
  const crossAt = (T - BETA) / ALPHA;
  const unsafe = trigger === undefined ? crossAt <= L1 : crossAt < trigger;
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150,
    ymax = 70;
  const sx = (l: number) => x0 + ((l - L0) / (L1 - L0)) * pw;
  const sy = (v: number) =>
    y0 + (1 - Math.max(0, Math.min(v, ymax)) / ymax) * ph;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          evaluate every {k}× compute{" "}
          <input
            type="range"
            min={1}
            max={5}
            value={ki}
            onChange={(e) => setKi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          warning buffer: {buffer} points (needed: {needed}){" "}
          <input
            type="range"
            min={0}
            max={24}
            value={bi}
            onChange={(e) => setBi(+e.target.value)}
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
        aria-label="Capability against compute, with evaluations, a threshold and a warning line"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 20, 40, 60].map((v) => (
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
        <line
          x1={x0}
          x2={x0 + pw}
          y1={sy(T)}
          y2={sy(T)}
          stroke="var(--danger)"
          strokeWidth={2}
        />
        <line
          x1={x0}
          x2={x0 + pw}
          y1={sy(warn)}
          y2={sy(warn)}
          stroke="var(--danger)"
          strokeDasharray="5 3"
        />
        <line
          x1={sx(L0)}
          y1={sy(capability(L0))}
          x2={sx(L1)}
          y2={sy(capability(L1))}
          stroke="var(--text-muted)"
          strokeWidth={2}
        />
        <line
          x1={sx(L0)}
          y1={sy(capability(L0) - gap)}
          x2={sx(L1)}
          y2={sy(capability(L1) - gap)}
          stroke="var(--accent)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        {evals.map((l) => (
          <circle
            key={l}
            cx={sx(l)}
            cy={sy(capability(l) - gap)}
            r={4}
            fill={l === trigger ? "var(--danger)" : "var(--accent)"}
          />
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          doublings of effective compute
        </text>
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        {unsafe
          ? "The true capability crosses the threshold before any evaluation triggers."
          : "An evaluation triggers the warning before the true capability reaches the threshold."}
      </p>
      <div
        style={{
          display: "flex",
          gap: "4px 16px",
          justifyContent: "center",
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>true capability</span>
        <span style={{ color: "var(--accent)" }}>measured at evaluations</span>
        <span style={{ color: "var(--danger)" }}>
          threshold and warning line
        </span>
      </div>
      <figcaption className="viz-caption">
        Capability rises by 4 points per doubling of compute, and evaluations
        measure it 3 points low. The warning line sits below the threshold by
        the chosen buffer. If the buffer covers the growth possible between
        evaluations plus the elicitation gap, the first evaluation above the
        warning line always comes before the threshold is crossed; with a
        smaller buffer or sparser evaluations, the threshold can be crossed
        unseen.
      </figcaption>
    </figure>
  );
}
