"use client";

import { useState } from "react";

type Algo = "search" | "topo" | "dijkstra" | "mst";

const NAMES = "ABCDEFG";
const POS: [number, number][] = [[60, 60], [190, 40], [320, 60], [100, 170], [230, 160], [360, 180], [470, 110]];
const WEDGES: [number, number, number][] = [[0, 1, 4], [0, 3, 2], [1, 3, 1], [1, 2, 5], [1, 4, 3], [3, 4, 7], [2, 4, 2], [2, 6, 3], [4, 5, 4], [5, 6, 1], [2, 5, 6]];
const DAG: [number, number][] = [[0, 1], [0, 3], [1, 2], [3, 4], [1, 4], [4, 5], [2, 6], [5, 6], [2, 5]];
const N = POS.length;
const key = (u: number, v: number) => (u < v ? `${u}-${v}` : `${v}-${u}`);

type Snap = { state: number[]; label: string[]; hot: string[]; list: string; note: string };

function search(dfs: boolean): Snap[] {
  const adj = Array.from({ length: N }, () => [] as number[]);
  for (const [u, v] of WEDGES) { adj[u].push(v); adj[v].push(u); }
  adj.forEach((a) => a.sort((x, y) => x - y));
  const state = Array(N).fill(0), label = Array(N).fill(""), hot: string[] = [];
  const parent = Array(N).fill(-1);
  const out: Snap[] = [];
  const fr: number[] = [0];
  state[0] = 1;
  let order = 0;
  const show = () => fr.map((i) => NAMES[i]).join(" ") || "empty";
  out.push({ state: [...state], label: [...label], hot: [], list: `${dfs ? "stack" : "queue"}: ${show()}`, note: `Start at A. ${dfs ? "A stack: the newest vertex found is explored first." : "A queue: vertices are explored in the order found."}` });
  while (fr.length) {
    const u = dfs ? fr.pop()! : fr.shift()!;
    if (state[u] === 2) continue;
    state[u] = 2;
    label[u] = String(++order);
    if (parent[u] >= 0) hot.push(key(parent[u], u));
    const added: number[] = [];
    const nbrs = dfs ? [...adj[u]].reverse() : adj[u];
    for (const v of nbrs) {
      if (state[v] === 2 || (!dfs && state[v] === 1)) continue;
      state[v] = 1; parent[v] = u; fr.push(v); added.push(v);
    }
    out.push({ state: [...state], label: [...label], hot: [...hot], list: `${dfs ? "stack" : "queue"}: ${show()}`, note: `Visit ${NAMES[u]} (number ${order}). ${added.length ? `Push ${added.map((v) => NAMES[v]).join(", ")}.` : "Nothing new to push."}` });
  }
  const last = out[out.length - 1];
  if (!last.list.endsWith("empty")) last.note += " The vertices left on the frontier were already visited, so popping them does nothing.";
  out[out.length - 1].note += dfs ? " Done: the highlighted edges form the depth-first tree, which runs deep before it branches." : " Done: the highlighted edges form the breadth-first tree, whose paths from A use the fewest edges.";
  return out;
}

function topo(): Snap[] {
  const indeg = Array(N).fill(0);
  for (const [, v] of DAG) indeg[v]++;
  const state = Array(N).fill(0), label = indeg.map(String), hot: string[] = [];
  const q = indeg.map((d, i) => (d === 0 ? i : -1)).filter((i) => i >= 0);
  q.forEach((i) => (state[i] = 1));
  const order: number[] = [];
  const out: Snap[] = [{ state: [...state], label: [...label], hot: [], list: `ready: ${q.map((i) => NAMES[i]).join(" ")}`, note: "Numbers are in-degrees: how many prerequisites remain. Vertices with none are ready." }];
  while (q.length) {
    const u = q.shift()!;
    order.push(u); state[u] = 2; label[u] = `#${order.length}`;
    const freed: number[] = [];
    for (const [a, b] of DAG) if (a === u) { hot.push(key(a, b)); indeg[b]--; label[b] = String(indeg[b]); if (indeg[b] === 0) { q.push(b); state[b] = 1; freed.push(b); } }
    out.push({ state: [...state], label: [...label], hot: [...hot], list: `order: ${order.map((i) => NAMES[i]).join(" ")}   ready: ${q.map((i) => NAMES[i]).join(" ") || "none"}`, note: `Output ${NAMES[u]} and delete its out-edges.${freed.length ? ` ${freed.map((i) => NAMES[i]).join(" and ")} now ${freed.length > 1 ? "have" : "has"} no prerequisites left.` : ""}` });
  }
  out[out.length - 1].note += ` All ${N} vertices are out, so the graph has no cycle.`;
  return out;
}

function dijkstra(): Snap[] {
  const dist = Array(N).fill(Infinity), parent = Array(N).fill(-1), state = Array(N).fill(0);
  dist[0] = 0; state[0] = 1;
  let heap: [number, number][] = [[0, 0]];
  const lab = () => dist.map((d) => (d === Infinity ? "∞" : String(d)));
  const hp = () => `heap: ${[...heap].sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([d, v]) => `(${d},${NAMES[v]})`).join(" ") || "empty"}`;
  const hot = () => parent.map((p, v) => (p >= 0 && state[v] === 2 ? key(p, v) : "")).filter(Boolean);
  const out: Snap[] = [{ state: [...state], label: lab(), hot: [], list: hp(), note: "Labels are tentative distances from A. The heap holds (distance, vertex) pairs." }];
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const [d, u] = heap.shift()!;
    if (state[u] === 2) { out.push({ state: [...state], label: lab(), hot: hot(), list: hp(), note: `Pop (${d},${NAMES[u]}): ${NAMES[u]} is already final, so skip this stale entry.` }); continue; }
    state[u] = 2;
    const relaxed: string[] = [];
    for (const [a, b, w] of WEDGES) {
      const v = a === u ? b : b === u ? a : -1;
      if (v < 0 || state[v] === 2) continue;
      if (d + w < dist[v]) { dist[v] = d + w; parent[v] = u; state[v] = 1; heap.push([d + w, v]); relaxed.push(`${NAMES[v]} to ${d + w}`); }
    }
    out.push({ state: [...state], label: lab(), hot: hot(), list: hp(), note: `Pop (${d},${NAMES[u]}): ${NAMES[u]} is final at distance ${d}.${relaxed.length ? ` Relax its edges: ${relaxed.join(", ")}.` : " No edge improves anything."}` });
  }
  out[out.length - 1].note += " The highlighted edges form the shortest-path tree.";
  return out;
}

