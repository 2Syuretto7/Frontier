"use client";

import { useState } from "react";
import { MapDiagram } from "./MapDiagram";

const A = ["a", "b", "c"], B = ["1", "2", "3"], C = ["x", "y", "z"];
const bij = (h: number[]) => new Set(h).size === h.length;

/** Composing f: A → B with g: B → C, and inverting a bijection. */
export function ComposeViz() {
  const [f, setF] = useState([1, 0, 2]);
  const [g, setG] = useState([2, 2, 0]);
  const [inv, setInv] = useState(false);
  const gf = f.map((t) => g[t]);
  const fInv = A.map((_, y) => f.indexOf(y));
  const show = (h: number[], from: string[], to: string[]) => from.map((x, i) => `${x} ↦ ${to[h[i]]}`).join(", ");

  return (
    <figure className="viz">
      <MapDiagram
        label="f from A to B, then g from B to C"
        columns={[{ title: "A", items: A }, { title: "B", items: B }, { title: "C", items: C }]}
        maps={[f.map((t) => [t]), g.map((t) => [t])]}
        arrowClass={(s) => (s === 0 ? "plot-arrow" : "plot-arrow is-muted")}
        onItem={(col, i) => {
          if (col === 0) setF(f.map((t, j) => (j === i ? (t + 1) % 3 : t)));
          if (col === 1) setG(g.map((t, j) => (j === i ? (t + 1) % 3 : t)));
        }}
      />
      <p className="viz-verdict viz-verdict-right" style={{ margin: "0 0 4px" }}>
        g ∘ f: <span className="mono">{show(gf, A, C)}</span>
      </p>
      <MapDiagram
        label="the composite g after f, from A to C"
        columns={[{ title: "A", items: A }, { title: "C", items: C }]}
        maps={[gf.map((t) => [t])]}
        arrowClass={() => "plot-arrow"}
      />
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <button type="button" className={inv ? "btn btn-primary" : "btn"} aria-pressed={inv} onClick={() => setInv(!inv)}>Try to reverse f</button>
      </div>
      {inv && (
        bij(f)
          ? <>
              <MapDiagram label="the inverse of f, from B to A" columns={[{ title: "B", items: B }, { title: "A", items: A }]} maps={[fInv.map((t) => [t])]} />
              <p className="viz-verdict viz-verdict-right" style={{ margin: "0 0 4px" }}>f is a bijection, so reversing its arrows gives a function f⁻¹: <span className="mono">{show(fInv, B, A)}</span>.</p>
            </>
          : <p className="viz-verdict viz-verdict-wrong" style={{ margin: "8px 0 4px" }}>
              f is not a bijection: {B.filter((_, y) => !f.includes(y)).map((y) => `nothing goes to ${y}`).concat(B.filter((_, y) => f.filter((t) => t === y).length > 1).map((y) => `two arrows reach ${y}`)).join(", and ")}. Reversed, its arrows do not form a function from B to A.
            </p>
      )}
      <figcaption className="viz-caption" aria-live="polite">
        Click elements of A to change f, and elements of B to change g. The composite g ∘ f, read &ldquo;g after f&rdquo;, follows an
        arrow of f and then an arrow of g: (g ∘ f)(x) = g(f(x)). Note the order: f is applied first, though it is written second.
      </figcaption>
    </figure>
  );
}
