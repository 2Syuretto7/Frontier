"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const DIMS = [2, 10, 50];
const ELLS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const LMAX = 5.5, HMAX = 1.326;

/** Complementary error function, Abramowitz and Stegun 7.1.26 (error below 1.5e-7). */
export function erfc(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x);
  return x >= 0 ? y : 2 - y;
}

/** High-dimensional limit for random-walk Metropolis on a product target: acceptance and speed for step ell / sqrt(d). */
export const limitAcc = (ell: number) => erfc(ell / (2 * Math.SQRT2));
export const limitSpeed = (ell: number) => ell * ell * limitAcc(ell);

/** Acceptance rate and mean squared jump of random-walk Metropolis on N(0, I_d). */
export function simulate(d: number, ell: number, n: number, seed: number) {
  const rng = makeRng(seed), z = makeNormal(rng), h = ell / Math.sqrt(d);
  let x = Array.from({ length: d }, z), acc = 0, jump = 0;
  for (let i = 0; i < n; i++) {
    const y = x.map((v) => v + h * z());
    const dl = 0.5 * (x.reduce((s, v) => s + v * v, 0) - y.reduce((s, v) => s + v * v, 0));
    if (Math.log(Math.max(rng(), 1e-300)) < dl) {
      jump += y.reduce((s, v, k) => s + (v - x[k]) ** 2, 0); x = y; acc++;
    }
  }
  return { acc: acc / n, speed: jump / n };
}

export function OptimalScalingViz() {
  const [d, setD] = useState(10);
  const [pts, setPts] = useState<{ ell: number; acc: number; speed: number }[] | null>(null);
  useEffect(() => {
    setPts(ELLS.map((ell, i) => ({ ell, ...simulate(d, ell, 3000, 17 + 31 * i + d) })));
  }, [d]);
  const W = 330, H = 160, X0 = 30, PW = W - 40, PH = 130;
  const sx = (l: number) => X0 + (l / LMAX) * PW, sy = (v: number) => 10 + (1 - v) * PH;
  const grid = Array.from({ length: 111 }, (_, i) => (LMAX * i) / 110);
  const best = pts ? pts.reduce((b, p) => (p.speed > b.speed ? p : b)) : null;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {DIMS.map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={s === d} onClick={() => setD(s)}>d = {s}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Acceptance rate and speed of random-walk Metropolis against the scaled step size">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={sx(2.38)} y1={sy(0)} x2={sx(2.38)} y2={sy(1)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.5} points={grid.map((l) => `${sx(l)},${sy(limitAcc(l))}`).join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={grid.map((l) => `${sx(l)},${sy(limitSpeed(l) / HMAX)}`).join(" ")} />
        {pts?.map((p) => (
          <g key={p.ell}>
            <circle cx={sx(p.ell)} cy={sy(p.acc)} r={3} fill="var(--text-muted)" />
            <circle cx={sx(p.ell)} cy={sy(Math.min(1.1, p.speed / HMAX))} r={3} fill="var(--accent)" />
          </g>
        ))}
        <text x={X0 - 4} y={sy(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={sx(2.38)} y={H + 12} textAnchor="middle" className="viz-label">ℓ = 2.38</text>
        <text x={X0 + PW} y={H + 12} textAnchor="end" className="viz-label">ℓ</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {best ? `d = ${d}: fastest simulated step ℓ = ${best.ell}, acceptance ${best.acc.toFixed(2)}` : "simulating"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Random-walk Metropolis on a d-dimensional standard normal with proposal step ℓ/√d. Grey: acceptance rate; colour:
        squared distance moved per step, scaled so the limiting maximum is 1. Curves are the d → ∞ limit, dots are 3000-step
        simulations. Small steps are almost always accepted but go nowhere; large ones are almost always rejected. The best
        compromise sits near ℓ = 2.38, where about 23 per cent of proposals are accepted; in low dimension the optimum accepts more often.
      </figcaption>
    </figure>
  );
}
