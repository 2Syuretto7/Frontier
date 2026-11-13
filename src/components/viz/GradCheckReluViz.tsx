"use client";

import { useState } from "react";

const X = [[1, -2, 0.5], [0.3, 1, -1], [-1, 0.5, 2], [2, 1, 1]];
const C = [[1, -1], [2, 0.5], [-1, 1], [0.5, 2]];
const W0 = [[0.4, -0.3], [0.2, 0.8], [-0.6, 0.4]];
type Mode = "correct" | "bug" | "kink";

function zOf(W: number[][]) {
  return X.map((r) => [0, 1].map((j) => r.reduce((s, v, k) => s + v * W[k][j], 0)));
}
function loss(W: number[][]) {
  return zOf(W).reduce((s, r, i) => s + r.reduce((t, z, j) => t + Math.max(z, 0) * C[i][j], 0), 0);
}

function check(mode: Mode) {
  const W = W0.map((r) => [...r]);
  if (mode === "kink") {
    // move W[2][0] so that z[3][0] sits 1e-7 above the ReLU's kink
    const z = zOf(W)[3][0];
    W[2][0] += (1e-7 - z) / X[3][2];
  }
  const z = zOf(W);
  const h = 1e-5;
  const rows: { name: string; a: number; n: number; rel: number }[] = [];
  for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) {
    const a = X.reduce((s, r, i) => s + r[k] * C[i][j] * (mode === "bug" || z[i][j] > 0 ? 1 : 0), 0);
    const Wp = W.map((r) => [...r]), Wm = W.map((r) => [...r]);
    Wp[k][j] += h; Wm[k][j] -= h;
    const n = (loss(Wp) - loss(Wm)) / (2 * h);
    const rel = Math.abs(a - n) / Math.max(Math.abs(a), Math.abs(n), 1e-12);
    rows.push({ name: `W[${k},${j}]`, a, n, rel });
  }
  return rows;
}

const CAP: Record<Mode, string> = {
  correct: "Every relative error is around 1e-10 or below: rounding noise. The closures are right.",
  bug: "The ReLU closure forgot its mask and passes gradient through negative inputs. Every entry now disagrees at order 0.1 to 1, far beyond anything rounding could explain.",
  kink: "The closures are right, but one pre-activation sits 1e-7 from the kink at 0, closer than the step h = 1e-5. The finite difference straddles the kink and averages the two slopes, so the column touching it fails the check. Re-run with a different random point before blaming the code.",
};

/** A gradient check of relu(X W) weighted by C: analytic against central differences, as relative errors on a log scale. */
export function GradCheckReluViz() {
  const [mode, setMode] = useState<Mode>("correct");
  const rows = check(mode);
  const W = 330, bar = (r: number) => Math.max(2, ((Math.log10(Math.max(r, 1e-16)) + 16) / 16) * (W - 120));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={mode === "correct"} onClick={() => setMode("correct")}>correct closures</button>
        <button type="button" className="seg" aria-pressed={mode === "bug"} onClick={() => setMode("bug")}>ReLU mask forgotten</button>
        <button type="button" className="seg" aria-pressed={mode === "kink"} onClick={() => setMode("kink")}>near a kink</button>
      </div>
      <svg viewBox={`0 0 ${W} ${rows.length * 24 + 24}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Relative error per parameter, log scale">
        {rows.map((r, i) => (
          <g key={r.name}>
            <text x={0} y={i * 24 + 15} className="viz-label">{r.name}</text>
            <rect x={56} y={i * 24 + 4} width={bar(r.rel)} height={14} rx={3} fill={r.rel > 1e-6 ? "var(--danger)" : "var(--accent)"} />
            <text x={60 + bar(r.rel)} y={i * 24 + 15} className="viz-label">{r.rel.toExponential(0)}</text>
          </g>
        ))}
        <line x1={56 + bar(1e-6)} x2={56 + bar(1e-6)} y1={0} y2={rows.length * 24 + 4} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <text x={56 + bar(1e-6)} y={rows.length * 24 + 18} textAnchor="middle" className="viz-label">1e-6</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Loss Σ C ⊙ relu(X W) for a 3 × 2 weight matrix, central differences with h = 1e-5. {CAP[mode]}
      </figcaption>
    </figure>
  );
}
