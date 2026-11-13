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
const N = 600;
function sticks() {
  const r = makeRng(7);
  const out: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const u = r();
    out.push([u, u * r()]);
  }
  return out;
}

/** Break a stick at U, then break the left piece at a uniform point V: averaging V within bins of U approaches E[V | U] = U/2. */
export function CondMeanViz() {
  const pts = useMemo(sticks, []);
  const [bins, setBins] = useState(4);
  const sums = new Array(bins).fill(0), counts = new Array(bins).fill(0);
  pts.forEach(([u, v]) => { const k = Math.min(bins - 1, Math.floor(u * bins)); sums[k] += v; counts[k] += 1; });
  const means = sums.map((s, k) => (counts[k] > 0 ? s / counts[k] : 0));
  let seBin = 0, seTrue = 0, seConst = 0;
  const vbar = pts.reduce((s, p) => s + p[1], 0) / N;
  pts.forEach(([u, v]) => {
    const k = Math.min(bins - 1, Math.floor(u * bins));
    seBin += (v - means[k]) * (v - means[k]);
    seTrue += (v - u / 2) * (v - u / 2);
    seConst += (v - vbar) * (v - vbar);
  });
  const W = 300, H = 220, L = 30;
  const X = (x: number) => L + x * (W - L - 10);
  const Y = (y: number) => H - 20 - y * (H - 30);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          bins = {bins}
          <input type="range" min={1} max={30} value={bins} onChange={(e) => setBins(Number(e.target.value))} aria-label="number of bins" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Scatter of U and V with binned averages and the line V = U/2">
        <line x1={L} x2={W - 10} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={L} x2={L} y1={Y(0)} y2={Y(1)} stroke="var(--border)" />
        <text x={L - 4} y={Y(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={L - 4} y={Y(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={X(1)} y={H - 4} textAnchor="end" className="viz-label">U = 1</text>
        {pts.map(([u, v], i) => <circle key={i} cx={X(u)} cy={Y(v)} r={1.6} fill="var(--text-muted)" opacity={0.5} />)}
        <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(0.5)} stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 4" />
        {means.map((m, k) => (
          <line key={k} x1={X(k / bins)} x2={X((k + 1) / bins)} y1={Y(m)} y2={Y(m)} stroke="var(--danger)" strokeWidth={2.4} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        mean squared error: bins {(seBin / N).toFixed(4)}, U/2 {(seTrue / N).toFixed(4)}, constant {(seConst / N).toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Break a unit stick at U, then break the left piece at a uniform point, leaving V. Red segments are the average of V
        within each bin of U; the dashed line is E[V | U] = U/2. With one bin the prediction is the constant E[V] = 1/4. As the
        bins narrow, the averages track U/2, and the error falls towards that of U/2, the smallest any function of U can
        achieve. With too many bins on a finite sample the averages become noisy again.
      </figcaption>
    </figure>
  );
}
