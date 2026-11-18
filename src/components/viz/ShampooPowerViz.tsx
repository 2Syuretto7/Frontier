"use client";

import { useState } from "react";

const SIGMA = [8, 4, 2, 1, 0.5, 0.25];
const A = [4, 1, 0.25], B = [9, 1, 0.04];
const POWERS: [string, number][] = [["0", 0], ["1/8", 0.125], ["1/4", 0.25], ["1/2", 0.5]];

/** Singular values of L^(−p) G R^(−p) for one gradient G with singular values s, where L = GGᵀ and R = GᵀG. */
export function oneGradient(p: number) {
  return SIGMA.map((s) => s ** (1 - 4 * p));
}

/** Standard deviations of L^(−p) G R^(−p) in the eigenbasis when G has covariance A ⊗ B, with L = tr(B)A and R = tr(A)B. */
export function noisyGradients(p: number) {
  const tA = A.reduce((s, v) => s + v, 0), tB = B.reduce((s, v) => s + v, 0);
  return A.flatMap((a) => B.map((b) => Math.sqrt(a * b) * (tB * a) ** -p * (tA * b) ** -p));
}

function Bars({ vals, label }: { vals: number[]; label: string }) {
  const W = 300, H = 80, X0 = 34, PW = W - 42;
  const logs = vals.map((v) => Math.log10(v));
  const lo = -2, hi = 2;
  const bw = PW / vals.length;
  const y = (l: number) => 6 + ((hi - Math.min(hi, Math.max(lo, l))) / (hi - lo)) * (H - 12);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label={label}>
      <line x1={X0} y1={y(0)} x2={X0 + PW} y2={y(0)} stroke="var(--border)" />
      {logs.map((l, i) => (
        <rect key={i} x={X0 + i * bw + 2} width={bw - 4} y={Math.min(y(l), y(0))} height={Math.max(1, Math.abs(y(l) - y(0)))} fill="var(--accent)" />
      ))}
      {[100, 1, 0.01].map((v) => (
        <text key={v} x={X0 - 4} y={y(Math.log10(v)) + 4} textAnchor="end" className="viz-label">{v}</text>
      ))}
    </svg>
  );
}

export function ShampooPowerViz() {
  const [p, setP] = useState(0.25);
  const one = oneGradient(p), many = noisyGradients(p);
  const spread = (v: number[]) => (Math.max(...v) / Math.min(...v)).toFixed(v.length > 6 ? 1 : 2);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">exponent p in L^(−p) G R^(−p)</span>
        {POWERS.map(([name, v]) => (
          <button key={name} type="button" className="seg" aria-pressed={p === v} onClick={() => setP(v)}>{name}</button>
        ))}
      </div>
      <div className="viz-label" style={{ textAlign: "center" }}>one gradient: singular values of the direction</div>
      <Bars vals={one} label="Singular values of the Shampoo direction for a single gradient" />
      <div className="viz-label" style={{ textAlign: "center" }}>many noisy gradients: spread of the direction by eigen-direction</div>
      <Bars vals={many} label="Standard deviations of the Shampoo direction for Kronecker-structured gradient noise" />
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`largest / smallest: one gradient ${spread(one)}, noisy gradients ${spread(many)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Top: a single gradient with singular values 8 down to 0.25. Exponent 1/4 maps every singular value to 1, the
        orthogonalised gradient; 1/2 inverts them. Bottom: gradients that are pure noise with covariance A ⊗ B, where the
        statistics converge to L = tr(B)A and R = tr(A)B. Here exponent 1/2 whitens every direction to the same size,
        matching full-matrix AdaGrad, while 1/4 only halves the spread in logarithmic terms.
      </figcaption>
    </figure>
  );
}
