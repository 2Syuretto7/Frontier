"use client";

import { useState } from "react";

const N = 8;

/** A circulant matrix built from a 3-tap kernel, and its eigenvalue magnitudes |ĉ_k|, which are the DFT of the kernel. */
export function CirculantViz() {
  const [a, setA] = useState(10), [b, setB] = useState(-5), [d, setD] = useState(-5);
  const c = new Array(N).fill(0);
  c[0] = a / 10; c[1] = b / 10; c[N - 1] = d / 10;
  const mags = Array.from({ length: N }, (_, k) => {
    let re = 0, im = 0;
    for (let j = 0; j < N; j++) { const t = (-2 * Math.PI * j * k) / N; re += c[j] * Math.cos(t); im += c[j] * Math.sin(t); }
    return Math.hypot(re, im);
  });
  const maxMag = Math.max(...mags, 1e-9);
  const cell = 16;
  const shade = (v: number) => (v > 0 ? "var(--accent)" : v < 0 ? "var(--danger)" : "var(--bg)");
  const slider = (label: string, v: number, set: (x: number) => void) => (
    <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
      {label} {(v / 10).toFixed(1)}
      <input type="range" min={-10} max={10} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} style={{ width: 80 }} />
    </label>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        {slider("c₀", a, setA)}
        {slider("c₁", b, setB)}
        {slider("c₇", d, setD)}
      </div>
      <svg viewBox="0 0 320 150" style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="A circulant matrix and the magnitudes of its eigenvalues">
        {Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => {
          const v = c[(i - j + N) % N];
          return <rect key={`${i}-${j}`} x={6 + j * cell} y={8 + i * cell} width={cell - 1} height={cell - 1} fill={shade(v)} opacity={v === 0 ? 1 : 0.25 + 0.75 * Math.min(1, Math.abs(v))} stroke="var(--border)" strokeWidth={0.5} />;
        }))}
        <text x={6 + (N * cell) / 2} y={146} textAnchor="middle" className="viz-label">C = circ(c)</text>
        {mags.map((m, k) => (
          <g key={k}>
            <rect x={160 + k * 19} y={128 - (m / maxMag) * 110} width={14} height={(m / maxMag) * 110} fill="var(--accent)" />
            <text x={167 + k * 19} y={142} textAnchor="middle" className="viz-label">{k}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        |ĉ| = [{mags.map((m) => m.toFixed(2)).join(", ")}], ‖C‖₂ = {maxMag.toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Left: each row of C is the previous row shifted one place to the right, wrapping round (blue positive, red
        negative). Right: the magnitudes of its eigenvalues, which are the discrete Fourier transform of the kernel c. The
        default kernel (1, −0.5, …, −0.5) is a discrete second difference: it kills the constant (k = 0) and amplifies the
        fastest oscillation (k = 4), a high-pass filter. Every circulant shares the same eigenvectors, the Fourier modes.
      </figcaption>
    </figure>
  );
}
