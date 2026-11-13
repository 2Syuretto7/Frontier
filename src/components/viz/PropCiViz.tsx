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

const Z = 1.96;
function interval(h: number, n: number, wilson: boolean): [number, number] {
  const p = h / n;
  if (!wilson) { const w = Z * Math.sqrt((p * (1 - p)) / n); return [p - w, p + w]; }
  const d = 1 + (Z * Z) / n;
  const c = (p + (Z * Z) / (2 * n)) / d;
  const w = (Z * Math.sqrt((p * (1 - p)) / n + (Z * Z) / (4 * n * n))) / d;
  return [c - w, c + w];
}

const ROWS = 40;

/** Forty 95% intervals for a proportion from independent samples, by the Wald or the Wilson method, with the exact coverage of each. */
export function PropCiViz() {
  const [p100, setP100] = useState(10);
  const [n, setN] = useState(20);
  const [wil, setWil] = useState(false);
  const [seed, setSeed] = useState(1);
  const p = p100 / 100;
  const hs = useMemo(() => {
    const r = makeRng(seed * 131 + p100 * 7 + n);
    return Array.from({ length: ROWS }, () => { let h = 0; for (let i = 0; i < n; i++) if (r() < p) h++; return h; });
  }, [seed, p100, n, p]);
  const exact = (w: boolean) => {
    let pm = Math.pow(1 - p, n), cov = 0;
    for (let h = 0; h <= n; h++) {
      const [a, b] = interval(h, n, w);
      if (a <= p && p <= b) cov += pm;
      pm = (pm * (n - h) * p) / ((h + 1) * (1 - p));
    }
    return cov;
  };
  const W = 330, H = 170;
  const X = (x: number) => 14 + Math.max(0, Math.min(1, x)) * (W - 28);
  const rowY = (i: number) => 10 + i * ((H - 26) / ROWS);
  const ivs = hs.map((h) => interval(h, n, wil));
  const misses = ivs.filter(([a, b]) => a > p || b < p).length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          p = {p.toFixed(2)}
          <input type="range" min={1} max={99} value={p100} onChange={(e) => setP100(Number(e.target.value))} aria-label="true proportion" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={5} max={200} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="sample size" style={{ width: 100 }} />
        </label>
        <button type="button" className="seg" aria-pressed={!wil} onClick={() => setWil(false)}>Wald</button>
        <button type="button" className="seg" aria-pressed={wil} onClick={() => setWil(true)}>Wilson</button>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new samples</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Forty confidence intervals for a proportion">
        {ivs.map(([a, b], i) => {
          const miss = a > p || b < p;
          return <line key={i} x1={X(a)} x2={Math.max(X(b), X(a) + 1)} y1={rowY(i)} y2={rowY(i)} stroke={miss ? "var(--danger)" : "var(--accent)"} strokeWidth={2} />;
        })}
        <line x1={X(p)} x2={X(p)} y1={4} y2={H - 14} stroke="var(--text)" strokeDasharray="3 3" />
        <text x={X(0)} y={H - 2} className="viz-label">0</text>
        <text x={X(1)} y={H - 2} textAnchor="end" className="viz-label">1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {misses} of {ROWS} miss; exact coverage Wald {exact(false).toFixed(3)}, Wilson {exact(true).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each line is a nominal 95% interval from a fresh sample of n trials; the dashed line is the true p, and misses are
        drawn in the danger colour. The exact coverage sums the binomial probabilities of every outcome whose interval
        contains p. For p near 0 or 1 and small n, the Wald interval p̂ ± 1.96·√(p̂(1 − p̂)/n) covers far less than 95%
        (with zero successes it collapses to a single point), while the Wilson interval stays close.
      </figcaption>
    </figure>
  );
}
