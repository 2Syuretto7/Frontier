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

const SIZES = [5, 8, 12, 20, 30, 50, 100, 400];

/** Accuracy of a model on eight benchmark subsets of different sizes, estimated with no pooling, complete pooling, or partial pooling controlled by the between-subset spread τ. */
export function PoolingViz() {
  const [lt, setLt] = useState(-12);
  const [seed, setSeed] = useState(1);
  const tau = Math.pow(10, lt / 10);
  const groups = useMemo(() => {
    const r = makeRng(seed * 6007);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    return SIZES.map((n) => {
      const theta = Math.min(0.97, Math.max(0.4, 0.75 + 0.06 * normal()));
      let h = 0;
      for (let i = 0; i < n; i++) if (r() < theta) h++;
      const xbar = h / n;
      const s2 = Math.max(xbar * (1 - xbar), 0.05) / n;
      return { n, theta, xbar, s2 };
    });
  }, [seed]);
  const t2 = tau * tau;
  const w = groups.map((g) => 1 / (g.s2 + t2));
  const mu = groups.reduce((s, g, i) => s + w[i] * g.xbar, 0) / w.reduce((a, b) => a + b, 0);
  const est = groups.map((g) => { const B = g.s2 / (g.s2 + t2); return B * mu + (1 - B) * g.xbar; });
  const mseRaw = groups.reduce((s, g) => s + (g.xbar - g.theta) * (g.xbar - g.theta), 0) / groups.length;
  const mseShr = groups.reduce((s, g, i) => s + (est[i] - g.theta) * (est[i] - g.theta), 0) / groups.length;
  const W = 330, H = 190;
  const X = (v: number) => 54 + ((Math.max(0.3, Math.min(1, v)) - 0.3) / 0.7) * (W - 66);
  const rowY = (i: number) => 14 + i * 21;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          τ = {tau.toFixed(3)}
          <input type="range" min={-30} max={0} value={lt} onChange={(e) => setLt(Number(e.target.value))} aria-label="between-group spread" style={{ width: 130 }} />
        </label>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new benchmark</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Raw and partially pooled accuracy estimates for eight subsets">
        <line x1={X(mu)} x2={X(mu)} y1={6} y2={H - 14} stroke="var(--text-muted)" strokeDasharray="4 3" />
        {groups.map((g, i) => (
          <g key={i}>
            <text x={4} y={rowY(i) + 4} className="viz-label">n = {g.n}</text>
            <line x1={X(g.xbar)} x2={X(est[i])} y1={rowY(i)} y2={rowY(i)} stroke="var(--accent)" opacity={0.6} />
            <circle cx={X(g.xbar)} cy={rowY(i)} r={3.2} fill="none" stroke="var(--text)" />
            <circle cx={X(est[i])} cy={rowY(i)} r={3.2} fill="var(--accent)" />
            <line x1={X(g.theta)} x2={X(g.theta)} y1={rowY(i) - 6} y2={rowY(i) + 6} stroke="var(--danger)" strokeWidth={1.6} />
          </g>
        ))}
        <text x={X(0.3)} y={H - 2} className="viz-label">0.3</text>
        <text x={X(1)} y={H - 2} textAnchor="end" className="viz-label">1.0</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        pooled mean {mu.toFixed(3)}; mean squared error: raw {mseRaw.toFixed(4)}, partially pooled {mseShr.toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each row is a benchmark subset of n questions. Hollow dots are the raw accuracies, filled dots the estimates
        shrunk towards the pooled mean (dashed line), and the short danger ticks the true accuracies. With τ near 0 every
        subset gets the pooled mean (complete pooling); with large τ the raw values stand (no pooling). In between, small
        subsets move most, because their raw values are least reliable, and the error is usually smallest there.
      </figcaption>
    </figure>
  );
}
