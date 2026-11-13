"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const MAX = 100000, SHOW = 1500;

/** Estimate π from random points in the unit square, with a CLT error bar, as the number of points grows. */
export function McPiViz() {
  const [k, setK] = useState(20);
  const [seed, setSeed] = useState(3);
  const data = useMemo(() => {
    const r = makeRng(seed);
    const xs = new Float64Array(MAX), ys = new Float64Array(MAX), hits = new Int32Array(MAX + 1);
    for (let i = 0; i < MAX; i++) {
      xs[i] = r(); ys[i] = r();
      hits[i + 1] = hits[i] + (xs[i] * xs[i] + ys[i] * ys[i] <= 1 ? 1 : 0);
    }
    return { xs, ys, hits };
  }, [seed]);
  const n = Math.round(Math.pow(10, 1 + (4 * k) / 40));
  const p = data.hits[n] / n;
  const est = 4 * p, se = 4 * Math.sqrt(Math.max(p * (1 - p), 1e-12) / n);
  const S = 200, pad = 6;
  const shown = Math.min(n, SHOW);
  const arc: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const a = (Math.PI / 2) * (i / 60);
    arc.push(`${(pad + Math.cos(a) * S).toFixed(1)},${(pad + S - Math.sin(a) * S).toFixed(1)}`);
  }
  const inside = Math.abs(est - Math.PI) <= 1.96 * se;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          n = {n}
          <input type="range" min={0} max={40} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="number of points, log scale" style={{ width: 170 }} />
        </label>
        <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>new points</button>
      </div>
      <svg viewBox={`0 0 ${S + 2 * pad} ${S + 2 * pad}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="Random points in the unit square, coloured by whether they fall inside the quarter circle">
        <rect x={pad} y={pad} width={S} height={S} fill="none" stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.4} points={arc.join(" ")} />
        {Array.from({ length: shown }, (_, i) => {
          const x = data.xs[i], y = data.ys[i];
          return <circle key={i} cx={pad + x * S} cy={pad + S - y * S} r={1.5} fill={x * x + y * y <= 1 ? "var(--accent)" : "var(--danger)"} opacity={0.7} />;
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        estimate {est.toFixed(4)} ± {(1.96 * se).toFixed(4)}; true π 3.1416; {inside ? "inside" : "outside"} the 95% interval
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A uniform point lands in the quarter circle with probability π/4, so 4 × (fraction inside) estimates π. The ± is
        1.96 standard errors from the CLT; it shrinks like 1/√n, so each extra correct digit costs a hundred times more points.
        {n > SHOW ? ` Only the first ${SHOW} points are drawn.` : ""}
      </figcaption>
    </figure>
  );
}
