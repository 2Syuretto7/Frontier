"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const KINDS = ["hand-written", "minified", "data tables"];
const COUNTS = [90, 25, 25];
const LIMITS = [50, 100, 200, 400];
const MIN_ALNUM = 0.25;

/** Synthetic source files: [kind, mean line length, alphanumeric fraction]. */
export function files() {
  const rng = rand(21);
  const out: [number, number, number][] = [];
  const ranges: [number, number, number, number][] = [[10, 140, 0.45, 0.78], [80, 4000, 0.55, 0.8], [15, 300, 0.05, 0.3]];
  KINDS.forEach((_, k) => {
    const [l0, l1, a0, a1] = ranges[k];
    for (let i = 0; i < COUNTS[k]; i++) {
      const len = Math.exp(Math.log(l0) + (Math.log(l1) - Math.log(l0)) * rng());
      out.push([k, len, a0 + (a1 - a0) * rng()]);
    }
  });
  return out;
}

export function CodeFilterViz() {
  const [li, setLi] = useState(1);
  const lim = LIMITS[li];
  const fs = files();
  const kept = KINDS.map((_, k) => fs.filter((f) => f[0] === k && f[1] <= lim && f[2] >= MIN_ALNUM).length);
  const W = 330, H = 170, X0 = 34, Y0 = 6, PW = 286, PH = 140;
  const x = (v: number) => X0 + ((Math.log10(v) - 0.7) / (Math.log10(5000) - 0.7)) * PW;
  const y = (a: number) => Y0 + PH - a * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">longest mean line kept</span>
        <div className="segmented" role="group" aria-label="Mean line length limit">
          {LIMITS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={li === j} onClick={() => setLi(j)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 16}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Files by mean line length and alphanumeric fraction">
        <rect x={X0} y={Y0} width={x(lim) - X0} height={y(MIN_ALNUM) - Y0} style={{ fill: "var(--accent)" }} opacity={0.08} />
        <line x1={x(lim)} x2={x(lim)} y1={Y0} y2={Y0 + PH} stroke="var(--text)" strokeDasharray="4 3" />
        <line x1={X0} x2={X0 + PW} y1={y(MIN_ALNUM)} y2={y(MIN_ALNUM)} stroke="var(--text)" strokeDasharray="4 3" />
        {fs.map(([k, len, a], i) => {
          const keep = len <= lim && a >= MIN_ALNUM;
          const cx = x(len), cy = y(a);
          return k === 0 ? <circle key={i} cx={cx} cy={cy} r={2.6} style={{ fill: keep ? "var(--accent)" : "var(--text-muted)" }} />
            : k === 1 ? <rect key={i} x={cx - 2.4} y={cy - 2.4} width={4.8} height={4.8} style={{ fill: keep ? "var(--accent)" : "var(--text-muted)" }} />
            : <path key={i} d={`M${cx} ${cy - 3}L${cx + 3} ${cy + 2.5}L${cx - 3} ${cy + 2.5}Z`} style={{ fill: keep ? "var(--accent)" : "var(--text-muted)" }} />;
        })}
        {[10, 100, 1000].map((v) => <text key={v} x={x(v)} y={Y0 + PH + 12} textAnchor="middle" className="viz-label">{v}</text>)}
        {[0, 0.5, 1].map((v) => <text key={v} x={X0 - 4} y={y(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <text x={X0 + PW} y={H + 14} textAnchor="end" className="viz-label">mean line length</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        kept: {KINDS.map((k, j) => `${k} ${kept[j]}/${COUNTS[j]}`).join(", ")}
      </div>
      <figcaption className="viz-caption">
        Synthetic source files placed by mean line length (log scale) and the fraction of characters that are letters or digits:
        circles are hand-written code, squares minified bundles, triangles numeric data tables. Files in the shaded corner pass both
        filters and are coloured. A tight line-length limit also discards long-lined hand-written files; a loose one starts letting
        minified code through.
      </figcaption>
    </figure>
  );
}
