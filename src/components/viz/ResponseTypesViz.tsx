"use client";

import { useState } from "react";

// response types: always (Y=1 either way), helped (Y=X), hurt (Y=1-X), never
// all mixtures below give P(Y=1 | do(X=1)) = 0.6 and P(Y=1 | do(X=0)) = 0.3
const AS = [0, 0.1, 0.2, 0.3];
const NAMES = ["always", "helped", "hurt", "never"];
const COLS = [
  "var(--text-muted)",
  "var(--accent)",
  "var(--danger)",
  "var(--border-strong)",
];

/** Shares of the four response types for always-share a. */
export function shares(a: number) {
  return [a, 0.6 - a, 0.3 - a, 0.1 + a];
}

export function ResponseTypesViz() {
  const [k, setK] = useState(0);
  const s = shares(AS[k]);
  const pns = s[1];
  const X = (p: number) => 20 + p * 300;
  let acc = 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">share who recover either way</span>
        <div
          className="segmented"
          role="group"
          aria-label="Share of always-recover units"
        >
          {AS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 178"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Shares of four response types consistent with the same experimental results, and the probability that treatment is necessary and sufficient"
      >
        {s.map((v, i) => {
          const x0 = X(acc);
          acc += v;
          return (
            <g key={i}>
              <rect
                x={x0}
                y={20}
                width={X(acc) - x0}
                height={34}
                fill={COLS[i]}
                fillOpacity={0.6}
              />
              {v >= 0.08 && (
                <text
                  x={(x0 + X(acc)) / 2}
                  y={41}
                  textAnchor="middle"
                  className="viz-label"
                >
                  {v.toFixed(1)}
                </text>
              )}
            </g>
          );
        })}
        {NAMES.map((n, i) => (
          <g key={n}>
            <rect
              x={20 + i * 78}
              y={62}
              width={10}
              height={10}
              fill={COLS[i]}
              fillOpacity={0.6}
            />
            <text x={34 + i * 78} y={71} className="viz-label">
              {n}
            </text>
          </g>
        ))}
        <text x={20} y={98} className="viz-label">
          P(recover | do(treat)) = always + helped = 0.6
        </text>
        <text x={20} y={114} className="viz-label">
          P(recover | do(no treat)) = always + hurt = 0.3
        </text>
        <line
          x1={X(0.3)}
          y1={130}
          x2={X(0.6)}
          y2={130}
          stroke="var(--success)"
          strokeWidth={6}
          strokeOpacity={0.4}
        />
        <circle cx={X(pns)} cy={130} r={5} fill="var(--accent)" />
        <text x={20} y={152} className="viz-label">
          P(treatment necessary and sufficient) = helped = {pns.toFixed(1)}
        </text>
        <text x={20} y={168} className="viz-label">
          bounds from the experiments alone: 0.3 to 0.6
        </text>
      </svg>
      <figcaption className="viz-caption">
        Every unit responds to treatment in one of four ways. Experiments reveal
        only two sums of these shares, so all four mixtures fit the same data.
        The share helped by treatment, the probability that it is necessary and
        sufficient for recovery, ranges over the green interval, the Tian–Pearl
        bounds.
      </figcaption>
    </figure>
  );
}
