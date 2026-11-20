"use client";

import { useState } from "react";

/**
 * A toy model whose output is a weighted sum of ten independent components, plus two components that are noisy copies of the first
 * two and have no weight. Everything is computed exactly from the weights and standard deviations.
 */
const W = [2.0, -1.5, 0.3, 1.2, -0.8, 3.0, 0.5, -0.4, 1.0, 0.2, 0, 0];
const SD = [1.0, 1.2, 2.0, 0.6, 1.0, 0.15, 1.5, 1.0, 0.8, 3.0, Math.sqrt(1.25), Math.sqrt(1.8)];
const COV_Y = W.map((w, j) => (j < 10 ? w * SD[j] ** 2 : j === 10 ? W[0] * SD[0] ** 2 : W[1] * SD[1] ** 2));
const EFFECT = W.map((w, j) => w * w * SD[j] ** 2);
const TOTAL = EFFECT.reduce((s, e) => s + e, 0);
const SD_Y = Math.sqrt(TOTAL);

export const SCORES = {
  weight: W.map((w) => Math.abs(w)),
  correlation: COV_Y.map((c, j) => Math.abs(c) / (SD[j] * SD_Y)),
  effect: EFFECT,
};
type Rule = keyof typeof SCORES;

/** Keep the k components that score highest; mean-ablate the rest. Loss recovered is the share of the output variance kept. */
export function recovered(rule: Rule, k: number) {
  const s = SCORES[rule];
  const keep = s.map((_, j) => j).sort((a, b) => s[b] - s[a] || a - b).slice(0, k);
  return { keep, frac: keep.reduce((t, j) => t + EFFECT[j], 0) / TOTAL };
}

const RULES: { key: Rule; name: string }[] = [
  { key: "weight", name: "largest weight" },
  { key: "correlation", name: "most correlated" },
  { key: "effect", name: "largest effect" },
];
const KS = [2, 4, 6];

export function ComponentEffectViz() {
  const [r, setR] = useState(1);
  const [k, setK] = useState(1);
  const { keep, frac } = recovered(RULES[r].key, KS[k]);
  const VW = 330, VH = 160, X0 = 12, PW = 306, Y0 = 8, PH = 116, MAXE = 0.4;
  const bw = PW / W.length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="How components are chosen">
          {RULES.map((x, i) => <button key={x.key} type="button" className="seg" aria-pressed={r === i} onClick={() => setR(i)}>{x.name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Number of components kept">
          {KS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>keep {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Share of the output each component accounts for, with the kept components highlighted">
        {W.map((_, j) => {
          const h = (EFFECT[j] / TOTAL / MAXE) * PH, x = X0 + j * bw;
          const kept = keep.includes(j);
          return (
            <g key={j}>
              <rect x={x + 3} y={Y0 + PH - h} width={bw - 6} height={h} style={{ fill: kept ? "var(--accent)" : "var(--border-strong)" }} />
              {kept && <rect x={x + 1} y={Y0 + PH + 2} width={bw - 2} height={3} style={{ fill: "var(--accent)" }} />}
              <text x={x + bw / 2} y={Y0 + PH + 17} textAnchor="middle" className="viz-label">{j < 10 ? j + 1 : j === 10 ? "1′" : "2′"}</text>
            </g>
          );
        })}
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border-strong)" />
        <text x={VW / 2} y={VH - 4} textAnchor="middle" className="viz-label">bar: each component's share of the output</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        kept {keep.map((j) => (j < 10 ? j + 1 : j === 10 ? "1′" : "2′")).join(", ")}; loss recovered {frac.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        A toy model whose output is a weighted sum of ten independent components; components 1′ and 2′ are noisy copies of 1 and 2
        that the model ignores. An explanation keeps a few components and replaces the rest with their averages, and is scored by the
        share of the model&apos;s behaviour it recovers. Picking by weight misses that a component with a large weight may barely vary;
        picking by correlation with the output brings in the copies, which correlate strongly but do nothing.
      </figcaption>
    </figure>
  );
}
