"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

type P = [number, number];

/** 600 points from a curved two-dimensional distribution. */
export function data(seed = 3): P[] {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return Array.from({ length: 600 }, () => {
    const t = 2 * r() - 1;
    return [t + 0.08 * nrm(), 0.8 * t * t - 0.4 + 0.08 * nrm()] as P;
  });
}

const d2 = (a: P, b: P) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const near = (p: P, cb: P[]) => { let b = 0; for (let k = 1; k < cb.length; k++) if (d2(p, cb[k]) < d2(p, cb[b])) b = k; return b; };

/** Lloyd's k-means with k-means++-style seeding from a fixed generator. */
export function kmeans(pts: P[], K: number, seed: number): P[] {
  const r = rand(seed);
  const cb: P[] = [pts[Math.floor(r() * pts.length)]];
  while (cb.length < K) {
    const w = pts.map((p) => Math.min(...cb.map((c) => d2(p, c))));
    let u = r() * w.reduce((a, v) => a + v, 0), i = 0;
    while (u > w[i] && i < pts.length - 1) { u -= w[i]; i++; }
    cb.push(pts[i]);
  }
  for (let it = 0; it < 30; it++) {
    const sum = cb.map(() => [0, 0, 0]);
    for (const p of pts) { const k = near(p, cb); sum[k][0] += p[0]; sum[k][1] += p[1]; sum[k][2]++; }
    sum.forEach((s, k) => { if (s[2]) cb[k] = [s[0] / s[2], s[1] / s[2]]; });
  }
  return cb;
}

/** Reconstructions after residual vector quantisation with the given stages of K codes each. */
export function rvq(pts: P[], K: number, stages: number) {
  let res = pts.map((p) => [...p] as P);
  const rec = pts.map(() => [0, 0] as P);
  for (let s = 0; s < stages; s++) {
    const cb = kmeans(res, K, 10 + s);
    res = res.map((p, i) => { const c = cb[near(p, cb)]; rec[i] = [rec[i][0] + c[0], rec[i][1] + c[1]]; return [p[0] - c[0], p[1] - c[1]] as P; });
  }
  const mse = pts.reduce((a, p, i) => a + d2(p, rec[i]), 0) / pts.length;
  return { rec, mse };
}

export const MODES: [string, number, number][] = [["4 codes", 4, 1], ["16 codes", 16, 1], ["64 codes", 64, 1], ["2 stages of 4", 4, 2], ["3 stages of 4", 4, 3]];

export function ResidualVqViz() {
  const [mi, setMi] = useState(4);
  const pts = useMemo(() => data(), []);
  const [, K, S] = MODES[mi];
  const { rec, mse } = useMemo(() => rvq(pts, K, S), [pts, K, S]);
  const used = new Set(rec.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`)).size;
  const W = 300, H = 180, sx = (x: number) => W / 2 + x * 130, sy = (y: number) => H / 2 - y * 130 + 10;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">quantiser</span>
        <div className="segmented" role="group" aria-label="Quantiser" style={{ flexWrap: "wrap" }}>
          {MODES.map(([n], i) => <button key={n} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Data and quantised reconstructions">
        {pts.map((p, i) => <line key={`l${i}`} x1={sx(p[0])} y1={sy(p[1])} x2={sx(rec[i][0])} y2={sy(rec[i][1])} stroke="var(--border-strong)" strokeWidth={0.6} />)}
        {pts.map((p, i) => <circle key={`p${i}`} cx={sx(p[0])} cy={sy(p[1])} r={1.3} fill="var(--text-muted)" />)}
        {rec.map((p, i) => <circle key={`r${i}`} cx={sx(p[0])} cy={sy(p[1])} r={2.6} fill="var(--accent)" />)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--text-muted)" }}>●</span> data</span>
        <span><span style={{ color: "var(--accent)" }}>●</span> reconstruction (line joins each point to it)</span>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${Math.log2(K) * S} bits per point, ${K * S} stored vectors, ${used} distinct reconstructions, error ${mse.toFixed(4)}`}
      </div>
      <figcaption className="viz-caption">
        Vector quantisation replaces each point by the nearest of K learned code vectors, so a point becomes a token with log₂ K
        bits. Residual quantisation quantises what is left over with a second codebook, then a third. Three stages of 4 codes
        spend the same 6 bits per point as one codebook of 64, store only 12 vectors instead of 64 and search 12 instead of 64,
        and use 55 distinct reconstructions; the price is about twice the error (0.0040 against 0.0019). Audio codecs stack
        eight or more such stages.
      </figcaption>
    </figure>
  );
}
