"use client";

import { useState } from "react";

type C = [number, number];
const mul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const pow = (a: C, n: number): C => { let r: C = [1, 0]; for (let i = 0; i < n; i++) r = mul(r, a); return r; };
const S3 = Math.sqrt(3);

/** Characteristic functions of three mean-0, variance-1 laws. */
export const LAWS: { label: string; phi: (t: number) => C }[] = [
  { label: "fair ±1", phi: (t) => [Math.cos(t), 0] },
  { label: "uniform on [−√3, √3]", phi: (t) => [Math.abs(t) < 1e-12 ? 1 : Math.sin(S3 * t) / (S3 * t), 0] },
  {
    label: "Exponential(1) − 1",
    phi: (t) => {
      // e^{−it} / (1 − it)
      const d = 1 + t * t;
      return mul([Math.cos(t), -Math.sin(t)], [1 / d, t / d]);
    },
  },
];
export const NS = [1, 2, 4, 16, 64];

export function sumCf(law: number, n: number, t: number): C {
  return pow(LAWS[law].phi(t / Math.sqrt(n)), n);
}

export function gap(law: number, n: number) {
  let g = 0;
  for (let i = 0; i <= 400; i++) {
    const t = -5 + i / 40, z = sumCf(law, n, t);
    g = Math.max(g, Math.hypot(z[0] - Math.exp(-t * t / 2), z[1]));
  }
  return g;
}

export function CfSumViz() {
  const [law, setLaw] = useState(0);
  const [ni, setNi] = useState(1);
  const n = NS[ni];
  const W = 330, H = 150, X0 = 26, PW = 296, Y0 = 8, PH = 124;
  const sx = (t: number) => X0 + ((t + 5) / 10) * PW, sy = (y: number) => Y0 + PH / 2 - y * (PH / 2) * 0.95;
  const ts = Array.from({ length: 401 }, (_, i) => -5 + i / 40);
  const zs = ts.map((t) => sumCf(law, n, t));
  const line = (f: (i: number) => number) => ts.map((t, i) => `${i ? "L" : "M"}${sx(t).toFixed(1)},${sy(f(i)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Law of the steps" style={{ flexWrap: "wrap" }}>
          {LAWS.map((l, i) => (
            <button key={l.label} type="button" className="seg" aria-pressed={law === i} onClick={() => setLaw(i)}>{l.label}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Number of terms n">
          {NS.map((v, i) => (
            <button key={v} type="button" className="seg" aria-pressed={ni === i} onClick={() => setNi(i)}>n = {v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Characteristic function of a standardised sum against the Gaussian">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={sx(0)} x2={sx(0)} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        {[-1, 1].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        {[-5, 0, 5].map((v) => <text key={v} x={sx(v)} y={H - 1} textAnchor={v === 5 ? "end" : v === -5 ? "start" : "middle"} className="viz-label">{v}</text>)}
        <path d={line((i) => Math.exp(-ts[i] * ts[i] / 2))} fill="none" stroke="var(--code-function)" strokeWidth={1.5} strokeDasharray="4 3" />
        <path d={line((i) => zs[i][0])} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {law === 2 && <path d={line((i) => zs[i][1])} fill="none" stroke="var(--text)" strokeWidth={1} strokeOpacity={0.6} />}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        largest |φₙ(t) − e^(−t²/2)| for |t| ≤ 5: {gap(law, n).toFixed(4)}
      </div>
      <figcaption className="viz-caption">
        The characteristic function of (X₁ + ⋯ + Xₙ)/√n is φ(t/√n)ⁿ (solid; the thin curve is its imaginary part for the
        skewed exponential steps), against the Gaussian e^(−t²/2) (dashed). Independence turned the sum into a power, and
        as n grows every one of these laws approaches the Gaussian curve: the central limit theorem, seen through Fourier
        transforms. For ±1 steps the curve returns to ±1 with period π√n, the mark of a law on a lattice; as n grows those
        returns move out of view.
      </figcaption>
    </figure>
  );
}
