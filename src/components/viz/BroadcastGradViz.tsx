"use client";

import { useState } from "react";

const G = [
  [1, -2, 0, 3],
  [2, 1, -1, 0],
  [-1, 4, 2, 1],
];

/** out = x + b with b broadcast along rows or columns; b.grad sums out.grad over the copies of each entry. */
export function BroadcastGradViz() {
  const [mode, setMode] = useState<"row" | "col">("row");
  const [sel, setSel] = useState(0);
  const n = mode === "row" ? 4 : 3;
  const s = Math.min(sel, n - 1);
  const inSel = (i: number, j: number) => (mode === "row" ? j === s : i === s);
  const bgrad = mode === "row" ? [0, 1, 2, 3].map((j) => G.reduce((t, r) => t + r[j], 0)) : G.map((r) => r.reduce((t, v) => t + v, 0));
  const cell = { width: 34, textAlign: "center" as const, padding: "4px 0", borderRadius: 4 };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={mode === "row"} onClick={() => { setMode("row"); setSel(0); }}>b shape (1, 4)</button>
        <button type="button" className="seg" aria-pressed={mode === "col"} onClick={() => { setMode("col"); setSel(0); }}>b shape (3, 1)</button>
      </div>
      <div className="mono" style={{ fontSize: 13, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", margin: "8px 0" }}>
        <div>
          <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>out.grad, shape (3, 4)</div>
          {G.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 2 }}>
              {r.map((v, j) => (
                <span key={j} style={{ ...cell, background: inSel(i, j) ? "var(--accent-soft)" : "transparent", border: "1px solid var(--border)" }}>{v}</span>
              ))}
            </div>
          ))}
        </div>
        <div>
          <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>b.grad, shape {mode === "row" ? "(1, 4)" : "(3, 1)"}</div>
          <div style={{ display: mode === "row" ? "flex" : "block", gap: 2 }}>
            {bgrad.map((v, k) => (
              <button key={k} type="button" onClick={() => setSel(k)} aria-pressed={k === s} className="mono" style={{ ...cell, display: "block", fontSize: 13, cursor: "pointer", color: "var(--text)", background: k === s ? "var(--accent-soft)" : "var(--bg)", border: `1px solid ${k === s ? "var(--accent)" : "var(--border)"}`, marginBottom: 2 }}>{v}</button>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Click an entry of b.grad. In the forward pass that entry of b was copied into every highlighted cell of out, so it
        receives the sum of their gradients: {G.flatMap((r, i) => r.filter((_, j) => inSel(i, j))).join(" + ").replace(/\+ -/g, "− ")} ={" "}
        {bgrad[s]}. The gradient of a broadcast is a sum over the broadcast axis.
      </figcaption>
    </figure>
  );
}
