"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { accuracy, growTree, makeRng, moons, treeProb, type Pt } from "./ml";

const V: View = { xmin: 0, xmax: 1, ymin: 0, ymax: 1, w: 320, h: 320 };
const G = 32;
const TS = [1, 2, 3, 5, 10, 25, 50, 100];

/** A random forest: many deep trees on bootstrap samples, each split on a random feature, votes averaged. */
export function ForestViz() {
  const [ti, setTi] = useState(0);
  const T = TS[ti];
  const train = useMemo(() => moons(3, 100, 0.25), []);
  const test = useMemo(() => moons(11, 400, 0.25), []);
  const trees = useMemo(() => {
    const r = makeRng(7);
    return Array.from({ length: 100 }, () => {
      const boot: Pt[] = Array.from({ length: train.length }, () => train[Math.floor(r() * train.length)]);
      return growTree(boot, 30, 1, r);
    });
  }, [train]);
  const prob = (x: number, y: number) => trees.slice(0, T).reduce((s, t) => s + treeProb(t, x, y), 0) / T;
  const f = (x: number, y: number) => (prob(x, y) >= 0.5 ? 1 : 0) as 0 | 1;
  const te = useMemo(() => accuracy(test, (x, y) => (trees.slice(0, T).reduce((s, t) => s + treeProb(t, x, y), 0) / T >= 0.5 ? 1 : 0)), [test, trees, T]);
  const { X, Y } = scales(V);
  const cells = [];
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const p = prob((i + 0.5) / G, (j + 0.5) / G);
    if (p > 0) cells.push(<rect key={`${i}-${j}`} x={X(i / G)} y={Y((j + 1) / G)} width={V.w / G + 0.5} height={V.h / G + 0.5} style={{ fill: "var(--accent)", opacity: 0.45 * p }} />);
  }
  return (
    <figure className="viz">
      <div style={{ maxWidth: 380, margin: "0 auto" }}>
        <Chart v={V} label={`Average vote of a random forest of ${T} trees`} xticks={[0, 0.5, 1]} yticks={[0, 0.5, 1]}>
          {cells}
          {train.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={4} className={p.c ? "ml-c1" : "ml-c0"} />)}
        </Chart>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{(accuracy(train, f) * 100).toFixed(0)}%</b><span>training accuracy</span></div>
        <div className="ml-stat"><b>{(te * 100).toFixed(0)}%</b><span>accuracy on 400 new points</span></div>
      </div>
      <div className="viz-sliders">
        <label>
          trees = {T}
          <input type="range" min={0} max={TS.length - 1} value={ti} onChange={(e) => setTi(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Darker shading means more trees vote for the filled class.{" "}
        {T === 1 ? "One tree, grown on a bootstrap sample with random features, is blocky and wrong in places." : T < 10 ? "A handful of trees already disagree usefully: where they split the vote, the shading is pale." : "With many trees, the jagged mistakes of individual trees cancel, and the vote traces the moons smoothly."}
      </figcaption>
    </figure>
  );
}
