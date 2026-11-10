"use client";

import { useState } from "react";

const LABEL = (n: number) => (n >= 0 ? String(2 ** n) : `1/${2 ** -n}`);

/** Powers of 2 as a ladder: each step down divides by 2, which forces 2⁰ = 1 and 2⁻ⁿ = 1/2ⁿ. */
export function PowerLadderViz() {
  const [n, setN] = useState(3);
  const ns = Array.from({ length: 9 }, (_, i) => 5 - i); // 5 down to -3
  const W = 620, rowH = 28;

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${ns.length * rowH + 8}`} role="img" aria-label={`2 to the power ${n} is ${LABEL(n)}`}>
        {ns.map((k, i) => {
          const y = 4 + i * rowH;
          const w = Math.max(3, (2 ** k / 32) * 480);
          const on = k === n;
          const reached = k >= n;
          return (
            <g key={k} style={{ opacity: reached ? 1 : 0.35, transition: "opacity 200ms" }}>
              <text x={56} y={y + 18} textAnchor="end" className={on ? "viz-label is-on" : "viz-label"}>2<tspan dy={-6} fontSize={10}>{k}</tspan></text>
              <rect x={70} y={y + 4} width={w} height={rowH - 10} rx={3} className={on ? "viz-region" : "viz-cell"} />
              <text x={80 + w} y={y + 18} className={on ? "viz-label is-on" : "viz-label"}>{LABEL(k)}</text>
            </g>
          );
        })}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => setN((v) => Math.max(-3, v - 1))} disabled={n === -3}>Step down: divide by 2</button>
        <button type="button" className="btn" onClick={() => setN((v) => Math.min(5, v + 1))} disabled={n === 5}>Step up: multiply by 2</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {n > 0 && <>2<sup>{n}</sup> is {n} twos multiplied together. Keep stepping down past 2<sup>1</sup>.</>}
        {n === 0 && <>One step below 2<sup>1</sup> = 2 is 2 ÷ 2 = 1. So 2<sup>0</sup> must be 1 if the pattern is to continue.</>}
        {n < 0 && <>Below 1, each step still halves: 2<sup>{n}</sup> = {LABEL(n)} = 1/2<sup>{-n}</sup>. A negative exponent means &ldquo;divide&rdquo;, not &ldquo;negative&rdquo;.</>}
      </figcaption>
    </figure>
  );
}
