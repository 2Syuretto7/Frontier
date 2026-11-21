"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// target: 0.3 N(-2, 0.6^2) + 0.7 N(2, 0.6^2)
const MEANS = [-2, 2],
  W8 = [0.3, 0.7],
  SD = 0.6,
  NPART = 800,
  EPS = 0.02;
const r0 = rand(1942);
const gauss = () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const INIT = Array.from({ length: NPART }, () => -4 + 8 * r0());
const STEPS = [0, 10, 100, 1000];

export const density = (x: number) =>
  MEANS.reduce(
    (a, m, i) =>
      a +
      (W8[i] * Math.exp(-((x - m) ** 2) / (2 * SD * SD))) /
        (SD * Math.sqrt(2 * Math.PI)),
    0,
  );

/** Score of the mixture: the posterior-weighted average of the component scores. */
export function score(x: number) {
  const w = MEANS.map(
    (m, i) => W8[i] * Math.exp(-((x - m) ** 2) / (2 * SD * SD)),
  );
  const s = w[0] + w[1];
  return MEANS.reduce((a, m, i) => a + (w[i] / s) * (-(x - m) / (SD * SD)), 0);
}

function run() {
  const snaps: number[][] = [INIT];
  let x = [...INIT],
    done = 0;
  for (const n of STEPS.slice(1)) {
    for (; done < n; done++)
      x = x.map((v) => v + EPS * score(v) + Math.sqrt(2 * EPS) * gauss());
    snaps.push(x);
  }
  return snaps;
}
let cache: number[][] | null = null;
export const snapshots = () => (cache ??= run());

export function ScoreLangevinViz() {
  const [si, setSi] = useState(2);
  const xs = snapshots()[si];
  const right = xs.filter((v) => v > 0).length / NPART;
  const W = 340,
    H = 210,
    XL = 10,
    XR = W - 10,
    Y0 = 8,
    YM = 130,
    LO = -4.5,
    HI = 4.5,
    BINS = 45;
  const sx = (x: number) => XL + ((x - LO) / (HI - LO)) * (XR - XL);
  const counts = Array(BINS).fill(0);
  xs.forEach((v) => {
    const b = Math.floor(((v - LO) / (HI - LO)) * BINS);
    if (b >= 0 && b < BINS) counts[b]++;
  });
  const bw = (HI - LO) / BINS;
  const dmax = 0.5;
  const sy = (d: number) => YM - (Math.min(d, dmax) / dmax) * (YM - Y0);
  const curve = Array.from(
    { length: 181 },
    (_, i) => LO + (i / 180) * (HI - LO),
  )
    .map((x, i) => `${i ? "L" : "M"}${sx(x)},${sy(density(x))}`)
    .join(" ");
  const arrows = Array.from({ length: 19 }, (_, i) => LO + 0.25 + i * 0.47);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", alignItems: "center", gap: 8 }}
      >
        <span className="viz-label">Langevin steps</span>
        <div
          className="segmented"
          role="group"
          aria-label="Langevin steps taken"
        >
          {STEPS.map((n, j) => (
            <button
              key={n}
              type="button"
              className="seg"
              aria-pressed={si === j}
              onClick={() => setSi(j)}
            >
              {n}
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
        aria-label="Langevin samples moving along a score field towards a two-component mixture"
      >
        {counts.map((c, i) => (
          <rect
            key={i}
            x={sx(LO + i * bw) + 0.5}
            y={sy(c / (NPART * bw))}
            width={sx(LO + bw) - sx(LO) - 1}
            height={YM - sy(c / (NPART * bw))}
            style={{ fill: "var(--accent)", fillOpacity: 0.25 }}
          />
        ))}
        <path d={curve} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
        <line x1={XL} y1={YM} x2={XR} y2={YM} stroke="var(--border-strong)" />
        <line x1={XL} y1={170} x2={XR} y2={170} stroke="var(--border)" />
        {arrows.map((x) => {
          const s = Math.max(-1, Math.min(1, score(x) / 4));
          return (
            <g key={x}>
              <line
                x1={sx(x)}
                y1={170}
                x2={sx(x) + s * 14}
                y2={170}
                stroke="var(--danger)"
                strokeWidth={1.6}
              />
              <circle
                cx={sx(x) + s * 14}
                cy={170}
                r={1.8}
                style={{ fill: "var(--danger)" }}
              />
            </g>
          );
        })}
        <text x={XL} y={152} className="viz-label">
          score ∇log p (arrows)
        </text>
        {[-4, -2, 0, 2, 4].map((x) => (
          <text
            key={x}
            x={sx(x)}
            y={H - 4}
            textAnchor="middle"
            className="viz-label"
          >
            {x}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        share of samples right of 0: {(100 * right).toFixed(1)}% (target 70%)
      </div>
      <figcaption className="viz-caption">
        The target is a mixture with 30% of its mass near −2 and 70% near 2
        (curve). The arrows show its score, which points uphill towards the
        nearer mode and vanishes at the modes and at the trough between them.
        800 samples start uniformly and follow Langevin steps x ← x + ε∇log p(x)
        + √(2ε) z with ε = 0.02. Within a hundred steps each sample settles into
        a mode; balancing the two modes requires crossings of the low-density
        gap, which are rare, so the shares approach 30:70 only slowly.
      </figcaption>
    </figure>
  );
}
