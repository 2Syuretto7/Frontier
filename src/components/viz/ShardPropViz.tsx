"use client";

import { useState } from "react";

type Ax = "tp" | null;
type Layout = { spec: [Ax, Ax]; partial: Ax };
type Op = { label: string; kind: "matmul" | "pointwise" | "constrain"; w?: [Ax, Ax]; to?: Layout };

function reshard(a: Layout, b: Layout): string {
  if (a.partial && !b.partial) return b.spec.some(Boolean) ? "reduce-scatter" : "all-reduce";
  if (a.spec[0] === b.spec[0] && a.spec[1] === b.spec[1]) return "";
  if (!a.spec.some(Boolean)) return "";                         // slicing a replicated array is local
  if (!b.spec.some(Boolean)) return "all-gather";
  return "all-to-all";
}

/** A tiny propagation pass: run the ops, inserting the collective each layout change needs. */
export function propagate(ops: Op[]) {
  let L: Layout = { spec: [null, null], partial: null };
  const rows: { label: string; layout: Layout; comm: string[] }[] = [];
  for (const op of ops) {
    const comm: string[] = [];
    const move = (t: Layout) => { const c = reshard(L, t); if (c) comm.push(c); L = t; };
    if (op.kind === "constrain") move(op.to!);
    else if (op.kind === "pointwise") { if (L.partial) move({ spec: L.spec, partial: null }); }
    else {
      const w = op.w!;
      if (L.partial) move({ spec: L.spec, partial: null });
      if (L.spec[1] !== w[0]) move({ spec: [L.spec[0], w[0]], partial: null });
      L = { spec: [L.spec[0], w[1]], partial: w[0] };
    }
    rows.push({ label: op.label, layout: L, comm });
  }
  return rows;
}

const REP: Layout = { spec: [null, null], partial: null };
const CASES: { label: string; ops: Op[] }[] = [
  { label: "columns, then rows", ops: [
    { label: "x @ W₁", kind: "matmul", w: [null, "tp"] }, { label: "gelu", kind: "pointwise" },
    { label: "h @ W₂", kind: "matmul", w: ["tp", null] }, { label: "output", kind: "constrain", to: REP }] },
  { label: "columns twice", ops: [
    { label: "x @ W₁", kind: "matmul", w: [null, "tp"] }, { label: "gelu", kind: "pointwise" },
    { label: "h @ W₂", kind: "matmul", w: [null, "tp"] }, { label: "output", kind: "constrain", to: REP }] },
  { label: "rows, sequence-sharded out", ops: [
    { label: "x @ W₁", kind: "matmul", w: [null, "tp"] }, { label: "gelu", kind: "pointwise" },
    { label: "h @ W₂", kind: "matmul", w: ["tp", null] }, { label: "output", kind: "constrain", to: { spec: ["tp", null], partial: null } }] },
];

const show = (l: Layout) => `(${l.spec.map((a) => (a ? "'tp'" : "None")).join(", ")})${l.partial ? " partial over tp" : ""}`;

export function ShardPropViz() {
  const [ci, setCi] = useState(0);
  const rows = propagate(CASES[ci].ops);
  const all = rows.flatMap((r) => r.comm);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Weight annotations">
          {CASES.map((c, j) => <button key={c.label} type="button" className="seg" aria-pressed={ci === j} onClick={() => setCi(j)}>{c.label}</button>)}
        </div>
      </div>
      <div className="mono" style={{ fontSize: 12, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", margin: "8px 0" }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "contents" }}>
            <span style={{ color: "var(--text-muted)" }}>{r.label}</span>
            <span>
              {r.comm.length > 0 && <span style={{ color: "var(--accent)" }}>{r.comm.join(" + ")} → </span>}
              {show(r.layout)}
            </span>
          </div>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        collectives inserted: {all.length ? all.join(", ") : "none"}
      </div>
      <figcaption className="viz-caption">
        The same MLP with different weight annotations, starting from a replicated input. Each line shows the layout after the step,
        with any collective the compiler must insert before it. Columns then rows leaves a partial sum that one collective completes.
        Splitting both weights by columns forces the hidden activation, four times wider, to be gathered. Asking for a
        sequence-sharded output turns the final all-reduce into a reduce-scatter, half the traffic.
      </figcaption>
    </figure>
  );
}
