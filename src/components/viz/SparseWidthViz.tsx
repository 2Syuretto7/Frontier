"use client";

import { useMemo, useState } from "react";

const DS = [100, 1000, 10000], TRIALS = 120;

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

/** Squared Gaussian width of the s-sparse unit vectors in dimension d, for s = 1..d, by Monte Carlo over TRIALS draws. */
export function simulate(d: number) {
  const r = rand(91 + d);
  const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const width = new Float64Array(d + 1);
  for (let k = 0; k < TRIALS; k++) {
    const sq = Float64Array.from({ length: d }, () => { const x = g(); return x * x; }).sort().reverse();
    let acc = 0;
    for (let s = 1; s <= d; s++) { acc += sq[s - 1]; width[s] += Math.sqrt(acc) / TRIALS; }
  }
  return Array.from(width, (w) => w * w);
}

export function SparseWidthViz() {
  const [d, setD] = useState(1000);
  const [s, setS] = useState(10);
  const w2 = useMemo(() => simulate(d), [d]);
  const sMax = Math.min(d, 100), sc = Math.min(s, sMax);
  const approx = (k: number) => 2 * k * Math.log((Math.E * d) / k);
  const W = 330, H = 180, X0 = 34, Y0 = 8, PW = W - 44, PH = H - Y0 - 32;
  const YMAX = Math.min(d, approx(sMax)) * 1.05;
  const sx = (k: number) => X0 + (k / sMax) * PW;
  const sy = (v: number) => Y0 + PH - (Math.min(v, YMAX) / YMAX) * PH;
  const line = (f: (k: number) => number) => Array.from({ length: sMax }, (_, i) => `${i ? "L" : "M"}${sx(i + 1).toFixed(1)},${sy(f(i + 1)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">dimension d</span>
        <div className="segmented" role="group" aria-label="Dimension">
          {DS.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={d === v} onClick={() => setD(v)}>{v}</button>
          ))}
        </div>
        <label className="viz-label" htmlFor="sw-s">sparsity s = {sc}</label>
        <input id="sw-s" type="range" min={1} max={sMax} step={1} value={sc} onChange={(e) => setS(Number(e.target.value))} style={{ flex: 1, minWidth: 100 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Squared Gaussian width of sparse unit vectors against sparsity">
        <path d={line(approx)} fill="none" stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4 3" />
        <path d={line((k) => k)} fill="none" stroke="var(--text-muted)" strokeWidth={1.2} />
        <path d={line((k) => w2[k])} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <circle cx={sx(sc)} cy={sy(w2[sc])} r={4} fill="var(--accent)" />
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        {[1, Math.round(sMax / 2), sMax].map((v) => <text key={v} x={sx(v)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{v}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">sparsity s</text>
        <text x={X0 - 4} y={Y0 + 10} textAnchor="end" className="viz-label">{Math.round(YMAX)}</text>
        <text x={X0 - 4} y={Y0 + PH} textAnchor="end" className="viz-label">0</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`s = ${sc}: w² = ${w2[sc].toFixed(1)}; 2s log(ed/s) = ${approx(sc).toFixed(1)}; s = ${sc}; d = ${d}`}
      </div>
      <figcaption className="viz-caption">
        The squared Gaussian width of the set of s-sparse unit vectors in dimension d (blue, by simulation), against s
        itself (grey), the width of an s-dimensional subspace, and the formula 2s log(ed/s) (red, dashed). Unless s is close to d, the
        width sits between the two: sparse vectors in unknown positions cost a logarithmic factor more than a known s-dimensional
        subspace, and far less than the whole space, whose squared width is d. Tenfold more dimensions add only a few
        units of width.
      </figcaption>
    </figure>
  );
}
