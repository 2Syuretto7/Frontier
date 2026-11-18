"use client";

import { useState } from "react";

type G = { adj: number[][]; pos: [number, number][] };

const ring = (n: number, cx: number, cy: number, r: number, off = 0): [number, number][] =>
  Array.from({ length: n }, (_, i) => [cx + r * Math.cos(off + (2 * Math.PI * i) / n), cy + r * Math.sin(off + (2 * Math.PI * i) / n)]);

const PAIRS: { name: string; a: G; b: G }[] = [
  {
    name: "two triangles vs hexagon",
    a: { adj: [[1, 2], [0, 2], [0, 1], [4, 5], [3, 5], [3, 4]], pos: [...ring(3, 35, 55, 24, -Math.PI / 2), ...ring(3, 35, 125, 24, -Math.PI / 2)] },
    b: { adj: Array.from({ length: 6 }, (_, i) => [(i + 5) % 6, (i + 1) % 6]), pos: ring(6, 50, 90, 40, -Math.PI / 2) },
  },
  {
    name: "branch at node 2 vs node 3",
    a: { adj: [[1], [0, 2, 5], [1, 3], [2, 4], [3], [1]], pos: [[10, 70], [35, 70], [60, 70], [85, 70], [110, 70], [35, 115]] },
    b: { adj: [[1], [0, 2], [1, 3, 5], [2, 4], [3], [2]], pos: [[10, 70], [35, 70], [60, 70], [85, 70], [110, 70], [60, 115]] },
  },
];

/** Colour refinement on both graphs with one shared palette, so equal numbers mean equal colours across graphs. */
export function refine(a: number[][], b: number[][], rounds: number) {
  let ca = a.map(() => 0), cb = b.map(() => 0);
  for (let r = 0; r < rounds; r++) {
    const sig = (adj: number[][], c: number[]) => adj.map((nb, v) => `${c[v]}|${nb.map((u) => c[u]).sort((x, y) => x - y).join(",")}`);
    const sa = sig(a, ca), sb = sig(b, cb), keys = [...new Set([...sa, ...sb])].sort();
    ca = sa.map((s) => keys.indexOf(s));
    cb = sb.map((s) => keys.indexOf(s));
  }
  const hist = (c: number[]) => [...c].sort((x, y) => x - y).join(",");
  return { ca, cb, same: hist(ca) === hist(cb) };
}

function Graph({ g, c, dx }: { g: G; c: number[]; dx: number }) {
  return (
    <g transform={`translate(${dx},0)`}>
      {g.adj.flatMap((nb, v) => nb.filter((u) => u > v).map((u) => (
        <line key={`${v}-${u}`} x1={g.pos[v][0]} y1={g.pos[v][1]} x2={g.pos[u][0]} y2={g.pos[u][1]} stroke="var(--text-muted)" strokeWidth={1.5} />
      )))}
      {g.pos.map(([x, y], v) => (
        <g key={v}>
          <circle cx={x} cy={y} r={10} fill={c[v] % 2 ? "var(--danger)" : "var(--accent)"} fillOpacity={0.25 + 0.15 * (c[v] % 4)} stroke="var(--text)" strokeWidth={1} />
          <text x={x} y={y + 4} textAnchor="middle" className="viz-label" style={{ fontWeight: 600 }}>{c[v]}</text>
        </g>
      ))}
    </g>
  );
}

export function WlRefineViz() {
  const [pi, setPi] = useState(0);
  const [rounds, setRounds] = useState(0);
  const p = PAIRS[pi], r = refine(p.a.adj, p.b.adj, rounds);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {PAIRS.map((q, i) => (
          <button key={q.name} type="button" className="seg" aria-pressed={i === pi} onClick={() => { setPi(i); setRounds(0); }}>{q.name}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        {[0, 1, 2, 3].map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={k === rounds} onClick={() => setRounds(k)}>{k} rounds</button>
        ))}
      </div>
      <svg viewBox="0 0 300 160" style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Colour refinement on two graphs side by side">
        <line x1={150} y1={10} x2={150} y2={150} stroke="var(--border)" strokeDasharray="3 3" />
        <Graph g={p.a} c={r.ca} dx={pi === 0 ? 40 : 10} />
        <Graph g={p.b} c={r.cb} dx={pi === 0 ? 180 : 165} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {r.same ? "colour counts equal: not told apart" : "colour counts differ: the graphs are different"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Every node starts with colour 0. In each round a node&apos;s new colour is determined by its old colour together with the
        multiset of its neighbours&apos; colours, using one numbering shared by both graphs. This is what a message-passing layer
        with an injective update can compute. The two branched paths have the same degrees and are separated only in round 2.
        Two triangles and a hexagon stay identical forever, since every node sees two neighbours just like itself.
      </figcaption>
    </figure>
  );
}
