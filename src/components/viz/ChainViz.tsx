"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const g = (x: number) => x * x, dg = (x: number) => 2 * x;
const f = (u: number) => Math.sin(u), df = (u: number) => Math.cos(u);
const L0 = 40, L1 = 580;
const lines = [
  { label: "x", lo: 0, hi: 2, y: 40, ticks: [0, 0.5, 1, 1.5, 2] },
  { label: "u = x²", lo: 0, hi: 4, y: 130, ticks: [0, 1, 2, 3, 4] },
  { label: "y = sin u", lo: -1, hi: 1, y: 220, ticks: [-1, -0.5, 0, 0.5, 1] },
];
const P = (i: number, v: number) => L0 + ((v - lines[i].lo) / (lines[i].hi - lines[i].lo)) * (L1 - L0);
const r4 = (v: number) => fmtNum(Number(v.toFixed(3)));

/** The chain rule as two stretchings in a row: x to u = x², then u to y = sin u. */
export function ChainViz() {
  const [x, setX] = useState(1);
  const [e, setE] = useState(0.6);
  const dx = 0.4 * 10 ** -e;
  const u0 = g(x), u1 = g(x + dx), y0 = f(u0), y1 = f(u1);
  const seg = [[x, x + dx], [u0, u1], [y0, y1]];

  return (
    <figure className="viz">
      <svg viewBox="0 0 620 250" role="img" aria-label={`A small interval near x = ${x} carried through u = x squared and y = sin u`}>
        {[0, 1].map((i) => {
          const [a0, a1] = seg[i], [b0, b1] = seg[i + 1];
          return (
            <path key={i} d={`M${P(i, a0)} ${lines[i].y} L${P(i, a1)} ${lines[i].y} L${P(i + 1, b1)} ${lines[i + 1].y} L${P(i + 1, b0)} ${lines[i + 1].y} Z`}
              style={{ fill: "var(--accent-soft)", stroke: "none" }} />
          );
        })}
        {lines.map((l, i) => (
          <g key={l.label}>
            <line x1={L0} x2={L1} y1={l.y} y2={l.y} className="viz-axis" />
            {l.ticks.map((t) => <text key={t} x={P(i, t)} y={l.y + 16} textAnchor="middle" className="plot-tick">{fmtNum(t)}</text>)}
            <text x={L0 - 6} y={l.y - 8} className="viz-label">{l.label}</text>
            <line x1={P(i, seg[i][0])} x2={P(i, seg[i][1])} y1={l.y} y2={l.y} style={{ stroke: "var(--danger)", strokeWidth: 5 }} />
          </g>
        ))}
      </svg>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 160 }}>
          x = <span className="mono">{fmtNum(x)}</span>
          <input type="range" className="viz-range" min={0.1} max={1.6} step={0.05} value={x} onChange={(ev) => setX(Number(ev.target.value))} />
        </label>
        <label className="viz-stepper-label" style={{ flex: 1, minWidth: 160 }}>
          Δx = <span className="mono">{fmtNum(Number(dx.toPrecision(2)))}</span>
          <input type="range" className="viz-range" min={0} max={2} step={0.2} value={e} onChange={(ev) => setE(Number(ev.target.value))} aria-label="How small Δx is" />
        </label>
      </div>
      <table className="table" style={{ marginTop: 8 }}>
        <thead><tr><th>stretch</th><th>measured</th><th>derivative</th></tr></thead>
        <tbody>
          <tr><td>x to u: Δu / Δx</td><td className="mono">{r4((u1 - u0) / dx)}</td><td className="mono">g′(x) = 2x = {r4(dg(x))}</td></tr>
          <tr><td>u to y: Δy / Δu</td><td className="mono">{r4((y1 - y0) / (u1 - u0))}</td><td className="mono">f′(u) = cos u = {r4(df(u0))}</td></tr>
          <tr><td>x to y: Δy / Δx</td><td className="mono">{r4((y1 - y0) / dx)}</td><td className="mono">f′(g(x)) · g′(x) = {r4(df(u0) * dg(x))}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        A small red interval of x-values is stretched by the first function, then stretched again by the second. Stretch
        factors multiply, so the overall rate is the product of the two rates. As Δx shrinks, the measured stretches approach
        the derivatives. When cos u is negative, the second step also flips the interval over.
      </figcaption>
    </figure>
  );
}
