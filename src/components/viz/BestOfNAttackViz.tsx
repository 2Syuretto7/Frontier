"use client";

import { useState } from "react";

/** Share of prompts still unbroken after n attempts when per-attempt success rates follow Beta(a, b). */
export function betaFail(a: number, b: number, n: number) {
  let f = 1;
  for (let k = 0; k < n; k++) f *= (b + k) / (a + b + k);
  return f;
}

const B = 2,
  NS = [
    1, 2, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000,
    10000,
  ];

export function BestOfNAttackViz() {
  const [ai, setAi] = useState(50);
  const a = ai / 100;
  const mean = a / (a + B);
  const W = 330,
    H = 200,
    x0 = 40,
    y0 = 10,
    pw = 270,
    ph = 150;
  const sx = (n: number) => x0 + (Math.log10(n) / 4) * pw;
  const sy = (f: number) =>
    y0 + (1 - (Math.max(-4, Math.log10(Math.max(f, 1e-6))) + 4) / 4) * ph;
  const path = (fn: (n: number) => number) =>
    NS.map(
      (n, i) => `${i ? "L" : "M"}${sx(n).toFixed(1)},${sy(fn(n)).toFixed(1)}`,
    ).join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          difficulty shape a (larger means fewer very hard prompts): {a.toFixed(2)}{" "}
          <input
            type="range"
            min={10}
            max={200}
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
        aria-label="Share of prompts not yet jailbroken against the number of attempts"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[1, 0.1, 0.01, 0.001, 0.0001].map((v) => (
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
        {[1, 10, 100, 1000, 10000].map((n) => (
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
        <path
          d={path((n) => (1 - mean) ** n)}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <path
          d={path((n) => betaFail(a, B, n))}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          attempts per prompt
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
        <span style={{ color: "var(--danger)" }}>
          prompts of varying difficulty
        </span>
        <span style={{ color: "var(--text-muted)" }}>
          every prompt equally hard
        </span>
      </div>
      <figcaption className="viz-caption">
        Each attempt is a random variation of a harmful request, and succeeds
        with a probability that depends on the request. If every request were
        equally hard, the share still refused would fall exponentially. Because
        a few requests are very hard, it falls as a power of the number of
        attempts, a straight line on these logarithmic axes whose slope is −a:
        the attacker keeps winning, ever more slowly, and never runs out of
        progress.
      </figcaption>
    </figure>
  );
}
