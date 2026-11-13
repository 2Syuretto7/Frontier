"use client";

import { useState } from "react";

type Node = { name: string; kind: string; params: [string, number[]][]; children: string[] };
const TREE: Record<string, Node> = {
  net: { name: "net", kind: "Sequential", params: [], children: ["net.layers[0]", "net.layers[1]", "net.layers[2]"] },
  "net.layers[0]": { name: "net.layers[0]", kind: "Linear(784, 128)", params: [["W", [784, 128]], ["b", [128]]], children: [] },
  "net.layers[1]": { name: "net.layers[1]", kind: "ReLU()", params: [], children: [] },
  "net.layers[2]": { name: "net.layers[2]", kind: "Linear(128, 10)", params: [["W", [128, 10]], ["b", [10]]], children: [] },
};
const size = (s: number[]) => s.reduce((a, b) => a * b, 1);
const collect = (k: string): [string, number[]][] =>
  [...TREE[k].params.map(([n, s]) => [`${k}.${n}`, s] as [string, number[]]), ...TREE[k].children.flatMap(collect)];

/** The module tree of a small MLP; parameters() on any module walks its attributes and collects every Tensor below it. */
export function ModuleTreeViz() {
  const [sel, setSel] = useState("net");
  const ps = collect(sel);
  const total = ps.reduce((a, [, s]) => a + size(s), 0);
  const row = (k: string, depth: number) => (
    <button key={k} type="button" onClick={() => setSel(k)} aria-pressed={sel === k} className="mono" style={{ display: "block", width: "100%", textAlign: "left", fontSize: 13, padding: "4px 8px", marginLeft: depth * 18, maxWidth: `calc(100% - ${depth * 18}px)`, background: sel === k ? "var(--accent-soft)" : "transparent", border: `1px solid ${sel === k ? "var(--accent)" : "var(--border)"}`, borderRadius: 6, color: "var(--text)", cursor: "pointer", marginBottom: 4 }}>
      {k.split(".").pop()}: {TREE[k].kind}
    </button>
  );
  return (
    <figure className="viz">
      <div style={{ margin: "4px 0 10px" }}>
        {row("net", 0)}
        {TREE.net.children.map((c) => row(c, 1))}
      </div>
      <div className="mono" style={{ fontSize: 13, overflowX: "auto" }}>
        <div style={{ color: "var(--text-muted)" }}>{sel}.parameters():</div>
        {ps.length === 0 ? <div>[] (no parameters)</div> : ps.map(([n, s]) => (
          <div key={n}>{n} shape ({s.join(", ")}{s.length === 1 ? "," : ""}) = {size(s).toLocaleString("en-IN")} numbers</div>
        ))}
        <div style={{ marginTop: 4 }}>total {total.toLocaleString("en-IN")}</div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Click a module. Its parameters() looks through its own attributes: a Tensor is a parameter, a Module is searched in
        turn, and a list is searched entry by entry. Calling it on the whole network collects all four tensors; an optimiser
        needs nothing else.
      </figcaption>
    </figure>
  );
}
