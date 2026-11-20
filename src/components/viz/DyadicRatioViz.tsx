"use client";

import { useState } from "react";

const TAU = 2 * Math.PI;
/** Density f(x) = 1 + 0.8 sin(2πx) on [0, 1] and its distribution function. */
export const f = (x: number) => 1 + 0.8 * Math.sin(TAU * x);
const Fc = (x: number) => x + (0.8 * (1 - Math.cos(TAU * x))) / TAU;
export const ATOM = 0.7, AW = 0.2;

/** Mass of [0, x) under ν = f·λ, or under 0.8 f·λ + 0.2 δ_0.7 with the atom. */
export function nuBelow(atom: boolean) {
  return (x: number) => (atom ? (1 - AW) * Fc(x) + (x > ATOM ? AW : 0) : Fc(x));
}

/** ν(B)/λ(B) on the half-open dyadic cells of level k (the last cell includes 1, which carries no mass). */
export function ratios(atom: boolean, k: number) {
  const n = 2 ** k, F = nuBelow(atom);
  return Array.from({ length: n }, (_, j) => (F((j + 1) / n) - F(j / n)) * n);
}

export function gap(atom: boolean, k: number) {
  const r = ratios(atom, k), n = r.length, m = 4096 / n;
  let g = 0;
  const w = atom ? 1 - AW : 1;
  r.forEach((v, j) => {
    for (let i = 0; i < m; i++) g += Math.abs(v - w * f((j + (i + 0.5) / m) / n)) / (n * m);
  });
  return g;
}

export function DyadicRatioViz() {
  const [k, setK] = useState(3);
  const [atom, setAtom] = useState(false);
  const r = ratios(atom, k), n = r.length;
  const atomCell = Math.floor(ATOM * n);
  const W = 330, H = 150, X0 = 26, PW = 296, Y0 = 8, PH = 124, TOP = 2.2;
  const sx = (x: number) => X0 + x * PW, sy = (y: number) => Y0 + PH - (Math.min(y, TOP) / TOP) * PH;
  const w = atom ? 1 - AW : 1;
  const fd = Array.from({ length: 301 }, (_, i) => i / 300).map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(w * f(x)).toFixed(1)}`).join(" ");
  const step = r.map((v, j) => `${j ? "L" : "M"}${sx(j / n).toFixed(1)},${sy(v).toFixed(1)} L${sx((j + 1) / n).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          level k = {k}
          <input type="range" min={0} max={9} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="Dyadic level" />
        </label>
        <button type="button" className="btn" aria-pressed={atom} onClick={() => setAtom((a) => !a)}>
          {atom ? "Remove atom" : "Add atom at 0.7"}
        </button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Ratios of nu to length on dyadic cells, approaching the density">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={sy(0)} stroke="var(--border)" />
        {[0, 1, 2].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        {[0, 0.5, 1].map((v) => <text key={v} x={sx(v)} y={H - 2} textAnchor={v === 1 ? "end" : "middle"} className="viz-label">{v}</text>)}
        <path d={fd} fill="none" stroke="var(--code-function)" strokeWidth={1.5} strokeDasharray="4 3" />
        <path d={step} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {atom && r[atomCell] > TOP && <text x={sx((atomCell + 0.5) / n)} y={Y0 + 8} textAnchor="middle" className="viz-label">↑</text>}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {n} cells; ratio on the cell holding 0.7 = {r[atomCell].toFixed(3)}; ∫|ratio − density| = {gap(atom, k).toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        The solid steps are ν(B)/λ(B) on the dyadic cells B of level k; the dashed curve is the density 1 + 0.8 sin 2πx. As
        the cells shrink, the ratios converge to the density and the L¹ gap goes to 0. Add an atom of weight 0.2 at 0.7
        (the rest of ν scaled to 0.8): the ratio on its cell grows like 0.2·2ᵏ, the singular part showing itself, while
        everywhere else the ratios still find the density of the absolutely continuous part, and the gap settles at 0.2.
      </figcaption>
    </figure>
  );
}
