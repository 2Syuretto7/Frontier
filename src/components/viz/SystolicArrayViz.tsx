"use client";

import { useState } from "react";

const N = 4;
const A = [[1, 2, 0, 1], [0, 1, 3, 1], [2, 0, 1, 1], [1, 1, 1, 0]];
const B = [[1, 0, 2, 1], [0, 1, 1, 2], [1, 1, 0, 0], [2, 0, 1, 1]];
const T = 3 * N - 2;

/** State of an output-stationary N × N systolic array after `steps` cycles computing A·B. */
export function systolicState(steps: number) {
  let a: (number | null)[][] = Array.from({ length: N }, () => new Array(N).fill(null));
  let b: (number | null)[][] = Array.from({ length: N }, () => new Array(N).fill(null));
  const C = Array.from({ length: N }, () => new Array(N).fill(0));
  let macs = 0;
  for (let t = 0; t < steps; t++) {
    a = a.map((row, i) => [t - i >= 0 && t - i < N ? A[i][t - i] : null, ...row.slice(0, N - 1)]);
    const nb = b.map((row) => row.slice());
    for (let j = 0; j < N; j++) {
      nb[0][j] = t - j >= 0 && t - j < N ? B[t - j][j] : null;
      for (let i = 1; i < N; i++) nb[i][j] = b[i - 1][j];
    }
    b = nb;
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++)
        if (a[i][j] !== null && b[i][j] !== null) { C[i][j] += a[i][j]! * b[i][j]!; macs++; }
  }
  return { a, b, C, macs };
}

export function SystolicArrayViz() {
  const [t, setT] = useState(3);
  const { a, b, C, macs } = systolicState(t);
  const cs = 52, X0 = 30, Y0 = 26, W = X0 + N * cs + 6, H = Y0 + N * cs + 6;
  const active = (i: number, j: number) => a[i][j] !== null && b[i][j] !== null;
  const nActive = a.flatMap((row, i) => row.map((_, j) => active(i, j))).filter(Boolean).length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="sys-t">cycle: {t} of {T}</label>
        <input id="sys-t" type="range" min={0} max={T} step={1} value={t} onChange={(e) => setT(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 360, display: "block", margin: "0 auto" }} role="img" aria-label="A four by four systolic array computing a matrix product">
        <text x={X0 - 6} y={14} className="viz-label" style={{ fontSize: 9 }}>B ↓</text>
        <text x={4} y={Y0 + 12} className="viz-label" style={{ fontSize: 9 }}>A →</text>
        {Array.from({ length: N }, (_, i) =>
          Array.from({ length: N }, (_, j) => {
            const x = X0 + j * cs, y = Y0 + i * cs, on = active(i, j);
            return (
              <g key={`${i}-${j}`}>
                <rect x={x} y={y} width={cs - 4} height={cs - 4} rx={4} fill={on ? "var(--accent-soft)" : "var(--bg)"} stroke={on ? "var(--accent)" : "var(--border)"} strokeWidth={on ? 2 : 1} />
                <text x={x + 4} y={y + 12} style={{ fontSize: 9, fill: "var(--text-muted)" }}>{a[i][j] ?? "·"}</text>
                <text x={x + cs - 8} y={y + 12} textAnchor="end" style={{ fontSize: 9, fill: "var(--text-muted)" }}>{b[i][j] ?? "·"}</text>
                <text x={x + (cs - 4) / 2} y={y + 34} textAnchor="middle" className="mono" style={{ fontSize: 14, fill: "var(--text)" }}>{C[i][j]}</text>
              </g>
            );
          }),
        )}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${nActive} of 16 cells multiplying this cycle; ${macs} of 64 multiply-adds done`}
      </div>
      <figcaption className="viz-caption">
        A 4 × 4 output-stationary systolic array computing C = AB. Rows of A enter from the left and columns of B from the
        top, each delayed by one cycle per row or column, so that a<sub>ik</sub> and b<sub>kj</sub> meet in cell (i, j) at
        cycle i + j + k. Each cell multiplies the pair it holds (small numbers, top corners), adds to its running sum (large
        number), and passes a right and b down. A wave of activity sweeps diagonally across the array; the product is
        complete after 3 × 4 − 2 = 10 cycles. Even in the middle of the wave only 12 of the 16 cells are busy, which is why a real array streams many rows through without pausing.
      </figcaption>
    </figure>
  );
}
