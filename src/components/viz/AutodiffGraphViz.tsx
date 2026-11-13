"use client";

import { useState } from "react";

type Mode = "eval" | "forward" | "reverse";
type Node = { id: string; op: string; args: number[]; x: number; y: number };

// f(x, y) = (x·y + sin x)·y as a graph of elementary operations.
const NODES: Node[] = [
  { id: "x", op: "input", args: [], x: 40, y: 60 },
  { id: "y", op: "input", args: [], x: 40, y: 175 },
  { id: "a", op: "×", args: [0, 1], x: 130, y: 118 },
  { id: "b", op: "sin", args: [0], x: 130, y: 32 },
  { id: "c", op: "+", args: [2, 3], x: 215, y: 75 },
  { id: "f", op: "×", args: [4, 1], x: 290, y: 140 },
];

function values(x: number, y: number) {
  const v = [x, y, x * y, Math.sin(x), 0, 0];
  v[4] = v[2] + v[3];
  v[5] = v[4] * v[1];
  return v;
}

/** Local partial derivative of node i with respect to its k-th argument. */
function local(i: number, k: number, v: number[]) {
  const n = NODES[i];
  if (n.op === "sin") return Math.cos(v[n.args[0]]);
  if (n.op === "+") return 1;
  return v[n.args[1 - k]]; // product rule for ×
}

const fmt = (z: number) => (Math.abs(z) < 5e-4 ? "0" : z.toFixed(3).replace(/0+$/, "").replace(/\.$/, ""));

/** Evaluate, forward-differentiate or reverse-differentiate a small computational graph one node at a time. */
export function AutodiffGraphViz({ mode }: { mode: Mode }) {
  const [x, setX] = useState(1);
  const [seed, setSeed] = useState<0 | 1>(0);
  const [k, setK] = useState(0);
  const y = 2;
  const v = values(x, y);
  // tangents (forward) and adjoints (reverse)
  const t = [seed === 0 ? 1 : 0, seed === 1 ? 1 : 0, 0, 0, 0, 0];
  for (let i = 2; i < 6; i++) t[i] = NODES[i].args.reduce((s, a, j) => s + local(i, j, v) * t[a], 0);
  const adj = [0, 0, 0, 0, 0, 1];
  for (let i = 5; i >= 2; i--) NODES[i].args.forEach((a, j) => { adj[a] += adj[i] * local(i, j, v); });

  const order = mode === "reverse" ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
  const shown = new Set(order.slice(0, k));
  const done = k >= 6;
  const cur = k > 0 ? order[k - 1] : -1;
  const reset = () => setK(0);

  const edges: { from: number; to: number; j: number }[] = [];
  NODES.forEach((n, i) => n.args.forEach((a, j) => edges.push({ from: a, to: i, j })));

  const label = (i: number) => {
    if (mode === "eval") return shown.has(i) ? fmt(v[i]) : "?";
    if (mode === "forward") return shown.has(i) ? `${fmt(v[i])} | ${fmt(t[i])}` : `${fmt(v[i])} | ?`;
    return shown.has(i) ? `${fmt(v[i])} | ${fmt(adj[i])}` : `${fmt(v[i])} | ?`;
  };

  const exact = seed === 0 ? y * y + Math.cos(x) * y : 2 * x * y + Math.sin(x);
  let caption: string;
  if (k === 0) {
    caption = mode === "eval"
      ? "Press Step to evaluate the nodes in topological order: each node needs only its inputs."
      : mode === "forward"
        ? `Each node will carry its value and its tangent, the derivative of that node with respect to ${seed === 0 ? "x" : "y"}. Press Step.`
        : "First a forward pass computes all values (shown). The backward pass will give each node its adjoint, ∂f/∂node, starting from ∂f/∂f = 1. Press Step.";
  } else if (!done) {
    const n = NODES[cur];
    caption = mode === "eval"
      ? `${n.id} = ${n.op === "input" ? "input" : n.op === "sin" ? `sin(${NODES[n.args[0]].id})` : `${NODES[n.args[0]].id} ${n.op} ${NODES[n.args[1]].id}`} = ${fmt(v[cur])}.`
      : mode === "forward"
        ? n.op === "input"
          ? `Seed: the tangent of ${n.id} is ${fmt(t[cur])}.`
          : `Tangent of ${n.id} = sum over its inputs of (local partial × input's tangent) = ${fmt(t[cur])}.`
        : cur === 5
          ? "Seed: the adjoint of the output is 1."
          : `Adjoint of ${n.id} = sum over the nodes that use it of (their adjoint × local partial) = ${fmt(adj[cur])}.`;
  } else {
    caption = mode === "eval"
      ? `f = (xy + sin x)·y = ${fmt(v[5])}. Every node was computed once, after its inputs.`
      : mode === "forward"
        ? `One forward sweep gave ∂f/∂${seed === 0 ? "x" : "y"} = ${fmt(t[5])} (exact: ${fmt(exact)}). The other partial needs a second sweep with the other seed.`
        : `One backward sweep gave both partials at once: ∂f/∂x = ${fmt(adj[0])}, ∂f/∂y = ${fmt(adj[1])}. Note that x and y each feed two nodes, and their adjoints add up both contributions.`;
  }

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={() => setK(Math.min(6, k + 1))} disabled={done}>Step</button>
        <button type="button" className="btn" onClick={reset}>Reset</button>
        {mode === "forward" && (
          <>
            <button type="button" className="seg" aria-pressed={seed === 0} onClick={() => { setSeed(0); reset(); }}>seed x</button>
            <button type="button" className="seg" aria-pressed={seed === 1} onClick={() => { setSeed(1); reset(); }}>seed y</button>
          </>
        )}
      </div>
      <svg viewBox="0 0 340 210" style={{ width: "100%", maxWidth: 440, display: "block", margin: "8px auto" }} role="img" aria-label="Computational graph of f(x, y) = (x y + sin x) y">
        {edges.map(({ from, to, j }) => {
          const A = NODES[from], B = NODES[to];
          const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          const active = mode === "reverse" ? from === cur : to === cur;
          return (
            <g key={`${from}-${to}`}>
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={active ? "var(--accent)" : "var(--border)"} strokeWidth={active ? 2.2 : 1.4} />
              {mode !== "eval" && (
                <text x={mx} y={my - 4} textAnchor="middle" className="viz-label" style={{ fill: "var(--text-muted)" }}>{fmt(local(to, j, v))}</text>
              )}
            </g>
          );
        })}
        {NODES.map((n, i) => (
          <g key={n.id}>
            <rect x={n.x - 34} y={n.y - 17} width={68} height={34} rx={8} fill={i === cur ? "var(--accent-soft)" : "var(--bg)"} stroke={i === cur ? "var(--accent)" : "var(--text-faint)"} />
            <text x={n.x} y={n.y - 4} textAnchor="middle" className="viz-label">{n.id}{n.op === "input" ? "" : ` = ${n.op}`}</text>
            <text x={n.x} y={n.y + 11} textAnchor="middle" className="viz-label">{label(i)}</text>
          </g>
        ))}
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">x = {x.toFixed(1)}, y = 2</span>
        <input type="range" min={-2} max={2} step={0.1} value={x} onChange={(e) => { setX(Number(e.target.value)); }} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <figcaption className="viz-caption" aria-live="polite">
        {mode === "forward" ? "Each node shows value | tangent; edges show local partial derivatives. " : mode === "reverse" ? "Each node shows value | adjoint; edges show local partial derivatives. " : ""}
        {caption}
      </figcaption>
    </figure>
  );
}
