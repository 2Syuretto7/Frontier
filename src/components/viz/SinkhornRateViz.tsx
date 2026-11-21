"use client";

import { useState } from "react";

// 30-point histograms on [0, 1] with squared-distance cost; plain Sinkhorn iterations
const N = 30,
  XS = Array.from({ length: N }, (_, i) => (i + 0.5) / N),
  ITERS = 150,
  EPS = [0.1, 0.03, 0.01];
const norm = (v: number[]) => {
  const s = v.reduce((a, b) => a + b, 0);
  return v.map((x) => x / s);
};
const A = norm(XS.map((x) => Math.exp(-((x - 0.35) ** 2) / 0.02) + 0.01));
export const PROBLEMS = [
  {
    name: "overlapping",
    b: norm(XS.map((x) => Math.exp(-((x - 0.5) ** 2) / 0.03) + 0.01)),
  },
  {
    name: "far apart",
    b: norm(XS.map((x) => Math.exp(-((x - 0.85) ** 2) / 0.005) + 0.001)),
  },
];
const C = XS.map((x) => XS.map((y) => (x - y) ** 2));

/** L1 error of the row marginals after each full iteration (columns are exact after the v update). */
export function errors(eps: number, b: number[]) {
  const K = C.map((r) => r.map((c) => Math.exp(-c / eps)));
  let u = Array(N).fill(1),
    v = Array(N).fill(1);
  const out: number[] = [];
  for (let it = 0; it < ITERS; it++) {
    u = A.map((a, i) => a / K[i].reduce((s, k, j) => s + k * v[j], 0));
    v = b.map((bj, j) => bj / K.reduce((s, r, i) => s + r[j] * u[i], 0));
    const err = A.reduce(
      (s, a, i) =>
        s + Math.abs(u[i] * K[i].reduce((t, k, j) => t + k * v[j], 0) - a),
      0,
    );
    out.push(Math.max(err, 1e-16));
  }
  return out;
}

export function SinkhornRateViz() {
  const [p, setP] = useState(0);
  const curves = EPS.map((e) => errors(e, PROBLEMS[p].b));
  const W = 340,
    H = 200,
    XL = 40,
    XR = W - 10,
    Y0 = 10,
    Y1 = H - 24,
    LY0 = -14,
    LY1 = 0;
  const sx = (k: number) => XL + (k / ITERS) * (XR - XL);
  const sy = (e: number) =>
    Y1 -
    ((Math.max(LY0, Math.min(LY1, Math.log10(e))) - LY0) / (LY1 - LY0)) *
      (Y1 - Y0);
  const colours = ["var(--accent)", "var(--danger)", "var(--text-muted)"];
  const dashes = [undefined, "5 3", "2 2"];
  const reach = curves.map((c) => {
    const k = c.findIndex((e) => e < 1e-9);
    return k < 0 ? `>${ITERS}` : String(k + 1);
  });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Problem">
          {PROBLEMS.map((q, j) => (
            <button
              key={q.name}
              type="button"
              className="seg"
              aria-pressed={p === j}
              onClick={() => setP(j)}
            >
              {q.name}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Marginal error of Sinkhorn's algorithm against iteration on a log scale for three values of epsilon"
      >
        <line x1={XL} y1={Y1} x2={XR} y2={Y1} stroke="var(--border)" />
        <line x1={XL} y1={Y0} x2={XL} y2={Y1} stroke="var(--border)" />
        {curves.map((c, j) => (
          <path
            key={j}
            d={c
              .map((e, k) => `${k ? "L" : "M"}${sx(k + 1)},${sy(e)}`)
              .join(" ")}
            fill="none"
            stroke={colours[j]}
            strokeWidth={1.6}
            strokeDasharray={dashes[j]}
          />
        ))}
        {[0, -4, -8, -12].map((v) => (
          <text
            key={v}
            x={XL - 4}
            y={sy(10 ** v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {`1e${v}`}
          </text>
        ))}
        {[0, 50, 100, 150].map((k) => (
          <text
            key={k}
            x={sx(k)}
            y={H - 8}
            textAnchor="middle"
            className="viz-label"
          >
            {k}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        iterations to error 1e-9: ε = 0.1: {reach[0]}, ε = 0.03: {reach[1]}, ε =
        0.01: {reach[2]}
      </div>
      <figcaption className="viz-caption">
        Error in the row sums after each Sinkhorn iteration, on a log scale, for
        ε = 0.1 (solid), 0.03 (dashed) and 0.01 (dotted). Every curve is
        eventually a straight line: the error shrinks by a constant factor per
        iteration, linear convergence. The factor gets closer to 1 as ε shrinks,
        because the Gibbs kernel becomes more nearly singular, so the number of
        iterations grows roughly like 1/ε. The worst-case bound depends only on
        the cost matrix and ε; actual runs, as the second problem shows, can be
        faster.
      </figcaption>
    </figure>
  );
}
