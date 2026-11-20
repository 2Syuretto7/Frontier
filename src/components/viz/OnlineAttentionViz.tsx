"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 16;
const BLOCKS = [1, 4, 16];

/** Sixteen keys for one query: a logit and a two-dimensional value each, from a seeded generator. */
export function keys(seed = 5) {
  const r = rand(seed);
  return Array.from({ length: N }, () => ({ z: 4 * r() - 1, v: [r(), r()] as [number, number] }));
}

/**
 * Attention output for one query computed block by block with a running maximum m, a running sum s and an unnormalised output o.
 * Returns the normalised output o / s after each block, the number of times an earlier state was rescaled because the maximum grew,
 * and the final weights.
 */
export function onlineAttention(block: number, reversed: boolean) {
  const ks = keys();
  const order = ks.map((_, i) => i);
  if (reversed) order.reverse();
  let m = -Infinity, s = 0, o = [0, 0], rescales = 0;
  const path: [number, number][] = [];
  for (let b = 0; b < N; b += block) {
    const idx = order.slice(b, b + block);
    const mb = Math.max(...idx.map((i) => ks[i].z));
    const mn = Math.max(m, mb);
    const f = Math.exp(m - mn);
    if (b > 0 && mn > m) rescales++;
    s *= f; o = [o[0] * f, o[1] * f];
    for (const i of idx) {
      const p = Math.exp(ks[i].z - mn);
      s += p; o = [o[0] + p * ks[i].v[0], o[1] + p * ks[i].v[1]];
    }
    m = mn;
    path.push([o[0] / s, o[1] / s]);
  }
  const w = ks.map((k) => Math.exp(k.z - m) / s);
  return { ks, path, rescales, w, m, s };
}

export function OnlineAttentionViz() {
  const [b, setB] = useState(1);
  const [rev, setRev] = useState(0);
  const res = onlineAttention(BLOCKS[b], rev === 1);
  const W = 300, H = 230, P = 16, S = 196;
  const X = (x: number) => P + 40 + x * S, Y = (y: number) => P + (1 - y) * S;
  const last = res.path[res.path.length - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Keys per block">
          {BLOCKS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={b === i} onClick={() => setB(i)}>{v} key{v > 1 ? "s" : ""} per block</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Order of the keys">
          {["in order", "reversed"].map((n, i) => <button key={n} type="button" className="seg" aria-pressed={rev === i} onClick={() => setRev(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Values of the keys and the running attention output after each block">
        <rect x={X(0)} y={Y(1)} width={S} height={S} style={{ fill: "none", stroke: "var(--border)" }} />
        {res.ks.map((k, i) => (
          <circle key={i} cx={X(k.v[0])} cy={Y(k.v[1])} r={2 + 10 * Math.sqrt(res.w[i])} style={{ fill: "var(--text-muted)" }} opacity={0.45} />
        ))}
        <polyline points={res.path.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")} style={{ fill: "none", stroke: "var(--accent)" }} strokeWidth={1.5} />
        {res.path.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={i === res.path.length - 1 ? 5 : 2.5} style={{ fill: "var(--accent)" }} />)}
        <text x={X(0.5)} y={H - 2} textAnchor="middle" className="viz-label">value, first coordinate</text>
        <text x={P + 30} y={Y(0.5)} textAnchor="middle" className="viz-label" transform={`rotate(-90 ${P + 30} ${Y(0.5)})`}>second coordinate</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {res.path.length} block{res.path.length > 1 ? "s" : ""}, {res.rescales} rescaling{res.rescales === 1 ? "" : "s"}; output ({last[0].toFixed(4)}, {last[1].toFixed(4)})
      </div>
      <figcaption className="viz-caption">
        One query attends to sixteen keys; grey discs are the keys&apos; values, sized by their final attention weight. Processing the
        keys a block at a time, the kernel keeps a running maximum, a running sum and an unnormalised output, rescaling both when a larger
        logit appears. The accent path is the normalised output after each block. Its route depends on block size and order; its end
        point does not.
      </figcaption>
    </figure>
  );
}
