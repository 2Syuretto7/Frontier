"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const N = 14;

/** A linear recurrence aₙ = p·aₙ₋₁ + q·aₙ₋₂: its terms, and the ratio aₙ/aₙ₋₁ settling to the largest root of x² = px + q. */
export function RecurrenceRootViz() {
  const [p, setP] = useState(1);
  const [q, setQ] = useState(1);
  const [a0, setA0] = useState(0);
  const [a1, setA1] = useState(1);
  const a = [a0, a1];
  for (let i = 2; i <= N; i++) a.push(p * a[i - 1] + q * a[i - 2]);
  const disc = p * p + 4 * q;
  const roots = disc >= 0 ? [(p + Math.sqrt(disc)) / 2, (p - Math.sqrt(disc)) / 2] : null;
  const ratio = a[N - 1] !== 0 ? a[N] / a[N - 1] : NaN;
  const W = 560, H = 200, top = Math.max(1, ...a.map(Math.abs)), bw = (W - 20) / (N + 1);
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label="Terms of the recurrence">
        <line x1={10} x2={W - 10} y1={H / 2} y2={H / 2} className="plot-ghost" />
        {a.map((v, i) => {
          const h = (Math.abs(v) / top) * (H / 2 - 8);
          return (
            <g key={i}>
              <rect x={10 + i * bw + 3} y={v >= 0 ? H / 2 - h : H / 2} width={bw - 6} height={h} className="viz-cell is-on" />
              <text x={10 + i * bw + bw / 2} y={H + 16} textAnchor="middle" className="plot-tick">{i}</text>
            </g>
          );
        })}
      </svg>
      <div className="viz-sliders">
        <label><span>p = <span className="mono">{p}</span></span><input type="range" min={-2} max={3} value={p} onChange={(e) => setP(Number(e.target.value))} /></label>
        <label><span>q = <span className="mono">{q}</span></span><input type="range" min={-2} max={3} value={q} onChange={(e) => setQ(Number(e.target.value))} /></label>
        <label><span>a₀ = <span className="mono">{a0}</span></span><input type="range" min={-3} max={3} value={a0} onChange={(e) => setA0(Number(e.target.value))} /></label>
        <label><span>a₁ = <span className="mono">{a1}</span></span><input type="range" min={-3} max={3} value={a1} onChange={(e) => setA1(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        aₙ = {p}·aₙ₋₁ + {q}·aₙ₋₂ gives {a.slice(0, 8).map(fmtNum).join(", ")}, … The characteristic equation x² = {p}x + {q} has{" "}
        {roots ? <>roots <span className="mono">{fmtNum(Number(roots[0].toFixed(4)))}</span> and <span className="mono">{fmtNum(Number(roots[1].toFixed(4)))}</span></> : <>complex roots, so the terms oscillate</>}.
        {" "}The ratio a₁₄/a₁₃ is <span className="mono">{fmtNum(Number(ratio.toFixed(4)))}</span>
        {roots && Math.abs(roots[0]) !== Math.abs(roots[1]) ? <>, close to the root of largest size, which dominates the closed form A·r₁ⁿ + B·r₂ⁿ.</> : <>.</>}
      </figcaption>
    </figure>
  );
}
