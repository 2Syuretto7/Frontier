"use client";

import { useMemo, useState } from "react";

const TRIALS = 2000, DIMS = [1, 2, 5, 20, 100, 500];

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

/** Norms of TRIALS standard Gaussian vectors in dimension d, with their mean and standard deviation. */
export function simulate(d: number) {
  const r = rand(31 + d);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const ns: number[] = [];
  for (let k = 0; k < TRIALS; k++) {
    let s = 0;
    for (let i = 0; i < d; i++) { const g = gauss(); s += g * g; }
    ns.push(Math.sqrt(s));
  }
  const mean = ns.reduce((a, b) => a + b, 0) / TRIALS;
  const sd = Math.sqrt(ns.reduce((a, b) => a + (b - mean) ** 2, 0) / (TRIALS - 1));
  const near = ns.filter((n) => Math.abs(n / Math.sqrt(d) - 1) < 0.1).length / TRIALS;
  return { ns, mean, sd, near };
}

export function NormShellViz() {
  const [d, setD] = useState(20);
  const { ns, mean, sd, near } = useMemo(() => simulate(d), [d]);
  const W = 330, H = 170, X0 = 10, Y0 = 8, PW = W - 20, PH = H - Y0 - 30, BINS = 60, MAX = 2.4;
  const hist = new Array(BINS).fill(0);
  ns.forEach((n) => { const b = Math.floor((n / Math.sqrt(d) / MAX) * BINS); if (b < BINS) hist[b]++; });
  const top = Math.max(...hist);
  const sx = (v: number) => X0 + (v / MAX) * PW;
  const bw = PW / BINS;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">dimension d</span>
        <div className="segmented" role="group" aria-label="Dimension">
          {DIMS.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={d === v} onClick={() => setD(v)}>{v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of the norm of a Gaussian vector divided by the square root of the dimension">
        <rect x={sx(0.9)} y={Y0} width={sx(1.1) - sx(0.9)} height={PH} fill="var(--accent-soft)" opacity={0.5} />
        {hist.map((h, b) => h > 0 && (
          <rect key={b} x={X0 + b * bw} y={Y0 + PH - (h / top) * PH} width={Math.max(bw - 0.5, 0.5)} height={(h / top) * PH} fill="var(--accent)" />
        ))}
        <line x1={sx(1)} x2={sx(1)} y1={Y0} y2={Y0 + PH} stroke="var(--danger)" strokeWidth={1.5} />
        {[0, 0.5, 1, 1.5, 2].map((v) => (
          <text key={v} x={sx(v)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{v}</text>
        ))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">‖X‖ / √d</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`√d = ${Math.sqrt(d).toFixed(2)}; mean ‖X‖ = ${mean.toFixed(2)}; sd of ‖X‖ = ${sd.toFixed(2)}; ${(near * 100).toFixed(0)}% within 10% of √d`}
      </div>
      <figcaption className="viz-caption">
        Two thousand standard Gaussian vectors in dimension d, with the histogram of their lengths divided by √d. In
        dimension 1 the length is spread from 0 to over 2; by dimension 500 all but a handful of samples lie in the shaded
        band within 10% of √d. The standard deviation of the length itself does not shrink: from dimension 5 on it sits near 0.7, close to its
        limit 1/√2. The
        length grows like √d while its fluctuations stay of order 1, so relative to its size it becomes a constant.
      </figcaption>
    </figure>
  );
}
