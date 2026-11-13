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

const GRID = Array.from({ length: 451 }, (_, i) => -4 + (9 * i) / 450);
const PRIORS: Record<string, (t: number) => number> = {
  flat: () => 0,
  sceptical: (t) => -Math.abs(t) / 0.25,
  "confident, wrong": (t) => -((t + 2) * (t + 2)) / (2 * 0.09),
};
type P = keyof typeof PRIORS;

/** A posterior for a normal mean (σ = 1, true μ = 2) built up one observation at a time from three different priors, computed on a grid. */
export function SeqUpdateViz() {
  const [n, setN] = useState(3);
  const [pr, setPr] = useState<P>("sceptical");
  const data = useMemo(() => {
    const r = makeRng(77);
    return Array.from({ length: 200 }, () => 2 + Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r()));
  }, []);
  const xs = data.slice(0, n);
  const norm = (lw: number[]) => { const m = Math.max(...lw); const w = lw.map((v) => Math.exp(v - m)); const z = w.reduce((a, b) => a + b, 0); return w.map((v) => v / z); };
  const prior = norm(GRID.map((t) => PRIORS[pr](t)));
  const post = norm(GRID.map((t) => PRIORS[pr](t) - 0.5 * xs.reduce((s, x) => s + (x - t) * (x - t), 0)));
  const mean = GRID.reduce((s, t, i) => s + t * post[i], 0);
  const sd = Math.sqrt(GRID.reduce((s, t, i) => s + (t - mean) * (t - mean) * post[i], 0));
  const xbar = n > 0 ? xs.reduce((a, b) => a + b, 0) / n : NaN;
  const ymax = Math.max(...post, ...prior) * 1.08;
  const W = 330, H = 150;
  const X = (t: number) => 14 + ((t + 4) / 9) * (W - 28);
  const Y = (y: number) => H - 16 - (y / ymax) * (H - 26);
  const line = (w: number[]) => GRID.map((t, i) => `${X(t).toFixed(1)},${Y(w[i]).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          observations = {n}
          <input type="range" min={0} max={200} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="number of observations" style={{ width: 120 }} />
        </label>
        {(Object.keys(PRIORS) as P[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={pr === k} onClick={() => setPr(k)}>{k}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Prior and posterior for a normal mean">
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.4} strokeDasharray="4 3" points={line(prior)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={line(post)} />
        <line x1={X(-4)} x2={X(5)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(2)} x2={X(2)} y1={10} y2={Y(0)} stroke="var(--danger)" strokeDasharray="3 3" />
        <text x={X(-4)} y={H - 2} className="viz-label">μ = −4</text>
        <text x={X(5)} y={H - 2} textAnchor="end" className="viz-label">5</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        posterior mean {mean.toFixed(3)}, sd {sd.toFixed(3)}; sample mean {n > 0 ? xbar.toFixed(3) : "none"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dashed curve is the prior and the solid curve the posterior after the first n observations from N(2, 1); the
        dashed vertical line is the true mean 2. A flat prior gives a posterior centred on the sample mean. A sceptical
        prior pulls small samples towards 0, and a confident but wrong prior can hold the posterior near −2 for a while.
        With enough data every prior that allows μ = 2 gives nearly the same posterior.
      </figcaption>
    </figure>
  );
}
