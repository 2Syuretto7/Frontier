"use client";

import { useState } from "react";

const KMAX = 50, NDOT = 7;
const KAPPAS = [10, 1e3, 1e6];

/** Track each eigenvalue t of AX_k under the Newton–Schulz map t ← t(2 − t): small ones only double per step, then all converge quadratically. */
function trajectories(kappa: number) {
  const ts: number[][] = [], rs: number[][] = [];
  for (let i = 0; i < NDOT; i++) {
    const sig = kappa ** (-i / (NDOT - 1));
    let t = 0.8 * sig * sig, r = 1 - t;
    const tl: number[] = [], rl: number[] = [];
    for (let k = 0; k <= KMAX; k++) {
      tl.push(t); rl.push(r);
      t = t * (2 - t); r = r * r;
    }
    ts.push(tl); rs.push(rl);
  }
  const worst = Array.from({ length: KMAX + 1 }, (_, k) => Math.max(...rs.map((rl) => rl[k])));
  return { ts, worst };
}

export function NsPlateauViz() {
  const [ki, setKi] = useState(1);
  const [k, setK] = useState(0);
  const kappa = KAPPAS[ki];
  const { ts, worst } = trajectories(kappa);
  const W = 330, H = 190;
  const TX = (t: number) => 34 + ((Math.max(-12, Math.log10(Math.max(t, 1e-300))) + 12) / 12) * (W - 50);
  const KX = (j: number) => 34 + (j / KMAX) * (W - 50);
  const RY = (r: number) => 70 + ((-Math.max(-16, Math.log10(Math.max(r, 1e-300)))) / 16) * (H - 92);
  const steps = worst.findIndex((r) => r < 1e-10);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        {KAPPAS.map((c, i) => (
          <button key={c} type="button" className="seg" aria-pressed={i === ki} onClick={() => setKi(i)}>
            κ = {c >= 1000 ? `1e${Math.round(Math.log10(c))}` : c}
          </button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          step k = {k}
          <input type="range" min={0} max={KMAX} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="iteration" style={{ width: 120 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Eigenvalues of AX_k on a log axis, and the residual norm against the step count">
        <text x={34} y={12} className="viz-label">eigenvalues of AX_k (log scale)</text>
        <line x1={TX(1e-12)} x2={TX(1)} y1={34} y2={34} stroke="var(--border)" />
        {[-12, -8, -4, 0].map((l) => (
          <text key={l} x={TX(10 ** l)} y={50} textAnchor="middle" className="viz-label">{l === 0 ? "1" : `1e${l}`}</text>
        ))}
        {ts.map((tl, i) => (
          <circle key={i} cx={TX(tl[k])} cy={34} r={4} fill="var(--accent)" opacity={0.75} />
        ))}
        {[0, -8, -16].map((l) => (
          <g key={l}>
            <line x1={KX(0)} x2={KX(KMAX)} y1={RY(10 ** l)} y2={RY(10 ** l)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={30} y={RY(10 ** l) + 3} textAnchor="end" className="viz-label">{l === 0 ? "1" : `1e${l}`}</text>
          </g>
        ))}
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={worst.map((r, j) => `${KX(j).toFixed(1)},${RY(r).toFixed(1)}`).join(" ")} />
        <line x1={KX(k)} x2={KX(k)} y1={RY(1) - 4} y2={RY(1e-16)} stroke="var(--danger)" strokeDasharray="2 2" />
        <text x={KX(KMAX)} y={H - 4} textAnchor="end" className="viz-label">k = {KMAX}</text>
        <text x={KX(0)} y={H - 4} className="viz-label">‖I − AX_k‖</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        residual at step {k}: {worst[k].toExponential(2)}; below 1e-10 after {steps} steps ({2 * steps} matrix products)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each dot is an eigenvalue t of AX_k, for singular values of A spread evenly on a log scale over a condition number
        κ. One Newton–Schulz step maps t to t(2 − t), so 1 − t is squared. A dot near 1 snaps to 1 in a few steps, but a dot
        near 1/κ² only doubles each step, so the residual sits near 1 for about 2·log₂κ steps before the quadratic phase
        takes over. Larger κ lengthens the plateau, not the finish.
      </figcaption>
    </figure>
  );
}
