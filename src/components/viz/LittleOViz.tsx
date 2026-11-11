"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const PAIRS: { f: string; g: string; F: (x: number) => number; G: (x: number) => number; L: string; note: string }[] = [
  { f: "sin x − x", g: "x³", F: (x) => Math.sin(x) - x, G: (x) => x ** 3, L: "−1/6", note: "The ratio settles on −1/6, so sin x − x = O(x³) as x → 0, and in fact sin x = x − x³/6 + o(x³)." },
  { f: "1 − cos x", g: "x²", F: (x) => 1 - Math.cos(x), G: (x) => x * x, L: "1/2", note: "The ratio settles on 1/2: 1 − cos x = x²/2 + o(x²). Note that 1 − cos x = o(x) too, a weaker statement." },
  { f: "eˣ − 1 − x", g: "x", F: (x) => Math.expm1(x) - x, G: (x) => x, L: "0", note: "The ratio tends to 0, so eˣ − 1 − x = o(x): the error of the tangent-line approximation is small even compared with x." },
  { f: "x ln x", g: "x^0.5", F: (x) => x * Math.log(x), G: (x) => Math.sqrt(x), L: "0", note: "Only x > 0 makes sense here. The ratio √x ln x tends to 0, so x ln x = o(√x) as x → 0⁺: the logarithm is weaker than any power." },
];

/** Big-O and little-o as limits of ratios: shrink x and watch f(x)/g(x). */
export function LittleOViz() {
  const [k, setK] = useState(0);
  const P = PAIRS[k];
  const xs = [1, 0.1, 0.01, 0.001, 0.0001];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Pair of functions">
        {PAIRS.map((p, i) => <button key={p.f} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}><span className="mono">{p.f} vs {p.g}</span></button>)}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ marginTop: 12 }}>
          <thead><tr><th>x</th><th>f(x) = {P.f}</th><th>f(x) / {P.g}</th></tr></thead>
          <tbody>{xs.map((x) => <tr key={x}><td className="mono">{fmtNum(x)}</td><td className="mono">{P.F(x).toExponential(4)}</td><td className="mono">{(P.F(x) / P.G(x)).toFixed(6)}</td></tr>)}</tbody>
        </table>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        As x shrinks, f(x) goes to 0 in every row, so the values alone say little. The ratio says how fast: here it tends to {P.L}. {P.note}
      </figcaption>
    </figure>
  );
}
