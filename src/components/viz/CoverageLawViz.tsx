"use client";

import { useMemo, useState } from "react";

/** Expected failure rate of k samples when per-problem success p ~ Beta(a, b), for k = 1..K. */
export function betaFails(a: number, b: number, K: number) {
  const out: number[] = [];
  let f = 1;
  for (let i = 0; i < K; i++) {
    f *= (b + i) / (a + b + i);
    out.push(f);
  }
  return out;
}

export function CoverageLawViz() {
  const [ai, setAi] = useState(4);
  const a = ai / 10,
    b = 3,
    K = 10000;
  const fails = useMemo(() => betaFails(a, b, K), [a]);
  const pm = a / (a + b);
  const W = 330,
    H = 210,
    x0 = 40,
    y0 = 10,
    pw = 262,
    ph = 160;
  const sx = (k: number) => x0 + (Math.log10(k) / 4) * pw;
  const sy = (f: number) => y0 + (-Math.log10(Math.max(f, 1e-4)) / 4) * ph;
  const ks = Array.from({ length: 81 }, (_, i) =>
    Math.round(10 ** (i / 20)),
  ).filter((k, i, s) => i === 0 || k !== s[i - 1]);
  const path = (f: (k: number) => number) =>
    ks
      .filter((k) => f(k) >= 1e-4)
      .map(
        (k, i) => `${i ? "L" : "M"}${sx(k).toFixed(1)},${sy(f(k)).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="viz-label">
          a = {a.toFixed(1)} (share of hard problems grows as a falls){" "}
          <input
            type="range"
            min={1}
            max={20}
            value={ai}
            onChange={(e) => setAi(+e.target.value)}
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
        aria-label="Failure rate against number of samples on log-log axes"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[1, 0.1, 0.01, 0.001, 0.0001].map((f) => (
          <g key={f}>
            <line
              x1={x0}
              x2={x0 + pw}
              y1={sy(f)}
              y2={sy(f)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 4}
              y={sy(f) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {f}
            </text>
          </g>
        ))}
        {[1, 10, 100, 1000, 10000].map((k) => (
          <text
            key={k}
            x={sx(k)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {k}
          </text>
        ))}
        <path
          d={path((k) => (1 - pm) ** k)}
          fill="none"
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
          strokeWidth={1.5}
        />
        <path
          d={path((k) => fails[k - 1])}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          samples k (log scale)
        </text>
      </svg>
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--accent)" }}>
          problems vary: slope −{a.toFixed(1)}
        </span>
        <span style={{ color: "var(--text-muted)" }}>
          every problem has p = {pm.toFixed(3)}
        </span>
      </div>
      <figcaption className="viz-caption">
        The fraction of problems left unsolved after k samples, on log-log axes.
        If every problem had the same success rate, failures would vanish
        exponentially. When success rates vary across problems as a Beta(a, 3)
        distribution with the same mean, the hardest problems dominate and the
        failure rate falls only as a power law, k to the minus a.
      </figcaption>
    </figure>
  );
}
