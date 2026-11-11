"use client";

import { useState } from "react";

const CHOICES = [12, 30, 36, 60, 16];
const omega = (k: number) => { let c = 0; for (let p = 2; k > 1; p++) while (k % p === 0) { k /= p; c++; } return c; };
const isPrime = (p: number) => p > 1 && omega(p) === 1;

/** The divisors of n ordered by divisibility, drawn as a Hasse diagram. */
export function HasseViz() {
  const [n, setN] = useState(12);
  const [sel, setSel] = useState<number | null>(4);
  const divs = Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
  const levels = Math.max(...divs.map(omega));
  const byLevel = Array.from({ length: levels + 1 }, (_, l) => divs.filter((d) => omega(d) === l));
  const W = 620, H = 70 + levels * 70;
  const pos = new Map<number, [number, number]>();
  byLevel.forEach((row, l) => row.forEach((d, i) => pos.set(d, [W / 2 + (i - (row.length - 1) / 2) * 92, H - 34 - l * 70])));
  const edges: [number, number][] = [];
  divs.forEach((a) => divs.forEach((b) => { if (b % a === 0 && isPrime(b / a)) edges.push([a, b]); }));
  const comparable = (a: number, b: number) => a % b === 0 || b % a === 0;
  const s = sel !== null && n % sel === 0 ? sel : null;
  const incomp = s === null ? [] : divs.filter((d) => !comparable(d, s));
  const chain = byLevel.every((r) => r.length === 1);

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <span className="viz-stepper-label">Divisors of</span>
        {CHOICES.map((c) => (
          <button key={c} type="button" className={c === n ? "btn btn-primary" : "btn"} aria-pressed={c === n} onClick={() => { setN(c); setSel(null); }}>{c}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Hasse diagram of the divisors of ${n}`}>
        {edges.map(([a, b]) => {
          const [x1, y1] = pos.get(a)!, [x2, y2] = pos.get(b)!;
          const hot = s !== null && comparable(a, s) && comparable(b, s) && (s % b === 0 || a % s === 0);
          return <line key={`${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: hot ? "var(--accent)" : "var(--border-strong)", strokeWidth: hot ? 2.5 : 1.5 }} />;
        })}
        {divs.map((d) => {
          const [x, y] = pos.get(d)!;
          const on = s !== null && comparable(d, s);
          return (
            <g key={d} onClick={() => setSel(d)} style={{ cursor: "pointer" }} role="button" aria-label={`Select ${d}`}>
              <circle cx={x} cy={y} r={18} style={{ fill: "var(--surface)" }} />
              <circle cx={x} cy={y} r={18} className={on ? "viz-cell is-on" : "viz-cell"} style={d === s ? { strokeWidth: 3 } : undefined} />
              <text x={x} y={y + 5} textAnchor="middle" className={on ? "viz-label is-on" : "viz-label"}>{d}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        A line going up from a to b means a divides b, with nothing in between.{" "}
        {s === null
          ? <>Click a divisor to see everything comparable with it.</>
          : incomp.length === 0
            ? <>Every divisor is comparable with {s}: it divides {s} or {s} divides it.</>
            : <>Shaded: the divisors comparable with {s}. The rest ({incomp.join(", ")}) are <strong>incomparable</strong> with {s}: for instance, neither of {s} and {incomp[0]} divides the other.</>}{" "}
        {chain
          ? <>Here every pair is comparable, so divisibility on the divisors of {n} is a <strong>total order</strong>: a single chain.</>
          : <>So divisibility is a <strong>partial order</strong> here, not a total one.</>}
      </figcaption>
    </figure>
  );
}
