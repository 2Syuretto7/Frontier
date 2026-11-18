"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const RHOS = [0, 0.5, 0.9, 0.99];
const STEPS = 40;

/** The first coordinate-wise moves of a Gibbs sampler on a standard bivariate normal with correlation rho. */
export function zigzag(rho: number, steps: number, seed: number) {
  const z = makeNormal(makeRng(seed)), s = Math.sqrt(1 - rho * rho);
  let x = 2.2, y = -2.2;
  const pts: [number, number][] = [[x, y]];
  for (let i = 0; i < steps; i++) {
    x = rho * y + s * z(); pts.push([x, y]);
    y = rho * x + s * z(); pts.push([x, y]);
  }
  return pts;
}

export const gibbsTau = (rho: number) => (1 + rho * rho) / (1 - rho * rho);

export function GibbsZigzagViz() {
  const [rho, setRho] = useState(0.9);
  const [seed, setSeed] = useState(1);
  const [pts, setPts] = useState<[number, number][] | null>(null);
  useEffect(() => setPts(zigzag(rho, STEPS, seed)), [rho, seed]);
  const S = 220, R = 3.2;
  const p = (v: number) => S / 2 + (v / R) * (S / 2 - 6), q = (v: number) => S / 2 - (v / R) * (S / 2 - 6);
  const a = Math.sqrt(1 + rho), b = Math.sqrt(1 - rho);
  const ell = Array.from({ length: 73 }, (_, i) => {
    const t = (2 * Math.PI * i) / 72, u = 2 * a * Math.cos(t), v = 2 * b * Math.sin(t);
    return `${p((u - v) / Math.SQRT2)},${q((u + v) / Math.SQRT2)}`;
  }).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {RHOS.map((r) => (
          <button key={r} type="button" className="seg" aria-pressed={r === rho} onClick={() => setRho(r)}>ρ = {r}</button>
        ))}
        <button type="button" className="seg" onClick={() => setSeed((s) => s + 1)}>new path</button>
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="Path of a Gibbs sampler on a correlated bivariate normal">
        <line x1={0} y1={q(0)} x2={S} y2={q(0)} stroke="var(--border)" />
        <line x1={p(0)} y1={0} x2={p(0)} y2={S} stroke="var(--border)" />
        <polygon points={ell} fill="none" stroke="var(--text-muted)" strokeDasharray="3 3" />
        {pts && <polyline fill="none" stroke="var(--accent)" strokeWidth={1.5} points={pts.map(([x, y]) => `${p(x)},${q(y)}`).join(" ")} />}
        {pts && <circle cx={p(pts[0][0])} cy={q(pts[0][1])} r={4} fill="var(--danger)" />}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        lag-one autocorrelation of x: ρ² = {(rho * rho).toFixed(3)}; τ = {gibbsTau(rho).toFixed(1)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Forty sweeps of Gibbs sampling, each a horizontal move drawing x given y and a vertical move drawing y given x, started
        at the red point. The dashed ellipse holds about 86 per cent of the mass. With strong correlation the conditionals are
        narrow slices across a long diagonal ridge, so the sampler can only take small steps along it, and the integrated
        autocorrelation time τ grows like 1/(1 − ρ²).
      </figcaption>
    </figure>
  );
}
