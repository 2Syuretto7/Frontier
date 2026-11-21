"use client";

import { useState } from "react";

/** Wall-clock time of a task with serial fraction f split over n agents, with coordination cost c per agent. */
export function timeModel(n: number, f: number, c: number) {
  return f + (1 - f) / n + c * n;
}

export function MultiAgentTimeViz() {
  const [fi, setFi] = useState(10);
  const [ci, setCi] = useState(10);
  const f = fi / 100,
    c = ci / 1000,
    N = 40;
  const ns = Array.from({ length: N }, (_, i) => i + 1);
  const best = ns.reduce((b, n) =>
    timeModel(n, f, c) < timeModel(b, f, c) ? n : b,
  );
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150;
  const sx = (n: number) => x0 + ((n - 1) / (N - 1)) * pw;
  const sy = (v: number) => y0 + (1 - Math.min(v, 1.2) / 1.2) * ph;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          serial share f = {f.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={60}
            value={fi}
            onChange={(e) => setFi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          cost per agent c = {c.toFixed(3)}{" "}
          <input
            type="range"
            min={1}
            max={50}
            value={ci}
            onChange={(e) => setCi(+e.target.value)}
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
        aria-label="Time against number of agents"
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
        <path
          d={ns
            .map(
              (n, i) =>
                `${i ? "L" : "M"}${sx(n).toFixed(1)},${sy(timeModel(n, f, c)).toFixed(1)}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <circle
          cx={sx(best)}
          cy={sy(timeModel(best, f, c))}
          r={4}
          fill="var(--success)"
        />
        {[1, 10, 20, 30, 40].map((n) => (
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
          agents n
        </text>
      </svg>
      <div style={{ textAlign: "center", fontSize: 13 }}>
        best: <strong>{best}</strong> agents, time{" "}
        <strong>{timeModel(best, f, c).toFixed(3)}</strong> of one agent&apos;s
      </div>
      <figcaption className="viz-caption">
        Time to finish, as a fraction of one agent working alone, when a share f
        of the work cannot be split and each agent adds a coordination cost c.
        Splitting helps until coordination outweighs the shrinking parallel
        part, at about the square root of (1 − f)/c agents.
      </figcaption>
    </figure>
  );
}
