"use client";

import { useState } from "react";

const EPS = [0.3, 1, 1.9, 2.05];
const STEPS = 40;

/** Leapfrog orbit for the harmonic oscillator H = (x² + p²)/2 started at (1, 0). */
export function orbit(eps: number, steps: number) {
  let x = 1, p = 0;
  const pts: [number, number][] = [[x, p]];
  for (let i = 0; i < steps; i++) {
    p -= 0.5 * eps * x; x += eps * p; p -= 0.5 * eps * x;
    pts.push([x, p]);
  }
  return pts;
}

export const maxEnergyError = (pts: [number, number][]) => Math.max(...pts.map(([x, p]) => Math.abs(0.5 * (x * x + p * p) - 0.5)));

export function LeapfrogViz() {
  const [eps, setEps] = useState(1);
  const pts = orbit(eps, STEPS);
  const err = maxEnergyError(pts), stable = eps < 2;
  const S = 220, R = 1.6, c = S / 2;
  const sp = (v: number) => c + (Math.max(-R, Math.min(R, v)) / R) * (c - 6);
  const sq = (v: number) => c - (Math.max(-R, Math.min(R, v)) / R) * (c - 6);
  const k = Math.sqrt(Math.max(0, 1 - (eps * eps) / 4));
  const shadow = Array.from({ length: 73 }, (_, i) => {
    const t = (2 * Math.PI * i) / 72;
    return `${sp(Math.cos(t))},${sq(k * Math.sin(t))}`;
  }).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {EPS.map((e) => (
          <button key={e} type="button" className="seg" aria-pressed={e === eps} onClick={() => setEps(e)}>ε = {e}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="Leapfrog orbit in phase space for a harmonic oscillator">
        <line x1={0} y1={c} x2={S} y2={c} stroke="var(--border)" />
        <line x1={c} y1={0} x2={c} y2={S} stroke="var(--border)" />
        <circle cx={c} cy={c} r={(1 / R) * (c - 6)} fill="none" stroke="var(--text-muted)" strokeDasharray="3 3" />
        {stable && <polygon points={shadow} fill="none" stroke="var(--accent)" strokeWidth={1} opacity={0.5} />}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1} opacity={0.4} points={pts.map(([x, p]) => `${sp(x)},${sq(p)}`).join(" ")} />
        {pts.map(([x, p], i) => (
          <circle key={i} cx={sp(x)} cy={sq(p)} r={2.5} fill={i === 0 ? "var(--danger)" : "var(--accent)"} />
        ))}
        <text x={S - 4} y={c - 4} textAnchor="end" className="viz-label">x</text>
        <text x={c + 4} y={12} className="viz-label">p</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {stable
          ? `largest energy error in ${STEPS} steps: ${err.toFixed(3)} (bound ε²/8 = ${((eps * eps) / 8).toFixed(3)})`
          : `unstable: energy error after ${STEPS} steps is ${err.toExponential(1)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Forty leapfrog steps of size ε for the oscillator H = (x² + p²)/2, started at the red point. The exact flow runs round
        the dashed unit circle. Leapfrog instead stays exactly on a nearby ellipse, the level set of a shadow Hamiltonian, so
        its energy error oscillates but never accumulates. Past ε = 2 the map stops being a rotation and the orbit flies off.
      </figcaption>
    </figure>
  );
}
