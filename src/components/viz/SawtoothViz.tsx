"use client";

import { useState } from "react";
import { lstsq } from "./ActivationWidthViz";

const tent = (x: number) => 2 * Math.max(0, x) - 4 * Math.max(0, x - 0.5);
export const saw = (x: number, k: number) => { for (let i = 0; i < k; i++) x = tent(x); return x; };
const XS = Array.from({ length: 2049 }, (_, i) => i / 2048);

/** Best least-squares fit by a continuous piecewise-linear function with m equal pieces (a shallow ReLU net with m units). */
export function shallowFit(k: number, m: number) {
  const hat = (j: number, x: number) => Math.max(0, 1 - Math.abs(x * m - j));
  const A = XS.map((x) => Array.from({ length: m + 1 }, (_, j) => hat(j, x)));
  const c = lstsq(A, XS.map((x) => saw(x, k)));
  const g = (x: number) => c.reduce((s, v, j) => s + v * hat(j, x), 0);
  const l1 = XS.reduce((s, x) => s + Math.abs(g(x) - saw(x, k)), 0) / XS.length;
  return { g, l1 };
}

export const MS = [2, 4, 8, 16, 32];

export function SawtoothViz() {
  const [k, setK] = useState(3);
  const [mi, setMi] = useState(1);
  const m = MS[mi];
  const r = shallowFit(k, m);
  const W = 330, H = 140, X0 = 20, PW = 302, Y0 = 8, PH = 114;
  const sx = (x: number) => X0 + x * PW, sy = (y: number) => Y0 + PH - y * PH;
  const path = (f: (x: number) => number) => XS.filter((_, i) => i % 2 === 0).map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          deep: k = {k} layers
          <input type="range" min={1} max={6} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="Number of tent layers" />
        </label>
        <div className="segmented" role="group" aria-label="Units in the shallow network">
          {MS.map((v, i) => (
            <button key={v} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{v} units</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="The k-fold tent map and the best shallow piecewise-linear fit">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0 + PW} y1={sy(0.5)} y2={sy(0.5)} stroke="var(--border)" strokeDasharray="2 3" />
        {[0, 1].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <path d={path((x) => saw(x, k))} fill="none" stroke="var(--code-function)" strokeWidth={1.3} />
        <path d={path(r.g)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <text x={X0 + PW} y={H - 2} textAnchor="end" className="viz-label">1</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        deep net: {2 * k} units, {2 ** k} pieces; best shallow net with {m} units: mean |error| {r.l1.toFixed(4)}
      </div>
      <figcaption className="viz-caption">
        Composing the tent map k times gives a sawtooth with 2ᵏ pieces using only 2 units per layer (thin curve). The thick
        curve is the best least-squares fit by a shallow network whose m units sit at equally spaced knots. Until m reaches
        2ᵏ the best shallow network here is the constant 1/2, with mean error 1/4; only with as many units as the deep net
        has pieces does it match.
      </figcaption>
    </figure>
  );
}
