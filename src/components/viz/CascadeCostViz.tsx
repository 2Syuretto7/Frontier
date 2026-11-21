"use client";

import { useState } from "react";

/** Up to k attempts at cost c each, stopping at the first success found by an exact checker; a share 1 - reach of tasks is never solved. */
export function retryStats(p: number, c: number, k: number, reach = 1) {
  const sk = 1 - (1 - p) ** k;
  return {
    s: reach * sk,
    cost: c * (reach * (p > 0 ? sk / p : k) + (1 - reach) * k),
  };
}

/** Try the cheap model; escalate to the strong one when the checker shows a failure. */
export function cascade(p1: number, c1: number, q2: number, c2: number) {
  return { s: p1 + (1 - p1) * q2, cost: c1 + (1 - p1) * c2 };
}

const C1 = 0.1,
  C2 = 1.0,
  P2 = 0.6,
  P = 0.6;

export function CascadeCostViz() {
  const [wi, setWi] = useState(60);
  const [qi, setQi] = useState(40);
  const w = wi / 100,
    q2 = qi / 100,
    p1 = w * P;
  const retries = [1, 2, 3, 4, 5, 6, 7, 8].map((k) => retryStats(P, C1, k, w));
  const cas = cascade(p1, C1, q2, C2);
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150,
    cmax = 1.2;
  const sx = (c: number) => x0 + (Math.min(c, cmax) / cmax) * pw;
  const sy = (v: number) => y0 + (1 - v) * ph;
  const pts = [
    { label: "strong", s: P2, cost: C2, color: "var(--danger)" },
    { label: "cascade", s: cas.s, cost: cas.cost, color: "var(--accent)" },
  ];
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          tasks within the cheap model&apos;s reach: {w.toFixed(2)}{" "}
          <input
            type="range"
            min={10}
            max={100}
            value={wi}
            onChange={(e) => setWi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          strong model solves the cheap one&apos;s failures: {q2.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={100}
            value={qi}
            onChange={(e) => setQi(+e.target.value)}
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
        aria-label="Success against cost per task for retries, a strong model and a cascade"
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
        {[0, 0.5, 1].map((c) => (
          <text
            key={c}
            x={sx(c)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {c.toFixed(1)}
          </text>
        ))}
        <path
          d={retries
            .map(
              (r, i) =>
                `${i ? "L" : "M"}${sx(r.cost).toFixed(1)},${sy(r.s).toFixed(1)}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={1.5}
        />
        {retries.map((r, i) => (
          <circle
            key={i}
            cx={sx(r.cost)}
            cy={sy(r.s)}
            r={3}
            fill="var(--text-muted)"
          />
        ))}
        {pts.map((p) => (
          <g key={p.label}>
            <circle cx={sx(p.cost)} cy={sy(p.s)} r={5} fill={p.color} />
            <text x={sx(p.cost) + 7} y={sy(p.s) + 4} className="viz-label">
              {p.label}
            </text>
          </g>
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          expected cost per task, dollars
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
        <span style={{ color: "var(--text-muted)" }}>
          cheap model, 1 to 8 attempts
        </span>
        <span>
          cost per success: strong {(C2 / P2).toFixed(2)}, cascade{" "}
          {(cas.cost / cas.s).toFixed(2)}
        </span>
      </div>
      <figcaption className="viz-caption">
        A cheap model costs $0.10 an attempt and succeeds 60% of the time on the
        tasks within its reach, never on the rest; a strong one costs $1.00 and
        succeeds on 60% of all tasks. Tests tell success from failure. Retrying
        the cheap model climbs the grey curve but flattens at its reach, while
        tasks out of reach use every attempt. A cascade tries the cheap model
        once and escalates its failures; whether it wins depends on how often
        the strong model solves exactly those harder tasks.
      </figcaption>
    </figure>
  );
}
