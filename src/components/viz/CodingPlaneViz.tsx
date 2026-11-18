"use client";

import { useState } from "react";

function comb(n: number, k: number) {
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return c;
}

export function repError(eps: number, r: number) {
  let s = 0;
  for (let k = Math.floor(r / 2) + 1; k <= r; k++) s += comb(r, k) * eps ** k * (1 - eps) ** (r - k);
  return s;
}

export function h2(p: number) {
  return p <= 0 || p >= 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

export function hammingError(eps: number) {
  return 1 - (1 - eps) ** 7 - 7 * eps * (1 - eps) ** 6;
}

/** Rate against error probability for simple codes on a binary symmetric channel, with the capacity as a wall. */
export function CodingPlaneViz() {
  const [e100, setE100] = useState(11);
  const eps = e100 / 100;
  const C = 1 - h2(eps);
  const W = 330, H = 190, X0 = 40, PW = W - 55, PH = 150;
  const sx = (r: number) => X0 + r * PW;
  const sy = (p: number) => 10 + (-Math.log10(Math.max(p, 1e-8)) / 8) * PH;
  const reps = [1, 3, 5, 7, 9, 11, 15, 21, 31, 51].map((r) => ({ r, rate: 1 / r, p: repError(eps, r) }));
  const ham = { rate: 4 / 7, p: hammingError(eps) };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          crossover ε {eps.toFixed(2)}
          <input type="range" min={1} max={30} value={e100} onChange={(ev) => setE100(Number(ev.target.value))} aria-label="crossover probability" style={{ width: 130 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Error probability on a log scale against rate, for repetition codes and the Hamming code, with the capacity marked">
        <rect x={sx(0)} y={sy(1)} width={sx(C) - sx(0)} height={sy(1e-8) - sy(1)} fill="var(--accent)" opacity={0.12} />
        <line x1={sx(C)} y1={sy(1)} x2={sx(C)} y2={sy(1e-8)} stroke="var(--danger)" strokeDasharray="4 3" />
        <text x={sx(C) + 3} y={sy(1e-7)} className="viz-label">C = {C.toFixed(2)}</text>
        <line x1={X0} y1={sy(1e-8)} x2={X0 + PW} y2={sy(1e-8)} stroke="var(--border)" />
        <line x1={X0} y1={sy(1)} x2={X0} y2={sy(1e-8)} stroke="var(--border)" />
        {[0, -2, -4, -6, -8].map((k) => (
          <text key={k} x={X0 - 4} y={sy(10 ** k) + 4} textAnchor="end" className="viz-label">{k === 0 ? "1" : `1e${k}`}</text>
        ))}
        {[0, 0.5, 1].map((r) => <text key={r} x={sx(r)} y={H - 10} textAnchor="middle" className="viz-label">{r}</text>)}
        <text x={X0 + PW / 2} y={H - 1} textAnchor="middle" className="viz-label">rate (bits per use)</text>
        <polyline fill="none" stroke="var(--text-muted)" points={reps.map((q) => `${sx(q.rate)},${sy(q.p)}`).join(" ")} />
        {reps.map((q) => <circle key={q.r} cx={sx(q.rate)} cy={sy(q.p)} r={3} fill="var(--text-muted)" />)}
        <rect x={sx(ham.rate) - 4} y={sy(ham.p) - 4} width={8} height={8} fill="var(--accent)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        repetition ×3: {repError(eps, 3).toExponential(1)} at rate 0.33; Hamming(7,4): {ham.p.toExponential(1)} at rate 0.57
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Grey dots are repetition codes of length 1, 3, 5, up to 51: their error falls only as their rate falls towards 0.
        The square is the Hamming(7,4) code. The coding theorem says the whole shaded region left of the capacity line is
        reachable: for any rate below C there are long codes whose error is as small as you like, while to the right of the
        line the error cannot be driven to zero.
      </figcaption>
    </figure>
  );
}
