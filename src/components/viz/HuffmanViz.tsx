"use client";

import { useState } from "react";

const PRESETS: { name: string; p: number[] }[] = [
  { name: "0.4 0.3 0.2 0.1", p: [0.4, 0.3, 0.2, 0.1] },
  { name: "dyadic", p: [0.5, 0.25, 0.125, 0.0625, 0.0625] },
  { name: "uniform 6", p: [1, 1, 1, 1, 1, 1].map((v) => v / 6) },
  { name: "skewed", p: [0.6, 0.15, 0.1, 0.08, 0.05, 0.02] },
];

type Node = { w: number; kids: number[]; leaf: number | null; height: number };

function build(p: number[]) {
  const nodes: Node[] = p.map((w, i) => ({ w, kids: [], leaf: i, height: 0 }));
  let live = nodes.map((_, i) => i);
  const merges: number[] = [];
  while (live.length > 1) {
    live.sort((a, b) => nodes[a].w - nodes[b].w || a - b);
    const [a, b] = live;
    nodes.push({ w: nodes[a].w + nodes[b].w, kids: [a, b], leaf: null, height: 1 + Math.max(nodes[a].height, nodes[b].height) });
    merges.push(nodes.length - 1);
    live = [...live.slice(2), nodes.length - 1];
  }
  return { nodes, merges, root: live[0] };
}

/** Huffman's algorithm step by step: repeatedly merge the two lightest trees; leaf depths are the code lengths. */
export function HuffmanViz() {
  const [pi, setPi] = useState(0);
  const p = PRESETS[pi].p;
  const { nodes, merges, root } = build(p);
  const [step, setStep] = useState(merges.length);
  const s = Math.min(step, merges.length);
  const shown = new Set(merges.slice(0, s));
  const order: number[] = [];
  const dfs = (v: number) => { if (nodes[v].leaf !== null) order.push(v); else nodes[v].kids.forEach(dfs); };
  dfs(root);
  const W = 330, H = 200, maxH = nodes[root].height || 1;
  const xs: number[] = [];
  order.forEach((v, i) => { xs[v] = 25 + (i / Math.max(1, order.length - 1)) * (W - 50); });
  const posX = (v: number): number => (nodes[v].leaf !== null ? xs[v] : (posX(nodes[v].kids[0]) + posX(nodes[v].kids[1])) / 2);
  const posY = (v: number) => 160 - (nodes[v].height / maxH) * 140;
  const depth = (v: number, d: number, out: number[]) => { if (nodes[v].leaf !== null) out[nodes[v].leaf as number] = d; else nodes[v].kids.forEach((k) => depth(k, d + 1, out)); return out; };
  const lengths = depth(root, 0, Array(p.length).fill(0));
  const L = p.reduce((a, q, i) => a + q * lengths[i], 0);
  const Hn = -p.reduce((a, q) => a + q * Math.log2(q), 0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {PRESETS.map((q, i) => (
          <button key={q.name} type="button" className="seg" aria-pressed={i === pi} onClick={() => { setPi(i); setStep(99); }}>{q.name}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          merges {s}/{merges.length}
          <input type="range" min={0} max={merges.length} value={s} onChange={(e) => setStep(Number(e.target.value))} aria-label="number of merges" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The Huffman tree after a number of merges">
        {[...shown].map((v) => nodes[v].kids.map((k, j) => (
          <g key={`${v}-${k}`}>
            <line x1={posX(v)} y1={posY(v)} x2={posX(k)} y2={posY(k)} stroke="var(--text-muted)" />
            <text x={(posX(v) + posX(k)) / 2 + (j === 0 ? -6 : 6)} y={(posY(v) + posY(k)) / 2} textAnchor="middle" className="viz-label">{j}</text>
          </g>
        )))}
        {[...shown].map((v) => (
          <g key={v}>
            <circle cx={posX(v)} cy={posY(v)} r={9} fill="var(--accent)" opacity={0.35} />
            <text x={posX(v)} y={posY(v) + 3} textAnchor="middle" className="viz-label">{nodes[v].w.toFixed(2).replace(/^0/, "")}</text>
          </g>
        ))}
        {order.map((v) => (
          <g key={v}>
            <rect x={posX(v) - 13} y={posY(v) - 9} width={26} height={18} fill="var(--accent)" opacity={0.7} />
            <text x={posX(v)} y={posY(v) + 3} textAnchor="middle" className="viz-label">{p[nodes[v].leaf as number].toFixed(2).replace(/^0/, "")}</text>
            {s === merges.length && <text x={posX(v)} y={posY(v) + 24} textAnchor="middle" className="viz-label">ℓ = {lengths[nodes[v].leaf as number]}</text>}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        expected length {L.toFixed(3)} bits; entropy {Hn.toFixed(3)} bits
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Start with one tree per symbol, weighted by its probability. Each step merges the two lightest trees under a new
        node whose weight is their sum; the edges are labelled 0 and 1. When one tree remains, each symbol&apos;s codeword is
        the path from the root, so its length is its depth. Heavy symbols are merged late and sit near the root. For the
        dyadic preset the expected length equals the entropy exactly.
      </figcaption>
    </figure>
  );
}
