"use client";

import { useState } from "react";
import { einsum, type Nd } from "./einsum";

const A: Nd = [[1, 2, 3], [4, 5, 6]];
const B: Nd = [[1, 0], [0, 1], [1, 1]];
const S: Nd = [[1, 2], [3, 4]];
const v: Nd = [1, 2, 3];
const w: Nd = [1, 10];
const CASES: { spec: string; ops: [string, Nd][]; name: string }[] = [
  { spec: "ij->ji", ops: [["A", A]], name: "transpose" },
  { spec: "ij->i", ops: [["A", A]], name: "row sums" },
  { spec: "ij->", ops: [["A", A]], name: "sum of everything" },
  { spec: "ii->", ops: [["S", S]], name: "trace" },
  { spec: "i,i->", ops: [["v", v], ["v", v]], name: "dot product" },
  { spec: "ij,j->i", ops: [["A", A], ["v", v]], name: "matrix times vector" },
  { spec: "ij,jk->ik", ops: [["A", A], ["B", B]], name: "matrix product" },
  { spec: "i,j->ij", ops: [["v", v], ["w", w]], name: "outer product" },
];

const show = (x: Nd): string => (Array.isArray(x) ? (Array.isArray(x[0]) ? (x as Nd[]).map(show).join("\n") : "[" + (x as number[]).join(", ") + "]") : String(x));

/** Read an einsum string as loops: free indices make the output, repeated-and-dropped indices are summed. */
export function EinsumViz() {
  const [ci, setCi] = useState(6);
  const c = CASES[ci];
  const r = einsum(c.spec, ...c.ops.map((o) => o[1]));
  const [lhs, rhs] = c.spec.split("->");
  const ins = lhs.split(",");
  const term = ins.map((s, k) => `${c.ops[k][0]}[${[...s].join(", ")}]`).join(" * ");
  const loops = [...[...rhs].map((x) => ({ x, sum: false })), ...r.summed.map((x) => ({ x, sum: true }))];
  const code = [
    `out = np.zeros(${r.outShape.length ? `(${r.outShape.join(", ")}${r.outShape.length === 1 ? "," : ""})` : "()"})`,
    ...loops.map((l, k) => `${"    ".repeat(k)}for ${l.x} in range(${r.sizes[l.x]}):${l.sum ? "    # summed" : ""}`),
    `${"    ".repeat(loops.length)}out[${[...rhs].join(", ")}] += ${term}`,
  ].join("\n");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="einsum">
          {CASES.map((x, i) => <button key={x.spec} type="button" className="seg" aria-pressed={ci === i} onClick={() => setCi(i)}><code>{x.spec}</code></button>)}
        </div>
      </div>
      <div className="trace" style={{ marginTop: 12 }}>
        <pre className="trace-code" style={{ padding: "8px 12px" }}>{`np.einsum("${c.spec}", ${c.ops.map((o) => o[0]).join(", ")})   # ${c.name}\n\n${code}`}</pre>
        <div className="trace-side">
          {c.ops.filter((o, k) => c.ops.findIndex((p) => p[0] === o[0]) === k).map(([n, x]) => (
            <div key={n} className="trace-box"><h4>{n}</h4><p className="trace-out">{show(x)}</p></div>
          ))}
          <div className="trace-box"><h4>result, shape ({r.outShape.join(", ")}{r.outShape.length === 1 ? "," : ""})</h4><p className="trace-out">{show(r.out)}</p></div>
        </div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Letters after the arrow are kept and index the output. {r.summed.length ? `The letter${r.summed.length > 1 ? "s" : ""} ${r.summed.join(", ")} ${r.summed.length > 1 ? "appear" : "appears"} before the arrow but not after, so ${r.summed.length > 1 ? "they are" : "it is"} summed over.` : "No letter is dropped, so nothing is summed: each output entry is a single product."}
      </figcaption>
    </figure>
  );
}