function mst(): Snap[] {
  const parent = Array.from({ length: N }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const sorted = [...WEDGES].sort((a, b) => a[2] - b[2] || a[0] - b[0] || a[1] - b[1]);
  const hot: string[] = [];
  let total = 0;
  const comps = () => {
    const g: Record<number, string> = {};
    for (let i = 0; i < N; i++) g[find(i)] = (g[find(i)] ?? "") + NAMES[i];
    return `sets: ${Object.values(g).join(" ")}`;
  };
  const state = () => Array.from({ length: N }, (_, i) => (hot.some((k) => k.split("-").map(Number).includes(i)) ? 2 : 0));
  const label = () => Array(N).fill("");
  const out: Snap[] = [{ state: state(), label: label(), hot: [], list: comps(), note: `Sort the ${WEDGES.length} edges by weight. Every vertex starts in its own set.` }];
  for (const [u, v, w] of sorted) {
    if (hot.length === N - 1) break;
    const ru = find(u), rv = find(v);
    if (ru === rv) { out.push({ state: state(), label: label(), hot: [...hot], list: comps(), note: `Edge ${NAMES[u]}${NAMES[v]} (${w}): both ends are already in one set, so it would close a cycle. Skip.` }); continue; }
    parent[ru] = rv; hot.push(key(u, v)); total += w;
    out.push({ state: state(), label: label(), hot: [...hot], list: comps(), note: `Edge ${NAMES[u]}${NAMES[v]} (${w}) joins two sets: take it and union them. Total ${total}.` });
  }
  out[out.length - 1].note += ` ${N - 1} edges taken: a minimum spanning tree of weight ${total}.`;
  return out;
}

/** Graph algorithms one step at a time on a small graph: search, topological sort, Dijkstra and Kruskal. */
export function GraphAlgoViz({ algo }: { algo: Algo }) {
  const [dfs, setDfs] = useState(false);
  const [t, setT] = useState(0);
  const snaps = algo === "search" ? search(dfs) : algo === "topo" ? topo() : algo === "dijkstra" ? dijkstra() : mst();
  const s = snaps[Math.min(t, snaps.length - 1)];
  const done = t >= snaps.length - 1;
  const directed = algo === "topo";
  const edges: [number, number, number][] = directed ? DAG.map(([u, v]) => [u, v, 0]) : WEDGES;
  const weighted = algo === "dijkstra" || algo === "mst";
  return (
    <figure className="viz">
      {algo === "search" && (
        <div className="segmented" role="group" aria-label="Search order">
          <button type="button" className="seg" aria-pressed={!dfs} onClick={() => { setDfs(false); setT(0); }}>Breadth-first (queue)</button>
          <button type="button" className="seg" aria-pressed={dfs} onClick={() => { setDfs(true); setT(0); }}>Depth-first (stack)</button>
        </div>
      )}
      <svg viewBox="0 0 530 220" role="img" aria-label={`Graph on ${N} vertices; ${s.list}`}>
        {edges.map(([u, v, w], k) => {
          const [x1, y1] = POS[u], [x2, y2] = POS[v];
          const on = s.hot.includes(key(u, v));
          const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
          const ex = x2 - ux * 18, ey = y2 - uy * 18;
          return (
            <g key={k}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="viz-link" style={on ? { stroke: "var(--accent)", strokeWidth: 3, opacity: 1 } : undefined} />
              {directed && <polygon points={`${ex},${ey} ${ex - ux * 9 - uy * 5},${ey - uy * 9 + ux * 5} ${ex - ux * 9 + uy * 5},${ey - uy * 9 - ux * 5}`} style={{ fill: on ? "var(--accent)" : "var(--text-faint)" }} />}
              {weighted && <text x={(x1 + x2) / 2 + uy * 10} y={(y1 + y2) / 2 - ux * 10 + 4} textAnchor="middle" className="plot-tick">{w}</text>}
            </g>
          );
        })}
        {POS.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={16} style={{ fill: "var(--surface)" }} />
            <circle cx={x} cy={y} r={16} className={s.state[i] === 2 ? "viz-node is-paired" : "viz-node"} style={s.state[i] === 1 ? { strokeWidth: 3, stroke: "var(--accent)" } : undefined} />
            <text x={x} y={y + 5} textAnchor="middle" className="viz-label">{NAMES[i]}</text>
            {s.label[i] && <text x={x} y={y - 22} textAnchor="middle" className="plot-tick">{s.label[i]}</text>}
          </g>
        ))}
      </svg>
      <p className="mono" style={{ margin: "0.25rem 0", overflowWrap: "anywhere" }}>{s.list}</p>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setT(t + 1)} disabled={done}>Next step</button>
        <button type="button" className="btn" onClick={() => setT(snaps.length - 1)} disabled={done}>Finish</button>
        <button type="button" className="btn" onClick={() => setT(0)}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">{s.note}</figcaption>
    </figure>
  );
}
