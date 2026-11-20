"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

export const N = 400;

export const KINDS = [
  { label: "Pólya fraction", a: 0.4, b: 0.6, lo: 0, hi: 1 },
  { label: "product of 1 ± 0.5", a: 0.5, b: 1.5, lo: 0, hi: 4 },
  { label: "random walk", a: -1, b: 1, lo: -45, hi: 45 },
];

export function path(kind: number, seed: number) {
  const g = rand(seed * 977 + kind * 31);
  const out: number[] = [];
  if (kind === 0) {
    let r = 1, t = 2;
    out.push(0.5);
    for (let i = 0; i < N; i++) { if (g() < r / t) r++; t++; out.push(r / t); }
  } else if (kind === 1) {
    let m = 1;
    out.push(m);
    for (let i = 0; i < N; i++) { m *= g() < 0.5 ? 1.5 : 0.5; out.push(m); }
  } else {
    let s = 0;
    out.push(s);
    for (let i = 0; i < N; i++) { s += g() < 0.5 ? 1 : -1; out.push(s); }
  }
  return out;
}

/** Times at which upcrossings of [a, b] are completed. */
export function upcrossTimes(p: number[], a: number, b: number) {
  const ts: number[] = [];
  let below = false;
  p.forEach((x, t) => {
    if (x <= a) below = true;
    else if (x >= b && below) { ts.push(t); below = false; }
  });
  return ts;
}

export function UpcrossViz() {
  const [kind, setKind] = useState(0);
  const [seed, setSeed] = useState(1);
  const K = KINDS[kind];
  const p = path(kind, seed);
  const ups = upcrossTimes(p, K.a, K.b);
  const W = 330, H = 150, X0 = 30, PW = 292, Y0 = 8, PH = 124;
  const sx = (t: number) => X0 + (t / N) * PW, sy = (y: number) => Y0 + PH - ((Math.max(K.lo, Math.min(K.hi, y)) - K.lo) / (K.hi - K.lo)) * PH;
  const d = p.map((y, t) => `${t ? "L" : "M"}${sx(t).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Martingale" style={{ flexWrap: "wrap" }}>
          {KINDS.map((k, i) => (
            <button key={k.label} type="button" className="seg" aria-pressed={kind === i} onClick={() => setKind(i)}>{k.label}</button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setSeed((s) => (s % 9) + 1)}>New path</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A martingale path with a band and its completed upcrossings marked">
        <rect x={X0} y={sy(K.b)} width={PW} height={sy(K.a) - sy(K.b)} fill="var(--code-function)" opacity={0.15} />
        <line x1={X0} x2={X0 + PW} y1={sy(K.lo)} y2={sy(K.lo)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={sy(K.lo)} stroke="var(--border)" />
        {[K.lo, K.a, K.b, K.hi].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={1.3} />
        {ups.map((t) => <circle key={t} cx={sx(t)} cy={sy(p[t])} r={2.6} fill="var(--code-function)" />)}
        <text x={X0 + PW} y={H - 2} textAnchor="end" className="viz-label">n = {N}</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        upcrossings of [{K.a}, {K.b}]: {ups.length}; value at n = {N}: {p[N] < 1e-3 && p[N] > 0 ? p[N].toExponential(1) : p[N].toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Each dot marks a completed upcrossing of the shaded band. The Pólya fraction is bounded, crosses a few times and
        settles. The product of independent factors 1.5 and 0.5 has mean 1 at every n, yet it collapses to 0: it converges
        almost surely but not in mean. The random walk is not bounded in L¹, keeps crossing, and never converges. Doob&apos;s
        upcrossing inequality is what separates the first two from the third.
      </figcaption>
    </figure>
  );
}
