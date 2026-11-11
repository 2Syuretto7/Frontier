"use client";

import { useState } from "react";

type Mode = "degree" | "bfs" | "tree" | "topo" | "colour" | "cut";

const POS: [number, number][] = [[80, 60], [210, 40], [330, 80], [120, 170], [250, 160], [380, 190], [470, 60], [500, 160]];
const EDGES: [number, number][] = [[0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [3, 4], [4, 5], [2, 5], [6, 7]];
const TREE_CANDIDATES: [number, number][] = [[0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [3, 4], [4, 5], [2, 5], [5, 7], [6, 7], [2, 6]];
const DAG: [number, number][] = [[0, 1], [0, 3], [1, 2], [1, 4], [3, 4], [4, 5], [2, 5], [6, 7], [2, 6], [5, 7]];
const COLOURS = ["var(--accent)", "var(--success)", "var(--danger)", "var(--warning, #b7791f)", "var(--text-faint)"];
const NAMES = "ABCDEFGH";

function mulberry(seed: number) {
  let t = seed >>> 0;
  return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}

/** One small graph, explored six ways: degrees, breadth-first search, trees, topological order, greedy colouring and random cuts. */
export function GraphLabViz({ mode }: { mode: Mode }) {
  const n = POS.length;
  const [sel, setSel] = useState(1);
  const [steps, setSteps] = useState(0);
  const [treeOn, setTreeOn] = useState<boolean[]>(TREE_CANDIDATES.map((_, i) => [0, 1, 2, 4, 7, 9, 10].includes(i)));
  const [order, setOrder] = useState<"name" | "degree">("name");
  const [seed, setSeed] = useState(1);

  const edges = mode === "tree" ? TREE_CANDIDATES.filter((_, i) => treeOn[i]) : mode === "topo" ? DAG : EDGES;
  const adj = Array.from({ length: n }, () => [] as number[]);
  for (const [u, v] of edges) { adj[u].push(v); if (mode !== "topo") adj[v].push(u); }

  // breadth-first search from sel
  const dist = Array(n).fill(-1);
  dist[sel] = 0;
  const queue = [sel];
  for (let h = 0; h < queue.length; h++) for (const v of adj[queue[h]]) if (dist[v] < 0) { dist[v] = dist[queue[h]] + 1; queue.push(v); }
  const shown = Math.min(steps, Math.max(...dist));

  // components (for tree mode)
  const comp = Array(n).fill(-1);
  let ncomp = 0;
  for (let s = 0; s < n; s++) if (comp[s] < 0) { const st = [s]; comp[s] = ncomp; while (st.length) { const u = st.pop()!; for (const v of adj[u]) if (comp[v] < 0) { comp[v] = ncomp; st.push(v); } } ncomp++; }

  // Kahn's algorithm, first `steps` removals
  const indeg = Array(n).fill(0);
  for (const [, v] of DAG) indeg[v]++;
  const topo: number[] = [];
  const left = [...indeg];
  for (let t = 0; t < Math.min(steps, n); t++) {
    const src = Array.from({ length: n }, (_, i) => i).find((i) => left[i] === 0 && !topo.includes(i));
    if (src === undefined) break;
    topo.push(src);
    for (const [u, v] of DAG) if (u === src) left[v]--;
  }

  // greedy colouring
  const deg = adj.map((a) => a.length);
  const seq = Array.from({ length: n }, (_, i) => i).sort((a, b) => (order === "degree" ? deg[b] - deg[a] || a - b : a - b));
  const col = Array(n).fill(-1);
  for (const u of seq) { const used = new Set(adj[u].map((v) => col[v])); let c = 0; while (used.has(c)) c++; col[u] = c; }
  const ncol = Math.max(...col) + 1;

  // random cut
  const rnd = mulberry(seed);
  const side = Array.from({ length: n }, () => (rnd() < 0.5 ? 0 : 1));
  const cut = EDGES.filter(([u, v]) => side[u] !== side[v]).length;
  let avg = 0;
  const r2 = mulberry(seed * 7919);
  for (let t = 0; t < 400; t++) { const s = Array.from({ length: n }, () => (r2() < 0.5 ? 0 : 1)); avg += EDGES.filter(([u, v]) => s[u] !== s[v]).length; }
  avg /= 400;

  const nodeClass = (i: number) => {
    if (mode === "degree") return i === sel || adj[sel].includes(i) ? "viz-node is-paired" : "viz-node";
    if (mode === "bfs") return dist[i] >= 0 && dist[i] <= shown ? "viz-node is-paired" : "viz-node";
    if (mode === "topo") return topo.includes(i) ? "viz-node is-paired" : "viz-node";
    return "viz-node";
  };
  const nodeFill = (i: number) => (mode === "colour" ? COLOURS[col[i] % COLOURS.length] : mode === "cut" ? (side[i] ? "var(--accent)" : "var(--surface)") : mode === "tree" ? COLOURS[comp[i] % COLOURS.length] : undefined);
  const edgeHot = (u: number, v: number) => (mode === "degree" && (u === sel || v === sel)) || (mode === "cut" && side[u] !== side[v]) || (mode === "bfs" && dist[u] >= 0 && dist[v] >= 0 && Math.abs(dist[u] - dist[v]) === 1 && Math.max(dist[u], dist[v]) <= shown);

  const arrow = (u: number, v: number) => {
    const [x1, y1] = POS[u], [x2, y2] = POS[v];
    const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const ex = x2 - ux * 17, ey = y2 - uy * 17;
    return <polygon points={`${ex},${ey} ${ex - ux * 9 - uy * 5},${ey - uy * 9 + ux * 5} ${ex - ux * 9 + uy * 5},${ey - uy * 9 - ux * 5}`} style={{ fill: "var(--accent)" }} />;
  };

  const all = mode === "tree" ? TREE_CANDIDATES : edges;
  return (
    <figure className="viz">
      {mode === "colour" && (
        <div className="segmented" role="group" aria-label="Order">
          <button type="button" className="seg" aria-pressed={order === "name"} onClick={() => setOrder("name")}>Colour in alphabetical order</button>
          <button type="button" className="seg" aria-pressed={order === "degree"} onClick={() => setOrder("degree")}>Largest degree first</button>
        </div>
      )}
      <svg viewBox="0 0 560 230" role="img" aria-label="A graph on eight vertices">
        {all.map(([u, v], k) => {
          const present = mode !== "tree" || treeOn[k];
          return (
            <g key={k} onClick={mode === "tree" ? () => setTreeOn(treeOn.map((b, j) => (j === k ? !b : b))) : undefined} style={mode === "tree" ? { cursor: "pointer" } : undefined}>
              {mode === "tree" && <line x1={POS[u][0]} y1={POS[u][1]} x2={POS[v][0]} y2={POS[v][1]} style={{ stroke: "transparent", strokeWidth: 14 }} />}
              <line x1={POS[u][0]} y1={POS[u][1]} x2={POS[v][0]} y2={POS[v][1]} className={present ? "viz-link" : "plot-ghost"} style={edgeHot(u, v) ? { stroke: "var(--danger)", opacity: 1, strokeWidth: 2.5 } : present ? undefined : { strokeDasharray: "4 4" }} />
              {mode === "topo" && arrow(u, v)}
            </g>
          );
        })}
        {POS.map(([x, y], i) => (
          <g key={i} onClick={() => { setSel(i); setSteps(0); }} style={{ cursor: "pointer" }}>
            <circle cx={x} cy={y} r={15} className={nodeClass(i)} style={nodeFill(i) ? { fill: nodeFill(i), fillOpacity: mode === "cut" ? 0.5 : 0.35 } : undefined} />
            <text x={x} y={y + 4} textAnchor="middle" className="viz-label">{NAMES[i]}</text>
            {mode === "bfs" && dist[i] >= 0 && dist[i] <= shown && <text x={x + 20} y={y - 12} className="plot-tick">{dist[i]}</text>}
            {mode === "topo" && topo.includes(i) && <text x={x + 20} y={y - 12} className="plot-tick">{topo.indexOf(i) + 1}</text>}
          </g>
        ))}
      </svg>
      {(mode === "bfs" || mode === "topo") && (
        <div className="viz-controls">
          <button type="button" className="btn" onClick={() => setSteps(steps + 1)}>{mode === "bfs" ? "Next layer" : "Remove a source"}</button>
          <button type="button" className="btn" onClick={() => setSteps(0)}>Reset</button>
        </div>
      )}
      {mode === "cut" && (
        <div className="viz-controls"><button type="button" className="btn" onClick={() => setSeed(seed + 1)}>Toss the coins again</button></div>
      )}
      <figcaption className="viz-caption" aria-live="polite">
        {mode === "degree" && <>Click a vertex. {NAMES[sel]} has degree <span className="mono">{deg[sel]}</span>, with neighbours {adj[sel].map((v) => NAMES[v]).join(", ")}. The degrees are {deg.join(", ")}, which add to <span className="mono">{deg.reduce((s, d) => s + d, 0)} = 2 × {EDGES.length}</span> edges: each edge has two ends.</>}
        {mode === "bfs" && <>Click a start vertex, then reveal one layer at a time. Numbers are distances from {NAMES[sel]}. {dist.some((d) => d < 0) ? <>Vertices {dist.map((d, i) => (d < 0 ? NAMES[i] : "")).join("")} are never reached: they lie in another connected component.</> : <>Every vertex is reached, so the graph is connected.</>}</>}
        {mode === "tree" && <>Click edges to add or remove them. {edges.length} edges on {n} vertices, {ncomp} connected component{ncomp > 1 ? "s" : ""} (shown by colour). {ncomp === 1 && edges.length === n - 1 ? <><strong>A tree</strong>: connected with n − 1 = 7 edges, so it has no cycles.</> : edges.length - n + ncomp > 0 ? <>There {edges.length - n + ncomp === 1 ? "is a cycle" : "are cycles"}: edges − vertices + components = {edges.length - n + ncomp}.</> : <>A forest, but not connected: add {ncomp - 1} more edge{ncomp > 2 ? "s" : ""} joining components.</>}</>}
        {mode === "topo" && <>Kahn&rsquo;s algorithm repeatedly removes a vertex with no incoming edges. Order so far: <span className="mono">{topo.map((i) => NAMES[i]).join(" → ") || "none"}</span>. Every edge points from earlier to later in this order.</>}
        {mode === "colour" && <>Greedy colouring gives each vertex the first colour not used by its neighbours. In this order it uses <span className="mono">{ncol}</span> colours. The triangle B, D, E needs at least 3, so 3 is optimal here.</>}
        {mode === "cut" && <>Each vertex joins a side by a fair coin toss. This toss cuts <span className="mono">{cut}</span> of the {EDGES.length} edges (red). Each edge is cut with probability ½, so the average is {EDGES.length / 2}; over 400 tosses it was {avg.toFixed(2)}. Since the average is {EDGES.length / 2}, some toss must cut at least {Math.ceil(EDGES.length / 2)}.</>}
      </figcaption>
    </figure>
  );
}
