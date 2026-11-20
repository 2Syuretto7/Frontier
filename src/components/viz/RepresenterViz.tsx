"use client";

import { useMemo, useState } from "react";

const XS = [-0.8, -0.3, 0.2, 0.7], SIGMA = 0.3;
const k = (a: number, b: number) => Math.exp(-((a - b) ** 2) / (2 * SIGMA * SIGMA));
const GRID = Array.from({ length: 161 }, (_, i) => -1.2 + (i * 2.4) / 160);

function solve(A: number[][], b: number[]) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const t = M[r][c] / M[c][c]; for (let q = c; q <= n; q++) M[r][q] -= t * M[c][q]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let q = r + 1; q < n; q++) s -= M[r][q] * x[q]; x[r] = s / M[r][r]; }
  return x;
}

/** f = k(c, ·) + 0.5 k(x_1, ·); v is its projection onto span{k(x_i, ·)}, u = f − v. Returns the three squared norms too. */
export function decompose(c: number) {
  const centres = [c, XS[0]], alpha = [1, 0.5];
  const f = (x: number) => centres.reduce((s, ci, i) => s + alpha[i] * k(ci, x), 0);
  const beta = solve(XS.map((a) => XS.map((b) => k(a, b))), XS.map(f));
  const v = (x: number) => XS.reduce((s, xi, i) => s + beta[i] * k(xi, x), 0);
  const nf = alpha.reduce((s, a, i) => s + alpha.reduce((t, b, j) => t + a * b * k(centres[i], centres[j]), 0), 0);
  const nv = beta.reduce((s, a, i) => s + beta.reduce((t, b, j) => t + a * b * k(XS[i], XS[j]), 0), 0);
  return { f, v, nf, nv, nu: nf - nv };
}

const CS = [-0.05, 0.45, 1.05];

export function RepresenterViz() {
  const [ci, setCi] = useState(0);
  const d = useMemo(() => decompose(CS[ci]), [ci]);
  const W = 330, H = 170, X0 = 10, PW = 310, Y0 = 8, PH = 150, YL = -0.6, YH = 1.4;
  const sx = (x: number) => X0 + ((x + 1.2) / 2.4) * PW, sy = (y: number) => Y0 + PH - ((y - YL) / (YH - YL)) * PH;
  const line = (g: (x: number) => number) => GRID.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(g(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">extra centre c</span>
        <div className="segmented" role="group" aria-label="Position of the extra kernel centre">
          {CS.map((c, i) => <button key={c} type="button" className="seg" aria-pressed={ci === i} onClick={() => setCi(i)}>{c}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A function, its projection onto the span of the training kernels, and the orthogonal remainder">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        {XS.map((x) => <line key={x} x1={sx(x)} x2={sx(x)} y1={Y0} y2={Y0 + PH} stroke="var(--border)" strokeDasharray="2 3" />)}
        <path d={line((x) => d.f(x) - d.v(x))} fill="none" stroke="var(--code-function)" strokeWidth={1.5} strokeDasharray="4 3" />
        <path d={line(d.f)} fill="none" stroke="var(--text)" strokeWidth={1.5} />
        <path d={line(d.v)} fill="none" stroke="var(--accent)" strokeWidth={2.2} />
        {XS.map((x) => <circle key={x} cx={sx(x)} cy={sy(d.f(x))} r={3.5} fill="var(--accent)" />)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span>━ f</span>
        <span><span style={{ color: "var(--accent)" }}>━</span> projection v</span>
        <span><span style={{ color: "var(--code-function)" }}>━</span> remainder u = f − v</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        ‖f‖² {d.nf.toFixed(3)} = ‖v‖² {d.nv.toFixed(3)} + ‖u‖² {d.nu.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        The function f uses a kernel centred at c, which is not a training point (dotted lines). Its projection onto the span
        of the four training kernels takes exactly the same values at the training points, so any loss on the data is
        unchanged, while the remainder vanishes there and only adds norm. The farther c is from the data, the more of f is
        invisible to it: ‖u‖² grows from 0.180 at c = −0.05 to 0.730 at c = 1.05.
      </figcaption>
    </figure>
  );
}
