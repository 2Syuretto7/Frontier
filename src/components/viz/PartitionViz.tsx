"use client";

import { useState } from "react";

const NUMS = Array.from({ length: 24 }, (_, i) => i + 1);
const ndiv = (k: number) => NUMS.filter((d) => k % d === 0).length;

/** An equivalence relation on 1 to 24 cuts it into disjoint classes: a partition. */
export function PartitionViz() {
  const [mode, setMode] = useState<0 | 1>(0);
  const [n, setN] = useState(3);
  const key = (k: number) => (mode === 0 ? k % n : ndiv(k));
  const keys = [...new Set(NUMS.map(key))].sort((a, b) => a - b);
  const classes = keys.map((c) => ({ c, xs: NUMS.filter((k) => key(k) === c) }));

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className={mode === 0 ? "btn btn-primary" : "btn"} aria-pressed={mode === 0} onClick={() => setMode(0)}>Same remainder on division by n</button>
        <button type="button" className={mode === 1 ? "btn btn-primary" : "btn"} aria-pressed={mode === 1} onClick={() => setMode(1)}>Same number of divisors</button>
        {mode === 0 && (
          <span className="viz-stepper"><span className="viz-stepper-label">n</span>
            <button type="button" className="btn" onClick={() => setN(Math.max(1, n - 1))} disabled={n <= 1} aria-label="Smaller n">−</button>
            <span className="mono viz-stepper-value">{n}</span>
            <button type="button" className="btn" onClick={() => setN(Math.min(8, n + 1))} disabled={n >= 8} aria-label="Larger n">+</button>
          </span>
        )}
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {classes.map(({ c, xs }) => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span className="viz-verdict viz-verdict-right" style={{ minWidth: 150 }}>
              {mode === 0 ? <>remainder {c}</> : <>{c} {c === 1 ? "divisor" : "divisors"}</>}
            </span>
            {xs.map((k) => <span key={k} className="viz-chip mono is-on">{k}</span>)}
          </div>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {mode === 0
          ? <>Two numbers are related when they leave the same remainder on division by {n}. The 24 numbers fall into {classes.length} {classes.length === 1 ? "class" : "classes"}, one for each possible remainder.</>
          : <>Two numbers are related when they have the same number of divisors. The 24 numbers fall into {classes.length} classes; the class of 2 divisors is exactly the primes.</>}{" "}
        Every number lies in exactly one class, and no class is empty: the classes form a <strong>partition</strong>.
      </figcaption>
    </figure>
  );
}
