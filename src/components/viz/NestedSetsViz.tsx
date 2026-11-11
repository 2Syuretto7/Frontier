"use client";

import { useState } from "react";

type S = { el: (string | S)[] };
const set = (...el: (string | S)[]): S => ({ el });
const E = set();

const EXAMPLES: { name: string; s: S; note: string }[] = [
  { name: "∅", s: E, note: "The empty set: a box with nothing in it. It has 0 elements." },
  { name: "{∅}", s: set(E), note: "A box containing an empty box. It has 1 element, the empty set, so {∅} ≠ ∅." },
  { name: "{∅, {∅}}", s: set(E, set(E)), note: "Two elements: the empty set, and the set whose only element is the empty set." },
  { name: "{1, 2, 3}", s: set("1", "2", "3"), note: "Three elements, each a number." },
  { name: "{1, {1}}", s: set("1", set("1")), note: "Two elements: the number 1, and the set {1}. Here 1 ∈ the set and {1} ∈ the set, but 1 and {1} are different things." },
  { name: "{{1, 2}, 3}", s: set(set("1", "2"), "3"), note: "Two elements: the set {1, 2} and the number 3. The number 1 is not an element, only an element of an element." },
];

function size(s: S | string): { w: number; h: number } {
  if (typeof s === "string") return { w: 30, h: 30 };
  if (s.el.length === 0) return { w: 44, h: 44 };
  const kids = s.el.map(size);
  return { w: kids.reduce((a, k) => a + k.w, 0) + 14 * (kids.length + 1), h: Math.max(...kids.map((k) => k.h)) + 36 };
}

function Draw({ s, x, y, depth }: { s: S | string; x: number; y: number; depth: number }) {
  const { w, h } = size(s);
  if (typeof s === "string") {
    return <g><circle cx={x + 15} cy={y + 15} r={13} className="plot-point" /><text x={x + 15} y={y + 20} textAnchor="middle" className="viz-label" style={{ fill: "var(--surface)", fontWeight: 600 }}>{s}</text></g>;
  }
  let cx = x + 14;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} className={depth === 0 ? "viz-cell is-on" : "viz-cell"} style={{ fillOpacity: depth === 0 ? 0.6 : 1 }} />
      {s.el.map((k, i) => {
        const sz = size(k);
        const node = <Draw key={i} s={k} x={cx} y={y + h - 16 - sz.h} depth={depth + 1} />;
        cx += sz.w + 14;
        return node;
      })}
    </g>
  );
}

/** Sets drawn as boxes: an element is whatever sits directly inside the box, even if it is itself a box. */
export function NestedSetsViz() {
  const [k, setK] = useState(1);
  const ex = EXAMPLES[k];
  const { w, h } = size(ex.s);

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {EXAMPLES.map((x, i) => (
          <button key={x.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}><span className="mono">{x.name}</span></button>
        ))}
      </div>
      <svg viewBox="0 0 620 180" role="img" aria-label={`The set ${ex.name} drawn as nested boxes`}>
        <Draw s={ex.s} x={(620 - w) / 2} y={(170 - h) / 2 + 5} depth={0} />
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono">{ex.name}</span> has <strong>{ex.s.el.length}</strong> {ex.s.el.length === 1 ? "element" : "elements"}: count only what sits directly inside the outer box. {ex.note}
      </figcaption>
    </figure>
  );
}
