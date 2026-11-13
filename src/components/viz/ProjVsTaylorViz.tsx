"use client";

import { useState } from "react";

// f(x) = 1 / (1 + 25 (x - 1/2)^2) on [0, 1]: L2 projection onto polynomials of degree <= d versus the Taylor polynomial at 1/2.
const N = 400;
const XS = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
const f = (x: number) => 1 / (1 + 25 * (x - 0.5) * (x - 0.5));
const FX = XS.map(f);

function project(d: number) {
  // modified Gram–Schmidt on sampled powers of (x - 1/2); the mean over the grid is the midpoint rule for the integral
  const ip = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0) / N;
  const es: number[][] = [];
  for (let k = 0; k <= d; k++) {
    let w = XS.map((x) => { let p = 1; for (let j = 0; j < k; j++) p *= x - 0.5; return p; });
    for (const e of es) { const c = ip(w, e); w = w.map((v, i) => v - c * e[i]); }
    const n = Math.sqrt(ip(w, w));
    es.push(w.map((v) => v / n));
  }
  const out = new Array(N).fill(0);
  for (const e of es) { const c = ip(FX, e); for (let i = 0; i < N; i++) out[i] += c * e[i]; }
  return out as number[];
}

function taylor(d: number) {
  // 1/(1 + 25 t^2) = sum over k of (-25 t^2)^k
  return XS.map((x) => {
    const t2 = 25 * (x - 0.5) * (x - 0.5);
    let s = 0, term = 1;
    for (let k = 0; 2 * k <= d; k++) { s += term; term *= -t2; }
    return s;
  });
}

const err = (g: number[]) => Math.sqrt(g.reduce((s, v, i) => s + (v - FX[i]) * (v - FX[i]), 0) / N);

/** Best L2 polynomial approximation (a projection) against the Taylor polynomial of the same degree. */
export function ProjVsTaylorViz() {
  const [d, setD] = useState(4);
  const P = project(d), T = taylor(d);
  const W = 320, H = 170;
  const X = (x: number) => 30 + x * (W - 40), Y = (y: number) => H - 20 - ((Math.max(-0.6, Math.min(1.6, y)) + 0.6) / 2.2) * (H - 30);
  const poly = (g: number[]) => g.map((v, i) => `${X(XS[i]).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const te = err(T);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          degree = {d}
          <input type="range" min={0} max={10} value={d} onChange={(e) => setD(Number(e.target.value))} aria-label="polynomial degree" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A function, its best polynomial approximation and its Taylor polynomial">
        <line x1={30} x2={W - 10} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <text x={26} y={Y(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={26} y={Y(0) + 4} textAnchor="end" className="viz-label">0</text>
        <polyline fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" points={poly(FX)} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.4} points={poly(T)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={poly(P)} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        L² error: projection {err(P).toFixed(4)}, Taylor {te > 1000 ? te.toExponential(1) : te.toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        f(x) = 1/(1 + 25(x − ½)²), dashed. The blue curve is the orthogonal projection of f onto polynomials of degree at most
        d, the best possible in the L² norm, and its error can only fall as d grows. The red Taylor polynomial at ½ matches f
        perfectly near the centre but diverges beyond distance 0.2, so its L² error grows: being exact at one point is not the
        same as being close overall.
      </figcaption>
    </figure>
  );
}
