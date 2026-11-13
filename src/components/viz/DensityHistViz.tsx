"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DISTS: Record<string, { draw: (r: () => number) => number; f: (x: number) => number; lo: number; hi: number }> = {
  "U²": { draw: (r) => { const u = r(); return u * u; }, f: (x) => (x > 0 && x <= 1 ? 1 / (2 * Math.sqrt(x)) : 0), lo: 0, hi: 1 },
  "U₁ + U₂": { draw: (r) => r() + r(), f: (x) => (x < 0 || x > 2 ? 0 : x < 1 ? x : 2 - x), lo: 0, hi: 2 },
  "−log U": { draw: (r) => -Math.log(1 - r()), f: (x) => (x < 0 ? 0 : Math.exp(-x)), lo: 0, hi: 5 },
};
const NS = [100, 1000, 10000, 100000];

/** Histograms scaled to area 1 (count / (n · width)) approach the density as n grows and the bins narrow. */
export function DensityHistViz() {
  const [name, setName] = useState("U²");
  const [ni, setNi] = useState(1);
  const [bins, setBins] = useState(20);
  const d = DISTS[name], n = NS[ni];
  const samples = useMemo(() => {
    const r = makeRng(7 + name.length);
    return Array.from({ length: 100000 }, () => DISTS[name].draw(r));
  }, [name]);
  const w = (d.hi - d.lo) / bins;
  const counts = new Array(bins).fill(0);
  for (let i = 0; i < n; i++) {
    const k = Math.floor((samples[i] - d.lo) / w);
    if (k >= 0 && k < bins) counts[k] += 1;
  }
  const heights = counts.map((c) => c / (n * w));
  const W = 320, H = 170, top = 3;
  const X = (x: number) => 30 + ((x - d.lo) / (d.hi - d.lo)) * (W - 40);
  const Y = (y: number) => H - 20 - (Math.min(y, top) / top) * (H - 34);
  const curve = Array.from({ length: 201 }, (_, i) => d.lo + ((d.hi - d.lo) * (i + 0.5)) / 201).map((x) => `${X(x).toFixed(1)},${Y(d.f(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {Object.keys(DISTS).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={name === k} onClick={() => setName(k)}>{k}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={0} max={NS.length - 1} value={ni} onChange={(e) => setNi(Number(e.target.value))} aria-label="sample size" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          bins = {bins}
          <input type="range" min={4} max={60} value={bins} onChange={(e) => setBins(Number(e.target.value))} aria-label="number of bins" style={{ width: 90 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of samples scaled as a density, with the true density">
        {[0, 1, 2, 3].map((y) => (
          <g key={y}>
            <line x1={30} x2={W - 10} y1={Y(y)} y2={Y(y)} stroke="var(--border)" />
            <text x={26} y={Y(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        {heights.map((h, k) => (
          <rect key={k} x={X(d.lo + k * w)} y={Y(h)} width={Math.max(0.5, X(d.lo + (k + 1) * w) - X(d.lo + k * w) - 0.6)} height={H - 20 - Y(h)} fill="var(--accent)" opacity={0.45} />
        ))}
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={curve} />
        <text x={X(d.lo)} y={H - 6} textAnchor="middle" className="viz-label">{d.lo}</text>
        <text x={X(d.hi)} y={H - 6} textAnchor="middle" className="viz-label">{d.hi}</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Each bar is (number of samples in the bin) / (n × bin width), so the bars have total area 1 and a bar&apos;s height
        is probability per unit length. With more samples and narrower bins they settle onto the density (red). The density
        of U² exceeds 1 and is even unbounded near 0, which is allowed: only its area has to be 1.
      </figcaption>
    </figure>
  );
}
