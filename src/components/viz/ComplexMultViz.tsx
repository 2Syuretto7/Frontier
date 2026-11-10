"use client";

import { useState } from "react";
import { Arrow, Axes, scales, type View } from "./Plot";
import { fmtNum } from "./format";

const V: View = { xmin: -6, xmax: 6, ymin: -6, ymax: 6, w: 380, h: 380 };
const MULTS = [
  { label: "i", re: 0, im: 1 },
  { label: "−1", re: -1, im: 0 },
  { label: "2", re: 2, im: 0 },
  { label: "1 + i", re: 1, im: 1 },
];

function show(re: number, im: number) {
  if (im === 0) return fmtNum(re);
  const imPart = Math.abs(im) === 1 ? "i" : `${fmtNum(Math.abs(im))}i`;
  if (re === 0) return im < 0 ? `−${imPart}` : imPart;
  return `${fmtNum(re)} ${im < 0 ? "−" : "+"} ${imPart}`;
}

/** Complex numbers as points: multiplying by i turns the plane a quarter turn about 0. */
export function ComplexMultViz() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(1);
  const [k, setK] = useState(0);
  const m = MULTS[k];
  const pr = m.re * a - m.im * b, pi = m.re * b + m.im * a;
  const { X, Y } = scales(V);
  const o = { x: X(0), y: Y(0) };
  const what = [
    "a quarter turn anticlockwise: the length stays the same",
    "a half turn: every point goes to the opposite side of 0",
    "a stretch by 2, with no turning",
    "a turn of 45° together with a stretch by √2 ≈ 1.41",
  ][k];

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {MULTS.map((n, i) => (
          <button key={n.label} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}>
            × ({n.label})
          </button>
        ))}
      </div>
      <Axes v={V} label={`z = ${show(a, b)}; multiplied by ${m.label} it becomes ${show(pr, pi)}`}>
        <Arrow x1={o.x} y1={o.y} x2={X(pr)} y2={Y(pi)} className="plot-arrow is-hot" />
        <Arrow x1={o.x} y1={o.y} x2={X(a)} y2={Y(b)} />
        <text x={X(a) + 8} y={Y(b) - 6} className="viz-label is-on">z</text>
        <text x={X(pr) + 8} y={Y(pi) - 6} className="viz-label" style={{ fill: "var(--danger)" }}>{m.label === "−1" ? "−z" : `${m.label === "1 + i" ? "(1 + i)" : m.label}z`}</text>
        <text x={V.w - 6} y={Y(0) - 6} textAnchor="end" className="plot-tick">real</text>
        <text x={X(0) + 6} y={12} className="plot-tick">imaginary</text>
      </Axes>
      <div className="viz-sliders">
        <label>
          <span>Real part <span className="mono">{fmtNum(a)}</span></span>
          <input type="range" min={-3} max={3} step={0.5} value={a} onChange={(e) => setA(Number(e.target.value))} />
        </label>
        <label>
          <span>Imaginary part <span className="mono">{fmtNum(b)}</span></span>
          <input type="range" min={-3} max={3} step={0.5} value={b} onChange={(e) => setB(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono">({m.label})({show(a, b)}) = {show(pr, pi)}</span>. Multiplying by {m.label} is {what}.
      </figcaption>
    </figure>
  );
}
