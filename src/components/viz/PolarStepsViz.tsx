"use client";

import { useState } from "react";

type Mat = number[][];
const mul = (A: Mat, B: Mat): Mat => [0, 1].map((i) => [0, 1].map((j) => A[i][0] * B[0][j] + A[i][1] * B[1][j]));
const tr = (A: Mat): Mat => [[A[0][0], A[1][0]], [A[0][1], A[1][1]]];

function polar(A: Mat) {
  // P = sqrt(AᵀA) by the 2×2 formula sqrt(M) = (M + sqrt(det M) I) / sqrt(tr M + 2 sqrt(det M)); S = A P⁻¹
  const Mm = mul(tr(A), A);
  const d = Math.sqrt(Math.max(0, Mm[0][0] * Mm[1][1] - Mm[0][1] * Mm[1][0]));
  const k = Math.sqrt(Mm[0][0] + Mm[1][1] + 2 * d);
  const P = [[(Mm[0][0] + d) / k, Mm[0][1] / k], [Mm[1][0] / k, (Mm[1][1] + d) / k]];
  const det = P[0][0] * P[1][1] - P[0][1] * P[1][0];
  const Pi = [[P[1][1] / det, -P[0][1] / det], [-P[1][0] / det, P[0][0] / det]];
  return { P, S: mul(A, Pi) };
}

const STEPS = ["x", "√(AᵀA) x", "S √(AᵀA) x = Ax"];

/** The polar decomposition A = S√(AᵀA): first a symmetric stretch, then a rotation or reflection. */
export function PolarStepsViz() {
  const [s10, setS10] = useState(12);
  const [step, setStep] = useState(2);
  const s = s10 / 10;
  const A = [[1, s], [-0.6, 1]];
  const { P, S } = polar(A);
  const M: Mat = step === 0 ? [[1, 0], [0, 1]] : step === 1 ? P : A;
  const C = 120, Sc = 32;
  const pt = (x: number, y: number) => [C + (M[0][0] * x + M[0][1] * y) * Sc, 100 - (M[1][0] * x + M[1][1] * y) * Sc];
  const curve: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const th = (i / 96) * 2 * Math.PI;
    const [a, b] = pt(Math.cos(th), Math.sin(th));
    curve.push(`${a.toFixed(1)},${b.toFixed(1)}`);
  }
  const marks: [number, number, string][] = [[1, 0, "var(--accent)"], [0, 1, "var(--danger)"]];
  const ang = (Math.atan2(S[1][0], S[0][0]) * 180) / Math.PI;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {STEPS.map((t, k) => (
          <button key={t} type="button" className="seg" aria-pressed={step === k} onClick={() => setStep(k)}>{t}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          s = {s.toFixed(1)}
          <input type="range" min={-20} max={20} value={s10} onChange={(e) => setS10(Number(e.target.value))} aria-label="entry s of A" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox="0 0 240 200" style={{ width: "100%", maxWidth: 360, display: "block", margin: "0 auto" }} role="img" aria-label="The unit circle under the two factors of the polar decomposition">
        <line x1={10} x2={230} y1={100} y2={100} stroke="var(--border)" />
        <line x1={C} x2={C} y1={5} y2={195} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.6} points={curve.join(" ")} />
        {marks.map(([x, y, c]) => {
          const [a, b] = pt(x, y);
          return <line key={c} x1={C} y1={100} x2={a} y2={b} stroke={c} strokeWidth={2} />;
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        A = [[1, {s.toFixed(1)}], [−0.6, 1]], {S[0][0] * S[1][1] - S[0][1] * S[1][0] > 0 ? `S rotates by ${ang.toFixed(1)}°` : "S is a reflection (det A < 0)"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The positive factor √(AᵀA) turns the circle into an ellipse whose axes are the right singular vectors, without
        rotating those axes. The isometry S then rotates the ellipse rigidly into place. Every square matrix factors this
        way, like a complex number r·e^(iθ): a non-negative &ldquo;modulus&rdquo; and a length-preserving &ldquo;phase&rdquo;.
      </figcaption>
    </figure>
  );
}
