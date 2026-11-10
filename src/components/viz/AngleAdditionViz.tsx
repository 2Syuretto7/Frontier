"use client";

import { useState } from "react";

const S = 280; // one unit of length, in pixels
const O = { x: 70, y: 320 };
const px = (x: number, y: number) => ({ x: O.x + S * x, y: O.y - S * y });
const rad = (d: number) => (d * Math.PI) / 180;
const f3 = (n: number) => n.toFixed(3);

function angleArc(c: { x: number; y: number }, r: number, from: number, to: number) {
  const a = { x: c.x + r * Math.cos(from), y: c.y - r * Math.sin(from) };
  const b = { x: c.x + r * Math.cos(to), y: c.y - r * Math.sin(to) };
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} A${r} ${r} 0 0 0 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

/** A small square marking a right angle at c, between the directions t1 and t2. */
function rightMark(c: { x: number; y: number }, t1: number, t2: number, k = 10) {
  const u = { x: k * Math.cos(t1), y: -k * Math.sin(t1) }, v = { x: k * Math.cos(t2), y: -k * Math.sin(t2) };
  return `M${(c.x + u.x).toFixed(1)} ${(c.y + u.y).toFixed(1)} L${(c.x + u.x + v.x).toFixed(1)} ${(c.y + u.y + v.y).toFixed(1)} L${(c.x + v.x).toFixed(1)} ${(c.y + v.y).toFixed(1)}`;
}

/**
 * The rectangle proof of the addition formulas: a right triangle with hypotenuse 1 and angle β,
 * standing on one with angle α, fits in a rectangle whose sides can be read two ways.
 */
export function AngleAdditionViz() {
  const [a, setA] = useState(30);
  const [b, setB] = useState(25);
  const A = rad(a), B = rad(b);
  const ca = Math.cos(A), sa = Math.sin(A), cb = Math.cos(B), sb = Math.sin(B);
  const o = px(0, 0), q = px(ca * cb, sa * cb), p = px(Math.cos(A + B), Math.sin(A + B));
  const r = px(ca * cb, 0), c = px(ca * cb, Math.sin(A + B)), d = px(0, Math.sin(A + B));
  const setAlpha = (v: number) => { setA(v); if (v + b > 80) setB(80 - v); };
  const setBeta = (v: number) => { setB(v); if (a + v > 80) setA(80 - v); };

  return (
    <figure className="viz">
      <svg viewBox="0 -10 620 360" role="img" aria-label={`Rectangle proof of the addition formulas with alpha ${a} degrees and beta ${b} degrees`}>
        <path d={`M${o.x} ${o.y} L${r.x} ${r.y} L${c.x} ${c.y} L${d.x} ${d.y} Z`} className="plot-ghost" />
        <path d={`M${o.x} ${o.y} L${q.x} ${q.y} L${p.x} ${p.y} Z`} className="plot-curve" />
        <line x1={r.x} y1={r.y} x2={q.x} y2={q.y} className="plot-curve-2" />
        <line x1={q.x} y1={q.y} x2={c.x} y2={c.y} className="plot-line" />
        <line x1={p.x} y1={p.y} x2={c.x} y2={c.y} className="plot-line" />
        <path d={angleArc(o, 46, 0, A)} className="plot-curve-2" />
        <path d={angleArc(o, 62, A, A + B)} className="plot-curve" />
        <path d={rightMark(q, A + Math.PI, A + Math.PI / 2)} className="plot-ghost" style={{ strokeDasharray: "none" }} />
        <path d={angleArc(q, 26, Math.PI / 2, Math.PI / 2 + A)} className="plot-curve-2" />
        <text x={o.x + 52 * Math.cos(A / 2)} y={o.y - 52 * Math.sin(A / 2) + 5} className="viz-label">α</text>
        <text x={o.x + 70 * Math.cos(A + B / 2)} y={o.y - 70 * Math.sin(A + B / 2) + 5} className="viz-label is-on">β</text>
        <text x={q.x - 10 + 34 * Math.cos(Math.PI / 2 + A / 2)} y={q.y - 34 * Math.sin(Math.PI / 2 + A / 2)} className="viz-label">α</text>
        <text x={(o.x + p.x) / 2 - 10} y={(o.y + p.y) / 2} textAnchor="end" className="viz-label is-on">1</text>
        <text x={(o.x + q.x) / 2 + 6} y={(o.y + q.y) / 2 + 16} className="viz-label">cos β</text>
        <text x={(q.x + p.x) / 2 - 12} y={(q.y + p.y) / 2 - 4} textAnchor="end" className="viz-label">sin β</text>
        <text x={(o.x + r.x) / 2} y={o.y + 20} textAnchor="middle" className="viz-label">cos α cos β</text>
        <text x={r.x + 8} y={(r.y + q.y) / 2 + 4} className="viz-label">sin α cos β</text>
        <text x={r.x + 8} y={(q.y + c.y) / 2 + 4} className="viz-label">cos α sin β</text>
        <text x={p.x + 14} y={c.y - 9} className="viz-label">sin α sin β</text>
        {[o, q, p].map((v, i) => <circle key={i} cx={v.x} cy={v.y} r={4} className="plot-point" />)}
        <text x={o.x - 8} y={o.y + 4} textAnchor="end" className="viz-label">O</text>
        <text x={q.x + 8} y={q.y + 5} className="viz-label">Q</text>
        <text x={p.x} y={p.y - 9} textAnchor="middle" className="viz-label">P</text>
      </svg>
      <div className="viz-sliders">
        <label>
          <span>α = <span className="mono">{a}°</span></span>
          <input type="range" min={5} max={75} step={1} value={a} onChange={(e) => setAlpha(Number(e.target.value))} />
        </label>
        <label>
          <span>β = <span className="mono">{b}°</span></span>
          <input type="range" min={5} max={75} step={1} value={b} onChange={(e) => setBeta(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The height of P, read on the left, is <span className="mono">sin(α + β) = {f3(Math.sin(A + B))}</span>; read on the right
        it is <span className="mono">sin α cos β + cos α sin β = {f3(sa * cb)} + {f3(ca * sb)}</span>. The width up to P is{" "}
        <span className="mono">cos(α + β) = {f3(Math.cos(A + B))}</span>, which is the bottom edge minus the top piece:{" "}
        <span className="mono">{f3(ca * cb)} − {f3(sa * sb)}</span>.
      </figcaption>
    </figure>
  );
}
