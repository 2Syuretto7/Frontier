"use client";

import { useEffect, useState } from "react";

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

const MROWS = 1000, D = 8, SIZES = [12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512], TRIALS = 4;

/** Least squares on rows [A | b] (columns 0..D−1 are A, column D is b) via normal equations with Gaussian elimination. */
function lsq(rows: number[][]): number[] {
  const G = Array.from({ length: D }, () => Array(D + 1).fill(0));
  for (const r of rows) for (let i = 0; i < D; i++) { for (let j = 0; j < D; j++) G[i][j] += r[i] * r[j]; G[i][D] += r[i] * r[D]; }
  for (let k = 0; k < D; k++) for (let i = k + 1; i < D; i++) { const l = G[i][k] / G[k][k]; for (let j = k; j <= D; j++) G[i][j] -= l * G[k][j]; }
  const x = Array(D).fill(0);
  for (let i = D - 1; i >= 0; i--) { let s = G[i][D]; for (let j = i + 1; j < D; j++) s -= G[i][j] * x[j]; x[i] = s / G[i][i]; }
  return x;
}

/** Sketch-and-solve least squares: residual of the sketched solution relative to the optimal residual, against sketch size. */
export function SketchResidualViz() {
  const [seed, setSeed] = useState(1);
  const [data, setData] = useState<{ g: number[][]; c: number[][] } | null>(null);
  useEffect(() => {
    const r = makeRng(17 * seed + 3);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const rows = Array.from({ length: MROWS }, () => { const a = Array.from({ length: D }, normal); return [...a, a.reduce((s, v) => s + v, 0) + normal()]; });
    const resid = (x: number[]) => Math.sqrt(rows.reduce((s, row) => s + (row.slice(0, D).reduce((t, v, i) => t + v * x[i], 0) - row[D]) ** 2, 0));
    const best = resid(lsq(rows));
    const g: number[][] = [], c: number[][] = [];
    for (const s of SIZES) {
      const gs: number[] = [], cs: number[] = [];
      for (let t = 0; t < TRIALS; t++) {
        const SG = Array.from({ length: s }, () => Array(D + 1).fill(0));
        for (const row of rows) for (let i = 0; i < s; i++) { const w = normal(); for (let j = 0; j <= D; j++) SG[i][j] += w * row[j]; }
        gs.push(resid(lsq(SG)) / best);
        const SC = Array.from({ length: s }, () => Array(D + 1).fill(0));
        for (const row of rows) { const h = Math.floor(r() * s), sg = r() < 0.5 ? -1 : 1; for (let j = 0; j <= D; j++) SC[h][j] += sg * row[j]; }
        cs.push(resid(lsq(SC)) / best);
      }
      g.push(gs); c.push(cs);
    }
    setData({ g, c });
  }, [seed]);
  const W = 330, H = 160;
  const X = (s: number) => 30 + ((Math.log2(s) - Math.log2(10)) / (Math.log2(600) - Math.log2(10))) * (W - 40);
  const Y = (v: number) => H - 20 - ((Math.min(v, 2) - 1) / 1) * (H - 32);
  const theory = SIZES.map((s) => Math.sqrt(1 + D / (s - D - 1)));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new data and sketches</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Residual ratio of sketched least squares against sketch size">
        {[1, 1.5, 2].map((v) => (
          <g key={v}>
            <line x1={X(10)} x2={X(600)} y1={Y(v)} y2={Y(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={26} y={Y(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        <polyline fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.4} points={SIZES.map((s, i) => `${X(s).toFixed(1)},${Y(theory[i]).toFixed(1)}`).join(" ")} />
        {data && SIZES.map((s, i) => data.g[i].map((v, t) => <circle key={`g${i}-${t}`} cx={X(s) - 2} cy={Y(v)} r={2.2} fill="var(--accent)" />))}
        {data && SIZES.map((s, i) => data.c[i].map((v, t) => <circle key={`c${i}-${t}`} cx={X(s) + 2} cy={Y(v)} r={2.2} fill="var(--danger)" opacity={0.8} />))}
        {[16, 64, 256].map((s) => <text key={s} x={X(s)} y={H - 6} textAnchor="middle" className="viz-label">s = {s}</text>)}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        A least-squares problem with 1000 rows and 8 unknowns is compressed to s rows by a Gaussian sketch (accent dots) or
        a CountSketch, which adds each row with a random sign into one random bucket (red dots), and the small problem is
        solved exactly. Each dot is the residual of that solution divided by the optimal residual. The dashed curve is the
        Gaussian expectation √(1 + d/(s − d − 1)): the excess shrinks like d/s, so a sketch a few dozen times larger than
        the number of unknowns gives a residual within a few per cent of optimal, independent of the 1000 original rows.
      </figcaption>
    </figure>
  );
}
