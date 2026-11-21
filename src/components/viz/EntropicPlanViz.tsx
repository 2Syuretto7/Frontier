"use client";

import { useState } from "react";

// two discrete measures on 40 grid points in [0, 1], squared-distance cost
const N = 40,
  XS = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
const norm = (v: number[]) => {
  const s = v.reduce((a, b) => a + b, 0);
  return v.map((x) => x / s);
};
const A = norm(XS.map((x) => Math.exp(-((x - 0.3) ** 2) / 0.01) + 0.02));
const B = norm(
  XS.map(
    (x) =>
      Math.exp(-((x - 0.2) ** 2) / 0.004) +
      0.8 * Math.exp(-((x - 0.75) ** 2) / 0.006) +
      0.02,
  ),
);
const C = XS.map((x) => XS.map((y) => (x - y) ** 2));
const EPS = [0.001, 0.01, 0.1];

/** Entropic plan by Sinkhorn scaling, with its transport cost and entropy. */
export function entropicPlan(eps: number) {
  const K = C.map((r) => r.map((c) => Math.exp(-c / eps)));
  let u = Array(N).fill(1),
    v = Array(N).fill(1);
  for (let it = 0; it < 3000; it++) {
    u = A.map((a, i) => a / K[i].reduce((s, k, j) => s + k * v[j], 0));
    v = B.map((b, j) => b / K.reduce((s, r, i) => s + r[j] * u[i], 0));
  }
  const P = K.map((r, i) => r.map((k, j) => u[i] * k * v[j]));
  let cost = 0,
    ent = 0;
  P.forEach((r, i) =>
    r.forEach((p, j) => {
      cost += p * C[i][j];
      if (p > 0) ent -= p * Math.log(p);
    }),
  );
  return { P, cost, ent };
}

const PLANS = EPS.map(entropicPlan);

export function EntropicPlanViz() {
  const [k, setK] = useState(1);
  const { P, cost, ent } = PLANS[k];
  const pmax = Math.max(...P.flat());
  const S = 300,
    M = 40,
    cell = (S - M) / N;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Regularisation">
          {EPS.map((e, j) => (
            <button
              key={e}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              ε = {e}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${S} ${S}`}
        style={{
          width: "100%",
          maxWidth: 360,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Entropic transport plan as a heat map, with the source density on the left and the target density on top"
      >
        {A.map((a, i) => (
          <rect
            key={`a${i}`}
            x={M - 4 - (a / Math.max(...A)) * (M - 8)}
            y={M + i * cell}
            width={(a / Math.max(...A)) * (M - 8)}
            height={cell}
            fill="var(--accent)"
            fillOpacity={0.6}
          />
        ))}
        {B.map((b, j) => (
          <rect
            key={`b${j}`}
            x={M + j * cell}
            y={M - 4 - (b / Math.max(...B)) * (M - 8)}
            width={cell}
            height={(b / Math.max(...B)) * (M - 8)}
            fill="var(--danger)"
            fillOpacity={0.6}
          />
        ))}
        <rect
          x={M}
          y={M}
          width={S - M}
          height={S - M}
          fill="none"
          stroke="var(--border)"
        />
        {P.map((r, i) =>
          r.map((p, j) =>
            p > pmax * 0.01 ? (
              <rect
                key={`${i}-${j}`}
                x={M + j * cell}
                y={M + i * cell}
                width={cell + 0.3}
                height={cell + 0.3}
                fill="var(--accent)"
                fillOpacity={Math.sqrt(p / pmax)}
              />
            ) : null,
          ),
        )}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        transport cost {cost.toFixed(4)}, entropy {ent.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        The plan minimising transport cost minus ε times entropy, between the
        source on the left (rows) and the target on top (columns). At small ε it
        is nearly the sharp monotone plan, a thin curve, and the cost is close
        to the true optimum. As ε grows the plan blurs: it pays a little more
        transport cost to gain entropy, and as ε → ∞ it would become the
        independent coupling.
      </figcaption>
    </figure>
  );
}
