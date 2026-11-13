"use client";

import { useState } from "react";

type Mat = number[][];
const PRESETS: Record<string, Mat> = {
  "definite": [[2, 0.5], [0.5, 1]],
  "indefinite": [[1, 2], [2, 1]],
  "semidefinite": [[1, 1], [1, 1]],
};
const mul = (A: Mat, B: Mat): Mat => [0, 1].map((i) => [0, 1].map((j) => A[i][0] * B[0][j] + A[i][1] * B[1][j]));
const tr = (A: Mat): Mat => [[A[0][0], A[1][0]], [A[0][1], A[1][1]]];
const symEig = (S: Mat) => {
  const m = (S[0][0] + S[1][1]) / 2, r = Math.sqrt(((S[0][0] - S[1][1]) / 2) * ((S[0][0] - S[1][1]) / 2) + S[0][1] * S[1][0]);
  return [m - r, m + r];
};
const realEig = (A: Mat) => {
  const m = (A[0][0] + A[1][1]) / 2, d = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const r = Math.sqrt(Math.max(0, m * m - d));
  return [m - r, m + r];
};

/** Congruence PᵀSP changes eigenvalues but not their signs (Sylvester); similarity P⁻¹SP keeps the eigenvalues. */
export function InertiaViz() {
  const [name, setName] = useState("indefinite");
  const [s10, setS10] = useState(10), [t10, setT10] = useState(15);
  const S = PRESETS[name];
  const P: Mat = [[1, s10 / 10], [0, t10 / 10]];
  const det = P[0][0] * P[1][1] - P[0][1] * P[1][0];
  const Pi: Mat = [[P[1][1] / det, -P[0][1] / det], [-P[1][0] / det, P[0][0] / det]];
  const rows: [string, number[]][] = [
    ["S", symEig(S)],
    ["PᵀSP", symEig(mul(mul(tr(P), S), P))],
    ["P⁻¹SP", realEig(mul(mul(Pi, S), P))],
  ];
  const W = 320, Z = 180, sc = 18;
  const X = (v: number) => Math.max(70, Math.min(W - 6, Z + v * sc));
  const sign = (v: number) => (Math.abs(v) < 1e-9 ? "0" : v > 0 ? "+" : "−");
  const slider = (label: string, v: number, set: (x: number) => void, min: number) => (
    <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
      {label} {(v / 10).toFixed(1)}
      <input type="range" min={min} max={20} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} style={{ width: 80 }} />
    </label>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {Object.keys(PRESETS).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={name === k} onClick={() => setName(k)}>{k}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 12 }}>
        {slider("P shear s", s10, setS10, -20)}
        {slider("P scale t", t10, setT10, 2)}
      </div>
      <svg viewBox={`0 0 ${W} 110`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Eigenvalues under congruence and similarity">
        <line x1={Z} x2={Z} y1={4} y2={106} stroke="var(--border)" />
        {rows.map(([label, ev], k) => (
          <g key={label}>
            <text x={4} y={26 + k * 34} className="viz-label">{label}</text>
            <line x1={70} x2={W - 6} y1={22 + k * 34} y2={22 + k * 34} stroke="var(--border)" />
            {ev.map((v, i) => <circle key={i} cx={X(v)} cy={22 + k * 34} r={5} fill={v > 1e-9 ? "var(--accent)" : v < -1e-9 ? "var(--danger)" : "var(--text-muted)"} />)}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        {rows.map(([label, ev]) => `${label}: ${ev.map((v) => v.toFixed(2)).join(", ")} (${ev.map(sign).join("")})`).join("; ")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        P = [[1, s], [0, t]] is a change of basis. The matrix of a bilinear form changes to PᵀSP (congruence), whose
        eigenvalues move as you drag the sliders but whose numbers of positive, negative and zero eigenvalues never change:
        Sylvester&apos;s law of inertia. The matrix of an operator changes to P⁻¹SP (similarity), which keeps the
        eigenvalues themselves. Same starting matrix, two different objects.
      </figcaption>
    </figure>
  );
}
