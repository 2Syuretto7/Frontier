"use client";

import { useState } from "react";

const f = Math.fround;
const BASE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const TRUE_VAR = 8.25;

function naive(c: number) {
  let s = f(0), s2 = f(0);
  for (const b of BASE) { const x = f(c + b); s = f(s + x); s2 = f(s2 + f(x * x)); }
  const m = f(s / BASE.length);
  return f(f(s2 / BASE.length) - f(m * m));
}
function welford(c: number) {
  let mean = f(0), m2 = f(0), n = 0;
  for (const b of BASE) {
    const x = f(c + b);
    n += 1;
    const d = f(x - mean);
    mean = f(mean + f(d / n));
    m2 = f(m2 + f(d * f(x - mean)));
  }
  return f(m2 / n);
}
const relErr = (v: number) => Math.abs(v - TRUE_VAR) / TRUE_VAR;

/** Variance of c + (0, 1, …, 9) in float32: E[X²] − E[X]² against Welford's update, as the offset c grows. */
export function VarianceCancelViz() {
  const [t, setT] = useState(40);
  const lc = t / 10;
  const c = Math.round(Math.pow(10, lc));
  const W = 320, H = 160;
  const X = (l: number) => 34 + (l / 8) * (W - 44);
  const yOf = (e: number) => 10 + ((1 - Math.log10(Math.min(10, Math.max(e, 1e-8)))) / 9) * (H - 30);
  const curve = (g: (c: number) => number) =>
    Array.from({ length: 81 }, (_, i) => i / 10).map((l) => `${X(l).toFixed(1)},${yOf(relErr(g(Math.round(Math.pow(10, l))))).toFixed(1)}`).join(" ");
  const nv = naive(c), wv = welford(c);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          offset c = {String(c)}
          <input type="range" min={0} max={80} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="log10 of the offset" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Relative error of two variance formulas against offset">
        {[1e-8, 1e-4, 1].map((e) => (
          <g key={e}>
            <line x1={34} x2={W - 10} y1={yOf(e)} y2={yOf(e)} stroke="var(--border)" />
            <text x={30} y={yOf(e) + 4} textAnchor="end" className="viz-label">{e === 1 ? "1" : e === 1e-4 ? "1e-4" : "≤1e-8"}</text>
          </g>
        ))}
        {[0, 2, 4, 6, 8].map((l) => <text key={l} x={X(l)} y={H - 6} textAnchor="middle" className="viz-label">1e{l}</text>)}
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={curve(naive)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve(welford)} />
        <line x1={X(lc)} x2={X(lc)} y1={10} y2={H - 20} stroke="var(--text-muted)" strokeDasharray="3 3" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        true 8.25; E[X²] − E[X]² gives {nv.toPrecision(6)}; Welford gives {wv.toPrecision(6)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The data are c + 0, c + 1, …, c + 9 in 32-bit floats, so the variance is 8.25 whatever c is. Red: the shortcut
        E[X²] − E[X]², which subtracts two numbers of size c² and loses everything once c² dwarfs 8.25 at float32 precision
        (about 7 digits). Blue: Welford&apos;s update, which works with deviations from the running mean and stays accurate
        far longer.
      </figcaption>
    </figure>
  );
}
