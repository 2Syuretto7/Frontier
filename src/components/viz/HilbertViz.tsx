"use client";

import { useState } from "react";
import { Arrow } from "./Plot";

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const sgn = (x: number) => (x < 0 ? `−${-x}` : String(x));
const MODES = ["Even numbers", "Integers", "Pairs", "Positive fractions"] as const;
const G = 6;

// cells of the grid in Cantor's diagonal order
const DIAG: [number, number][] = [];
for (let s = 0; s <= 2 * (G - 1); s++) for (let i = 0; i <= s; i++) if (i < G && s - i < G) DIAG.push([i, s - i]);

/** Listing infinite sets as a sequence: the evens, the integers, pairs and the positive fractions are all countable. */
export function HilbertViz() {
  const [mode, setMode] = useState(0);
  const [k, setK] = useState(10);
  const grid = mode >= 2;
  const cells = mode === 2 ? DIAG.filter(([a, b]) => a + b < G) : DIAG.filter(([a, b]) => a + b < G && gcd(a + 1, b + 1) === 1);
  const max = grid ? cells.length : 20;
  const kk = Math.min(k, max);
  const C = 44, X0 = 120, Y0 = 34;
  const cx = (a: number) => X0 + a * C + C / 2, cy = (b: number) => Y0 + b * C + C / 2;
  const seq = (i: number) => (mode === 0 ? String(2 * i) : sgn(i % 2 ? (i + 1) / 2 : -i / 2));

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {MODES.map((m, i) => (
          <button key={m} type="button" className={i === mode ? "btn btn-primary" : "btn"} aria-pressed={i === mode} onClick={() => setMode(i)}>{m}</button>
        ))}
      </div>
      <div className="viz-controls">
        <span className="viz-stepper"><span className="viz-stepper-label">Listed</span>
          <button type="button" className="btn" onClick={() => setK(Math.max(1, kk - 1))} disabled={kk <= 1} aria-label="List fewer">−</button>
          <span className="mono viz-stepper-value">{kk}</span>
          <button type="button" className="btn" onClick={() => setK(Math.min(max, kk + 1))} disabled={kk >= max} aria-label="List more">+</button>
        </span>
      </div>
      {!grid ? (
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ margin: "8px 0" }}>
            <tbody>
              <tr><td>n</td>{Array.from({ length: kk }, (_, i) => <td key={i} className="mono">{i}</td>)}</tr>
              <tr><td>f(n)</td>{Array.from({ length: kk }, (_, i) => <td key={i} className="mono"><strong>{seq(i)}</strong></td>)}</tr>
            </tbody>
          </table>
        </div>
      ) : (
        <svg viewBox="0 0 620 316" role="img" aria-label={`The first ${kk} ${mode === 2 ? "pairs" : "fractions"} in Cantor's order`}>
          {Array.from({ length: G }, (_, a) => (
            <text key={`h${a}`} x={cx(a)} y={Y0 - 10} textAnchor="middle" className="plot-tick">{mode === 2 ? a : a + 1}</text>
          ))}
          {Array.from({ length: G }, (_, b) => (
            <text key={`v${b}`} x={X0 - 12} y={cy(b) + 4} textAnchor="end" className="plot-tick">{mode === 2 ? b : b + 1}</text>
          ))}
          <text x={X0 - 12} y={Y0 - 10} textAnchor="end" className="plot-tick">{mode === 2 ? "n \\ m" : "q \\ p"}</text>
          {cells.slice(1, kk).map(([a, b], i) => {
            const [pa, pb] = cells[i];
            if (pa + pb !== a + b) return null;
            return <Arrow key={`${a}-${b}`} x1={cx(pa)} y1={cy(pb)} x2={cx(a)} y2={cy(b)} className="plot-arrow is-muted" head={7} />;
          })}
          {Array.from({ length: G * G }, (_, t) => {
            const a = t % G, b = Math.floor(t / G);
            const idx = cells.findIndex(([x, y]) => x === a && y === b);
            const listed = idx >= 0 && idx < kk;
            const skip = mode === 3 && gcd(a + 1, b + 1) > 1;
            const txt = mode === 2 ? `${a},${b}` : `${a + 1}/${b + 1}`;
            return (
              <g key={t}>
                <rect x={X0 + a * C + 4} y={Y0 + b * C + 4} width={C - 8} height={C - 8} rx={6} style={{ fill: "var(--surface)" }} />
                <rect x={X0 + a * C + 4} y={Y0 + b * C + 4} width={C - 8} height={C - 8} rx={6} className={listed ? "viz-cell is-on" : "viz-cell"} style={skip ? { opacity: 0.35 } : undefined} />
                <text x={cx(a)} y={cy(b) + 4} textAnchor="middle" className="plot-tick" style={skip ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>{txt}</text>
              </g>
            );
          })}
          <text x={X0 + G * C + 16} y={Y0 + 20} className="plot-tick">last listed, counting from 0:</text>
          <text x={X0 + G * C + 16} y={Y0 + 42} className="viz-label is-on">
            position {kk - 1}: {mode === 2 ? `(${cells[kk - 1][0]}, ${cells[kk - 1][1]})` : `${cells[kk - 1][0] + 1}/${cells[kk - 1][1] + 1}`}
          </text>
        </svg>
      )}
      <figcaption className="viz-caption" aria-live="polite">
        {mode === 0 && <>n &#8614; 2n pairs the natural numbers with the even ones, perfectly. A part of the set is as large as the whole: this is impossible for finite sets, and typical of infinite ones.</>}
        {mode === 1 && <>List 0, 1, −1, 2, −2, 3, &hellip;: every integer appears exactly once, so the integers are countable, although they stretch off in two directions.</>}
        {mode === 2 && <>Going along the first row would never finish it. Going along the diagonals instead, each of which is finite (arrows show the order within a diagonal), reaches every pair (m, n) after finitely many steps. So ℕ × ℕ is countable.</>}
        {mode === 3 && <>The same diagonal walk through all fractions p/q, skipping those not in lowest terms (struck out), lists every positive rational number exactly once.</>}
      </figcaption>
    </figure>
  );
}
