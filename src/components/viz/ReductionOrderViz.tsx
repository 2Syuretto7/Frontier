"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const fr = Math.fround;
const G = 64, NS = [1, 2, 4, 8, 16, 32];

/** 64 per-sample gradient values of mixed sign and widely varying size, rounded to float32. */
export function samples() {
  const rng = rand(13);
  return Array.from({ length: G }, () => fr((rng() < 0.5 ? -1 : 1) * Math.exp(8 * rng())));
}

const seq = (x: number[]) => x.reduce((a, v) => fr(a + v), 0);
const tree = (x: number[]): number => {
  let v = x.map(fr);
  while (v.length > 1) {
    if (v.length % 2) v.push(0);
    v = Array.from({ length: v.length / 2 }, (_, i) => fr(v[2 * i] + v[2 * i + 1]));
  }
  return v[0];
};

/** Data-parallel sum on N ranks: per-rank sums of contiguous blocks, then combined, either in order or by a fixed tree. */
export function dpSum(x: number[], N: number, fixedTree: boolean) {
  const k = x.length / N;
  const blocks = Array.from({ length: N }, (_, r) => x.slice(r * k, (r + 1) * k));
  return fixedTree ? tree(blocks.map(tree)) : seq(blocks.map(seq));
}

export function ReductionOrderViz() {
  const [fixed, setFixed] = useState(false);
  const x = samples();
  const vals = NS.map((n) => dpSum(x, n, fixed));
  const distinct = new Set(vals).size;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Reduction order">
          <button type="button" className="seg" aria-pressed={!fixed} onClick={() => setFixed(false)}>in order on each rank</button>
          <button type="button" className="seg" aria-pressed={fixed} onClick={() => setFixed(true)}>fixed tree</button>
        </div>
      </div>
      <div className="mono" style={{ fontSize: 12, display: "grid", gridTemplateColumns: "auto 1fr", gap: "3px 14px", margin: "8px 0" }}>
        {NS.map((n, i) => (
          <div key={n} style={{ display: "contents" }}>
            <span style={{ color: "var(--text-muted)" }}>{n} rank{n > 1 ? "s" : ""}</span>
            <span style={{ color: vals[i] === vals[0] ? "var(--text)" : "var(--accent)" }}>{vals[i].toPrecision(9)}</span>
          </div>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {distinct === 1 ? "the same float32 value for every world size" : `${distinct} different float32 values across ${NS.length} world sizes`}
      </div>
      <figcaption className="viz-caption">
        The same 64 per-sample gradients, summed in float32 by data-parallel jobs of different sizes. Adding each rank&apos;s samples
        in order and then the ranks in order changes the grouping whenever the number of ranks changes, and rounding makes the totals
        differ in their last digits; values differing from the one-rank result are highlighted. A fixed binary tree over the global
        sample index gives the same bits for every power-of-two world size.
      </figcaption>
    </figure>
  );
}
