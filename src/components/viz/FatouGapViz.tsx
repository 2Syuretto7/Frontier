"use client";

import { useMemo, useState } from "react";

const G = 2000, NMAX = 20, HORIZON = 400;
const XS = Array.from({ length: G }, (_, i) => (i + 0.5) / G);
type Seq = { label: string; f: (n: number, x: number) => number; lim: (x: number) => number };
export const SEQS: Seq[] = [
  { label: "alternating halves", f: (n, x) => ((n % 2 === 0) === (x < 0.5) ? 1 : 0), lim: () => 0 },
  { label: "spike", f: (n, x) => (x < 1 / n ? n : 0), lim: () => 0 },
  { label: "settling", f: (n, x) => 2 * x + Math.sin(7 * n * x) / n, lim: (x) => 2 * x },
];

/** ∫fₙ and ∫ inf_{k ≥ n} f_k for n = 1..NMAX, taking the infimum over n ≤ k ≤ HORIZON together with the pointwise limit. */
export function fatou(si: number) {
  const { f, lim } = SEQS[si], ints: number[] = [], tails: number[] = [];
  const inf = XS.map(lim);
  const tailAt: number[] = new Array(NMAX + 1).fill(0);
  for (let k = HORIZON; k >= 1; k--) {
    XS.forEach((x, i) => (inf[i] = Math.min(inf[i], f(k, x))));
    if (k <= NMAX) tailAt[k] = inf.reduce((a, b) => a + b, 0) / G;
  }
  for (let n = 1; n <= NMAX; n++) { ints.push(XS.reduce((a, x) => a + f(n, x), 0) / G); tails.push(tailAt[n]); }
  return { ints, tails };
}

export function FatouGapViz() {
  const [si, setSi] = useState(0);
  const d = useMemo(() => fatou(si), [si]);
  const W = 330, H = 150, X0 = 26, PW = 296, Y0 = 8, PH = 124, YH = 1.2;
  const sx = (n: number) => X0 + ((n - 1) / (NMAX - 1)) * PW, sy = (y: number) => Y0 + PH - (Math.min(YH, y) / YH) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Sequence of functions">
          {SEQS.map((q, i) => <button key={q.label} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{q.label}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Integrals of a sequence of functions and of their tail infima">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        {[0, 0.5, 1].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        {[1, 10, 20].map((n) => <text key={n} x={sx(n)} y={H - 1} textAnchor="middle" className="viz-label">{n}</text>)}
        {d.ints.map((v, i) => <circle key={i} cx={sx(i + 1)} cy={sy(v)} r={3} fill="var(--code-function)" />)}
        <path d={d.tails.map((v, i) => `${i ? "L" : "M"}${sx(i + 1).toFixed(1)},${sy(v).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--code-function)" }}>●</span> ∫fₙ</span>
        <span><span style={{ color: "var(--accent)" }}>━</span> ∫ inf over k ≥ n of f_k</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        at n = {NMAX}: ∫fₙ = {d.ints[NMAX - 1].toFixed(3)}, ∫ tail infimum = {d.tails[NMAX - 1].toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Dots are the integrals of fₙ; the line is the integral of gₙ = inf over k ≥ n of f_k, which increases to the
        integral of lim inf fₙ. Fatou says the line ends below the lim inf of the dots. For alternating halves every fₙ has
        integral 0.500 but no point stays covered, so gₙ = 0: a strict gap of 0.5. The spike loses all its mass the same
        way, gap 1. When fₙ = 2x + sin(7nx)/n settles down, the line climbs (0.592, 0.754, 0.818, …, 0.960 at n = 20)
        towards the common limit 1, and there is no gap.
      </figcaption>
    </figure>
  );
}
