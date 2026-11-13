"use client";

import { useMemo, useState } from "react";

const ARMS = [
  { name: "full", mean: 0.8 },
  { name: "− A", mean: 0.79 },
  { name: "− B", mean: 0.75 },
  { name: "− A − B", mean: 0.7 },
];
const SEED_SD = 0.02, RUN_SD = 0.004, MAXS = 10;

function gauss(seed: number) {
  let a = seed >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
}

/** Accuracy of four ablation arms over several seeds, with error bars and the paired comparison. */
export function AblationViz() {
  const [n, setN] = useState(3);
  const data = useMemo(() => {
    const r = gauss(8);
    const seedEffect = Array.from({ length: MAXS }, () => SEED_SD * r());
    return ARMS.map((a) => seedEffect.map((s) => a.mean + s + RUN_SD * r()));
  }, []);
  const used = data.map((d) => d.slice(0, n));
  const stats = used.map((d) => {
    const m = d.reduce((a, b) => a + b, 0) / d.length;
    const sd = d.length > 1 ? Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / (d.length - 1)) : NaN;
    return { m, se: sd / Math.sqrt(d.length) };
  });
  const diffs = used[0].map((v, i) => v - used[1][i]);
  const dm = diffs.reduce((a, b) => a + b, 0) / n;
  const dse = n > 1 ? Math.sqrt(diffs.reduce((a, b) => a + (b - dm) ** 2, 0) / (n - 1)) / Math.sqrt(n) : NaN;
  const W = 320, H = 170, lo = 0.62, hi = 0.88;
  const py = (v: number) => 10 + ((hi - v) / (hi - lo)) * (H - 34);
  const cx = (k: number) => 50 + k * 72;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          seeds per arm {n}
          <input type="range" min={1} max={MAXS} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="number of seeds" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Accuracy by ablation arm with seeds and error bars">
        {[0.65, 0.7, 0.75, 0.8, 0.85].map((v) => (
          <g key={v}>
            <line x1={30} x2={W - 6} y1={py(v)} y2={py(v)} stroke="var(--border)" />
            <text x={26} y={py(v) + 4} textAnchor="end" className="viz-label">{v.toFixed(2)}</text>
          </g>
        ))}
        {used.map((d, k) => (
          <g key={k}>
            {d.map((v, i) => <circle key={i} cx={cx(k) - 12 + (i % 5) * 6} cy={py(v)} r={2.5} fill="var(--text-muted)" />)}
            {n > 1 && <line x1={cx(k) + 20} x2={cx(k) + 20} y1={py(stats[k].m + 2 * stats[k].se)} y2={py(stats[k].m - 2 * stats[k].se)} stroke="var(--accent)" strokeWidth={2} />}
            <circle cx={cx(k) + 20} cy={py(stats[k].m)} r={4} fill="var(--accent)" />
            <text x={cx(k) + 4} y={H - 8} textAnchor="middle" className="viz-label">{ARMS[k].name}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        full − (−A): unpaired {(stats[0].m - stats[1].m).toFixed(3)} ± {n > 1 ? (2 * Math.hypot(stats[0].se, stats[1].se)).toFixed(3) : "?"}; paired {dm.toFixed(3)} ± {n > 1 ? (2 * dse).toFixed(3) : "?"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Grey dots are runs with different seeds; blue shows the mean ± 2 standard errors. Seeds move every arm up or down
        together (some initialisations are simply luckier), so the error bars of "full" and "− A" overlap even though A
        helps by about 0.01 in every seed. Comparing each seed with itself, the paired difference, removes that shared noise.
        Removing B costs 0.05, and removing A as well costs another 0.05 rather than 0.01: A and B interact.
      </figcaption>
    </figure>
  );
}
