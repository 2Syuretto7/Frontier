"use client";

import { useState } from "react";

// a = 2, b = -3, c = a*b, d = c + a, e = d*c
type Name = "a" | "b" | "c" | "d" | "e";
const DATA: Record<Name, number> = { a: 2, b: -3, c: -6, d: -4, e: 24 };
const DESC: Record<Name, string> = { a: "leaf", b: "leaf", c: "c = a * b", d: "d = c + a", e: "e = d * c" };
// each node's backward: list of [input, local derivative]
const LOCAL: Record<Name, [Name, number][]> = {
  a: [],
  b: [],
  c: [["a", DATA.b], ["b", DATA.a]],
  d: [["c", 1], ["a", 1]],
  e: [["d", DATA.c], ["c", DATA.d]],
};
const ORDERS: Record<"topo" | "bfs", Name[]> = { topo: ["e", "d", "c", "b", "a"], bfs: ["e", "c", "d", "a", "b"] };
const TRUE: Record<Name, number> = { a: 24, b: -20, c: -10, d: -6, e: 1 };

/** Running each node's _backward in reverse topological order, or in a breadth-first order that goes wrong. */
export function BackwardOrderViz() {
  const [mode, setMode] = useState<"topo" | "bfs">("topo");
  const [k, setK] = useState(0);
  const order = ORDERS[mode];
  const grad: Record<Name, number> = { a: 0, b: 0, c: 0, d: 0, e: 1 };
  const doneAt: Partial<Record<Name, number>> = {};
  order.slice(0, k).forEach((n, i) => {
    doneAt[n] = i;
    LOCAL[n].forEach(([p, l]) => { grad[p] += l * grad[n]; });
  });
  const late = mode === "bfs" && k >= 3; // d's closure added to c after c's closure ran
  const names: Name[] = ["e", "d", "c", "b", "a"];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={mode === "topo"} onClick={() => { setMode("topo"); setK(0); }}>reverse topological order</button>
        <button type="button" className="seg" aria-pressed={mode === "bfs"} onClick={() => { setMode("bfs"); setK(0); }}>breadth-first from e</button>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setK(Math.min(5, k + 1))} disabled={k >= 5}>Run next _backward</button>
        <button type="button" className="btn" onClick={() => setK(0)}>Reset</button>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>order: {order.map((n, i) => (i < k ? `[${n}]` : n)).join(" → ")}</div>
      <div className="mono" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "4px 12px", fontSize: 13, alignItems: "center" }}>
        <span style={{ color: "var(--text-muted)" }}>node</span>
        <span style={{ color: "var(--text-muted)" }}>made by</span>
        <span style={{ color: "var(--text-muted)" }}>grad</span>
        <span style={{ color: "var(--text-muted)" }}>true</span>
        {names.map((n) => {
          const ok = Math.abs(grad[n] - TRUE[n]) < 1e-9;
          return [
            <span key={`${n}0`} style={{ fontWeight: doneAt[n] === k - 1 ? 700 : 400 }}>{n}</span>,
            <span key={`${n}1`}>{DESC[n]}</span>,
            <span key={`${n}2`} style={{ color: k >= 5 ? (ok ? "var(--accent)" : "var(--danger)") : "var(--text)" }}>{grad[n]}</span>,
            <span key={`${n}3`} style={{ color: "var(--text-muted)" }}>{TRUE[n]}</span>,
          ];
        })}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        e.grad starts at 1. Each step runs one node&rsquo;s _backward, which adds to the grads of its inputs.{" "}
        {mode === "topo"
          ? k >= 5
            ? "Every node ran only after all the nodes that use it, so every grad was complete when it was passed on. All match the true derivatives."
            : "In reverse topological order, a node runs only after every node that uses it."
          : late
            ? "c ran while its grad was still −4: d, which also uses c, had not yet added its −6. That contribution arrives too late to reach a and b, so their grads come out wrong."
            : "Breadth-first visits c (an input of e) before d, which also uses c."}
      </figcaption>
    </figure>
  );
}
