"use client";

import { useState } from "react";

export const NS = [4, 16, 64, 256];
export const CASES = ["n fair ±1 steps", "plus one step ±2√n", "n rare jumps"];

type Law = Map<number, number>;

/** Integer-valued laws of the n-th row: values on an integer lattice, with the scale that maps them to real values. */
function row(c: number, n: number): { laws: Law[]; scale: number } {
  const coin: Law = new Map([[-1, 0.5], [1, 0.5]]);
  if (c === 0) return { laws: Array(n).fill(coin), scale: 1 };
  if (c === 1) { const m = 2 * Math.round(Math.sqrt(n)); return { laws: [...Array(n).fill(coin), new Map([[-m, 0.5], [m, 0.5]])], scale: 1 }; }
  // Bernoulli(1/n) − 1/n, kept on the integers by working with n·X = n·B − 1.
  return { laws: Array(n).fill(new Map([[n - 1, 1 / n], [-1, 1 - 1 / n]])), scale: 1 / n };
}

function erf(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));

export function analyse(c: number, n: number) {
  const { laws, scale } = row(c, n);
  let dist: Law = new Map([[0, 1]]);
  for (const L of laws) {
    const nd: Law = new Map();
    dist.forEach((p, s) => L.forEach((q, x) => nd.set(s + x, (nd.get(s + x) ?? 0) + p * q)));
    dist = nd;
  }
  const vars = laws.map((L) => { let v = 0; L.forEach((p, x) => (v += p * (x * scale) ** 2)); return v; });
  const s2 = vars.reduce((a, b) => a + b, 0), s = Math.sqrt(s2);
  let lind = 0;
  laws.forEach((L) => L.forEach((p, x) => { if (Math.abs(x * scale) > 0.5 * s) lind += (p * (x * scale) ** 2) / s2; }));
  const pts = [...dist.entries()].map(([x, p]) => [(x * scale) / s, p] as [number, number]).sort((a, b) => a[0] - b[0]);
  let F = 0, ks = 0;
  for (const [z, p] of pts) { ks = Math.max(ks, Math.abs(F - Phi(z))); F += p; ks = Math.max(ks, Math.abs(F - Phi(z))); }
  return { pts, lind, share: Math.max(...vars) / s2, ks };
}

export function LindebergViz() {
  const [c, setC] = useState(0);
  const [ni, setNi] = useState(1);
  const r = analyse(c, NS[ni]);
  const W = 330, H = 150, X0 = 10, PW = 310, Y0 = 8, PH = 124, ZR = 4;
  const sx = (z: number) => X0 + ((z + ZR) / (2 * ZR)) * PW, sy = (y: number) => Y0 + PH - (y / 0.65) * PH;
  const gap = r.pts.length > 1 ? Math.min(...r.pts.slice(1).map(([z], i) => z - r.pts[i][0]).filter((d) => d > 1e-9)) : 1;
  const dens = Array.from({ length: 201 }, (_, i) => -ZR + (2 * ZR * i) / 200).map((z, i) => `${i ? "L" : "M"}${sx(z).toFixed(1)},${sy(Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Triangular array" style={{ flexWrap: "wrap" }}>
          {CASES.map((l, i) => (
            <button key={l} type="button" className="seg" aria-pressed={c === i} onClick={() => setC(i)}>{l}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Row n">
          {NS.map((v, i) => (
            <button key={v} type="button" className="seg" aria-pressed={ni === i} onClick={() => setNi(i)}>n = {v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Exact law of the standardised row sum against the normal density">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        {r.pts.filter(([z]) => Math.abs(z) <= ZR).map(([z, p]) => {
          const h = Math.min(0.65, p / gap);
          return <rect key={z} x={sx(z) - Math.max(0.6, (gap / (2 * ZR)) * PW * 0.35)} y={sy(h)} width={Math.max(1.2, (gap / (2 * ZR)) * PW * 0.7)} height={sy(0) - sy(h)} fill="var(--accent)" />;
        })}
        <path d={dens} fill="none" stroke="var(--code-function)" strokeWidth={1.5} strokeDasharray="4 3" />
        {[-3, 0, 3].map((v) => <text key={v} x={sx(v)} y={H - 1} textAnchor="middle" className="viz-label">{v}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        Lindeberg sum at ε = 0.5: {r.lind.toFixed(3)}; largest variance share {r.share.toFixed(3)}; distance to Φ {r.ks.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        The exact law of the standardised row sum Sₙ/sₙ (bars, height = probability per unit length) against the normal
        density (dashed). With equal small steps the Lindeberg sum is 0 from n = 4 on and the law approaches the normal.
        One step of size 2√n keeps four fifths of the variance in a single term: the limit is a two-humped mixture of
        normals. Rare jumps of size about 1 put all the variance in big values: the limit is a centred Poisson law, not a
        normal one.
      </figcaption>
    </figure>
  );
}
