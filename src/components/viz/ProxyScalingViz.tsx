"use client";

import { useState } from "react";

export function ProxyScalingViz() {
  const [t1i, setT1] = useState(150);
  const [ci, setC] = useState(20);
  const t1 = t1i / 100,
    tc = ci / 100;
  const eff = (n: number) => t1 / (t1 + ((2 * (n - 1)) / n) * tc);
  const floor = t1 / (t1 + 2 * tc);
  const W = 330,
    H = 190,
    x0 = 36,
    y0 = 10,
    pw = 280,
    ph = 150,
    kmax = 10;
  const sx = (k: number) => x0 + (k / kmax) * pw;
  const sy = (v: number) => y0 + (1 - v) * ph;
  const pts: string[] = [];
  for (let k = 0; k <= kmax + 1e-9; k += 0.1)
    pts.push(`${sx(k)},${sy(eff(2 ** k))}`);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          step time on one node: {t1.toFixed(2)} s{" "}
          <input
            type="range"
            min={20}
            max={400}
            value={t1i}
            onChange={(e) => setT1(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          extra time measured on two nodes: {tc.toFixed(2)} s{" "}
          <input
            type="range"
            min={0}
            max={200}
            value={ci}
            onChange={(e) => setC(+e.target.value)}
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
        aria-label="Predicted weak-scaling efficiency against the number of nodes"
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
        <line
          x1={x0}
          x2={x0 + pw}
          y1={sy(floor)}
          y2={sy(floor)}
          stroke="var(--danger)"
          strokeDasharray="4 3"
        />
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        {[0, 1].map((k) => (
          <circle
            key={k}
            cx={sx(k)}
            cy={sy(eff(2 ** k))}
            r={4}
            fill="var(--success)"
          />
        ))}
        {[0, 5, 10].map((k) => (
          <text
            key={k}
            x={sx(k)}
            y={H - 16}
            textAnchor="middle"
            className="viz-label"
          >
            {2 ** k}
          </text>
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 2}
          textAnchor="middle"
          className="viz-label"
        >
          nodes
        </text>
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Predicted efficiency at 1024 nodes: {eff(1024).toFixed(3)}; it never
        falls below {floor.toFixed(3)}.
      </p>
      <figcaption className="viz-caption">
        Two proxy measurements, at one and two nodes (green), fix the model: the
        step time is the compute time plus a ring all-reduce whose cost
        approaches twice the two-node overhead. The dashed line is the limit. A
        real run that falls below the curve is losing time to something the
        model leaves out, such as a slow link or a straggler.
      </figcaption>
    </figure>
  );
}
