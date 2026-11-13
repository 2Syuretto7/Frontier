"use client";

import { useState } from "react";

type Cand = { expr: string; a: [string, string]; b: [string, string] };
const SIZES: Record<string, number> = { B: 32, n: 100, m: 10 };
const TARGETS: { label: string; shape: [string, string]; cands: Cand[] }[] = [
  {
    label: "∂L/∂W",
    shape: ["n", "m"],
    cands: [
      { expr: "Xᵀ dY", a: ["n", "B"], b: ["B", "m"] },
      { expr: "dY Xᵀ", a: ["B", "m"], b: ["n", "B"] },
      { expr: "X dY", a: ["B", "n"], b: ["B", "m"] },
      { expr: "dYᵀ X", a: ["m", "B"], b: ["B", "n"] },
    ],
  },
  {
    label: "∂L/∂X",
    shape: ["B", "n"],
    cands: [
      { expr: "dY W", a: ["B", "m"], b: ["n", "m"] },
      { expr: "dY Wᵀ", a: ["B", "m"], b: ["m", "n"] },
      { expr: "Wᵀ dY", a: ["m", "n"], b: ["B", "m"] },
      { expr: "W dYᵀ", a: ["n", "m"], b: ["m", "B"] },
    ],
  },
];
const sh = ([r, c]: [string, string]) => `${r}×${c} (${SIZES[r]}×${SIZES[c]})`;

/** For Y = XW, the shapes alone pick out the gradient formulas. */
export function ShapeMatchViz() {
  const [ti, setTi] = useState(0);
  const [ci, setCi] = useState<number | null>(null);
  const T = TARGETS[ti];
  const c = ci === null ? null : T.cands[ci];
  const inner = c ? c.a[1] === c.b[0] : false;
  const result: [string, string] | null = c && inner ? [c.a[0], c.b[1]] : null;
  const right = result !== null && result[0] === T.shape[0] && result[1] === T.shape[1];
  return (
    <figure className="viz">
      <div className="mono" style={{ fontSize: 13, lineHeight: 1.7, overflowWrap: "anywhere" }}>
        Y = X W with X: {sh(["B", "n"])}, W: {sh(["n", "m"])}, so Y and dY = ∂L/∂Y: {sh(["B", "m"])}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        {TARGETS.map((t, i) => (
          <button key={t.label} type="button" className="seg" aria-pressed={ti === i} onClick={() => { setTi(i); setCi(null); }}>
            find {t.label}
          </button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        {T.cands.map((k, i) => (
          <button key={k.expr} type="button" className={`seg${ci === i ? (right ? " is-right" : " is-wrong") : ""}`} aria-pressed={ci === i} onClick={() => setCi(i)}>
            {k.expr}
          </button>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 13, lineHeight: 1.7, minHeight: 44, overflowWrap: "anywhere" }}>
        {c && (
          <>
            <div>{c.expr}: ({c.a.join("×")}) times ({c.b.join("×")})</div>
            <div style={{ color: right ? "var(--accent)" : "var(--danger)" }}>
              {!inner
                ? `inner sizes ${c.a[1]} and ${c.b[0]} do not match: not a valid product`
                : right
                  ? `gives ${result!.join("×")}, the shape of ${ti === 0 ? "W" : "X"}`
                  : `gives ${result!.join("×")}, but ${T.label} must be ${T.shape.join("×")}`}
            </div>
          </>
        )}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The gradient of a scalar loss with respect to a matrix has that matrix&rsquo;s shape, and it is linear in dY. With
        distinct sizes B, n and m, exactly one way of combining dY with the other factor (transposed or not) has the right shape,
        and it is the correct formula. Pick a candidate to check it.
      </figcaption>
    </figure>
  );
}
