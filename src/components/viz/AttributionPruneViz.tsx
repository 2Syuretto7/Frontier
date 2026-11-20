"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const LAYERS = 4, FEATS = 5, ROWS = FEATS + 1;
const NODES = LAYERS * ROWS + 1;
const OUT = NODES - 1;
const layerOf = (i: number) => (i === OUT ? LAYERS : Math.floor(i / ROWS));
const isError = (i: number) => i !== OUT && i % ROWS === FEATS;

/**
 * A random attribution graph: four layers of five features plus one error node each, and an output node. A feature writes to later
 * features and to the output with sparse positive weights; error nodes only write. errScale multiplies the error nodes' weights.
 * Returns the direct-effect matrix and every node's total influence on the output, summed over all paths.
 */
export function attributionGraph(errScale: number, seed = 2) {
  const r = rand(seed);
  const A = Array.from({ length: NODES }, () => new Array(NODES).fill(0));
  for (let s = 0; s < OUT; s++) {
    for (let t = 0; t < NODES; t++) {
      if (t !== OUT && (isError(t) || layerOf(t) <= layerOf(s))) continue;
      const gap = layerOf(t) - layerOf(s);
      const p = (t === OUT ? [0.1, 0.2, 0.4, 0.85][layerOf(s)] : gap === 1 ? 0.4 : 0.1) * (isError(s) ? 1.6 : 1);
      if (r() < p) A[s][t] = (0.15 + 0.6 * r()) * (isError(s) ? errScale : 1);
    }
  }
  const inf = new Array(NODES).fill(0);
  for (let i = OUT - 1; i >= 0; i--) {
    let v = A[i][OUT];
    for (let k = i + 1; k < OUT; k++) v += A[i][k] * inf[k];
    inf[i] = v;
  }
  return { A, inf };
}

export function pruneGraph(inf: number[], keep: number) {
  const order = inf.map((_, i) => i).filter((i) => i !== OUT).sort((p, q) => inf[q] - inf[p] || p - q);
  const total = inf.reduce((s, v) => s + v, 0);
  const kept = new Set<number>([OUT]);
  let acc = 0;
  for (const i of order) {
    if (acc >= keep * total - 1e-12) break;
    kept.add(i);
    acc += inf[i];
  }
  return kept;
}

const KEEPS = [0.5, 0.8, 0.95];
const ERRS = [0.3, 1.5];

export function AttributionPruneViz() {
  const [k, setK] = useState(1);
  const [e, setE] = useState(0);
  const { A, inf } = useMemo(() => attributionGraph(ERRS[e]), [e]);
  const kept = useMemo(() => pruneGraph(inf, KEEPS[k]), [inf, k]);
  const total = inf.reduce((s, v) => s + v, 0);
  const featShare = inf.reduce((s, v, i) => s + (isError(i) ? 0 : v), 0) / total;
  const keptFeats = [...kept].filter((i) => i !== OUT && !isError(i)).length;
  const keptErr = [...kept].filter((i) => isError(i)).length;
  const W = 340, H = 176;
  const pos = (i: number) => (i === OUT ? { x: 316, y: 76 } : { x: 24 + layerOf(i) * 74, y: 14 + (i % ROWS) * 25 });
  const edges: { s: number; t: number; w: number }[] = [];
  for (let s = 0; s < OUT; s++) for (let t = 0; t < NODES; t++) if (A[s][t] > 0) edges.push({ s, t, w: A[s][t] });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Share of influence to keep">
          {KEEPS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>keep {Math.round(v * 100)}%</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Size of the error nodes">
          {["small errors", "large errors"].map((n, i) => <button key={n} type="button" className="seg" aria-pressed={e === i} onClick={() => setE(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="An attribution graph pruned to the nodes that carry most of the influence on the output">
        {edges.map(({ s, t, w }) => {
          const a = pos(s), b = pos(t), on = kept.has(s) && kept.has(t);
          return <line key={`${s}-${t}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={on ? "var(--accent)" : "var(--border)"} strokeWidth={on ? 0.6 + 2.2 * w : 0.6} opacity={on ? 0.85 : 0.6} />;
        })}
        {Array.from({ length: NODES }, (_, i) => {
          const p = pos(i), on = kept.has(i);
          const fill = on ? (isError(i) ? "var(--text)" : "var(--accent)") : "var(--bg)";
          const stroke = on ? fill : "var(--text-muted)";
          return isError(i)
            ? <rect key={i} x={p.x - 6} y={p.y - 6} width={12} height={12} style={{ fill, stroke }} />
            : <circle key={i} cx={p.x} cy={p.y} r={i === OUT ? 9 : 6} style={{ fill, stroke }} />;
        })}
        {Array.from({ length: LAYERS }, (_, l) => <text key={l} x={24 + l * 74} y={H - 8} textAnchor="middle" className="viz-label">layer {l + 1}</text>)}
        <text x={316} y={H - 8} textAnchor="middle" className="viz-label">output</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        kept {keptFeats} of {LAYERS * FEATS} features and {keptErr} of {LAYERS} error nodes; features carry {(100 * featShare).toFixed(0)}% of the influence
      </div>
      <figcaption className="viz-caption">
        A simulated attribution graph. Circles are features, squares are error nodes holding what the replacement model gets wrong, and
        each node&apos;s influence on the output sums its effect over every path. Pruning keeps the most influential nodes until the chosen
        share of total influence is covered; a few nodes usually carry most of it. When the errors are large, error nodes survive pruning
        and a large part of the computation is left unexplained.
      </figcaption>
    </figure>
  );
}
