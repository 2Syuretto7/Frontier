"use client";

import { useState } from "react";
import { corridorJ } from "./ShortCorridorViz";

const P = 0.8, DELTAS = [0.001, 0.01, 0.1, 0.5, 1];
const SLOPE = (() => {
  const h = 1e-6;
  return (corridorJ(P + h) - corridorJ(P - h)) / (2 * h);
})();

const klBern = (p: number, q: number) => p * Math.log(p / q) + (1 - p) * Math.log((1 - p) / (1 - q));

/** The surrogate of TRPO on the short corridor at p = 0.8: J(p) plus the old policy's visits times the new policy's advantages,
 *  which is linear in the new probability p'. */
export const surrogate = (q: number) => corridorJ(P) + (q - P) * SLOPE;

/** Edge of the trust region {p' : KL(p || p') ≤ delta} on the side of p' < p, where the surrogate increases. */
export function edge(delta: number) {
  let lo = 1e-6, hi = P;
  for (let i = 0; i < 100; i++) {
    const m = (lo + hi) / 2;
    if (klBern(P, m) <= delta) hi = m; else lo = m;
  }
  return hi;
}

export function upperEdge(delta: number) {
  let lo = P, hi = 1 - 1e-9;
  for (let i = 0; i < 100; i++) {
    const m = (lo + hi) / 2;
    if (klBern(P, m) <= delta) lo = m; else hi = m;
  }
  return lo;
}

export function TrustRegionViz() {
  const [di, setDi] = useState(2);
  const d = DELTAS[di], lo = edge(d), hi = upperEdge(d);
  const W = 330, H = 180, X0 = 36, Y0 = 8, PW = W - 46, PH = H - Y0 - 30, YMIN = -40, YMAX = 20;
  const sx = (q: number) => X0 + q * PW, sy = (v: number) => Y0 + PH - ((Math.min(YMAX, Math.max(YMIN, v)) - YMIN) / (YMAX - YMIN)) * PH;
  const pts: string[] = [];
  for (let i = 1; i < 200; i++) {
    const q = i / 200;
    if (corridorJ(q) < YMIN) continue;
    pts.push(`${pts.length ? "L" : "M"}${sx(q).toFixed(1)},${sy(corridorJ(q)).toFixed(1)}`);
  }
  const fmt = (v: number) => `${v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">KL limit δ</span>
        <div className="segmented" role="group" aria-label="Trust region size">
          {DELTAS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={di === i} onClick={() => setDi(i)}>{x}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="True objective, surrogate and trust region on the short corridor">
        <rect x={sx(lo)} y={Y0} width={sx(hi) - sx(lo)} height={PH} fill="var(--accent-soft)" />
        {[-40, -20, 0, 20].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={sy(v)} y2={sy(v)} stroke="var(--border)" strokeDasharray={v === YMIN ? undefined : "2 4"} />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v < 0 ? `−${-v}` : v}</text>
          </g>
        ))}
        <path d={pts.join(" ")} fill="none" stroke="var(--text)" strokeWidth={1.6} />
        <line x1={sx(0.02)} x2={sx(0.98)} y1={sy(surrogate(0.02))} y2={sy(surrogate(0.98))} stroke="var(--danger)" strokeWidth={1.4} strokeDasharray="5 3" />
        <circle cx={sx(P)} cy={sy(corridorJ(P))} r={4} fill="var(--text-muted)" />
        <circle cx={sx(lo)} cy={sy(corridorJ(lo))} r={4.5} fill="var(--accent)" />
        <circle cx={sx(lo)} cy={sy(surrogate(lo))} r={3.5} fill="var(--danger)" />
        {[0, 0.5, 1].map((q) => <text key={q} x={sx(q)} y={Y0 + PH + 14} textAnchor={q === 1 ? "end" : q === 0 ? "start" : "middle"} className="viz-label">{q}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">new probability of choosing right</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`step to ${lo.toFixed(3)}: surrogate ${fmt(surrogate(lo))}, true value ${fmt(corridorJ(lo))} (now ${fmt(corridorJ(P))})`}
      </div>
      <figcaption className="viz-caption">
        The short corridor of l6.6.1 with the current policy choosing right with probability 0.8 (grey point). The black curve
        is the true value of each new policy; the dashed red line is the surrogate built from the current policy&apos;s visits and
        advantages, which matches the true value and its slope at 0.8. The shaded band is the trust region, where the KL
        divergence from the current policy is at most δ. Maximising the surrogate in the band moves to its left edge (blue
        point). For small δ the surrogate predicts the gain well, and δ = 0.1 lands almost at the optimum. At δ = 0.5 the
        surrogate promises 6.2 while the true value, −15.6, has slipped below the start, and at δ = 1 the step lands at
        −27.4.
      </figcaption>
    </figure>
  );
}
