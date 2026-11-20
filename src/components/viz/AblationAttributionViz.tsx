"use client";

import { useState } from "react";

/** Benchmark scores with neither, one or both of two components, in three hypothetical cases. */
const CASES = [
  { name: "additive", v0: 0.5, a: 0.6, b: 0.65, ab: 0.75 },
  { name: "redundant", v0: 0.5, a: 0.7, b: 0.7, ab: 0.72 },
  { name: "synergistic", v0: 0.5, a: 0.52, b: 0.52, ab: 0.75 },
];

/** Credit given to each component by removing it from the full system, by adding it to the bare system, and by Shapley values. */
export function credits(c: { v0: number; a: number; b: number; ab: number }) {
  return {
    remove: [c.ab - c.b, c.ab - c.a],
    add: [c.a - c.v0, c.b - c.v0],
    shapley: [0.5 * (c.a - c.v0 + c.ab - c.b), 0.5 * (c.b - c.v0 + c.ab - c.a)],
  };
}

const METHODS: { key: "remove" | "add" | "shapley"; name: string }[] = [
  { key: "remove", name: "remove from full" },
  { key: "add", name: "add to bare" },
  { key: "shapley", name: "Shapley" },
];

export function AblationAttributionViz() {
  const [k, setK] = useState(1);
  const c = CASES[k];
  const cr = credits(c);
  const W = 330, H = 146, X0 = 110, PW = 200, MAX = 0.25;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="How the components interact">
          {CASES.map((x, i) => <button key={x.name} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{x.name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Credit given to two components by three attribution methods">
        {METHODS.map((m, i) => (
          <g key={m.key}>
            <text x={X0 - 8} y={24 + i * 46} textAnchor="end" className="viz-label">{m.name}</text>
            {[0, 1].map((j) => {
              const v = cr[m.key][j], y = 10 + i * 46 + j * 18;
              return (
                <g key={j}>
                  <rect x={X0} y={y} width={(Math.max(0, v) / MAX) * PW} height={14} style={{ fill: j ? "var(--text-muted)" : "var(--accent)" }} />
                  <text x={X0 + (Math.max(0, v) / MAX) * PW + 4} y={y + 11} className="viz-label">{j ? "B" : "A"} {v.toFixed(3)}</text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        scores: neither {c.v0}, A only {c.a}, B only {c.b}, both {c.ab}
      </div>
      <figcaption className="viz-caption">
        Two components of a system, A and B, and three ways to credit them. When their effects add, every method agrees. When
        either alone does the job, removing one from the full system makes it look useless. When they only work together, adding one
        to the bare system makes it look useless. Shapley values average over both orders and always share out the full gain.
      </figcaption>
    </figure>
  );
}
