"use client";

import { useState } from "react";

const N = 60;
const DIVS = [2, 3, 5];

/** Inclusion-exclusion on 1 to 60: count the numbers divisible by at least one chosen divisor, term by term. */
export function InclusionGridViz() {
  const [on, setOn] = useState([true, true, false]);
  const chosen = DIVS.filter((_, i) => on[i]);
  const hit = (x: number) => chosen.some((d) => x % d === 0);
  const count = Array.from({ length: N }, (_, i) => i + 1).filter(hit).length;
  const terms: { set: number[]; size: number; sign: number }[] = [];
  for (let mask = 1; mask < 1 << chosen.length; mask++) {
    const set = chosen.filter((_, i) => mask & (1 << i));
    const lcm = set.reduce((a, b) => a * b, 1);
    terms.push({ set, size: Math.floor(N / lcm), sign: set.length % 2 ? 1 : -1 });
  }
  const C = 38;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {DIVS.map((d, i) => (
          <button key={d} type="button" className={on[i] ? "viz-chip is-on" : "viz-chip"} aria-pressed={on[i]} onClick={() => setOn(on.map((v, j) => (j === i ? !v : v)))}>divisible by {d}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${10 * C + 10} ${6 * C + 10}`} role="img" aria-label={`${count} of the numbers 1 to 60 are divisible by a chosen divisor`}>
        {Array.from({ length: N }, (_, i) => {
          const x = i + 1, cx = 5 + (i % 10) * C, cy = 5 + Math.floor(i / 10) * C;
          const k = chosen.filter((d) => x % d === 0).length;
          return (
            <g key={x}>
              <rect x={cx + 2} y={cy + 2} width={C - 4} height={C - 4} rx={4} className={k ? "viz-cell is-on" : "viz-cell"} style={k > 1 ? { strokeWidth: 2.5 } : undefined} />
              <text x={cx + C / 2} y={cy + C / 2 + 4} textAnchor="middle" className={k ? "viz-label is-on" : "plot-tick"}>{x}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        {chosen.length === 0 ? <>Choose at least one divisor.</> : (
          <>
            Shaded: {count} numbers. Inclusion-exclusion gives{" "}
            <span className="mono">
              {terms.map((t, i) => `${i === 0 ? "" : t.sign > 0 ? " + " : " − "}${t.size}`).join("")} = {terms.reduce((s, t) => s + t.sign * t.size, 0)}
            </span>
            : add the multiples of each divisor, subtract the multiples of each pair (counted twice), add back the multiples of all three.
            Thick borders mark numbers counted more than once by the first sum.
          </>
        )}
      </figcaption>
    </figure>
  );
}
