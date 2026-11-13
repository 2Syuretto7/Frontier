"use client";

import { useMemo, useState } from "react";

const XS = [-0.95, -0.7, -0.45, -0.2, 0.05, 0.3, 0.55, 0.85];
const NOISE = [0.12, -0.15, 0.1, 0.18, -0.12, 0.08, -0.16, 0.1];
const YS = XS.map((x, i) => Math.sin(Math.PI * x) + NOISE[i]);
const DEG = 7, K = 200;

function gauss(seed: number) {
  let a = seed >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
}

function solve(A: number[][], b: number[]) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((r, i) => r[n] / r[i]);
}

const feats = (x: number) => Array.from({ length: DEG + 1 }, (_, k) => x ** k);

/** A degree-7 polynomial fitted to 8 points, with each input copied many times with Gaussian jitter. */
export function NoiseAugmentViz() {
  const [sigma, setSigma] = useState(0);
  const coef = useMemo(() => {
    const r = gauss(9);
    const A = Array.from({ length: DEG + 1 }, () => new Array(DEG + 1).fill(0));
    const b = new Array(DEG + 1).fill(0);
    XS.forEach((x, i) => {
      for (let k = 0; k < (sigma > 0 ? K : 1); k++) {
        const f = feats(x + sigma * r());
        for (let a = 0; a <= DEG; a++) {
          b[a] += f[a] * YS[i];
          for (let c = 0; c <= DEG; c++) A[a][c] += f[a] * f[c];
        }
      }
    });
    for (let a = 0; a <= DEG; a++) A[a][a] += 1e-9;
    return solve(A, b);
  }, [sigma]);
  const W = 320, H = 180;
  const px = (x: number) => 20 + ((x + 1) / 2) * (W - 30);
  const py = (y: number) => H / 2 - Math.max(-2.2, Math.min(2.2, y)) * ((H - 20) / 4.4);
  const pts: string[] = [];
  for (let x = -1; x <= 1.0001; x += 0.01) pts.push(`${px(x).toFixed(1)},${py(feats(x).reduce((s, f, k) => s + f * coef[k], 0)).toFixed(1)}`);
  const truth: string[] = [];
  for (let x = -1; x <= 1.0001; x += 0.02) truth.push(`${px(x).toFixed(1)},${py(Math.sin(Math.PI * x)).toFixed(1)}`);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          input jitter σ = {sigma.toFixed(2)}
          <input type="range" min={0} max={0.3} step={0.01} value={sigma} onChange={(e) => setSigma(Number(e.target.value))} aria-label="augmentation noise" style={{ width: 160 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Polynomial fit with and without noise augmentation">
        <line x1={20} x2={W - 10} y1={py(0)} y2={py(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.5} points={truth.join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={pts.join(" ")} />
        {XS.map((x, i) => <circle key={i} cx={px(x)} cy={py(YS[i])} r={4} fill="var(--danger)" />)}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Eight noisy samples of sin(πx) (dashed) and a degree-7 polynomial, which can pass through all eight exactly. At σ = 0
        it does, and swings wildly between them. Training instead on {K} jittered copies of each input forbids the fit from
        changing sharply near any training point: the curve smooths out, much as ridge regression would make it. Too much
        jitter flattens the real signal too.
      </figcaption>
    </figure>
  );
}
