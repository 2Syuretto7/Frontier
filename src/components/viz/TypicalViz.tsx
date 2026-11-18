"use client";

import { useState } from "react";

const NS = [10, 30, 100, 300, 1000, 3000];

function lgamma(x: number): number {
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61503916999185, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Sequences of n Bernoulli(p) flips grouped by their number of ones: the typical band holds most of the probability but few of the sequences. */
export function TypicalViz() {
  const [ni, setNi] = useState(3);
  const [p, setP] = useState(0.1);
  const eps = 0.05;
  const n = NS[ni];
  const H = -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
  const rows = Array.from({ length: n + 1 }, (_, k) => {
    const lc = lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
    const rate = -(k * Math.log2(p) + (n - k) * Math.log2(1 - p)) / n;
    return { k, mass: Math.exp(lc + k * Math.log(p) + (n - k) * Math.log(1 - p)), log2count: lc / Math.LN2, typ: Math.abs(rate - H) <= eps };
  });
  const pTyp = rows.filter((r) => r.typ).reduce((s, r) => s + r.mass, 0);
  const typCounts = rows.filter((r) => r.typ).map((r) => r.log2count);
  const mx = typCounts.length ? Math.max(...typCounts) : 0;
  const log2Size = typCounts.length ? mx + Math.log2(typCounts.reduce((s, v) => s + 2 ** (v - mx), 0)) : -Infinity;
  const W = 330, Hh = 170;
  const X = (f: number) => 20 + f * (W - 36);
  const maxMass = Math.max(...rows.map((r) => r.mass));
  const Y = (m: number) => 140 - (m / maxMass) * 120;
  const bw = Math.max(0.6, (W - 36) / (n + 1) - 0.3);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={0} max={NS.length - 1} value={ni} onChange={(e) => setNi(Number(e.target.value))} aria-label="sequence length" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          p = {p.toFixed(2)}
          <input type="range" min={0.02} max={0.5} step={0.01} value={p} onChange={(e) => setP(Number(e.target.value))} aria-label="probability of a one" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${Hh}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Probability of each number of ones, with the typical band highlighted">
        {rows.map((r) => (
          <rect key={r.k} x={X(r.k / (n + 1))} y={Y(r.mass)} width={bw} height={140 - Y(r.mass)} fill={r.typ ? "var(--accent)" : "var(--text-muted)"} opacity={r.typ ? 0.8 : 0.4} />
        ))}
        <line x1={X(0)} x2={X(1)} y1={140} y2={140} stroke="var(--border)" />
        <text x={X(0)} y={154} className="viz-label">k = 0</text>
        <text x={X(1)} y={154} textAnchor="end" className="viz-label">k = n</text>
        <text x={X(p)} y={166} textAnchor="middle" className="viz-label">np</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        H = {H.toFixed(3)}; P(typical) = {pTyp.toFixed(3)}; log₂|typical set|/n = {Number.isFinite(log2Size) ? (log2Size / n).toFixed(3) : "—"} (all sequences: 1)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each bar is the total probability of the sequences with k ones; accent bars are those whose per-symbol surprise is
        within ε = 0.05 of the entropy. As n grows the typical band captures almost all the probability, yet it contains
        only about 2^(nH) of the 2^n sequences, a vanishing fraction when H &lt; 1. The single most likely sequence, all
        zeros, sits at k = 0, outside the band: likely individually, but there is only one of it.
      </figcaption>
    </figure>
  );
}
