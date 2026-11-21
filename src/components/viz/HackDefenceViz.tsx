"use client";

import { useState } from "react";

/** Expected reward when a trajectory passes with probability pass, is flagged with probability flag, and a flag costs c. */
export function expectedReward(pass: number, flag: number, c: number) {
  return (1 - flag) * pass - flag * c;
}

const RHO = 0.6,
  C = 0.5,
  NS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function HackDefenceViz() {
  const [qi, setQi] = useState(10);
  const [pi, setPi] = useState(20);
  const q = qi / 100,
    p = pi / 100;
  const hack = NS.map((n) => expectedReward(RHO ** n, q, C));
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150,
    lo = -0.5;
  const sx = (n: number) => x0 + (n / 10) * pw;
  const sy = (v: number) => y0 + ((1 - v) / (1 - lo)) * ph;
  const wins = NS.filter((n) => hack[n] > p);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          monitor catches the hack: {q.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={100}
            value={qi}
            onChange={(e) => setQi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          honest success rate: {p.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={100}
            value={pi}
            onChange={(e) => setPi(+e.target.value)}
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
        aria-label="Expected reward of a hack against the number of hidden tests"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {wins.length > 0 && (
          <rect
            x={x0}
            y={y0}
            width={sx(Math.max(...wins) + 0.5) - x0}
            height={ph}
            fill="var(--danger)"
            fillOpacity={0.1}
          />
        )}
        {[-0.5, 0, 0.5, 1].map((v) => (
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
        {[0, 5, 10].map((n) => (
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
        <line
          x1={x0}
          x2={x0 + pw}
          y1={sy(p)}
          y2={sy(p)}
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <path
          d={NS.map(
            (n, i) =>
              `${i ? "L" : "M"}${sx(n).toFixed(1)},${sy(hack[n]).toFixed(1)}`,
          ).join(" ")}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        {NS.map((n) => (
          <circle
            key={n}
            cx={sx(n)}
            cy={sy(hack[n])}
            r={3}
            fill="var(--danger)"
          />
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          hidden tests the hack must also pass
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
        <span style={{ color: "var(--accent)" }}>honest policy</span>
        <span style={{ color: "var(--danger)" }}>hack</span>
      </div>
      <figcaption className="viz-caption">
        A hack that special-cases the visible tests passes each hidden test with
        probability 0.6, and a flag from the monitor costs 0.5. Each hidden test
        multiplies the hack&apos;s chance of reward by 0.6; the monitor takes a
        fixed share and adds a penalty. Where the hack still earns more than
        honest work (shaded), training will find it.
      </figcaption>
    </figure>
  );
}
