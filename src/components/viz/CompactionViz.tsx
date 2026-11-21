"use client";

import { useState } from "react";

/** Context size read at each step, compacting to prompt plus summary when it would exceed C. */
export function contextTrace(
  T: number,
  P: number,
  o: number,
  C: number,
  s: number,
) {
  let ctx = P;
  const reads: number[] = [];
  for (let t = 0; t < T; t++) {
    reads.push(ctx);
    ctx += o;
    if (ctx > C) ctx = P + s;
  }
  return reads;
}

export function CompactionViz() {
  const [s, setS] = useState(10);
  const P = 5,
    o = 2,
    C = 100,
    T = 150;
  const reads = contextTrace(T, P, o, C, s);
  const total = reads.reduce((a, b) => a + b, 0);
  const naive = T * P + (o * T * (T - 1)) / 2;
  const W = 330,
    H = 200,
    x0 = 40,
    y0 = 10,
    pw = 275,
    ph = 150,
    ymax = 320;
  const sx = (t: number) => x0 + (t / T) * pw;
  const sy = (v: number) => y0 + (1 - v / ymax) * ph;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="viz-label">
          summary kept = {s}k tokens{" "}
          <input
            type="range"
            min={1}
            max={60}
            value={s}
            onChange={(e) => setS(+e.target.value)}
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
        aria-label="Context size over the steps of an agent with compaction"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 100, 200, 300].map((v) => (
          <g key={v}>
            <line
              x1={x0}
              x2={x0 + pw}
              y1={sy(v)}
              y2={sy(v)}
              stroke={v === C ? "var(--danger)" : "var(--grid-line)"}
              strokeDasharray={v === C ? "4 3" : undefined}
            />
            <text
              x={x0 - 4}
              y={sy(v) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {v}k
            </text>
          </g>
        ))}
        <path
          d={Array.from({ length: T }, (_, t) => t)
            .map(
              (t, i) =>
                `${i ? "L" : "M"}${sx(t).toFixed(1)},${sy(P + o * t).toFixed(1)}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
          strokeWidth={1.5}
        />
        <path
          d={reads
            .map(
              (v, t) =>
                `${t ? "L" : "M"}${sx(t).toFixed(1)},${sy(v).toFixed(1)}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        {[0, 50, 100, 150].map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {t}
          </text>
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          steps
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
        <span style={{ color: "var(--accent)" }}>
          with compaction: {(total / 1000).toFixed(1)}M tokens read
        </span>
        <span style={{ color: "var(--text-muted)" }}>
          without: {(naive / 1000).toFixed(1)}M, past the 100k limit
        </span>
      </div>
      <figcaption className="viz-caption">
        Each step adds 2k tokens to a 5k prompt. When the context would pass the
        100k window, the agent replaces its history with a summary and carries
        on. A short summary leaves room for many steps between compactions but
        keeps less of what happened; a long one compacts more often.
      </figcaption>
    </figure>
  );
}
