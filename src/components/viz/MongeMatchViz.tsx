"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// seven source points and seven target points on a line, equal weights
const N = 7;
const r0 = rand(2027);
const XS = Array.from({ length: N }, () => 0.3 + 5.4 * r0()).sort(
  (a, b) => a - b,
);
const YS = Array.from({ length: N }, () => 0.3 + 5.4 * r0());

function perms(n: number): number[][] {
  if (n === 1) return [[0]];
  const out: number[][] = [];
  for (const p of perms(n - 1))
    for (let i = 0; i <= p.length; i++)
      out.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
  return out;
}
const ALL = perms(N);

export const sq = (x: number, y: number) => (x - y) ** 2;
export const root = (x: number, y: number) => Math.sqrt(Math.abs(x - y));

export function cost(p: number[], c: (x: number, y: number) => number) {
  return p.reduce((a, j, i) => a + c(XS[i], YS[j]), 0) / N;
}

export function best(c: (x: number, y: number) => number) {
  let bp = ALL[0],
    bc = Infinity;
  for (const p of ALL) {
    const v = cost(p, c);
    if (v < bc) {
      bc = v;
      bp = p;
    }
  }
  return bp;
}

const RANDOM = (() => {
  const p = Array.from({ length: N }, (_, i) => i);
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(r0() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
})();
const MODES = ["random", "best for squared cost", "best for √ cost"] as const;
const MATCH = [RANDOM, best(sq), best(root)];

export function MongeMatchViz() {
  const [m, setM] = useState(1);
  const p = MATCH[m];
  const W = 340,
    H = 170,
    XL = 16,
    XR = W - 16,
    YT = 40,
    YB = 130,
    LO = 0,
    HI = 6;
  const sx = (v: number) => XL + ((v - LO) / (HI - LO)) * (XR - XL);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Matching">
          {MODES.map((s, j) => (
            <button
              key={s}
              type="button"
              className="seg"
              aria-pressed={m === j}
              onClick={() => setM(j)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Source points on the upper line matched to target points on the lower line"
      >
        <line x1={XL} y1={YT} x2={XR} y2={YT} stroke="var(--border)" />
        <line x1={XL} y1={YB} x2={XR} y2={YB} stroke="var(--border)" />
        {p.map((j, i) => (
          <line
            key={i}
            x1={sx(XS[i])}
            y1={YT}
            x2={sx(YS[j])}
            y2={YB}
            stroke="var(--accent)"
            strokeWidth={1.4}
          />
        ))}
        {XS.map((x, i) => (
          <circle key={i} cx={sx(x)} cy={YT} r={4} fill="var(--accent)" />
        ))}
        {YS.map((y, i) => (
          <circle key={i} cx={sx(y)} cy={YB} r={4} fill="var(--danger)" />
        ))}
        <text x={XL} y={YT - 12} className="viz-label">
          source μ
        </text>
        <text x={XL} y={YB + 22} className="viz-label">
          target ν
        </text>
        {[0, 2, 4, 6].map((v) => (
          <text
            key={v}
            x={sx(v)}
            y={YB + 22}
            textAnchor="middle"
            className="viz-label"
          >
            {v > 0 ? v : ""}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        mean squared cost {cost(p, sq).toFixed(3)}, mean √ cost{" "}
        {cost(p, root).toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Each of seven source points must be sent to one of seven target points,
        one to one: a Monge map between two uniform discrete measures, found
        here by checking all 5040 matchings. For the squared distance the best
        matching is monotone, the k-th source point to the k-th target point,
        and no two lines cross. For the square root of the distance, a concave
        cost, the best matching is different: it pays to leave points that are
        already close where they are and send a few far.
      </figcaption>
    </figure>
  );
}
