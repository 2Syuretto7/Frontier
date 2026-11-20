"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

export const STEPS = 400, PATHS = 24;

/** Pólya urn paths: the fraction of red balls after each draw, starting from r red and b blue. */
export function urnPaths(r0: number, b0: number, seed: number) {
  const g = rand(seed * 101 + r0 * 7 + b0);
  return Array.from({ length: PATHS }, () => {
    let r = r0, b = b0;
    const fr = [r / (r + b)];
    for (let t = 0; t < STEPS; t++) {
      if (g() < r / (r + b)) r++;
      else b++;
      fr.push(r / (r + b));
    }
    return fr;
  });
}

const STARTS: [number, number][] = [[1, 1], [2, 1], [10, 10]];

export function UrnPathsViz() {
  const [si, setSi] = useState(0);
  const [seed, setSeed] = useState(1);
  const [r0, b0] = STARTS[si];
  const ps = urnPaths(r0, b0, seed);
  const finals = ps.map((p) => p[STEPS]);
  const mean = finals.reduce((a, b) => a + b, 0) / PATHS;
  const W = 330, H = 150, X0 = 26, PW = 250, Y0 = 8, PH = 124, HX = X0 + PW + 8, HW = 40;
  const sx = (t: number) => X0 + (t / STEPS) * PW, sy = (y: number) => Y0 + PH - y * PH;
  const bins = Array.from({ length: 10 }, (_, i) => finals.filter((v) => Math.min(9, Math.floor(v * 10)) === i).length);
  const bmax = Math.max(...bins, 1);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Starting urn">
          {STARTS.map(([r, b], i) => (
            <button key={i} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{r} red, {b} blue</button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setSeed((s) => (s % 9) + 1)}>New paths</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Fraction of red balls in a Polya urn along 24 sample paths, with a histogram of final fractions">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={sy(0)} stroke="var(--border)" />
        {[0, 0.5, 1].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        {[0, 200, 400].map((v) => <text key={v} x={sx(v)} y={H - 2} textAnchor={v === 400 ? "end" : "middle"} className="viz-label">{v}</text>)}
        {ps.map((p, i) => (
          <path key={i} d={p.filter((_, t) => t % 2 === 0 || t === STEPS).map((y, j, arr) => `${j ? "L" : "M"}${sx(j === arr.length - 1 ? STEPS : 2 * j).toFixed(1)},${sy(y).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeOpacity={0.55} strokeWidth={1} />
        ))}
        <line x1={X0} x2={X0 + PW} y1={sy(r0 / (r0 + b0))} y2={sy(r0 / (r0 + b0))} stroke="var(--code-function)" strokeDasharray="4 3" />
        {bins.map((c, i) => <rect key={i} x={HX} y={sy((i + 1) / 10) + 1} width={(c / bmax) * HW} height={PH / 10 - 2} fill="var(--code-function)" />)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        start fraction {(r0 / (r0 + b0)).toFixed(3)}; average final fraction over {PATHS} paths {mean.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        A Pólya urn: draw a ball, return it with another of the same colour. The fraction of red is a martingale, so its
        expected value stays at the starting fraction (dashed line), yet each path settles down to its own random limit;
        the bars on the right count where the 24 paths end. From one ball of each colour the limit is uniform on [0, 1];
        from ten of each it concentrates near 1/2.
      </figcaption>
    </figure>
  );
}
