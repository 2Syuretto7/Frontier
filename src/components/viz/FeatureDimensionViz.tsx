"use client";

import { useState } from "react";

/*
 * Results of real training runs, recorded offline: twelve equally important features, each zero with probability S and otherwise
 * uniform on [0, 1], compressed into four dimensions by the toy model ReLU(W^T W x + b), trained with Adam (learning rate 0.002,
 * batch 1,024, 10,000 steps) at sixteen sparsities. Each feature's dimensionality is ||W_i||^2 / sum_j (unit(W_i) . W_j)^2; features
 * the model does not represent (column length below 0.3) are given 0.
 */
export const GEOM: { S: number; dims: number[] }[] = [{"S":0.0,"dims":[0.787,0.186,0.699,0.1,0.0,0.163,0.783,0.0,0.144,0.733,0.102,0.147]},{"S":0.2644,"dims":[0.665,0.653,0.649,0.0,0.0,0.0,0.663,0.0,0.0,0.666,0.656,0.0]},{"S":0.4588,"dims":[0.497,0.498,0.502,0.0,0.0,0.0,0.497,0.0,0.774,0.501,0.503,0.0]},{"S":0.6019,"dims":[0.493,0.501,0.755,0.0,0.0,0.0,0.496,0.0,0.0,0.499,0.507,0.504]},{"S":0.7071,"dims":[0.499,0.503,0.5,0.0,0.0,0.501,0.5,0.0,0.506,0.497,0.0,0.494]},{"S":0.7846,"dims":[0.399,0.389,0.394,0.308,0.0,0.361,0.395,0.345,0.341,0.353,0.352,0.36]},{"S":0.8415,"dims":[0.333,0.335,0.333,0.33,0.334,0.331,0.331,0.332,0.331,0.334,0.335,0.339]},{"S":0.8834,"dims":[0.335,0.333,0.333,0.332,0.334,0.33,0.333,0.335,0.332,0.333,0.331,0.338]},{"S":0.9142,"dims":[0.334,0.331,0.334,0.33,0.334,0.33,0.334,0.332,0.336,0.335,0.331,0.335]},{"S":0.9369,"dims":[0.333,0.333,0.333,0.331,0.336,0.33,0.333,0.333,0.333,0.335,0.332,0.337]},{"S":0.9536,"dims":[0.333,0.331,0.335,0.333,0.334,0.331,0.333,0.331,0.337,0.336,0.331,0.334]},{"S":0.9659,"dims":[0.335,0.33,0.334,0.332,0.336,0.331,0.336,0.332,0.337,0.337,0.331,0.329]},{"S":0.9749,"dims":[0.329,0.34,0.342,0.328,0.346,0.325,0.331,0.325,0.344,0.33,0.327,0.328]},{"S":0.9815,"dims":[0.329,0.341,0.343,0.326,0.346,0.325,0.331,0.323,0.344,0.329,0.326,0.328]},{"S":0.9864,"dims":[0.328,0.344,0.346,0.322,0.349,0.324,0.328,0.325,0.343,0.327,0.325,0.328]},{"S":0.99,"dims":[0.326,0.345,0.346,0.321,0.35,0.324,0.328,0.326,0.342,0.327,0.328,0.324]}];

const FRACS = [
  { name: "1", v: 1 },
  { name: "2/3", v: 2 / 3 },
  { name: "1/2", v: 0.5 },
  { name: "1/3", v: 1 / 3 },
];
const PICK = [1, 3, 6, 15];

export function FeatureDimensionViz() {
  const [k, setK] = useState(1);
  const W = 330, H = 186, X0 = 30, PW = 260, Y0 = 10, PH = 140;
  const px = (S: number) => X0 + (Math.log10(1 / (1 - S)) / 2) * PW;
  const py = (d: number) => Y0 + PH - (d / 1.05) * PH;
  const sel = GEOM[PICK[k]];
  const kept = sel.dims.filter((d) => d > 0);
  const groups = new Map<string, number>();
  for (const d of kept) {
    const f = FRACS.reduce((a, b) => (Math.abs(b.v - d) < Math.abs(a.v - d) ? b : a));
    const key = Math.abs(f.v - d) < 0.04 ? f.name : d.toFixed(2);
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Sparsity to inspect">
          {PICK.map((p, i) => <button key={p} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>S = {GEOM[p].S.toFixed(2)}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Dimensionality of each feature against sparsity">
        {FRACS.map((f) => (
          <g key={f.name}>
            <line x1={X0} x2={X0 + PW} y1={py(f.v)} y2={py(f.v)} stroke="var(--border)" strokeDasharray="2 3" />
            <text x={X0 + PW + 10} y={py(f.v) + 4} className="viz-label">{f.name}</text>
          </g>
        ))}
        <line x1={px(sel.S)} x2={px(sel.S)} y1={Y0} y2={Y0 + PH} stroke="var(--border-strong)" />
        {GEOM.map((g, i) => g.dims.filter((d) => d > 0).map((d, j) => (
          <circle key={`${i}-${j}`} cx={px(g.S) + (j - 6) * 0.5} cy={py(d)} r={2.6} style={{ fill: i === PICK[k] ? "var(--accent)" : "var(--text-muted)" }} opacity={i === PICK[k] ? 1 : 0.5} />
        )))}
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border-strong)" />
        {[1, 10, 100].map((v) => <text key={v} x={X0 + (Math.log10(v) / 2) * PW} y={Y0 + PH + 13} textAnchor={v === 1 ? "start" : v === 100 ? "end" : "middle"} className="viz-label">{v}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">1 / (1 − S), log scale; dot: one feature</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        S = {sel.S.toFixed(2)}: {kept.length} of 12 features kept; dimensionalities{" "}
        {[...groups.entries()].map(([g, c]) => `${c} at ${g}`).join(", ")}
      </div>
      <figcaption className="viz-caption">
        Real toy models packing twelve equally important features into four dimensions. Each dot is one feature&apos;s dimensionality, the
        share of a dimension it effectively owns. As features get sparser the values do not slide smoothly: they jump between a few
        fractions, 2/3 for triangles, 1/2 for antipodal pairs, 1/3 when three features share each dimension, which are the geometric
        arrangements the model switches between.
      </figcaption>
    </figure>
  );
}
