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
function erf(x: number) {
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
const Phi = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));
const phi = (x: number) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
function expMax(k: number) {
  let s = 0;
  for (let i = 0; i <= 1600; i++) { const x = -8 + i * 0.01; s += x * k * phi(x) * Math.pow(Phi(x), k - 1) * 0.01; }
  return s;
}

/** Scores of two training recipes over k random seeds each: seed-to-seed spread, the mean over seeds, and the inflation from reporting the best seed. */
export function SeedSpreadViz() {
  const [k, setK] = useState(3);
  const [g10, setG10] = useState(5);
  const [seed, setSeed] = useState(1);
  const gap = g10 / 10;
  const runs = useMemo(() => {
    const r = makeRng(seed * 9173);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    return { a: Array.from({ length: 20 }, normal), b: Array.from({ length: 20 }, normal) };
  }, [seed]);
  const a = runs.a.slice(0, k), b = runs.b.slice(0, k).map((v) => v + gap);
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const pWrong = gap === 0 ? 0.5 : Phi(-gap / Math.sqrt(2 / k));
  const infl = expMax(k);
  const W = 330, H = 120;
  const X = (v: number) => 14 + ((v + 3.5) / 7.5) * (W - 28);
  const row = (vals: number[], y: number, label: string, fill: string) => (
    <g>
      <text x={X(-3.5)} y={y - 10} className="viz-label">{label}</text>
      {vals.map((v, i) => <circle key={i} cx={X(v)} cy={y} r={3} fill={fill} opacity={0.55} />)}
      <line x1={X(mean(vals))} x2={X(mean(vals))} y1={y - 9} y2={y + 9} stroke={fill} strokeWidth={2.4} />
      <path d={`M ${X(Math.max(...vals))} ${y - 13} l -4 -6 l 8 0 z`} fill="var(--text)" />
    </g>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          seeds k = {k}
          <input type="range" min={1} max={20} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="number of seeds" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          true gap = {gap.toFixed(1)}σ
          <input type="range" min={0} max={20} value={g10} onChange={(e) => setG10(Number(e.target.value))} aria-label="true gap in seed standard deviations" style={{ width: 110 }} />
        </label>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new runs</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Seed scores for two recipes with their means and best runs">
        {row(a, 40, "recipe A", "var(--danger)")}
        {row(b, 92, "recipe B (better)", "var(--accent)")}
        <line x1={X(0)} x2={X(0)} y1={22} y2={H - 6} stroke="var(--border)" strokeDasharray="3 3" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        P(mean of A ≥ mean of B) = {pWrong.toFixed(3)}; best of {k} overstates the mean by {infl.toFixed(2)}σ on average
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each dot is one training run, in units of the seed-to-seed standard deviation σ; recipe B is truly better by the
        chosen gap. Thick ticks mark the mean over seeds and triangles the best seed. With one seed each, a 0.5σ
        improvement is reported backwards 36% of the time. Averaging k seeds shrinks the noise like 1/√k, while reporting
        the best seed adds a bias that grows with k.
      </figcaption>
    </figure>
  );
}
