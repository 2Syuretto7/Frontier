"use client";

import { useState } from "react";

type Rec = { name: string; start: string; rule: string; terms: (k: number) => number[]; note: string };

const RECS: Rec[] = [
  {
    name: "Factorial",
    start: "0! = 1",
    rule: "(n + 1)! = (n + 1) · n!",
    terms: (k) => { const a = [1]; for (let i = 1; i < k; i++) a.push(a[i - 1] * i); return a; },
    note: "Each value is defined from the one before, so every n! is defined: that is induction in disguise.",
  },
  {
    name: "Fibonacci",
    start: "F₀ = 0, F₁ = 1",
    rule: "Fₙ₊₂ = Fₙ₊₁ + Fₙ",
    terms: (k) => { const a = [0, 1]; while (a.length < k) a.push(a[a.length - 1] + a[a.length - 2]); return a.slice(0, k); },
    note: "Each term needs the two before it, so two starting values are needed. Proofs about it usually need strong induction.",
  },
  {
    name: "Doubling plus one",
    start: "a₀ = 0",
    rule: "aₙ₊₁ = 2aₙ + 1",
    terms: (k) => { const a = [0]; for (let i = 1; i < k; i++) a.push(2 * a[i - 1] + 1); return a; },
    note: "The values are 0, 1, 3, 7, 15, …: a guess of 2ⁿ − 1 can be proved by induction. These are the move counts for the Tower of Hanoi.",
  },
  {
    name: "Collatz",
    start: "c₀ = 27",
    rule: "cₙ₊₁ = cₙ / 2 if cₙ is even, 3cₙ + 1 if odd",
    terms: (k) => { const a = [27]; for (let i = 1; i < k; i++) { const c = a[i - 1]; a.push(c % 2 === 0 ? c / 2 : 3 * c + 1); } return a; },
    note: "Perfectly well defined, yet nobody knows whether every starting number eventually reaches 1. Starting at 27 it takes 111 steps and climbs as high as 9232 on the way.",
  },
];

/** Recursive definitions: a starting value and a rule that builds each term from earlier ones. */
export function RecursionViz() {
  const [r, setR] = useState(1);
  const [k, setK] = useState(10);
  const R = RECS[r];
  const ts = R.terms(k);
  const max = Math.max(...ts, 1);

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {RECS.map((x, i) => (
          <button key={x.name} type="button" className={i === r ? "btn btn-primary" : "btn"} aria-pressed={i === r} onClick={() => { setR(i); if (i !== 3) setK(Math.min(k, 16)); }}>{x.name}</button>
        ))}
      </div>
      <p style={{ margin: "14px 0 6px" }}>
        <span className="viz-verdict viz-verdict-right">Start: </span><span className="mono">{R.start}</span>
        <span className="viz-verdict viz-verdict-right" style={{ marginLeft: 20 }}>Rule: </span><span className="mono">{R.rule}</span>
      </p>
      <svg viewBox="0 0 620 160" role="img" aria-label={`The first ${k} terms: ${ts.join(", ")}`}>
        {ts.map((v, i) => {
          const w = 560 / k, h = Math.max(1, (v / max) * 110);
          return (
            <g key={i}>
              <rect x={30 + i * w + 2} y={130 - h} width={w - 4} height={h} className={i === k - 1 ? "viz-cell is-on" : "viz-cell"} />
              {k <= 16 && <text x={30 + i * w + w / 2} y={148} textAnchor="middle" className="plot-tick">{v}</text>}
            </g>
          );
        })}
      </svg>
      <div className="viz-controls">
        <span className="viz-stepper"><span className="viz-stepper-label">terms</span>
          <button type="button" className="btn" onClick={() => setK(Math.max(2, k - 1))} disabled={k <= 2} aria-label="Fewer terms">−</button>
          <span className="mono viz-stepper-value">{k}</span>
          <button type="button" className="btn" onClick={() => setK(Math.min(r === 3 ? 112 : 16, k + 1))} disabled={k >= (r === 3 ? 112 : 16)} aria-label="More terms">+</button>
        </span>
        {r === 3 && <button type="button" className="btn" onClick={() => setK(112)}>Show all 112 terms</button>}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The last term shown is <span className="mono">{ts[ts.length - 1]}</span>. {R.note}
      </figcaption>
    </figure>
  );
}
