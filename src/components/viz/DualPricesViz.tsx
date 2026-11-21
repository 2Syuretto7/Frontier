"use client";

import { useState } from "react";

// three sources and three targets on a line, squared-distance cost
const XS = [0, 1, 3],
  A = [0.3, 0.4, 0.3];
const YS = [1, 2, 4],
  B = [0.2, 0.4, 0.4];
const C = XS.map((x) => YS.map((y) => (x - y) ** 2));

/** The monotone (north-west) plan, optimal here. */
export function plan() {
  const P = XS.map(() => YS.map(() => 0));
  const a = A.slice(),
    b = B.slice();
  let i = 0,
    j = 0;
  while (i < 3 && j < 3) {
    const m = Math.min(a[i], b[j]);
    P[i][j] = m;
    a[i] -= m;
    b[j] -= m;
    if (a[i] <= 1e-12) i++;
    else j++;
  }
  return P;
}
const P = plan();

/** Potentials with phi_0 = 0 and phi_i + psi_j = C_ij on the support of the plan. */
export function potentials() {
  const phi: (number | null)[] = [0, null, null],
    psi: (number | null)[] = [null, null, null];
  for (let it = 0; it < 6; it++)
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        if (P[i][j] <= 1e-12) continue;
        if (phi[i] !== null && psi[j] === null) psi[j] = C[i][j] - phi[i]!;
        if (psi[j] !== null && phi[i] === null) phi[i] = C[i][j] - psi[j]!;
      }
  return { phi: phi as number[], psi: psi as number[] };
}

const OPT = potentials();
const MODES = [
  { name: "optimal prices", phi: OPT.phi, psi: OPT.psi },
  {
    name: "shifted by 2",
    phi: OPT.phi.map((v) => v + 2),
    psi: OPT.psi.map((v) => v - 2),
  },
  {
    name: "cautious prices",
    phi: [0, 0, 0],
    psi: YS.map((_, j) => Math.min(...C.map((r) => r[j]))),
  },
];

export function summary(k: number) {
  const { phi, psi } = MODES[k];
  const cost = P.reduce(
    (s, r, i) => s + r.reduce((t, p, j) => t + p * C[i][j], 0),
    0,
  );
  const dual =
    phi.reduce((s, v, i) => s + v * A[i], 0) +
    psi.reduce((s, v, j) => s + v * B[j], 0);
  const feasible = C.every((r, i) =>
    r.every((c, j) => phi[i] + psi[j] <= c + 1e-9),
  );
  return { cost, dual, feasible };
}

export function DualPricesViz() {
  const [k, setK] = useState(0);
  const { phi, psi } = MODES[k];
  const { cost, dual, feasible } = summary(k);
  const W = 340,
    H = 210,
    XL = 30,
    XR = W - 20,
    YT = 70,
    YB = 150,
    LO = -0.5,
    HI = 4.5;
  const sx = (v: number) => XL + ((v - LO) / (HI - LO)) * (XR - XL);
  const tight = (i: number, j: number) =>
    Math.abs(phi[i] + psi[j] - C[i][j]) < 1e-9;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Prices">
          {MODES.map((m, j) => (
            <button
              key={m.name}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              {m.name}
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
        aria-label="Optimal transport plan between three sources and three targets, with the prices at each point"
      >
        {XS.map((x, i) =>
          YS.map((y, j) =>
            P[i][j] > 1e-12 ? (
              <line
                key={`${i}${j}`}
                x1={sx(x)}
                y1={YT}
                x2={sx(y)}
                y2={YB}
                stroke={tight(i, j) ? "var(--accent)" : "var(--danger)"}
                strokeWidth={1 + 10 * P[i][j]}
                strokeOpacity={0.7}
              />
            ) : null,
          ),
        )}
        {XS.map((x, i) => (
          <g key={i}>
            <circle cx={sx(x)} cy={YT} r={4} fill="var(--accent)" />
            <text x={sx(x) + 10} y={YT - 10} className="viz-label">
              φ={phi[i]}
            </text>
          </g>
        ))}
        {YS.map((y, j) => (
          <g key={j}>
            <circle cx={sx(y)} cy={YB} r={4} fill="var(--danger)" />
            <text x={sx(y) + 10} y={YB + 18} className="viz-label">
              ψ={psi[j]}
            </text>
          </g>
        ))}
        <text x={XL - 22} y={YT + 4} className="viz-label">
          x
        </text>
        <text x={XL - 22} y={YB + 4} className="viz-label">
          y
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        transport cost {cost.toFixed(2)}, dual value {dual.toFixed(2)},{" "}
        {feasible ? "prices feasible" : "prices infeasible"}
      </div>
      <figcaption className="viz-caption">
        The optimal plan for the squared distance, line widths showing mass. A
        shipper charges φ(x) to collect at x and ψ(y) to deliver at y, and never
        more in total than the cost of moving the mass yourself: φ(x) + ψ(y) ≤
        (x − y)². Revenue Σ φ a + Σ ψ b is a lower bound on the transport cost.
        At the optimal prices every route the plan uses is tight (accent colour)
        and revenue equals cost. Adding 2 to every φ and subtracting 2 from
        every ψ changes nothing. Cautious prices are feasible but leave routes
        slack (red) and a gap.
      </figcaption>
    </figure>
  );
}
