"use client";

import { useEffect, useMemo, useState } from "react";

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

const NP = 60, D = 1000, KS = [5, 10, 20, 50, 100, 200, 400];

/** Squared pairwise distances of 60 points in 1000 dimensions after a Gaussian random projection to k dimensions, as ratios to the originals. */
export function JlDistortionViz() {
  const [j, setJ] = useState(3);
  const [seed, setSeed] = useState(1);
  const [X, setX] = useState<number[][] | null>(null);
  useEffect(() => {
    const r = makeRng(5);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    setX(Array.from({ length: NP }, () => Array.from({ length: D }, normal)));
  }, []);
  const k = KS[j];
  const ratios = useMemo(() => {
    if (!X) return null;
    const r = makeRng(1000 * seed + k);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const S = Array.from({ length: k }, () => Array.from({ length: D }, () => normal() / Math.sqrt(k)));
    const Y = X.map((x) => S.map((row) => row.reduce((s, v, i) => s + v * x[i], 0)));
    const out: number[] = [];
    for (let a = 0; a < NP; a++) for (let b = a + 1; b < NP; b++) {
      let dx = 0, dy = 0;
      for (let i = 0; i < D; i++) dx += (X[a][i] - X[b][i]) ** 2;
      for (let i = 0; i < k; i++) dy += (Y[a][i] - Y[b][i]) ** 2;
      out.push(dy / dx);
    }
    return out;
  }, [X, k, seed]);
  const nb = 40, hi = 2.5;
  const counts = Array(nb).fill(0);
  if (ratios) ratios.forEach((v) => { const b = Math.min(nb - 1, Math.floor((v / hi) * nb)); counts[b]++; });
  const cmax = Math.max(...counts, 1);
  const worst = ratios ? Math.max(...ratios.map((v) => Math.abs(v - 1))) : 0;
  const W = 330, H = 150;
  const X0 = (v: number) => 14 + (v / hi) * (W - 28);
  const Yc = (c: number) => H - 20 - (c / cmax) * (H - 34);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          k = {k}
          <input type="range" min={0} max={KS.length - 1} value={j} onChange={(e) => setJ(Number(e.target.value))} aria-label="target dimension" style={{ width: 120 }} />
        </label>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new projection</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of distance ratios after random projection">
        {counts.map((c, i) => (
          <rect key={i} x={X0((i * hi) / nb)} y={Yc(c)} width={X0(hi / nb) - X0(0) - 0.6} height={H - 20 - Yc(c)} fill="var(--accent)" opacity={0.75} />
        ))}
        <line x1={X0(0)} x2={X0(hi)} y1={H - 20} y2={H - 20} stroke="var(--border)" />
        <line x1={X0(1)} x2={X0(1)} y1={8} y2={H - 20} stroke="var(--text)" strokeDasharray="3 3" />
        {[0, 1, 2].map((v) => <text key={v} x={X0(v)} y={H - 6} textAnchor="middle" className="viz-label">{v}</text>)}
        <line x1={X0(Math.max(0, 1 - 2 * Math.sqrt(2 / k)))} x2={X0(1 + 2 * Math.sqrt(2 / k))} y1={14} y2={14} stroke="var(--danger)" strokeWidth={2} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {ratios ? `${ratios.length} pairs; worst |ratio − 1| = ${worst.toFixed(3)}; standard deviation √(2/k) = ${Math.sqrt(2 / k).toFixed(3)}` : "computing…"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Sixty random points in 1000 dimensions are mapped to k dimensions by a Gaussian matrix with entries of variance
        1/k. The histogram shows, for all 1770 pairs, the squared distance after projection divided by the squared
        distance before. Each ratio has mean 1 and standard deviation √(2/k) (the red bar marks two standard deviations either
        side), so the spread shrinks like 1/√k. The original dimension 1000 plays no role: the number of points and the
        tolerated distortion alone decide how small k can be.
      </figcaption>
    </figure>
  );
}
