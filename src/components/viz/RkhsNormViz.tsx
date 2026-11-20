"use client";

import { useMemo, useState } from "react";

const XS = [-0.9, -0.55, -0.2, 0.15, 0.5, 0.85];
const TARGETS: Record<string, (x: number) => number> = { smooth: (x) => Math.sin(1.5 * x), wiggly: (x) => Math.sin(6 * x) };
const SIGMAS = [0.1, 0.3, 1.0];
const GRID = Array.from({ length: 161 }, (_, i) => -1.2 + (i * 2.4) / 160);

function solve(A: number[][], b: number[]) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const t = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= t * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
}

/** Minimum-norm interpolant f = Σ α_i k(x_i, ·) with α = K⁻¹y, and its RKHS norm √(αᵀKα) = √(yᵀK⁻¹y). */
export function interpolant(target: string, sigma: number) {
  const k = (a: number, b: number) => Math.exp(-((a - b) ** 2) / (2 * sigma * sigma));
  const ys = XS.map(TARGETS[target]);
  const K = XS.map((a) => XS.map((b) => k(a, b)));
  const alpha = solve(K, ys);
  const norm = Math.sqrt(alpha.reduce((s, a, i) => s + a * ys[i], 0));
  const f = (x: number) => XS.reduce((s, xi, i) => s + alpha[i] * k(xi, x), 0);
  return { ys, alpha, norm, f };
}

export function RkhsNormViz() {
  const [target, setTarget] = useState("smooth");
  const [si, setSi] = useState(1);
  const sigma = SIGMAS[si];
  const r = useMemo(() => interpolant(target, sigma), [target, sigma]);
  const W = 330, H = 160, X0 = 10, PW = 310, Y0 = 8, PH = 140, YL = -2, YH = 2;
  const sx = (x: number) => X0 + ((x + 1.2) / 2.4) * PW, sy = (y: number) => Y0 + PH - ((Math.max(YL, Math.min(YH, y)) - YL) / (YH - YL)) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Target">
          {Object.keys(TARGETS).map((t) => <button key={t} type="button" className="seg" aria-pressed={target === t} onClick={() => setTarget(t)}>{t} target</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Kernel width">
          {SIGMAS.map((s, i) => <button key={s} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>σ = {s}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Minimum-norm kernel interpolant through six points">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <path d={GRID.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(TARGETS[target](x)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text)" strokeDasharray="4 3" strokeWidth={1} />
        <path d={GRID.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(r.f(x)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {XS.map((x, i) => <circle key={i} cx={sx(x)} cy={sy(r.ys[i])} r={3.5} fill="var(--code-function)" />)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        RKHS norm of the interpolant {r.norm.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        The smallest-norm function in the Gaussian-kernel RKHS that passes through six samples (dashed: the function they
        came from). Narrow kernels interpolate with isolated bumps and a modest norm; wide kernels make functions smooth, so
        fitting rapidly varying data is expensive. With σ = 1 the smooth target costs norm 1.64, the wiggly one 266.54: the
        RKHS norm measures how much a function disagrees with the kernel&apos;s idea of smoothness.
      </figcaption>
    </figure>
  );
}
