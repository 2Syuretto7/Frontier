"use client";

import { useState } from "react";

/*
 * Results of real training runs, recorded offline. Two synthetic "models" have 16-dimensional activations built from sparse features
 * (each active with probability 0.05, magnitude uniform on [0, 1]): 30 features shared by both, written in different directions in
 * each, plus features only one model has. A crosscoder with 64 latents reads both activations and reconstructs both, trained with Adam
 * (learning rate 0.001, batch 512, 10,000 steps) on squared error plus 0.1 times each latent's activation times the sum of its two
 * decoder norms. For each live latent: [relative decoder norm ||d_B|| / (||d_A|| + ||d_B||), kind of the true feature its decoder best
 * matches (0 shared, 1 only in A, 2 only in B)].
 */
export const CROSS: Record<string, [number, number][]> = {"6_6":[[0.0,1],[0.0,1],[0.001,1],[0.001,1],[0.001,1],[0.001,1],[0.001,1],[0.001,1],[0.019,0],[0.043,0],[0.313,0],[0.319,0],[0.409,0],[0.41,0],[0.415,0],[0.429,0],[0.434,0],[0.464,0],[0.47,0],[0.472,0],[0.477,0],[0.479,0],[0.496,0],[0.496,0],[0.497,0],[0.497,0],[0.498,0],[0.499,0],[0.499,0],[0.499,0],[0.499,0],[0.5,0],[0.5,0],[0.5,0],[0.501,0],[0.501,0],[0.502,0],[0.503,0],[0.503,0],[0.503,0],[0.503,0],[0.504,0],[0.505,0],[0.515,0],[0.518,0],[0.538,0],[0.54,0],[0.543,0],[0.553,0],[0.568,0],[0.572,0],[0.602,0],[0.611,0],[0.675,0],[0.749,0],[0.974,0],[0.999,2],[0.999,2],[0.999,2],[0.999,2],[0.999,2],[0.999,2],[0.999,2],[0.999,2]],"0_12":[[0.007,0],[0.029,0],[0.225,0],[0.256,0],[0.278,0],[0.283,0],[0.359,0],[0.383,0],[0.386,0],[0.398,0],[0.402,0],[0.432,0],[0.439,0],[0.445,0],[0.481,0],[0.491,0],[0.494,0],[0.495,0],[0.495,0],[0.495,0],[0.495,0],[0.496,0],[0.497,0],[0.498,0],[0.498,0],[0.498,0],[0.5,0],[0.501,0],[0.501,0],[0.517,0],[0.538,0],[0.545,0],[0.547,0],[0.553,0],[0.571,0],[0.574,0],[0.576,0],[0.58,0],[0.609,0],[0.641,0],[0.649,0],[0.698,0],[0.954,0],[0.967,0],[0.978,0],[0.982,0],[0.993,2],[0.995,2],[0.999,2],[0.999,2],[0.999,2],[0.999,2],[0.999,2],[0.999,2],[0.999,2],[0.999,2],[0.999,2],[0.999,2],[0.999,2],[1.0,2],[1.0,2],[1.0,2],[1.0,2],[1.0,2]],"0_0":[[0.031,0],[0.039,0],[0.059,0],[0.086,0],[0.165,0],[0.169,0],[0.246,0],[0.253,0],[0.324,0],[0.326,0],[0.331,0],[0.331,0],[0.35,0],[0.351,0],[0.358,0],[0.358,0],[0.366,0],[0.369,0],[0.394,0],[0.41,0],[0.429,0],[0.472,0],[0.478,0],[0.479,0],[0.489,0],[0.497,0],[0.499,0],[0.499,0],[0.499,0],[0.5,0],[0.5,0],[0.501,0],[0.501,0],[0.501,0],[0.501,0],[0.501,0],[0.502,0],[0.503,0],[0.505,0],[0.557,0],[0.578,0],[0.581,0],[0.584,0],[0.588,0],[0.591,0],[0.592,0],[0.6,0],[0.601,0],[0.603,0],[0.605,0],[0.608,0],[0.61,0],[0.627,0],[0.64,0],[0.642,0],[0.642,0],[0.643,0],[0.664,0],[0.706,0],[0.727,0],[0.73,0],[0.732,0],[0.747,0],[0.763,0]]};

const CASES = [
  { key: "6_6", name: "6 only in A, 6 only in B" },
  { key: "0_12", name: "12 only in B" },
  { key: "0_0", name: "all shared" },
];
const FILL = ["var(--border-strong)", "var(--accent)", "var(--text)"];

export function CrosscoderDiffViz() {
  const [k, setK] = useState(0);
  const lat = CROSS[CASES[k].key];
  const BINS = 20, W = 330, H = 170, X0 = 24, PW = 296, Y0 = 8, PH = 120;
  const counts = Array.from({ length: BINS }, () => [0, 0, 0]);
  for (const [r, c] of lat) counts[Math.min(BINS - 1, Math.floor(r * BINS))][c]++;
  const top = Math.max(...counts.map((c) => c[0] + c[1] + c[2]));
  const bw = PW / BINS;
  const ext = lat.filter(([r]) => r < 0.15 || r > 0.85);
  const fake = ext.filter(([, c]) => c === 0).length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Which features differ between the models">
          {CASES.map((c, i) => <button key={c.key} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{c.name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of crosscoder latents by relative decoder norm">
        {counts.map((c, i) => {
          let y = Y0 + PH;
          return (
            <g key={i}>
              {c.map((v, j) => {
                const h = (v / top) * PH;
                y -= h;
                return <rect key={j} x={X0 + i * bw + 0.5} y={y} width={bw - 1} height={h} style={{ fill: FILL[j] }} />;
              })}
            </g>
          );
        })}
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border-strong)" />
        {[0, 0.5, 1].map((v) => <text key={v} x={X0 + v * PW} y={Y0 + PH + 13} textAnchor={v === 0 ? "start" : v === 1 ? "end" : "middle"} className="viz-label">{v === 0 ? "0 (A only)" : v === 1 ? "1 (B only)" : "0.5"}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">relative decoder norm; colour: true feature matched</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {lat.length} live latents; {ext.length} look exclusive to one model, of which {fake} actually match a shared feature
      </div>
      <figcaption className="viz-caption">
        Real crosscoders trained on two synthetic models. Grey latents match a shared feature, purple ones a feature only model A has,
        black ones a feature only model B has. Exclusive features land at the ends, as hoped, and shared ones near the middle. But even
        when every feature is shared, a few latents land at an end: the crosscoder has split a shared feature into a shared latent and a
        one-sided correction, so an exclusive-looking latent needs checking before it is reported as a difference between models.
      </figcaption>
    </figure>
  );
}
