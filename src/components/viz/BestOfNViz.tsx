"use client";

import { useState } from "react";

/** Expected maximum of N independent standard normals, by midpoint integration of its density. */
export function expectedMax(N: number) {
  const lo = -8,
    hi = 8,
    m = 1600,
    h = (hi - lo) / m;
  const erf = (x: number) => {
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const y =
      1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
        t +
        0.254829592) *
        t *
        Math.exp(-x * x);
    return x >= 0 ? y : -y;
  };
  let s = 0;
  for (let i = 0; i < m; i++) {
    const x = lo + (i + 0.5) * h,
      phi = Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI),
      Phi = 0.5 * (1 + erf(x / Math.SQRT2));
    s += x * N * phi * Phi ** (N - 1) * h;
  }
  return s;
}

const RS = [1, 0.7, 0.4],
  COLS = ["var(--accent)", "var(--success)", "var(--danger)"];
const NS = Array.from({ length: 11 }, (_, i) => 2 ** i);

export function BestOfNViz() {
  const [show, setShow] = useState(true);
  const W = 330,
    H = 210,
    X0 = 30,
    PW = 285,
    Y0 = 10,
    PH = 160,
    YM = 4;
  const sx = (n: number) => X0 + (Math.log2(n) / 10) * PW,
    sy = (v: number) => Y0 + PH - (v / YM) * PH;
  const em = NS.map(expectedMax);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Bound">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              className="seg"
              aria-pressed={show === v}
              onClick={() => setShow(v)}
            >
              {v ? "show √(2 ln N)" : "hide bound"}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 440,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Expected quality of the best of N samples"
      >
        <rect
          x={X0}
          y={Y0}
          width={PW}
          height={PH}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 1, 2, 3, 4].map((v) => (
          <g key={v}>
            <line
              x1={X0}
              x2={X0 + PW}
              y1={sy(v)}
              y2={sy(v)}
              stroke="var(--grid-line)"
            />
            <text
              x={X0 - 4}
              y={sy(v) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {v}
            </text>
          </g>
        ))}
        {[1, 4, 16, 64, 256, 1024].map((n) => (
          <text
            key={n}
            x={sx(n)}
            y={Y0 + PH + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {n}
          </text>
        ))}
        <text
          x={X0 + PW / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          samples N
        </text>
        {show && (
          <path
            d={NS.slice(1)
              .map(
                (n, i) =>
                  `${i ? "L" : "M"}${sx(n).toFixed(1)},${sy(Math.sqrt(2 * Math.log(n))).toFixed(1)}`,
              )
              .join(" ")}
            fill="none"
            stroke="var(--text-muted)"
            strokeDasharray="4 3"
            strokeWidth={1.5}
          />
        )}
        {RS.map((r, k) => (
          <g key={r}>
            <path
              d={NS.map(
                (n, i) =>
                  `${i ? "L" : "M"}${sx(n).toFixed(1)},${sy(r * em[i]).toFixed(1)}`,
              ).join(" ")}
              fill="none"
              stroke={COLS[k]}
              strokeWidth={2}
            />
            {NS.map((n, i) => (
              <circle
                key={n}
                cx={sx(n)}
                cy={sy(r * em[i])}
                r={2.5}
                fill={COLS[k]}
              />
            ))}
          </g>
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 14px",
          justifyContent: "center",
          fontSize: 13,
        }}
      >
        {RS.map((r, k) => (
          <span key={r}>
            <span style={{ color: COLS[k] }}>●</span> verifier correlation {r}
          </span>
        ))}
      </div>
      <figcaption className="viz-caption">
        Expected quality, in standard deviations above the average sample, of
        the sample a verifier scores highest among N. Quality and score are
        jointly Gaussian with correlation r. Each doubling of N adds less than
        the one before; the gain grows only like √(2 ln N) (dashed), and an
        imperfect verifier scales the whole curve down by r.
      </figcaption>
    </figure>
  );
}
