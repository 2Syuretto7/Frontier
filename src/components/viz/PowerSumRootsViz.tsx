"use client";

import { useEffect, useState } from "react";
import { makeRng } from "./ml";

const SETS = [
  [1, 2, 3],
  [0, 0, 3],
  [-1, 1, 2],
  [-2, 0.5, 2.5],
];

export function powerSums(x: number[], n: number) {
  return Array.from({ length: n }, (_, k) => x.reduce((a, v) => a + v ** (k + 1), 0));
}

/** Newton's identities: elementary symmetric polynomials e_0..e_n from power sums p_1..p_n. */
export function elementary(p: number[]) {
  const e = [1];
  for (let k = 1; k <= p.length; k++) {
    let s = 0;
    for (let i = 1; i <= k; i++) s += (-1) ** (i - 1) * e[k - i] * p[i - 1];
    e.push(s / k);
  }
  return e;
}

/** The monic polynomial with the set as its roots, rebuilt only from the power sums. */
export function polyFromSums(p: number[]) {
  const e = elementary(p), n = p.length;
  return (t: number) => e.reduce((a, ek, k) => a + (-1) ** k * ek * t ** (n - k), 0);
}

export function PowerSumRootsViz() {
  const [si, setSi] = useState(0);
  const [order, setOrder] = useState<number[]>([0, 1, 2]);
  const [shuffles, setShuffles] = useState(0);
  useEffect(() => {
    if (shuffles === 0) return;
    const u = makeRng(shuffles * 31 + 5), o = [0, 1, 2];
    for (let i = 2; i > 0; i--) {
      const j = Math.floor(u() * (i + 1));
      [o[i], o[j]] = [o[j], o[i]];
    }
    setOrder(o);
  }, [shuffles]);
  const x = order.map((i) => SETS[si][i]);
  const p = powerSums(x, 3), f = polyFromSums(p);
  const W = 300, H = 180, X0 = 10, PW = W - 20, T0 = -3, T1 = 4, YM = 12;
  const sx = (t: number) => X0 + ((t - T0) / (T1 - T0)) * PW, sy = (v: number) => 8 + ((YM - Math.max(-YM, Math.min(YM, v))) / (2 * YM)) * (H - 16);
  const grid = Array.from({ length: 141 }, (_, i) => T0 + (i * (T1 - T0)) / 140);
  const fmt = (v: number) => (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(3));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {SETS.map((s, i) => (
          <button key={i} type="button" className="seg" aria-pressed={i === si} onClick={() => setSi(i)}>{`{${s.join(", ")}}`}</button>
        ))}
        <button type="button" className="seg" onClick={() => setShuffles(shuffles + 1)}>shuffle order</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Polynomial rebuilt from the power sums of a set, with the set's elements as its roots">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        {[-2, 0, 2, 4].map((t) => (
          <g key={t}>
            <line x1={sx(t)} y1={sy(0) - 3} x2={sx(t)} y2={sy(0) + 3} stroke="var(--border)" />
            <text x={sx(t)} y={sy(0) + 14} textAnchor="middle" className="viz-label">{t}</text>
          </g>
        ))}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={grid.map((t) => `${sx(t)},${sy(f(t))}`).join(" ")} />
        {x.map((v, i) => <circle key={i} cx={sx(v)} cy={sy(0)} r={4.5} fill="none" stroke="var(--danger)" strokeWidth={2} />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`input order (${x.join(", ")}); p1 = ${fmt(p[0])}, p2 = ${fmt(p[1])}, p3 = ${fmt(p[2])}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A set of three numbers is summarised by the sums of their first, second and third powers, a sum of the same function
        over the elements and so blind to order. Newton&apos;s identities turn these three numbers into the coefficients of the
        cubic drawn here, whose roots (red circles) are exactly the original elements, repeats included. Shuffling the order
        changes nothing: the summary loses the order and nothing else.
      </figcaption>
    </figure>
  );
}
