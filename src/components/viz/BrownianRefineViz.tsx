"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const LEVELS = [2, 4, 6, 8, 12];

/** A Brownian path on [0, 1] at 2^K + 1 points built by Lévy's midpoint refinement. */
export function levyPath(K: number, seed: number) {
  const z = makeNormal(makeRng(seed));
  let p = [0, z()];
  for (let k = 0; k < K; k++) {
    const dt = 1 / (p.length - 1), q: number[] = [];
    for (let i = 0; i < p.length - 1; i++) q.push(p[i], 0.5 * (p[i] + p[i + 1]) + Math.sqrt(dt / 4) * z());
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
}

/** The path seen at 2^k + 1 equally spaced times, with its total and quadratic variation. */
export function coarse(p: number[], k: number) {
  const K = Math.round(Math.log2(p.length - 1)), step = 2 ** (K - k), pts = p.filter((_, i) => i % step === 0);
  let tv = 0, qv = 0;
  for (let i = 1; i < pts.length; i++) { const d = pts[i] - pts[i - 1]; tv += Math.abs(d); qv += d * d; }
  return { pts, tv, qv };
}

export function BrownianRefineViz() {
  const [k, setK] = useState(6);
  const [seed, setSeed] = useState(4);
  const [path, setPath] = useState<number[] | null>(null);
  useEffect(() => setPath(levyPath(12, seed)), [seed]);
  const W = 330, H = 160, X0 = 10, PW = W - 20;
  const c = path ? coarse(path, k) : null;
  const lo = path ? Math.min(...path) : -1, hi = path ? Math.max(...path) : 1, pad = 0.1 * (hi - lo + 1e-9);
  const sx = (i: number, n: number) => X0 + (i / n) * PW, sy = (v: number) => 8 + (1 - (v - lo + pad) / (hi - lo + 2 * pad)) * (H - 16);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {LEVELS.map((l) => (
          <button key={l} type="button" className="seg" aria-pressed={l === k} onClick={() => setK(l)}>{2 ** l} steps</button>
        ))}
        <button type="button" className="seg" onClick={() => setSeed((s) => s + 1)}>new path</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="A Brownian path sampled at increasing resolution">
        {path && <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />}
        {path && k < 12 && <polyline fill="none" stroke="var(--text-muted)" strokeWidth={0.6} opacity={0.6} points={path.map((v, i) => `${sx(i, path.length - 1)},${sy(v)}`).join(" ")} />}
        {c && <polyline fill="none" stroke="var(--accent)" strokeWidth={k >= 8 ? 1 : 1.8} points={c.pts.map((v, i) => `${sx(i, c.pts.length - 1)},${sy(v)}`).join(" ")} />}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {c ? `sum of |ΔB| = ${c.tv.toFixed(2)}; sum of (ΔB)² = ${c.qv.toFixed(3)}` : "building"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        One Brownian path on [0, 1], built by repeatedly inserting midpoints with the right conditional noise, so the coarse
        points (colour) lie exactly on the fine path (grey). Each refinement keeps the sum of squared increments near 1, the
        length of the interval, while the sum of absolute increments grows by about √2 per doubling: the path has finite
        quadratic variation but infinite length.
      </figcaption>
    </figure>
  );
}
