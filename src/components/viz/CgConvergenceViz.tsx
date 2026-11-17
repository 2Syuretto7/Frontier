"use client";

import { useMemo, useState } from "react";

const N = 100, ITERS = 60;

function spectrum(kappa: number, clustered: boolean): number[] {
  if (!clustered) return Array.from({ length: N }, (_, i) => 1 + ((kappa - 1) * i) / (N - 1));
  const centres = [1, Math.sqrt(kappa), kappa];
  return Array.from({ length: N }, (_, i) => centres[i % 3] * (1 + 1e-4 * ((i % 7) - 3) / 3));
}

/** Relative A-norm error per iteration for a diagonal SPD system: conjugate gradient, steepest descent, and the Chebyshev bound. */
function run(lam: number[]) {
  const b = Array(N).fill(1);
  const xs = b.map((v, i) => v / lam[i]);
  const aerr = (x: number[]) => Math.sqrt(x.reduce((s, v, i) => s + lam[i] * (v - xs[i]) ** 2, 0));
  const e0 = aerr(Array(N).fill(0));
  const cg: number[] = [1], sd: number[] = [1];
  let x = Array(N).fill(0), r = b.slice(), p = r.slice(), rr = r.reduce((s, v) => s + v * v, 0);
  for (let k = 0; k < ITERS; k++) {
    if (rr < 1e-300) { cg.push(cg[cg.length - 1]); continue; }
    const Ap = p.map((v, i) => lam[i] * v);
    const alpha = rr / p.reduce((s, v, i) => s + v * Ap[i], 0);
    x = x.map((v, i) => v + alpha * p[i]);
    r = r.map((v, i) => v - alpha * Ap[i]);
    const rn = r.reduce((s, v) => s + v * v, 0);
    p = r.map((v, i) => v + (rn / rr) * p[i]);
    rr = rn;
    cg.push(Math.max(aerr(x) / e0, 1e-16));
  }
  let y = Array(N).fill(0), s = b.slice();
  for (let k = 0; k < ITERS; k++) {
    const As = s.map((v, i) => lam[i] * v);
    const a = s.reduce((t, v) => t + v * v, 0) / s.reduce((t, v, i) => t + v * As[i], 0);
    y = y.map((v, i) => v + a * s[i]);
    s = s.map((v, i) => v - a * As[i]);
    sd.push(Math.max(aerr(y) / e0, 1e-16));
  }
  return { cg, sd };
}

export function CgConvergenceViz() {
  const [lk, setLk] = useState(2);
  const [clustered, setClustered] = useState(false);
  const kappa = 10 ** lk;
  const { cg, sd } = useMemo(() => run(spectrum(kappa, clustered)), [kappa, clustered]);
  const q = (Math.sqrt(kappa) - 1) / (Math.sqrt(kappa) + 1);
  const W = 330, H = 160;
  const X = (k: number) => 30 + (k / ITERS) * (W - 40);
  const Y = (v: number) => 10 + (-Math.max(Math.log10(v), -16) / 16) * (H - 30);
  const line = (arr: number[]) => arr.map((v, k) => `${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const bound = Array.from({ length: ITERS + 1 }, (_, k) => Math.min(1, 2 * q ** k));
  const hit = cg.findIndex((v) => v < 1e-10);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <button type="button" className="seg" aria-pressed={!clustered} onClick={() => setClustered(false)}>spread evenly</button>
        <button type="button" className="seg" aria-pressed={clustered} onClick={() => setClustered(true)}>three clusters</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          κ = 10^{lk.toFixed(1)}
          <input type="range" min={0.5} max={4} step={0.5} value={lk} onChange={(e) => setLk(Number(e.target.value))} aria-label="log condition number" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Error against iteration for conjugate gradient and steepest descent">
        {[0, -4, -8, -12, -16].map((l) => (
          <g key={l}>
            <line x1={X(0)} x2={X(ITERS)} y1={Y(10 ** l)} y2={Y(10 ** l)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={26} y={Y(10 ** l) + 3} textAnchor="end" className="viz-label">{l === 0 ? "1" : `1e${l}`}</text>
          </g>
        ))}
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.2} strokeDasharray="4 3" points={line(bound)} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} points={line(sd)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={line(cg)} />
        <text x={X(0)} y={H - 4} className="viz-label">k = 0</text>
        <text x={X(ITERS)} y={H - 4} textAnchor="end" className="viz-label">k = {ITERS}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        CG reaches 10⁻¹⁰ at k = {hit < 0 ? `> ${ITERS}` : hit}; steepest descent after {ITERS} steps: {sd[ITERS].toExponential(1)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A diagonal 100 × 100 system with eigenvalues between 1 and κ, started from zero. The curves show the A-norm error
        relative to the start: conjugate gradient (accent), steepest descent with exact line search (red), and the bound
        2((√κ − 1)/(√κ + 1))^k (grey dashed). Steepest descent improves by about (κ − 1)/(κ + 1) per step; CG by about
        (√κ − 1)/(√κ + 1), a square root better in κ. With three tight clusters of eigenvalues, CG&apos;s error drops by several
        orders of magnitude within three or four steps whatever κ is, because a degree-3 polynomial can be nearly zero on
        all three clusters; the later steps resolve the tiny spread inside each cluster.
      </figcaption>
    </figure>
  );
}
