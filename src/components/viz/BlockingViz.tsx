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

const REPS = 1500;
const NB = 4, PER = 10;

function shuffleHalf(idx: number[], r: () => number) {
  const a = idx.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a.slice(0, a.length / 2);
}

/** Repeated experiments on 40 units in 4 blocks, with true effect 1: complete randomisation against randomisation within blocks. */
export function BlockingViz() {
  const [b, setB] = useState(3);
  const res = useMemo(() => {
    const r = makeRng(101 + b * 17);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const all = Array.from({ length: NB * PER }, (_, i) => i);
    const out = { comp: [] as number[], block: [] as number[] };
    for (let k = 0; k < REPS; k++) {
      const y0 = all.map((i) => b * Math.floor(i / PER) + normal());
      const est = (treated: number[]) => {
        const z = Array(all.length).fill(0);
        treated.forEach((i) => { z[i] = 1; });
        let s1 = 0, s0 = 0;
        all.forEach((i) => { if (z[i]) s1 += y0[i] + 1; else s0 += y0[i]; });
        return s1 / (all.length / 2) - s0 / (all.length / 2);
      };
      out.comp.push(est(shuffleHalf(all, r)));
      const tb: number[] = [];
      for (let g = 0; g < NB; g++) tb.push(...shuffleHalf(all.slice(g * PER, (g + 1) * PER), r));
      out.block.push(est(tb));
    }
    return out;
  }, [b]);
  const sd = (xs: number[]) => {
    const m = xs.reduce((a, c) => a + c, 0) / xs.length;
    return Math.sqrt(xs.reduce((a, c) => a + (c - m) * (c - m), 0) / xs.length);
  };
  const lo = -4, hi = 6, nbins = 50, bw = (hi - lo) / nbins;
  const hist = (xs: number[]) => {
    const c = Array(nbins).fill(0);
    xs.forEach((x) => { const i = Math.floor((x - lo) / bw); if (i >= 0 && i < nbins) c[i]++; });
    return c.map((v) => v / (REPS * bw));
  };
  const hc = hist(res.comp), hb = hist(res.block);
  const W = 330, H = 190, rowH = 80;
  const X = (x: number) => 12 + ((x - lo) / (hi - lo)) * (W - 24);
  const ymax = 1.4;
  const bars = (h: number[], top: number, fill: string) =>
    h.map((d, i) => {
      const hh = (Math.min(d, ymax) / ymax) * (rowH - 18);
      return <rect key={i} x={X(lo + i * bw)} y={top + rowH - 4 - hh} width={X(lo + bw) - X(lo) - 0.5} height={hh} fill={fill} opacity={0.6} />;
    });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          block effect = {b}
          <input type="range" min={0} max={6} value={b} onChange={(e) => setB(Number(e.target.value))} aria-label="size of the block effect" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histograms of effect estimates under complete and blocked randomisation">
        <text x={12} y={12} className="viz-label">complete randomisation</text>
        {bars(hc, 4, "var(--danger)")}
        <line x1={12} x2={W - 12} y1={rowH} y2={rowH} stroke="var(--border)" />
        <text x={12} y={rowH + 18} className="viz-label">randomised within blocks</text>
        {bars(hb, rowH + 10, "var(--accent)")}
        <line x1={12} x2={W - 12} y1={2 * rowH + 6} y2={2 * rowH + 6} stroke="var(--border)" />
        <line x1={X(1)} x2={X(1)} y1={16} y2={2 * rowH + 6} stroke="var(--text)" strokeDasharray="4 3" />
        <text x={X(1)} y={H - 2} textAnchor="middle" className="viz-label">true effect 1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        sd of estimate: complete {sd(res.comp).toFixed(3)}, blocked {sd(res.block).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each histogram shows {REPS} repeats of an experiment on 40 units in 4 blocks of 10, such as questions grouped by
        difficulty, where block g adds g times the block effect to every outcome and the treatment adds 1. Both designs are
        centred on the true effect. Complete randomisation lets the blocks fall unevenly into the two arms, so its spread grows
        with the block effect; assigning half of each block to treatment cancels the block terms and keeps the spread near
        √(2/20) ≈ 0.32 however large they are.
      </figcaption>
    </figure>
  );
}
