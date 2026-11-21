"use client";

import { useState } from "react";

/** Share of the project's value expected from finishing at time T. */
export function capturedValue(T: number, lam: number, mu: number) {
  return Math.exp(-lam * T) * (1 - Math.exp(-mu * T));
}

export function ScoopTimingViz() {
  const [li, setL] = useState(10);
  const [mi, setM] = useState(25);
  const lam = li / 100,
    mu = mi / 100;
  const tStar = Math.log((lam + mu) / lam) / mu;
  const best = capturedValue(tStar, lam, mu);
  const W = 330,
    H = 190,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150,
    tmax = 36;
  const sx = (t: number) => x0 + (t / tmax) * pw;
  const sy = (v: number) => y0 + (1 - v) * ph;
  const pts: string[] = [];
  const succ: string[] = [];
  const fresh: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * tmax;
    pts.push(`${sx(t)},${sy(capturedValue(t, lam, mu))}`);
    succ.push(`${sx(t)},${sy(1 - Math.exp(-mu * t))}`);
    fresh.push(`${sx(t)},${sy(Math.exp(-lam * t))}`);
  }
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          competitors per month: {lam.toFixed(2)}{" "}
          <input
            type="range"
            min={1}
            max={40}
            value={li}
            onChange={(e) => setL(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          progress rate per month: {mu.toFixed(2)}{" "}
          <input
            type="range"
            min={5}
            max={80}
            value={mi}
            onChange={(e) => setM(+e.target.value)}
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
        aria-label="Expected share of value against the time spent before publishing"
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
        <polyline
          points={succ.join(" ")}
          fill="none"
          stroke="var(--success)"
          strokeDasharray="4 3"
        />
        <polyline
          points={fresh.join(" ")}
          fill="none"
          stroke="var(--danger)"
          strokeDasharray="4 3"
        />
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.5}
        />
        {tStar <= tmax && (
          <>
            <line
              x1={sx(tStar)}
              x2={sx(tStar)}
              y1={sy(0)}
              y2={sy(best)}
              stroke="var(--accent)"
              strokeDasharray="2 2"
            />
            <circle cx={sx(tStar)} cy={sy(best)} r={4} fill="var(--accent)" />
          </>
        )}
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          months before publishing (0 to {tmax})
        </text>
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Best time to publish: {tStar.toFixed(1)} months, keeping{" "}
        {(100 * best).toFixed(1)}% of the value.
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
        <span style={{ color: "var(--success)" }}>chance of success</span>
        <span style={{ color: "var(--danger)" }}>chance not yet scooped</span>
        <span style={{ color: "var(--accent)" }}>their product</span>
      </div>
      <figcaption className="viz-caption">
        Working longer makes success more likely but gives competitors more time
        to publish first. The expected value is the product, and it peaks where
        the two pressures balance. A crowded area pushes the peak earlier and
        lower; a problem you are unusually well placed to solve pushes it later
        and higher.
      </figcaption>
    </figure>
  );
}
