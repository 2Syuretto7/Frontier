"use client";

import { useState } from "react";
import { MapDiagram } from "./MapDiagram";

const A = ["a", "b", "c", "d"], B = ["1", "2", "3"];
const OPTS: number[][] = [[0], [1], [2], [0, 2], []];
const PRESETS: { name: string; f: number[] }[] = [
  { name: "A function", f: [0, 2, 1, 2] },
  { name: "An arrow missing", f: [0, 4, 1, 2] },
  { name: "Two arrows from one", f: [0, 2, 3, 1] },
  { name: "A constant function", f: [1, 1, 1, 1] },
];

/** When is a relation from A to B a function? Every element of A must have exactly one arrow. */
export function FunctionViz() {
  const [f, setF] = useState(PRESETS[0].f);
  const targets = f.map((o) => OPTS[o]);
  const missing = A.filter((_, i) => targets[i].length === 0);
  const multi = A.filter((_, i) => targets[i].length > 1);
  const ok = !missing.length && !multi.length;
  const pairs = A.flatMap((a, i) => targets[i].map((t) => `(${a}, ${B[t]})`));
  const preset = PRESETS.findIndex((p) => p.f.every((v, i) => v === f[i]));

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {PRESETS.map((p, i) => (
          <button key={p.name} type="button" className={i === preset ? "btn btn-primary" : "btn"} aria-pressed={i === preset} onClick={() => setF(p.f)}>{p.name}</button>
        ))}
      </div>
      <MapDiagram
        label={`A relation from A to B with ${pairs.length} arrows`}
        columns={[{ title: "A", items: A, on: targets.map((t) => t.length === 1) }, { title: "B", items: B }]}
        maps={[targets]}
        arrowClass={(_, i) => (targets[i].length > 1 ? "plot-arrow is-hot" : "plot-arrow")}
        onItem={(col, i) => { if (col === 0) setF(f.map((o, j) => (j === i ? (o + 1) % OPTS.length : o))); }}
      />
      <p className={ok ? "viz-verdict viz-verdict-right" : "viz-verdict viz-verdict-wrong"} style={{ margin: "4px 0 0" }}>
        {ok
          ? "A function: every element of A has exactly one arrow."
          : [missing.length ? `Not a function: ${missing.join(" and ")} ${missing.length === 1 ? "has" : "have"} no arrow.` : "", multi.length ? `Not a function: ${multi.join(" and ")} ${multi.length === 1 ? "has" : "have"} two arrows.` : ""].filter(Boolean).join(" ")}
      </p>
      <figcaption className="viz-caption" aria-live="polite">
        As a set of ordered pairs, this relation is <span className="mono">{pairs.length ? `{${pairs.join(", ")}}` : "∅"}</span>. Click an element of A to change its
        arrows. Elements of B may receive any number of arrows, including none.
      </figcaption>
    </figure>
  );
}
