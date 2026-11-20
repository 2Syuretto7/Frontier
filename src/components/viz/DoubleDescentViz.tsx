"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 40, D = 160, S2 = 0.25, RUNS = 10, YH = 4;
export const BETAS: Record<string, number[]> = {
  spread: Array.from({ length: D }, () => 1 / D),
  decaying: (() => { const v = Array.from({ length: D }, (_, j) => 1 / (j + 1) ** 2), s = v.reduce((a, b) => a + b, 0); return v.map((x) => x / s); })(),
};
const PS = Array.from({ length: D / 2 }, (_, i) => 2 * i + 2);

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

/** Expected test risk of minimum-norm least squares on the first p of D isotropic Gaussian features (Belkin, Hsu and Xu). */
export function theory(p: number, b2: number[]) {
  const sin = b2.slice(0, p).reduce((a, v) => a + v, 0), sout = 1 - sin;
  if (p < N - 1) return (sout + S2) * (1 + p / (N - p - 1));
  if (p > N + 1) return sin * (1 - N / p) + (sout + S2) * (1 + N / (p - N - 1));
  return Infinity;
}

/** Simulated test risk ‖w − β‖² + σ², averaged over RUNS training sets, for each p in PS. */
export function simulate(kind: string) {
  const b2 = BETAS[kind], beta = b2.map(Math.sqrt), out = new Array(PS.length).fill(0);
  for (let s = 0; s < RUNS; s++) {
    const r = rand(500 + s);
    const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    const X = Array.from({ length: N }, () => Array.from({ length: D }, nrm));
    const y = X.map((row) => row.reduce((a, v, j) => a + v * beta[j], 0) + Math.sqrt(S2) * nrm());
    PS.forEach((p, k) => {
      let w: number[];
      if (p < N) {
        const A = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => X.reduce((a, row) => a + row[i] * row[j], 0)));
        w = solve(A, Array.from({ length: p }, (_, i) => X.reduce((a, row, t) => a + row[i] * y[t], 0)));
      } else {
        const G = X.map((u) => X.map((v) => u.slice(0, p).reduce((a, x, j) => a + x * v[j], 0)));
        const al = solve(G, y);
        w = Array.from({ length: p }, (_, j) => X.reduce((a, row, t) => a + row[j] * al[t], 0));
      }
      out[k] += (beta.reduce((a, bj, j) => a + (bj - (j < p ? w[j] : 0)) ** 2, 0) + S2) / RUNS;
    });
  }
  return out;
}

export function DoubleDescentViz() {
  const [kind, setKind] = useState("spread");
  const sim = useMemo(() => simulate(kind), [kind]), b2 = BETAS[kind];
  const W = 330, H = 158, X0 = 26, PW = 290, Y0 = 8, PH = 128;
  const sx = (p: number) => X0 + (p / D) * PW, sy = (y: number) => Y0 + PH - (Math.min(YH, y) / YH) * PH;
  const th = Array.from({ length: D }, (_, i) => i + 1);
  const seg = (ps: number[]) => ps.map((p, i) => `${i ? "L" : "M"}${sx(p).toFixed(1)},${sy(theory(p, b2)).toFixed(1)}`).join(" ");
  const under = th.filter((p) => p < N - 1), over = th.filter((p) => p > N + 1);
  const bestU = Math.min(...under.map((p) => theory(p, b2))), bestO = Math.min(...over.map((p) => theory(p, b2)));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">true coefficients</span>
        <div className="segmented" role="group" aria-label="How the signal is spread over the features">
          {Object.keys(BETAS).map((k) => <button key={k} type="button" className="seg" aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Test risk of minimum-norm least squares against the number of features">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        <line x1={sx(N)} x2={sx(N)} y1={Y0} y2={Y0 + PH} stroke="var(--border)" strokeDasharray="2 3" />
        {[0, 1, 2, 3, 4].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        {[40, 80, 120, 160].map((p) => <text key={p} x={sx(p)} y={H - 1} textAnchor={p === D ? "end" : "middle"} className="viz-label">{p === N ? "p = n" : p}</text>)}
        <path d={seg(under)} fill="none" stroke="var(--text)" strokeWidth={1.2} strokeDasharray="4 3" />
        <path d={seg(over)} fill="none" stroke="var(--text)" strokeWidth={1.2} strokeDasharray="4 3" />
        {PS.map((p, k) => <circle key={p} cx={sx(p)} cy={sy(sim[k])} r={2.2} fill="var(--accent)" />)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--accent)" }}>●</span> simulated test risk (mean of {RUNS})</span>
        <span>┅ formula</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        best risk with p &lt; n: {bestU.toFixed(3)}; with p &gt; n: {bestO.toFixed(3)}; simulated at p = {D}: {sim[PS.length - 1].toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Minimum-norm least squares with n = 40 examples, using the first p of 160 Gaussian features, with noise variance
        0.25. The risk climbs as p approaches n, blows up at the interpolation threshold, and falls again beyond it. When the
        signal is spread evenly over all 160 features, the second descent wins: the best risk with p &gt; n is 1.084, at p = 160,
        against 1.276 for the best p &lt; n. When the coefficients decay quickly, a small model with p = 7 reaches 0.399 and
        the overparameterised side never does better than 1.011.
      </figcaption>
    </figure>
  );
}
