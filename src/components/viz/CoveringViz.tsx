"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const POINTS = 3000;

/** Many weight vectors in the unit disc; a greedy ε-cover of them in Euclidean distance. */
export function cover(eps: number, seed: number) {
  const r = rand(seed);
  const ws: [number, number][] = [];
  while (ws.length < POINTS) { const a = 2 * r() - 1, b = 2 * r() - 1; if (a * a + b * b <= 1) ws.push([a, b]); }
  const centres: [number, number][] = [];
  for (const w of ws) if (centres.every((c) => Math.hypot(w[0] - c[0], w[1] - c[1]) > eps)) centres.push(w);
  return { ws, centres };
}

const EPS = [0.5, 0.25, 0.1];

export function CoveringViz() {
  const [ei, setEi] = useState(1);
  const eps = EPS[ei];
  const { ws, centres } = useMemo(() => cover(eps, 5), [eps]);
  const S = 220, c = S / 2, sc = S / 3.1;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">scale ε</span>
        <div className="segmented" role="group" aria-label="Covering radius">
          {EPS.map((e, i) => <button key={e} type="button" className="seg" aria-pressed={ei === i} onClick={() => setEi(i)}>{e}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="Greedy cover of the unit disc of weight vectors">
        <circle cx={c} cy={c} r={sc} fill="none" stroke="var(--border)" />
        {ws.slice(0, 600).map((w, i) => <circle key={i} cx={c + sc * w[0]} cy={c - sc * w[1]} r={0.9} fill="var(--text)" fillOpacity={0.35} />)}
        {centres.map((w, i) => <circle key={`c${i}`} cx={c + sc * w[0]} cy={c - sc * w[1]} r={sc * eps} fill="var(--accent)" fillOpacity={0.12} stroke="var(--accent)" strokeOpacity={0.5} strokeWidth={0.6} />)}
        {centres.map((w, i) => <circle key={`d${i}`} cx={c + sc * w[0]} cy={c - sc * w[1]} r={1.6} fill="var(--accent)" />)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        ε = {eps}: {centres.length} balls; volumetric bound (1 + 2/ε)² = {((1 + 2 / eps) ** 2).toFixed(0)}
      </div>
      <figcaption className="viz-caption">
        Each weight vector w in the unit disc is the linear function x ↦ ⟨w, x⟩, and two functions are within ε on every
        input of norm at most 1 exactly when their weights are within ε. A greedy pass over 3000 sampled weights keeps any
        point farther than ε from every centre so far. The count grows like (1/ε)², the dimension showing up as the
        exponent: 12 balls at ε = 0.5, 39 at 0.25 and 195 at 0.1, always below the volumetric bound.
      </figcaption>
    </figure>
  );
}
