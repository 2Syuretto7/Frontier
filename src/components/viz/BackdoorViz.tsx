"use client";

import { useState } from "react";

// linear Gaussian model, unit noise variances; [parent, child, coefficient]
const V = ["W", "A", "B", "C", "X", "M", "Y"];
const EDGES: [string, string, number][] = [
  ["W", "X", 0.8],
  ["W", "Y", 0.8],
  ["A", "X", 0.7],
  ["A", "C", 0.8],
  ["B", "C", 0.8],
  ["B", "Y", 0.8],
  ["X", "M", 0.6],
  ["M", "Y", 0.5],
  ["X", "Y", 0.4],
];
const CHOICES = ["W", "A", "B", "C", "M"];
const POS: Record<string, [number, number]> = {
  W: [170, 24],
  A: [40, 60],
  B: [300, 60],
  C: [170, 82],
  X: [60, 150],
  M: [170, 150],
  Y: [280, 150],
};
export const TRUE_EFFECT = 0.4 + 0.6 * 0.5;

function solve(A: number[][], b: number[]) {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let k = i + 1; k < n; k++)
      if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
    [M[i], M[p]] = [M[p], M[i]];
    for (let k = 0; k < n; k++)
      if (k !== i) {
        const f = M[k][i] / M[i][i];
        for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j];
      }
  }
  return M.map((r, i) => r[n] / r[i]);
}

/** Population covariance of the variables in order V. */
function cov() {
  // X = B X + U with V in causal order, so solve column by column
  const n = V.length;
  const idx = (v: string) => V.indexOf(v);
  const T = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ); // T = (I - B)^{-1}, built row by row
  for (let i = 0; i < n; i++)
    for (const [p, c, w] of EDGES)
      if (idx(c) === i) for (let j = 0; j < n; j++) T[i][j] += w * T[idx(p)][j];
  return T.map((r) => T.map((s) => r.reduce((a, v, k) => a + v * s[k], 0)));
}
const S = cov();

/** Least-squares coefficient of X when Y is regressed on X and the set Z. */
export function estimate(Z: string[]) {
  const ids = ["X", ...Z].map((v) => V.indexOf(v));
  const y = V.indexOf("Y");
  return solve(
    ids.map((i) => ids.map((j) => S[i][j])),
    ids.map((i) => S[i][y]),
  )[0];
}

/** Backdoor criterion for this graph: W adjusted, M not, and C only with A or B. */
export function isBackdoor(Z: string[]) {
  return (
    Z.includes("W") &&
    !Z.includes("M") &&
    (!Z.includes("C") || Z.includes("A") || Z.includes("B"))
  );
}

export function BackdoorViz() {
  const [Z, setZ] = useState<string[]>([]);
  const est = estimate(Z);
  const ok = isBackdoor(Z);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">adjust for</span>
        {CHOICES.map((v) => (
          <button
            key={v}
            type="button"
            className="btn"
            aria-pressed={Z.includes(v)}
            onClick={() =>
              setZ(Z.includes(v) ? Z.filter((u) => u !== v) : [...Z, v])
            }
          >
            {Z.includes(v) ? `${v} ✓` : v}
          </button>
        ))}
      </div>
      <svg
        viewBox="0 0 340 236"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A causal graph with a chosen adjustment set, whether it satisfies the backdoor criterion, and the resulting regression estimate"
      >
        <defs>
          <marker
            id="bdv-arrow"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)" />
          </marker>
        </defs>
        {EDGES.map(([p, c]) => {
          const [x1, y1] = POS[p],
            [x2, y2] = POS[c];
          const d = Math.hypot(x2 - x1, y2 - y1);
          if (p === "X" && c === "Y")
            return (
              <path
                key={p + c}
                d={`M${x1 + 10},${y1 + 10} Q170,205 ${x2 - 10},${y2 + 10}`}
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth={1.3}
                markerEnd="url(#bdv-arrow)"
              />
            );
          return (
            <line
              key={p + c}
              x1={x1 + ((x2 - x1) * 15) / d}
              y1={y1 + ((y2 - y1) * 15) / d}
              x2={x2 - ((x2 - x1) * 15) / d}
              y2={y2 - ((y2 - y1) * 15) / d}
              stroke="var(--text-muted)"
              strokeWidth={1.3}
              markerEnd="url(#bdv-arrow)"
            />
          );
        })}
        {V.map((v) => (
          <g key={v}>
            <circle
              cx={POS[v][0]}
              cy={POS[v][1]}
              r={13}
              fill={Z.includes(v) ? "var(--accent)" : "var(--surface)"}
              fillOpacity={Z.includes(v) ? 0.3 : 1}
              stroke={
                v === "X" || v === "Y" ? "var(--danger)" : "var(--text-muted)"
              }
              strokeWidth={Z.includes(v) ? 2.5 : 1.2}
            />
            <text
              x={POS[v][0]}
              y={POS[v][1] + 4}
              textAnchor="middle"
              className="viz-label"
            >
              {v}
            </text>
          </g>
        ))}
        <text x={10} y={214} className="viz-label">
          true effect {TRUE_EFFECT.toFixed(3)}, estimate {est.toFixed(3)}
        </text>
        <text x={10} y={230} className="viz-label">
          {ok ? "backdoor criterion holds" : "backdoor criterion fails"}
        </text>
      </svg>
      <figcaption className="viz-caption">
        A linear model: every arrow is a coefficient, every variable has its own
        unit-variance noise. The estimate is the coefficient of X when Y is
        regressed on X and the chosen variables, computed exactly from the
        population covariance. It equals the true effect exactly when the chosen
        set satisfies the backdoor criterion. Adjusting for the mediator M
        removes part of the effect, and adjusting for C alone opens the path
        through A and B.
      </figcaption>
    </figure>
  );
}
