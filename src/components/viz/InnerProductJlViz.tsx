"use client";

import { useMemo, useState } from "react";

const N = 40, D = 500, KS = [10, 30, 100, 300, 1000];

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

function gaussFrom(r: () => number) {
  return () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
}

/** N unit vectors in dimension D whose inner products spread over [-1, 1]. */
function points() {
  const g = gaussFrom(rand(7));
  const c1 = Array.from({ length: D }, g), c2 = Array.from({ length: D }, g);
  const unit = (v: number[]) => { const n = Math.sqrt(v.reduce((a, b) => a + b * b, 0)); return v.map((x) => x / n); };
  const u1 = unit(c1), u2 = unit(c2);
  const u = rand(8);
  return Array.from({ length: N }, () => {
    const a = 2 * u() - 1, b = 2 * u() - 1;
    return unit(Array.from({ length: D }, (_, j) => a * u1[j] + b * u2[j] + (0.5 * g()) / Math.sqrt(D)));
  });
}

const dot = (x: number[], y: number[]) => x.reduce((s, v, i) => s + v * y[i], 0);

/** Pairs of (true, projected) inner products under a Gaussian map to k dimensions with entries of variance 1/k. */
export function simulate(k: number) {
  const X = points();
  const g = gaussFrom(rand(100 + k));
  const S = Array.from({ length: k }, () => Array.from({ length: D }, () => g() / Math.sqrt(k)));
  const Y = X.map((x) => S.map((row) => dot(row, x)));
  const pairs: [number, number][] = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) pairs.push([dot(X[i], X[j]), dot(Y[i], Y[j])]);
  const errs = pairs.map(([a, b]) => b - a);
  const sd = Math.sqrt(errs.reduce((s, e) => s + e * e, 0) / errs.length);
  const worst = Math.max(...errs.map(Math.abs));
  return { pairs, sd, worst };
}

export function InnerProductJlViz() {
  const [k, setK] = useState(100);
  const { pairs, sd, worst } = useMemo(() => simulate(k), [k]);
  const S = 220, P = 24, L = 1.6;
  const sc = (v: number) => P + ((v + L) / (2 * L)) * (S - 2 * P);
  const sy = (v: number) => S - sc(v);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">target dimension k</span>
        <div className="segmented" role="group" aria-label="Target dimension">
          {KS.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={k === v} onClick={() => setK(v)}>{v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="Scatter of projected inner products against true inner products">
        <rect x={P} y={P} width={S - 2 * P} height={S - 2 * P} fill="none" stroke="var(--border)" />
        <line x1={sc(-1)} y1={sy(-1)} x2={sc(1)} y2={sy(1)} stroke="var(--danger)" strokeWidth={1} />
        {pairs.map(([a, b], i) => (
          <circle key={i} cx={sc(a)} cy={sy(Math.max(-L, Math.min(L, b)))} r={1.6} fill="var(--accent)" opacity={0.6} />
        ))}
        {[-1, 0, 1].map((v) => (
          <g key={v}>
            <text x={sc(v)} y={S - P + 14} textAnchor="middle" className="viz-label">{v}</text>
            <text x={P - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        <text x={S / 2} y={S - 2} textAnchor="middle" className="viz-label">⟨x, y⟩</text>
        <text x={P} y={P - 8} className="viz-label">⟨Sx, Sy⟩</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`k = ${k}: error sd ${sd.toFixed(3)}, largest error ${worst.toFixed(3)}; 1/√k = ${(1 / Math.sqrt(k)).toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        Forty unit vectors in 500 dimensions, with inner products ranging over most of [−1, 1], are mapped to k dimensions by
        a Gaussian matrix with entries of variance 1/k. Each dot is one of the 780 pairs: its true inner product across,
        its inner product after projection up. The dots scatter about the diagonal (red) with errors of typical size
        about 1/√k: for a single pair of unit vectors the error has variance (1 + ⟨x, y⟩²)/k. The original dimension plays
        no part.
      </figcaption>
    </figure>
  );
}
