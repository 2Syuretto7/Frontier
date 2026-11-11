"use client";

import { useState } from "react";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POS = (() => {
  const r = rng(7);
  return Array.from({ length: 12 }, (_, i) => [70 + (i % 6) * 96 + (r() - 0.5) * 40, 50 + Math.floor(i / 6) * 80 + (r() - 0.5) * 30] as const);
})();
const ORDER = [0, 7, 3, 10, 5, 1, 8, 11, 2, 6, 9, 4];

/** Counting a finite set is building a bijection with {1, …, n}; every order of counting gives the same n. */
export function CountViz() {
  const [n, setN] = useState(7);
  const [seed, setSeed] = useState(1);
  const [k, setK] = useState(0);
  const items = ORDER.filter((i) => i < n);
  const order = (() => {
    const r = rng(seed * 101), a = [...items];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  })();
  const label = new Map(order.slice(0, k).map((it, i) => [it, i + 1]));

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <span className="viz-stepper"><span className="viz-stepper-label">Objects</span>
          <button type="button" className="btn" onClick={() => { setN(Math.max(1, n - 1)); setK(0); }} disabled={n <= 1} aria-label="Fewer objects">−</button>
          <span className="mono viz-stepper-value">{n}</span>
          <button type="button" className="btn" onClick={() => { setN(Math.min(12, n + 1)); setK(0); }} disabled={n >= 12} aria-label="More objects">+</button>
        </span>
        <button type="button" className="btn btn-primary" onClick={() => setK(Math.min(n, k + 1))} disabled={k >= n}>Count one more</button>
        <button type="button" className="btn" onClick={() => setK(n)} disabled={k >= n}>Count them all</button>
        <button type="button" className="btn" onClick={() => { setSeed(seed + 1); setK(0); }}>Count again in a new order</button>
      </div>
      <svg viewBox="0 0 620 182" role="img" aria-label={`${k} of ${n} objects counted`}>
        {items.map((it) => {
          const [x, y] = POS[it];
          const c = label.get(it);
          return (
            <g key={it}>
              <circle cx={x} cy={y + 6} r={22} className={c ? "viz-cell is-on" : "viz-cell"} />
              <text x={x} y={y + 12} textAnchor="middle" className={c ? "viz-label is-on" : "viz-label"}>{c ?? ""}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        {k < n
          ? <>Counting pairs each object with one of the numbers 1, 2, 3, and so on, never using a number twice. So far {k} {k === 1 ? "object has" : "objects have"} a number.</>
          : <>Done: the counting is a bijection between these objects and {"{"}1, &hellip;, {n}{"}"}. Count again in a new order: the numbers land on different objects, but the last number is always {n}. That this cannot change is a theorem, and it rests on the pigeonhole principle.</>}
      </figcaption>
    </figure>
  );
}
