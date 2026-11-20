"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

export const NMAX = 4000, PATHS = 40, EPS = 0.1;
export const STARTS = [50, 200, 800];

/** Running means of i.i.d. samples: Exponential(1) (mean 1) or standard Cauchy (no mean). */
export function meanPaths(law: number, seed: number) {
  const g = rand(seed * 613 + law);
  return Array.from({ length: PATHS }, () => {
    const out = new Float64Array(NMAX);
    let s = 0;
    for (let n = 0; n < NMAX; n++) {
      const u = g();
      s += law === 0 ? -Math.log(1 - u) : Math.tan(Math.PI * (u - 0.5));
      out[n] = s / (n + 1);
    }
    return out;
  });
}

export function fractions(paths: Float64Array[], start: number, centre: number) {
  let atN = 0, ever = 0;
  for (const p of paths) {
    if (Math.abs(p[start - 1] - centre) > EPS) atN++;
    let left = false;
    for (let n = start - 1; n < NMAX; n++) if (Math.abs(p[n] - centre) > EPS) { left = true; break; }
    if (left) ever++;
  }
  return { atN: atN / paths.length, ever: ever / paths.length };
}

export function MeanPathsViz() {
  const [law, setLaw] = useState(0);
  const [si, setSi] = useState(1);
  const [seed, setSeed] = useState(1);
  const ps = meanPaths(law, seed);
  const centre = law === 0 ? 1 : 0, start = STARTS[si];
  const f = fractions(ps, start, centre);
  const W = 330, H = 150, X0 = 30, PW = 292, Y0 = 8, PH = 124, R = 0.8;
  const lx = (n: number) => X0 + (Math.log10(n) / Math.log10(NMAX)) * PW;
  const sy = (y: number) => Y0 + PH - ((Math.max(centre - R, Math.min(centre + R, y)) - (centre - R)) / (2 * R)) * PH;
  const idx = Array.from({ length: 160 }, (_, i) => Math.max(1, Math.round(NMAX ** (i / 159))));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Law of the samples">
          {["Exponential(1)", "Cauchy"].map((l, i) => (
            <button key={l} type="button" className="seg" aria-pressed={law === i} onClick={() => setLaw(i)}>{l}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Start of the tail window">
          {STARTS.map((s, i) => (
            <button key={s} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>from n = {s}</button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setSeed((s) => (s % 9) + 1)}>New samples</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Running means of 40 independent sequences, with a band around the centre">
        <rect x={lx(start)} y={sy(centre + EPS)} width={X0 + PW - lx(start)} height={sy(centre - EPS) - sy(centre + EPS)} fill="var(--code-function)" opacity={0.18} />
        <line x1={X0} x2={X0 + PW} y1={sy(centre)} y2={sy(centre)} stroke="var(--code-function)" strokeDasharray="4 3" />
        <line x1={lx(start)} x2={lx(start)} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        {[centre - R, centre, centre + R].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v.toFixed(1)}</text>)}
        {[1, 10, 100, 1000].map((n) => <text key={n} x={lx(n)} y={H - 2} textAnchor="middle" className="viz-label">{n}</text>)}
        {ps.map((p, i) => (
          <path key={i} d={idx.map((n, j) => `${j ? "L" : "M"}${lx(n).toFixed(1)},${sy(p[n - 1]).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeOpacity={0.45} strokeWidth={1} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        outside ±{EPS} at n = {start}: {Math.round(f.atN * PATHS)} of {PATHS}; outside at some n from {start} to {NMAX}: {Math.round(f.ever * PATHS)} of {PATHS}
      </div>
      <figcaption className="viz-caption">
        Running means of 40 independent sequences, on a log scale in n. The weak law controls how many paths are outside
        the band at the single time n; the strong law controls how many ever leave it afterwards, a larger count that also
        shrinks to zero as n grows. Cauchy samples have no mean: their running mean is again standard Cauchy at every n,
        and the paths never settle.
      </figcaption>
    </figure>
  );
}
