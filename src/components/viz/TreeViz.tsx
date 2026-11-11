"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { accuracy, growTree, leaves, moons, treeProb, type Tree } from "./ml";

const V: View = { xmin: 0, xmax: 1, ymin: 0, ymax: 1, w: 320, h: 320 };

/** Collect each leaf's rectangle by walking the tree's splits. */
function boxes(t: Tree, x0 = 0, x1 = 1, y0 = 0, y1 = 1, out: { x0: number; x1: number; y0: number; y1: number; p: number }[] = []) {
  if (t.leaf) out.push({ x0, x1, y0, y1, p: t.p });
  else if (t.axis === "x") { boxes(t.lo, x0, Math.min(t.t, x1), y0, y1, out); boxes(t.hi, Math.max(t.t, x0), x1, y0, y1, out); }
  else { boxes(t.lo, x0, x1, y0, Math.min(t.t, y1), out); boxes(t.hi, x0, x1, Math.max(t.t, y0), y1, out); }
  return out;
}

/** A decision tree cutting the plane into rectangles, one split at a time. */
export function TreeViz() {
  const [depth, setDepth] = useState(2);
  const train = useMemo(() => moons(3, 100, 0.25), []);
  const test = useMemo(() => moons(11, 400, 0.25), []);
  const tree = useMemo(() => growTree(train, depth), [train, depth]);
  const f = (x: number, y: number) => (treeProb(tree, x, y) >= 0.5 ? 1 : 0) as 0 | 1;
  const { X, Y } = scales(V);
  const bx = boxes(tree);
  return (
    <figure className="viz">
      <div style={{ maxWidth: 380, margin: "0 auto" }}>
        <Chart v={V} label={`Regions of a decision tree of depth ${depth}`} xticks={[0, 0.5, 1]} yticks={[0, 0.5, 1]}>
          {bx.map((b, i) => (
            <rect key={i} x={X(b.x0)} y={Y(b.y1)} width={X(b.x1) - X(b.x0)} height={Y(b.y0) - Y(b.y1)} className={b.p >= 0.5 ? "ml-r1" : "ml-r0"} style={{ stroke: "var(--border-strong)", strokeWidth: 1 }} />
          ))}
          {train.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={4} className={p.c ? "ml-c1" : "ml-c0"} />)}
        </Chart>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{leaves(tree)}</b><span>leaves</span></div>
        <div className="ml-stat"><b>{(accuracy(train, f) * 100).toFixed(0)}%</b><span>training accuracy</span></div>
        <div className="ml-stat"><b>{(accuracy(test, f) * 100).toFixed(0)}%</b><span>accuracy on 400 new points</span></div>
      </div>
      <div className="viz-sliders">
        <label>
          maximum depth = {depth}
          <input type="range" min={0} max={8} value={depth} onChange={(e) => setDepth(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each split is a question of the form &ldquo;is x₁ at most t?&rdquo; or &ldquo;is x₂ at most t?&rdquo;, so every region is a rectangle, labelled by the majority of the training points inside it.{" "}
        {depth === 0 ? "With no splits, the tree predicts the same class everywhere." : leaves(tree) === 13 ? "Here the tree has stopped growing: every leaf is pure, training accuracy is perfect, and some leaves exist only to hold a single stray point." : "Each extra level of depth can double the number of rectangles."}
      </figcaption>
    </figure>
  );
}
