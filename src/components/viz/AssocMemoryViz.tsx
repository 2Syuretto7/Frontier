"use client";

import { useEffect, useState } from "react";

const DS = [32, 64, 128];
const RATIOS = [0.25, 0.5, 1, 2, 4, 8, 16];
const M = 32, QUERIES = 128;
const COLORS = ["var(--danger)", "var(--accent)", "var(--success)"];

function gaussian(seed: number) {
  let a = seed >>> 0;
  const uni = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(1 - uni())) * Math.cos(2 * Math.PI * uni());
}

function unitRows(g: () => number, n: number, d: number) {
  const A = new Float64Array(n * d);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let k = 0; k < d; k++) { const v = g(); A[i * d + k] = v; s += v * v; }
    s = Math.sqrt(s);
    for (let k = 0; k < d; k++) A[i * d + k] /= s;
  }
  return A;
}

/** n facts with random unit keys, each mapped to one of M attribute vectors, stored as W = Σ v k^T; recall by nearest attribute. */
export function recallAccuracy(n: number, d: number, seed: number) {
  const g = gaussian(seed);
  const K = unitRows(g, n, d), U = unitRows(g, M, d);
  const lab = Array.from({ length: n }, (_, i) => Math.floor(Math.abs(Math.sin(i * 12.9898 + seed) * 43758.5453) % 1 * M));
  let correct = 0;
  const q = Math.min(QUERIES, n);
  for (let j = 0; j < q; j++) {
    const o = new Float64Array(d);
    for (let i = 0; i < n; i++) {
      let dot = 0;
      for (let k = 0; k < d; k++) dot += K[i * d + k] * K[j * d + k];
      const u = lab[i] * d;
      for (let k = 0; k < d; k++) o[k] += dot * U[u + k];
    }
    let best = -1, bs = -Infinity;
    for (let c = 0; c < M; c++) {
      let s = 0;
      for (let k = 0; k < d; k++) s += o[k] * U[c * d + k];
      if (s > bs) { bs = s; best = c; }
    }
    correct += best === lab[j] ? 1 : 0;
  }
  return correct / q;
}

export function AssocMemoryViz() {
  const [acc, setAcc] = useState<number[][] | null>(null);
  const [ri, setRi] = useState(3);
  useEffect(() => {
    const id = setTimeout(() => setAcc(DS.map((d) => RATIOS.map((r) => recallAccuracy(Math.round(r * d), d, 7)))), 0);
    return () => clearTimeout(id);
  }, []);
  const W = 320, H = 190, X0 = 34, Y0 = 10, PW = W - X0 - 10, PH = H - Y0 - 30;
  const sx = (i: number) => X0 + (i / (RATIOS.length - 1)) * PW;
  const sy = (v: number) => Y0 + PH - v * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">facts per dimension n/d</span>
        {RATIOS.map((r, i) => (
          <button key={r} type="button" className="seg" aria-pressed={ri === i} onClick={() => setRi(i)}>{r}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Recall accuracy of a linear associative memory against the number of stored facts">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={W - 10} y1={sy(v)} y2={sy(v)} stroke="var(--border)" />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {RATIOS.map((r, i) => (
          <text key={r} x={sx(i)} y={H - 10} textAnchor="middle" className="viz-label">{r}</text>
        ))}
        <line x1={X0} x2={W - 10} y1={sy(1 / M)} y2={sy(1 / M)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        {acc && acc.map((row, k) => (
          <path key={k} d={row.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ")} fill="none" stroke={COLORS[k]} strokeWidth={2} />
        ))}
        <line x1={sx(ri)} x2={sx(ri)} y1={Y0} y2={Y0 + PH} stroke="var(--text-muted)" strokeDasharray="3 3" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {acc ? DS.map((d, k) => `d = ${d}: ${(100 * acc[k][ri]).toFixed(0)}%`).join(", ") + `; relative crosstalk ≈ (n − 1)/d ≈ ${RATIOS[ri]}` : "computing…"}
      </div>
      <figcaption className="viz-caption">
        Facts stored in one matrix, as an MLP stores associations: each subject has a random key, each fact adds the outer
        product of its attribute vector (one of 32) with that key, and recall reads W k and picks the closest attribute.
        Red, blue and green are widths 32, 64 and 128; the dashed line is guessing. Recall is perfect up to half the
        dimension and above 90% at n = d; beyond that, interference between keys grows like n/d and recall falls, somewhat
        more slowly for wider matrices.
      </figcaption>
    </figure>
  );
}
