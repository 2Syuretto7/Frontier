"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 80, ITERS = 30;
const sig = (z: number) => 1 / (1 + Math.exp(-z));

type Stats = { g: number[]; H: number[][] };

function stats(X: number[][], y: number[], w: number[]): Stats {
  const p = w.length, g = Array(p).fill(0), H = Array.from({ length: p }, () => Array(p).fill(0));
  X.forEach((x, i) => {
    const m = sig(x.reduce((s, v, k) => s + v * w[k], 0));
    for (let a = 0; a < p; a++) { g[a] += (m - y[i]) * x[a]; for (let b = 0; b < p; b++) H[a][b] += m * (1 - m) * x[a] * x[b]; }
  });
  return { g, H };
}

function solve3(A: number[][], b: number[]) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
}

/** Logistic regression fitted by gradient descent and by Newton's method (IRLS): the error of Newton squares each step and ignores feature scaling; gradient descent shrinks it by a constant factor that depends on scaling. */
export function IrlsConvViz() {
  const [scale, setScale] = useState(1);
  const res = useMemo(() => {
    const r = makeRng(4242);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const X: number[][] = [], y: number[] = [];
    for (let i = 0; i < N; i++) {
      const a = normal(), b = normal();
      X.push([1, a, scale * b]);
      y.push(r() < sig(0.5 + 1.2 * a - 0.8 * b) ? 1 : 0);
    }
    const newton = (w: number[]) => { const { g, H } = stats(X, y, w); const d = solve3(H, g); return w.map((v, k) => v - d[k]); };
    let ws = [0, 0, 0];
    for (let k = 0; k < 40; k++) ws = newton(ws);
    const L = (() => { const { H } = stats(X, y, [0, 0, 0]); return H.reduce((s, row) => s + row.reduce((a, v) => a + Math.abs(v), 0), 0); })();
    const err = (w: number[]) => Math.log10(Math.max(Math.hypot(...w.map((v, k) => v - ws[k])), 1e-16));
    const gd: number[] = [], nt: number[] = [];
    let wg = [0, 0, 0], wn = [0, 0, 0];
    for (let k = 0; k <= ITERS; k++) {
      gd.push(err(wg)); nt.push(err(wn));
      const { g } = stats(X, y, wg);
      wg = wg.map((v, j) => v - (1.5 / L) * g[j]);
      wn = newton(wn);
    }
    return { gd, nt, ws };
  }, [scale]);
  const W = 330, H = 170;
  const X = (k: number) => 30 + (k / ITERS) * (W - 44);
  const Y = (e: number) => 10 + ((1 - Math.max(e, -16)) / 17) * (H - 30);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="mono" style={{ fontSize: 13 }}>second feature scaled by</span>
        {[1, 10].map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={scale === s} onClick={() => setScale(s)}>×{s}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Log error against iteration for gradient descent and Newton's method">
        {[0, -4, -8, -12, -16].map((e) => (
          <g key={e}>
            <line x1={30} x2={W - 14} y1={Y(e)} y2={Y(e)} stroke="var(--border)" strokeDasharray="2 3" />
            <text x={26} y={Y(e) + 4} textAnchor="end" className="viz-label">{e === 0 ? "1" : `1e${e}`}</text>
          </g>
        ))}
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} points={res.gd.map((e, k) => `${X(k).toFixed(1)},${Y(e).toFixed(1)}`).join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={res.nt.map((e, k) => `${X(k).toFixed(1)},${Y(e).toFixed(1)}`).join(" ")} />
        {res.nt.map((e, k) => <circle key={k} cx={X(k)} cy={Y(e)} r={2} fill="var(--accent)" />)}
        <text x={X(ITERS)} y={H - 4} textAnchor="end" className="viz-label">iteration {ITERS}</text>
        <text x={X(0)} y={H - 4} className="viz-label">0</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        Newton error after 5 steps: 10^{res.nt[5].toFixed(1)}; gradient descent after {ITERS}: 10^{res.gd[ITERS].toFixed(1)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Distance to the maximum-likelihood weights for logistic regression on 80 points, on a log scale. Gradient descent
        (the steadily falling line), with a safe fixed step, gains a roughly constant number of digits per step. Newton&apos;s
        method (the dotted line) is slow for a step or two, then the number of correct digits doubles each step until it
        reaches machine precision. Scaling a feature by 10 makes the problem badly conditioned: gradient descent slows to
        a crawl, while Newton&apos;s iterates are just rescaled and converge exactly as fast.
      </figcaption>
    </figure>
  );
}
