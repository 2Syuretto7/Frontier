"use client";

import { useMemo, useState } from "react";

const D = 30, R = 2, PS = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5];

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fixed rank-2 matrix with smooth, incoherent factors. */
export const TRUTH = Array.from({ length: D }, (_, i) => Array.from({ length: D }, (_, j) =>
  Math.sin((2 * Math.PI * i) / D) * Math.cos((2 * Math.PI * j) / D) + 0.6 * Math.cos((4 * Math.PI * i) / D + 1) * Math.sin((2 * Math.PI * j) / D + 0.5)));

/** Solve the 2 by 2 system (G + 1e-3 I) z = b, a small ridge that keeps rows with few observations stable. */
function solve2(g: number[], b: number[]) {
  const a = g[0] + 1e-3, c = g[1], d = g[3] + 1e-3, det = a * d - c * c;
  return [(d * b[0] - c * b[1]) / det, (a * b[1] - c * b[0]) / det];
}

/** Observe each entry with probability p and fit a rank-2 factorisation U V^T by alternating least squares. */
export function complete(p: number) {
  const r = rand(Math.round(p * 1000));
  const mask = TRUTH.map((row) => row.map(() => r() < p));
  let U = Array.from({ length: D }, () => [r() - 0.5, r() - 0.5]);
  let V = Array.from({ length: D }, () => [r() - 0.5, r() - 0.5]);
  const fit = (F: number[][], rows: boolean) => Array.from({ length: D }, (_, i) => {
    const g = [0, 0, 0, 0], b = [0, 0];
    for (let j = 0; j < D; j++) {
      const seen = rows ? mask[i][j] : mask[j][i];
      if (!seen) continue;
      const f = F[j], m = rows ? TRUTH[i][j] : TRUTH[j][i];
      g[0] += f[0] * f[0]; g[1] += f[0] * f[1]; g[3] += f[1] * f[1];
      b[0] += f[0] * m; b[1] += f[1] * m;
    }
    return solve2(g, b);
  });
  for (let it = 0; it < 200; it++) { U = fit(V, true); V = fit(U, false); }
  const est = U.map((u) => V.map((v) => u[0] * v[0] + u[1] * v[1]));
  let se = 0, ss = 0, seen = 0;
  for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) { se += (est[i][j] - TRUTH[i][j]) ** 2; ss += TRUTH[i][j] ** 2; if (mask[i][j]) seen++; }
  let thin = 0;
  for (let i = 0; i < D; i++) {
    if (mask[i].filter(Boolean).length < R) thin++;
    if (mask.filter((row) => row[i]).length < R) thin++;
  }
  return { mask, est, rel: Math.sqrt(se / ss), seen, thin };
}

function Heat({ M, mask, x0, cell }: { M: number[][]; mask?: boolean[][]; x0: number; cell: number }) {
  return (
    <g>
      {M.map((row, i) => row.map((v, j) => {
        const hidden = mask && !mask[i][j];
        const a = Math.min(1, Math.abs(v) / 1.4);
        return <rect key={`${i}-${j}`} x={x0 + j * cell} y={i * cell} width={cell} height={cell}
          fill={hidden ? "var(--border)" : v >= 0 ? "var(--accent)" : "var(--danger)"} opacity={hidden ? 0.5 : 0.15 + 0.85 * a} />;
      }))}
    </g>
  );
}

export function MatrixCompletionViz() {
  const [p, setP] = useState(0.2);
  const { mask, est, rel, seen, thin } = useMemo(() => complete(p), [p]);
  const cell = 3.4, size = D * cell, gap = 12, W = 3 * size + 2 * gap;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">fraction observed p</span>
        <div className="segmented" role="group" aria-label="Fraction of entries observed">
          {PS.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={p === v} onClick={() => setP(v)}>{v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 -14 ${W} ${size + 16}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="True matrix, observed entries, and completed matrix">
        <text x={size / 2} y={-4} textAnchor="middle" className="viz-label">truth</text>
        <text x={size + gap + size / 2} y={-4} textAnchor="middle" className="viz-label">observed</text>
        <text x={2 * (size + gap) + size / 2} y={-4} textAnchor="middle" className="viz-label">completed</text>
        <Heat M={TRUTH} x0={0} cell={cell} />
        <Heat M={TRUTH} mask={mask} x0={size + gap} cell={cell} />
        <Heat M={est} x0={2 * (size + gap)} cell={cell} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${seen} of 900 entries seen (degrees of freedom 116); rows or columns with under 2 seen: ${thin}; relative error ${rel.toExponential(1)}`}
      </div>
      <figcaption className="viz-caption">
        A 30 × 30 matrix of rank 2 (left; blue positive, red negative), a random fraction p of its entries (middle; grey is
        unseen), and the rank-2 fit by alternating least squares to the seen entries alone (right). With 10% of the entries,
        fewer than the 116 numbers that determine the matrix, the fit fails. With 20% there are more entries than
        degrees of freedom, but a row or column with fewer than two seen entries cannot be pinned down, and the fit still
        fails. From 30% every row and column is covered and every hidden entry is recovered to within 0.1%: what matters
        is both the count of entries and their spread.
      </figcaption>
    </figure>
  );
}
