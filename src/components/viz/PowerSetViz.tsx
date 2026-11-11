"use client";

import { useState } from "react";

const LETTERS = ["a", "b", "c", "d"];

/** All subsets of a small set, arranged by size, with the switch-pattern that names each one. */
export function PowerSetViz() {
  const [n, setN] = useState(3);
  const [hover, setHover] = useState<number | null>(null);
  const els = LETTERS.slice(0, n);
  const subsets = Array.from({ length: 2 ** n }, (_, m) => m);
  const bySize = Array.from({ length: n + 1 }, (_, k) => subsets.filter((m) => els.filter((_, i) => (m >> i) & 1).length === k));
  const name = (m: number) => {
    const xs = els.filter((_, i) => (m >> i) & 1);
    return xs.length ? `{${xs.join(", ")}}` : "∅";
  };
  const bits = (m: number) => els.map((_, i) => ((m >> i) & 1 ? "1" : "0")).join("");

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-stepper"><span className="viz-stepper-label">Elements</span>
          <button type="button" className="btn" onClick={() => { setN(Math.max(0, n - 1)); setHover(null); }} disabled={n <= 0} aria-label="Remove an element">−</button>
          <span className="mono viz-stepper-value">{n}</span>
          <button type="button" className="btn" onClick={() => { setN(Math.min(4, n + 1)); setHover(null); }} disabled={n >= 4} aria-label="Add an element">+</button>
        </span>
        <span className="viz-stepper-label">S = <span className="mono">{n ? `{${els.join(", ")}}` : "∅"}</span></span>
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {bySize.map((row, k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span className="viz-verdict viz-verdict-right" style={{ minWidth: 72 }}>size {k}: {row.length}</span>
            {row.map((m) => (
              <button key={m} type="button" className={`viz-chip mono ${hover === m ? "is-on" : ""}`} style={{ cursor: "pointer" }} onClick={() => setHover(m)} aria-pressed={hover === m}>{name(m)}</button>
            ))}
          </div>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The power set of S has {2 ** n} elements{n ? <> ({bySize.map((r) => r.length).join(" + ")} by size)</> : null}: each element of S is either in a subset or out, giving 2 choices {n} {n === 1 ? "time" : "times"}, so 2<sup>{n}</sup> = {2 ** n}.{" "}
        {hover !== null
          ? <>Reading the switches for {els.join(", ")} in order, the subset {name(hover)} is <span className="mono">{bits(hover)}</span>.</>
          : n ? <>Click a subset to see its pattern of in-and-out switches.</> : null}
      </figcaption>
    </figure>
  );
}
