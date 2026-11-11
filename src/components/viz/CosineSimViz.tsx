"use client";

import { useState } from "react";

const WORDS: { w: string; v: number[] }[] = [
  { w: "king", v: [0.9, 0.8, 0.1, 0.2] },
  { w: "queen", v: [0.85, 0.75, 0.15, 0.9] },
  { w: "prince", v: [0.7, 0.6, 0.1, 0.25] },
  { w: "apple", v: [0.1, 0.05, 0.9, 0.3] },
  { w: "mango", v: [0.12, 0.08, 0.85, 0.35] },
  { w: "the", v: [2.5, 2.2, 2.4, 2.1] },
];
const dotp = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
const nrm = (a: number[]) => Math.sqrt(dotp(a, a));

/** Ranking toy word vectors by dot product and by cosine similarity: a long, vague vector wins the first but not the second. */
export function CosineSimViz() {
  const [q, setQ] = useState(0);
  const [by, setBy] = useState<"cos" | "dot">("dot");
  const query = WORDS[q];
  const rows = WORDS.filter((_, i) => i !== q).map((x) => ({ w: x.w, d: dotp(query.v, x.v), c: dotp(query.v, x.v) / (nrm(query.v) * nrm(x.v)) }))
    .sort((a, b) => (by === "cos" ? b.c - a.c : b.d - a.d));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Query word">
        {WORDS.slice(0, 5).map((x, i) => <button key={x.w} type="button" className={i === q ? "btn btn-primary" : "btn"} aria-pressed={i === q} onClick={() => setQ(i)}>{x.w}</button>)}
      </div>
      <div className="viz-controls" role="group" aria-label="Rank by">
        <button type="button" className={by === "dot" ? "btn btn-primary" : "btn"} aria-pressed={by === "dot"} onClick={() => setBy("dot")}>rank by dot product</button>
        <button type="button" className={by === "cos" ? "btn btn-primary" : "btn"} aria-pressed={by === "cos"} onClick={() => setBy("cos")}>rank by cosine</button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ marginTop: 12 }}>
          <thead><tr><th>word</th><th>vector</th><th>length</th><th>dot</th><th>cosine</th></tr></thead>
          <tbody>{rows.map((r) => { const v = WORDS.find((x) => x.w === r.w)!.v; return <tr key={r.w}><td>{r.w}</td><td className="mono">({v.join(", ")})</td><td className="mono">{nrm(v).toFixed(2)}</td><td className="mono">{r.d.toFixed(2)}</td><td className="mono">{r.c.toFixed(3)}</td></tr>; })}</tbody>
        </table>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Nearest words to <b>{query.w}</b>, whose vector is ({query.v.join(", ")}). {by === "dot" ? "By dot product, the long vector for “the” comes first, simply because it is long: it is a little like everything." : "Cosine similarity divides out both lengths and compares directions only, so the related words rise to the top and “the” sinks."}
      </figcaption>
    </figure>
  );
}
