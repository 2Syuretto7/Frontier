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

const K = 10;

/** Two models scored on ten tasks of very different difficulty: lines join each task's pair of scores, and the paired t-statistic is compared with the unpaired one. */
export function PairedTViz() {
  const [g10, setG10] = useState(10);
  const [spread, setSpread] = useState(8);
  const [seed, setSeed] = useState(1);
  const gap = g10 / 10;
  const z = useMemo(() => {
    const r = makeRng(seed * 811);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    return Array.from({ length: K }, () => [normal(), normal(), normal()]);
  }, [seed]);
  const a = z.map(([t, e]) => 70 + spread * t + e);
  const b = z.map(([t, , e]) => 70 + spread * t + gap + e);
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const sd = (v: number[]) => { const m = mean(v); return Math.sqrt(v.reduce((s, x) => s + (x - m) * (x - m), 0) / (v.length - 1)); };
  const d = b.map((v, i) => v - a[i]);
  const tPair = mean(d) / (sd(d) / Math.sqrt(K));
  const tUnp = (mean(b) - mean(a)) / Math.sqrt((sd(a) ** 2 + sd(b) ** 2) / K);
  const lo = Math.min(...a, ...b) - 1, hi = Math.max(...a, ...b) + 1;
  const W = 330, H = 170;
  const Y = (v: number) => H - 14 - ((v - lo) / (hi - lo)) * (H - 24);
  const XA = 70, XB = 200;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          true gain = {gap.toFixed(1)}
          <input type="range" min={0} max={30} value={g10} onChange={(e) => setG10(Number(e.target.value))} aria-label="true improvement" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          task spread = {spread}
          <input type="range" min={0} max={15} value={spread} onChange={(e) => setSpread(Number(e.target.value))} aria-label="spread of task difficulty" style={{ width: 100 }} />
        </label>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new tasks</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Slope chart of two models' scores on ten tasks">
        {a.map((v, i) => (
          <g key={i}>
            <line x1={XA} x2={XB} y1={Y(v)} y2={Y(b[i])} stroke={d[i] > 0 ? "var(--accent)" : "var(--danger)"} strokeWidth={1.3} opacity={0.8} />
            <circle cx={XA} cy={Y(v)} r={2.6} fill="var(--text)" />
            <circle cx={XB} cy={Y(b[i])} r={2.6} fill="var(--text)" />
          </g>
        ))}
        <text x={XA} y={H - 2} textAnchor="middle" className="viz-label">model A</text>
        <text x={XB} y={H - 2} textAnchor="middle" className="viz-label">model B</text>
        <text x={W - 6} y={20} textAnchor="end" className="viz-label">B wins {d.filter((v) => v > 0).length}/{K}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        paired t = {tPair.toFixed(2)}, unpaired t = {tUnp.toFixed(2)}; 5% two-sided cut-off with 9 df: 2.26
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each line joins one task&apos;s score under model A to its score under model B; lines rising (accent) are tasks
        where B wins. Tasks differ hugely in difficulty, which dominates the spread of each model&apos;s scores, so the
        unpaired t-statistic is small. The paired t-statistic uses only the per-task differences, where that spread
        cancels. Set the task spread to 0 and the two statistics become similar.
      </figcaption>
    </figure>
  );
}
