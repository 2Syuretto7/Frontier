"use client";

import { useState } from "react";

type M = number[][];
const A: M = [[1, 2, 3], [4, 5, 6]];
const B: M = [[1, 0], [0, 1], [2, -1]];
const T = (m: M): M => m[0].map((_, j) => m.map((r) => r[j]));
const mm = (x: M, y: M): M => x.map((r) => y[0].map((_, j) => r.reduce((s, v, k) => s + v * y[k][j], 0)));
const flat = (m: M) => m.flat();
const shape = (m: M) => `(${m.length}, ${m[0].length})`;

type Op = { label: string; code: string; out: M; g: M; grad: M; rule: string };
const G23: M = [[1, -1, 0], [2, 0, 1]];
const OPS: Op[] = [
  { label: "A @ B", code: "out = A @ B", out: mm(A, B), g: [[1, 2], [0, -1]], grad: mm([[1, 2], [0, -1]], T(B)), rule: "A.grad += out.grad @ B.T: shapes (2, 2) @ (2, 3) give (2, 3), the shape of A." },
  { label: "sum(axis=0)", code: "out = A.sum(axis=0)", out: [A[0].map((_, j) => A[0][j] + A[1][j])], g: [[1, -2, 3]], grad: [[1, -2, 3], [1, -2, 3]], rule: "Each column was summed into one entry, so its gradient is copied back down the column: expand_dims, then broadcast." },
  { label: "sum(axis=1)", code: "out = A.sum(axis=1)", out: [A.map((r) => r.reduce((s, v) => s + v, 0))], g: [[2, -1]], grad: [[2, 2, 2], [-1, -1, -1]], rule: "Each row was summed into one entry, so its gradient is copied back along the row." },
  { label: "A.T", code: "out = A.T", out: T(A), g: T(G23), grad: G23, rule: "A transpose only moves entries, so the gradient is moved back: A.grad += out.grad.T." },
  { label: "reshape(3, 2)", code: "out = A.reshape(3, 2)", out: [[1, 2], [3, 4], [5, 6]], g: [[1, -1], [0, 2], [0, 1]], grad: [[1, -1, 0], [2, 0, 1]], rule: "A reshape keeps the entries in the same order, so the gradient is reshaped back: A.grad += out.grad.reshape(A.shape)." },
];

function Mat({ m, title }: { m: M; title: string }) {
  return (
    <div>
      <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>{title}</div>
      {m.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 2 }}>
          {r.map((v, j) => (
            <span key={j} style={{ width: 32, textAlign: "center", padding: "3px 0", border: "1px solid var(--border)", borderRadius: 4 }}>{v}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Forward and backward of matmul, axis sums, transpose and reshape on one 2 x 3 matrix. */
export function OpBackwardViz() {
  const [k, setK] = useState(0);
  const op = OPS[k];
  const outShape = k === 1 || k === 2 ? `(${flat(op.out).length},)` : shape(op.out);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {OPS.map((o, i) => (
          <button key={o.label} type="button" className="seg" aria-pressed={i === k} onClick={() => setK(i)}>{o.label}</button>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>{op.code}{k === 0 ? `, with B = ${JSON.stringify(B)}` : ""}</div>
      <div className="mono" style={{ fontSize: 13, display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start", margin: "8px 0" }}>
        <Mat m={A} title="A (2, 3)" />
        <Mat m={op.out} title={`out ${outShape}`} />
        <Mat m={op.g} title="out.grad" />
        <Mat m={op.grad} title="A.grad (2, 3)" />
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {op.rule} Whatever the operation, A.grad comes out with the shape of A.
      </figcaption>
    </figure>
  );
}
