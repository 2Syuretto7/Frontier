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

const N = 12, B = 2000;

/** A two-sample permutation test: the observed difference in means against the differences after shuffling the group labels. */
export function PermTestViz() {
  const [d10, setD10] = useState(6);
  const [seed, setSeed] = useState(1);
  const delta = d10 / 10;
  const { a, b } = useMemo(() => {
    const r = makeRng(seed * 4447);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const base = Array.from({ length: 2 * N }, normal);
    return { a: base.slice(0, N).map((x) => x + delta), b: base.slice(N) };
  }, [seed, delta]);
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const obs = mean(a) - mean(b);
  const perms = useMemo(() => {
    const r = makeRng(seed * 13 + 5);
    const pooled = [...a, ...b];
    const out: number[] = [];
    for (let k = 0; k < B; k++) {
      const p = [...pooled];
      for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
      out.push(mean(p.slice(0, N)) - mean(p.slice(N)));
    }
    return out;
  }, [a, b, seed]);
  const hits = perms.filter((v) => v >= obs - 1e-12).length;
  const pval = (1 + hits) / (1 + B);
  const lo = -2, hi = 2.5, nb = 45, bw = (hi - lo) / nb;
  const counts = Array(nb).fill(0);
  perms.forEach((v) => { const k = Math.floor((v - lo) / bw); if (k >= 0 && k < nb) counts[k]++; });
  const cmax = Math.max(...counts, 1);
  const W = 330, H = 150;
  const X = (x: number) => 12 + ((Math.max(lo, Math.min(hi, x)) - lo) / (hi - lo)) * (W - 24);
  const Y = (c: number) => H - 16 - (c / cmax) * (H - 30);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          true shift = {delta.toFixed(1)}
          <input type="range" min={0} max={15} value={d10} onChange={(e) => setD10(Number(e.target.value))} aria-label="true difference" style={{ width: 120 }} />
        </label>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new data</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Permutation distribution of the difference in means with the observed value">
        {counts.map((c, i) => (
          <rect key={i} x={X(lo + i * bw)} y={Y(c)} width={X(lo + (i + 1) * bw) - X(lo + i * bw) - 0.5} height={Y(0) - Y(c)} fill={lo + (i + 0.5) * bw >= obs ? "var(--danger)" : "var(--accent)"} opacity={0.45} />
        ))}
        <line x1={12} x2={W - 12} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(obs)} x2={X(obs)} y1={8} y2={Y(0)} stroke="var(--text)" strokeWidth={1.6} />
        <text x={X(lo)} y={H - 2} className="viz-label">{lo}</text>
        <text x={X(hi)} y={H - 2} textAnchor="end" className="viz-label">{hi}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        observed difference {obs.toFixed(3)}; one-sided p = (1 + {hits})/(1 + {B}) = {pval.toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Two groups of {N} observations, the first shifted by the chosen amount. If the shift were 0, the group labels
        would be arbitrary, so the bars show the difference in means for {B} random relabellings. The p-value is the
        fraction of relabellings at least as extreme as the observed difference (solid line); those bars are in the danger
        colour. With shift 0, p is uniform across new data sets; with a real shift it is usually small.
      </figcaption>
    </figure>
  );
}
