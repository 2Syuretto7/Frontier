"use client";

import { useState } from "react";

type Cx = [number, number];
const mul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const abs = (a: Cx) => Math.hypot(a[0], a[1]);

const METHODS: { name: string; amp: (z: Cx) => number }[] = [
  { name: "Euler", amp: (z) => abs([1 + z[0], z[1]]) },
  {
    name: "RK4",
    amp: (z) => {
      let term: Cx = [1, 0], sum: Cx = [1, 0];
      for (let k = 1; k <= 4; k++) { term = mul(term, z); term = [term[0] / k, term[1] / k]; sum = [sum[0] + term[0], sum[1] + term[1]]; }
      return abs(sum);
    },
  },
  { name: "trapezoid", amp: (z) => abs([1 + z[0] / 2, z[1] / 2]) / abs([1 - z[0] / 2, -z[1] / 2]) },
  { name: "backward Euler", amp: (z) => 1 / abs([1 - z[0], -z[1]]) },
];
const LAMBDAS = [-1, -1000];
const XL = -8, XR = 3, YB = -4, YT = 4, CELL = 0.2;

/** Regions of absolute stability |R(z)| ≤ 1 for four methods, with hλ for the stiff eigenvalues −1 and −1000. */
export function StabRegionViz() {
  const [mi, setMi] = useState(0);
  const [lh, setLh] = useState(-3);
  const h = 10 ** lh;
  const m = METHODS[mi];
  const W = 330, H = 250;
  const sx = (W - 20) / (XR - XL), sy = 200 / (YT - YB);
  const PX = (x: number) => 10 + (x - XL) * sx;
  const PY = (y: number) => 10 + (YT - y) * sy;
  const cells: Cx[] = [];
  for (let x = XL; x < XR - 1e-9; x += CELL) for (let y = YB; y < YT - 1e-9; y += CELL) {
    if (m.amp([x + CELL / 2, y + CELL / 2]) <= 1) cells.push([x, y]);
  }
  const zs = LAMBDAS.map((l) => h * l);
  const stable = zs.every((z) => m.amp([z, 0]) <= 1);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {METHODS.map((q, i) => (
          <button key={q.name} type="button" className="seg" aria-pressed={i === mi} onClick={() => setMi(i)}>{q.name}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          h = {h.toPrecision(2)}
          <input type="range" min={-4} max={0} step={0.1} value={lh} onChange={(e) => setLh(Number(e.target.value))} aria-label="log step size" style={{ width: 120 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Stability region in the complex plane with the scaled eigenvalues">
        {cells.map(([x, y], i) => (
          <rect key={i} x={PX(x)} y={PY(y + CELL)} width={CELL * sx + 0.3} height={CELL * sy + 0.3} fill="var(--accent)" opacity={0.25} />
        ))}
        <line x1={PX(XL)} x2={PX(XR)} y1={PY(0)} y2={PY(0)} stroke="var(--border)" />
        <line x1={PX(0)} x2={PX(0)} y1={PY(YT)} y2={PY(YB)} stroke="var(--border)" />
        {[-8, -6, -4, -2, 2].map((t) => (
          <text key={t} x={PX(t)} y={PY(0) + 12} textAnchor="middle" className="viz-label">{t}</text>
        ))}
        {zs.map((z, i) => {
          const off = z < XL;
          const cx = off ? PX(XL) + 6 : PX(z);
          return (
            <g key={i}>
              <circle cx={cx} cy={PY(0)} r={4.5} fill={m.amp([z, 0]) <= 1 ? "var(--accent)" : "var(--danger)"} />
              <text x={cx + (off ? 8 : 0)} y={PY(0) - 9} textAnchor={off ? "start" : "middle"} className="viz-label">
                {off ? `← hλ = ${z.toFixed(0)}` : `hλ${i + 1}`}
              </text>
            </g>
          );
        })}
        <text x={10} y={H - 22} className="viz-label">shaded: |R(z)| ≤ 1 for {m.name}</text>
        <text x={10} y={H - 6} className="viz-label">hλ for λ = −1 and λ = −1000</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {m.name}: |R(−1000h)| = {m.amp([-1000 * h, 0]).toPrecision(3)}, {stable ? "stable" : "unstable"}; steps to reach t = 1: {Math.ceil(1 / h - 1e-9)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded set is where the method&apos;s one-step factor R(z) has modulus at most 1. A step size h is stable for
        x′ = Ax when hλ lies in it for every eigenvalue λ. Euler&apos;s region is the disk around −1 of radius 1 and
        RK4&apos;s reaches about −2.79, so both need h below roughly 0.002 or 0.0028 because of λ = −1000, even though
        that component has died out after t = 0.01. The trapezoid rule is stable on the whole left half-plane and backward
        Euler on even more, so h can be chosen for accuracy on the slow component alone.
      </figcaption>
    </figure>
  );
}
