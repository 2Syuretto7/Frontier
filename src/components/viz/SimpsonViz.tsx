"use client";

import { useState } from "react";

// kidney stone data (Charig et al., 1986): [successes, patients] for treatments A and B by stone size
const DATA = {
  small: { A: [81, 87], B: [234, 270] },
  large: { A: [192, 263], B: [55, 80] },
};
const VIEWS = ["by stone size", "pooled (observe)", "adjusted (intervene)"];

/** Success rates of A and B in each view: per stratum, pooled, and adjusted for stone size. */
export function rates() {
  const r = (s: number[]) => s[0] / s[1];
  const nSmall = DATA.small.A[1] + DATA.small.B[1];
  const nLarge = DATA.large.A[1] + DATA.large.B[1];
  const ps = nSmall / (nSmall + nLarge);
  const pool = (t: "A" | "B") =>
    (DATA.small[t][0] + DATA.large[t][0]) /
    (DATA.small[t][1] + DATA.large[t][1]);
  const adj = (t: "A" | "B") =>
    ps * r(DATA.small[t]) + (1 - ps) * r(DATA.large[t]);
  return {
    small: [r(DATA.small.A), r(DATA.small.B)],
    large: [r(DATA.large.A), r(DATA.large.B)],
    pooled: [pool("A"), pool("B")],
    adjusted: [adj("A"), adj("B")],
  };
}

export function SimpsonViz() {
  const [v, setV] = useState(1);
  const R = rates();
  const groups: [string, number[]][] =
    v === 0
      ? [
          ["small stones", R.small],
          ["large stones", R.large],
        ]
      : v === 1
        ? [["all patients, as observed", R.pooled]]
        : [["everyone given each treatment", R.adjusted]];
  const X = (p: number) => 20 + ((p - 0.5) / 0.5) * 290;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="View">
          {VIEWS.map((name, j) => (
            <button
              key={name}
              type="button"
              className="seg"
              aria-pressed={v === j}
              onClick={() => setV(j)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 170"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Success rates of two kidney stone treatments by stone size, pooled, and adjusted for stone size"
      >
        {[0.5, 0.6, 0.7, 0.8, 0.9, 1].map((p) => (
          <g key={p}>
            <line
              x1={X(p)}
              y1={20}
              x2={X(p)}
              y2={140}
              stroke="var(--grid-line)"
            />
            <text x={X(p)} y={156} textAnchor="middle" className="viz-label">
              {Math.round(p * 100)}%
            </text>
          </g>
        ))}
        {groups.map(([label, ab], g) => {
          const y0 = 26 + g * 58;
          return (
            <g key={label}>
              <text x={20} y={y0} className="viz-label">
                {label}
              </text>
              {ab.map((p, t) => (
                <g key={t}>
                  <rect
                    x={X(0.5)}
                    y={y0 + 6 + t * 20}
                    width={X(p) - X(0.5)}
                    height={16}
                    fill={t ? "var(--danger)" : "var(--accent)"}
                    fillOpacity={0.75}
                  />
                  <text x={X(p) + 4} y={y0 + 18 + t * 20} className="viz-label">
                    {t ? "B" : "A"} {(p * 100).toFixed(1)}%
                  </text>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption">
        Treatment A succeeds more often for small stones and for large stones,
        yet less often overall, because doctors gave A mostly to the harder
        large stones. Adjusting for stone size, averaging the stratum rates with
        the overall share of each size, estimates what would happen if everyone
        got A, or everyone got B, and A wins.
      </figcaption>
    </figure>
  );
}
