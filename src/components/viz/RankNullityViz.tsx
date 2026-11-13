"use client";

import { useState } from "react";

type Op = { name: string; M: number[][]; nul: string; ran: string };
const OPS: Op[] = [
  { name: "p′", M: [[0, 1, 0, 0, 0], [0, 0, 2, 0, 0], [0, 0, 0, 3, 0], [0, 0, 0, 0, 4], [0, 0, 0, 0, 0]], nul: "constants: span(1)", ran: "degree ≤ 3: span(1, x, x², x³)" },
  { name: "p″", M: [[0, 0, 2, 0, 0], [0, 0, 0, 6, 0], [0, 0, 0, 0, 12], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]], nul: "span(1, x)", ran: "degree ≤ 2: span(1, x, x²)" },
  { name: "p(1)", M: [[1, 1, 1, 1, 1]], nul: "multiples of (x − 1): span(x − 1, x² − 1, x³ − 1, x⁴ − 1)", ran: "all of ℝ" },
  { name: "x·p′", M: [[0, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 0, 2, 0, 0], [0, 0, 0, 3, 0], [0, 0, 0, 0, 4]], nul: "constants: span(1)", ran: "span(x, x², x³, x⁴)" },
  { name: "p(x) − p(−x)", M: [[0, 0, 0, 0, 0], [0, 2, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 2, 0], [0, 0, 0, 0, 0]], nul: "even polynomials: span(1, x², x⁴)", ran: "odd polynomials: span(x, x³)" },
];

function rank(M: number[][]) {
  const A = M.map((r) => [...r]);
  let r = 0;
  for (let c = 0; c < A[0].length && r < A.length; c++) {
    let p = r;
    for (let i = r + 1; i < A.length; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
    if (Math.abs(A[p][c]) < 1e-12) continue;
    [A[r], A[p]] = [A[p], A[r]];
    for (let i = 0; i < A.length; i++) if (i !== r) { const f = A[i][c] / A[r][c]; for (let k = c; k < A[0].length; k++) A[i][k] -= f * A[r][k]; }
    r++;
  }
  return r;
}

/** Five linear maps on polynomials of degree at most 4: their matrices, null spaces and ranges, and dim null + dim range = 5. */
export function RankNullityViz() {
  const [k, setK] = useState(0);
  const op = OPS[k];
  const r = rank(op.M), n = 5 - r;
  const W = 300, unit = (W - 20) / 5;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {OPS.map((o, i) => (
          <button key={o.name} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>p ↦ {o.name}</button>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto", whiteSpace: "pre" }}>
        {op.M.map((row) => `[${row.map((v) => String(v).padStart(2)).join(" ")}]`).join("\n")}
      </div>
      <svg viewBox={`0 0 ${W} 44`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Dimension of null space and range">
        <rect x={10} y={8} width={n * unit} height={20} fill="var(--danger)" opacity={0.75} />
        <rect x={10 + n * unit} y={8} width={r * unit} height={20} fill="var(--accent)" opacity={0.85} />
        {Array.from({ length: 6 }, (_, i) => <line key={i} x1={10 + i * unit} x2={10 + i * unit} y1={6} y2={30} stroke="var(--bg)" strokeWidth={2} />)}
        <text x={10} y={42} className="viz-label">dim null = {n}</text>
        <text x={W - 10} y={42} textAnchor="end" className="viz-label">dim range = {r}</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Columns are the images of 1, x, x², x³, x⁴. Null space: {op.nul}. Range: {op.ran}. Whatever the map, the two
        dimensions add up to 5, the dimension of the domain: every direction either survives into the range or is lost
        to the null space.
      </figcaption>
    </figure>
  );
}
