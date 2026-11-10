"use client";

import { useState } from "react";

const MIN = -10, MAX = 10;

/** Integers as positions; adding is a move, multiplying by -1 is turning around through 0. */
export function SignedMovesViz() {
  const [n, setN] = useState(3);
  const [history, setHistory] = useState<string[]>([]);
  const W = 660, x0 = 30, step = 30, y = 64;
  const x = (v: number) => x0 + (v - MIN) * step;
  const ticks = Array.from({ length: MAX - MIN + 1 }, (_, i) => MIN + i);

  const apply = (label: string, f: (v: number) => number) => {
    const next = f(n);
    if (next < MIN || next > MAX) return;
    setN(next);
    setHistory((h) => [...h.slice(-5), label]);
  };

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} 112`} role="img" aria-label={`A marker at ${n} on the integer line`}>
        <line x1={x(MIN) - 10} y1={y} x2={x(MAX) + 10} y2={y} className="viz-axis" />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} y1={y - (t === 0 ? 9 : 5)} x2={x(t)} y2={y + (t === 0 ? 9 : 5)} className="viz-axis" />
            {(t % 2 === 0 || t === n) && (
              <text x={x(t)} y={y + 28} textAnchor="middle" className={t === n ? "viz-label is-on" : "viz-label"}>{t}</text>
            )}
          </g>
        ))}
        <path d={`M${x(0)} ${y - 26} L${x(n)} ${y - 26}`} className="viz-link" strokeWidth={3} style={{ transition: "d 200ms" }} />
        <text x={(x(0) + x(n)) / 2} y={y - 34} textAnchor="middle" className="viz-label">
          {n === 0 ? "at 0" : `${Math.abs(n)} to the ${n > 0 ? "right" : "left"} of 0`}
        </text>
        <circle cx={x(n)} cy={y} r={9} className="viz-node is-paired" style={{ transition: "cx 200ms cubic-bezier(0.2,0,0,1)" }} />
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => apply("+ 3", (v) => v + 3)} disabled={n + 3 > MAX}>Add 3</button>
        <button type="button" className="btn" onClick={() => apply("− 3", (v) => v - 3)} disabled={n - 3 < MIN}>Subtract 3</button>
        <button type="button" className="btn" onClick={() => apply("+ (−3)", (v) => v - 3)} disabled={n - 3 < MIN}>Add −3</button>
        <button type="button" className="btn btn-primary" onClick={() => apply("× (−1)", (v) => -v)}>Multiply by −1</button>
        <button type="button" className="btn btn-ghost" onClick={() => { setN(3); setHistory([]); }}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {history.length ? <>Start at 3, then <span className="mono">{history.join(", then ")}</span>: now at {n}. </> : null}
        Subtracting 3 and adding −3 always land in the same place. Multiplying by −1 turns you around through 0; doing it twice faces you the original way.
      </figcaption>
    </figure>
  );
}
