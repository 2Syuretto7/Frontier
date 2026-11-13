"use client";

import { useState } from "react";

function lgamma(x: number): number {
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61503916999185, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

const betaPdf = (p: number, a: number, b: number) => {
  if (p <= 0 || p >= 1) return 0;
  return Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + (a - 1) * Math.log(p) + (b - 1) * Math.log(1 - p));
};

/** A Beta(a, b) prior on a coin's bias, updated by h heads in n flips to the Beta(a + h, b + n − h) posterior. */
export function BetaPostViz() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(2);
  const [n, setN] = useState(3);
  const [h, setH] = useState(3);
  const hh = Math.min(h, n);
  const pa = a + hh, pb = b + n - hh;
  const ps = Array.from({ length: 199 }, (_, i) => (i + 1) / 200);
  const pri = ps.map((p) => betaPdf(p, a, b));
  const post = ps.map((p) => betaPdf(p, pa, pb));
  const ymax = Math.max(...pri, ...post) * 1.08;
  const W = 330, H = 150;
  const X = (p: number) => 16 + p * (W - 32);
  const Y = (y: number) => H - 16 - (y / ymax) * (H - 26);
  const pmean = pa / (pa + pb);
  const mle = n > 0 ? hh / n : null;
  const slider = (label: string, v: number, set: (x: number) => void, min: number, max: number) => (
    <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
      {label} = {v}
      <input type="range" min={min} max={max} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} style={{ width: 90 }} />
    </label>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        {slider("a", a, setA, 1, 20)}
        {slider("b", b, setB, 1, 20)}
        {slider("n", n, (v) => { setN(v); if (h > v) setH(v); }, 0, 60)}
        {slider("h", hh, setH, 0, n)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Prior and posterior densities for a coin's bias">
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.4} strokeDasharray="4 3" points={ps.map((p, i) => `${X(p).toFixed(1)},${Y(pri[i]).toFixed(1)}`).join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={ps.map((p, i) => `${X(p).toFixed(1)},${Y(post[i]).toFixed(1)}`).join(" ")} />
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(pmean)} x2={X(pmean)} y1={10} y2={Y(0)} stroke="var(--accent)" strokeDasharray="3 3" />
        {mle !== null && <line x1={X(mle)} x2={X(mle)} y1={10} y2={Y(0)} stroke="var(--danger)" strokeDasharray="2 2" />}
        <text x={X(0)} y={H - 2} className="viz-label">0</text>
        <text x={X(1)} y={H - 2} textAnchor="end" className="viz-label">1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        posterior Beta({pa}, {pb}); mean {pmean.toFixed(3)}; MLE {mle === null ? "undefined" : mle.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dashed curve is the prior Beta(a, b) and the solid curve the posterior after h heads in n flips. The posterior
        mean (accent dashed line) is (a + h)/(a + b + n), between the prior mean a/(a + b) and the maximum likelihood
        estimate h/n (danger dashed line). With three heads in three flips the MLE says 1, while the posterior mean stays
        below it; raise n and the data take over from the prior.
      </figcaption>
    </figure>
  );
}
