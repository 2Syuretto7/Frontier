"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 32;

function gauss(r: () => number) {
  const u = Math.max(1e-12, r()), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** N random orthonormal vectors (columns) by Gram–Schmidt. */
function orthonormal(r: () => number) {
  const vs: number[][] = [];
  while (vs.length < N) {
    let v = Array.from({ length: N }, () => gauss(r));
    for (const u of vs) {
      const d = v.reduce((s, x, i) => s + x * u[i], 0);
      v = v.map((x, i) => x - d * u[i]);
    }
    const n = Math.hypot(...v);
    vs.push(v.map((x) => x / n));
  }
  return vs;
}

export type Spectrum = "fast" | "slow";

/** Singular values of the synthetic fine-tuning update. */
export function spectrum(kind: Spectrum) {
  return Array.from({ length: N }, (_, i) => (kind === "fast" ? Math.pow(0.6, i) : 1 / Math.sqrt(i + 1)));
}

/** Relative Frobenius error of the best rank-r approximation (Eckart–Young). */
export function rankError(s: number[], r: number) {
  const tot = s.reduce((a, x) => a + x * x, 0);
  const rest = s.slice(r).reduce((a, x) => a + x * x, 0);
  return Math.sqrt(rest / tot);
}

export function LoraRankViz() {
  const [kind, setKind] = useState<Spectrum>("fast");
  const [rank, setRank] = useState(4);
  const basis = useMemo(() => { const r = rand(12); return { U: orthonormal(r), V: orthonormal(r) }; }, []);
  const s = useMemo(() => spectrum(kind), [kind]);
  const mat = (k: number) => {
    const M = Array.from({ length: N }, () => new Array(N).fill(0));
    for (let t = 0; t < k; t++) for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) M[i][j] += s[t] * basis.U[t][i] * basis.V[t][j];
    return M;
  };
  const full = useMemo(() => mat(N), [s, basis]); // eslint-disable-line react-hooks/exhaustive-deps
  const approx = useMemo(() => mat(rank), [s, basis, rank]); // eslint-disable-line react-hooks/exhaustive-deps
  const vmax = Math.max(...full.flat().map(Math.abs));
  const C = 4.4, GAP = 18, X0 = 12, Y0 = 18;
  const W = 330, H = Y0 + N * C + 14;
  const cell = (v: number) => (v >= 0 ? "var(--accent)" : "var(--danger)");
  const heat = (M: number[][], x0: number) =>
    M.flatMap((row, i) => row.map((v, j) => (
      <rect key={`${x0}-${i}-${j}`} x={x0 + j * C} y={Y0 + i * C} width={C} height={C} style={{ fill: cell(v) }} opacity={Math.min(1, 1.3 * Math.pow(Math.abs(v) / vmax, 0.6))} />
    )));
  const params = rank * 2 * N;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Rank">
          {[1, 2, 4, 8, 16].map((r) => (
            <button key={r} className="seg" aria-pressed={rank === r} onClick={() => setRank(r)}>r = {r}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Spectrum of the update">
          {(["fast", "slow"] as Spectrum[]).map((k) => (
            <button key={k} className="seg" aria-pressed={kind === k} onClick={() => setKind(k)}>{k === "fast" ? "fast-decaying spectrum" : "slow-decaying spectrum"}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="A weight update and its low-rank approximation">
        <text x={X0} y={12} className="viz-label">full update ΔW</text>
        <text x={X0 + N * C + GAP} y={12} className="viz-label">rank-{rank} approximation BA</text>
        {heat(full, X0)}
        {heat(approx, X0 + N * C + GAP)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        rank {rank}: {params} parameters against {N * N} for the full matrix; relative error {(rankError(s, rank) * 100).toFixed(1)}%
      </div>
      <figcaption className="viz-caption">
        A synthetic 32-by-32 weight update with a chosen spread of singular values, and its best approximation of rank r, which
        is what a LoRA adapter of that rank can at most represent. When the update&apos;s spectrum decays quickly, a small rank captures
        almost all of it with a fraction of the parameters; when it decays slowly, low-rank adapters leave a large part out.
      </figcaption>
    </figure>
  );
}
