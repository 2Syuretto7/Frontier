"use client";

import { useMemo, useState } from "react";
import { countBelow, tridiagonal } from "./SemicircleViz";

const N = 100, DS = Array.from({ length: 20 }, (_, i) => 5 * (i + 1));

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Largest and smallest singular values of an N by d random matrix, for each d in DS. */
export function simulate(signs: boolean) {
  const r = rand(signs ? 77 : 78);
  const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return DS.map((d) => {
    const A = Array.from({ length: N }, () => Array.from({ length: d }, () => (signs ? (r() < 0.5 ? -1 : 1) : g())));
    const G = Array.from({ length: d }, (_, i) => Array.from({ length: d }, (_, j) => { let s = 0; for (let k = 0; k < N; k++) s += A[k][i] * A[k][j]; return s; }));
    const { d: dg, e } = tridiagonal(G);
    const find = (target: number) => {
      // smallest x with at least target eigenvalues below it
      let lo = -1, hi = 4 * N * 4 + 10;
      for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2; if (countBelow(dg, e, m) >= target) hi = m; else lo = m; }
      return Math.sqrt(Math.max(0, (lo + hi) / 2));
    };
    return { d, smax: find(d), smin: find(1) };
  });
}

export function SingularEdgesViz() {
  const [signs, setSigns] = useState(false);
  const rows = useMemo(() => simulate(signs), [signs]);
  const W = 330, H = 180, X0 = 30, Y0 = 8, PW = W - 40, PH = H - Y0 - 32, YMAX = 22;
  const sx = (d: number) => X0 + (d / 100) * PW;
  const sy = (v: number) => Y0 + PH - (v / YMAX) * PH;
  const curve = (f: (d: number) => number) => Array.from({ length: 101 }, (_, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(f(i)).toFixed(1)}`).join(" ");
  const last = rows[rows.length - 1], mid = rows[9];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">entries</span>
        <div className="segmented" role="group" aria-label="Entry distribution">
          <button type="button" className="seg" aria-pressed={!signs} onClick={() => setSigns(false)}>Gaussian</button>
          <button type="button" className="seg" aria-pressed={signs} onClick={() => setSigns(true)}>signs</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Largest and smallest singular values against the number of columns">
        <path d={curve((d) => 10 + Math.sqrt(d))} fill="none" stroke="var(--danger)" strokeWidth={1.5} />
        <path d={curve((d) => 10 - Math.sqrt(d))} fill="none" stroke="var(--danger)" strokeWidth={1.5} />
        {rows.map((p) => (
          <g key={p.d}>
            <circle cx={sx(p.d)} cy={sy(p.smax)} r={2.5} fill="var(--accent)" />
            <circle cx={sx(p.d)} cy={sy(p.smin)} r={2.5} fill="var(--accent)" />
          </g>
        ))}
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        {[0, 25, 50, 75, 100].map((v) => <text key={v} x={sx(v)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{v}</text>)}
        {[0, 10, 20].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">columns d (rows n = 100)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`d = 50: s_max ${mid.smax.toFixed(2)}, s_min ${mid.smin.toFixed(2)} (predicted ${(10 + Math.sqrt(50)).toFixed(2)}, ${(10 - Math.sqrt(50)).toFixed(2)}); d = 100: s_min ${last.smin.toFixed(2)}`}
      </div>
      <figcaption className="viz-caption">
        Largest and smallest singular values of one random 100 × d matrix for each d, against √n + √d and √n − √d (red).
        The largest hugs its curve, sometimes slightly above it: Gordon&apos;s bound is for the expectation,
        and the fluctuations around it are of order 1. The smallest follows its curve down and
        collapses for square matrices, where √n − √d = 0: a square random matrix is nearly singular, and a tall one is
        well conditioned. Signs and Gaussians behave alike.
      </figcaption>
    </figure>
  );
}
