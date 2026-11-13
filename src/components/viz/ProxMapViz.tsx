"use client";

import { useState } from "react";

const HS = [
  {
    label: "|x|",
    h: (x: number) => Math.abs(x),
    prox: (v: number, l: number) => Math.sign(v) * Math.max(Math.abs(v) - l, 0),
    note: "soft thresholding: values within λ of 0 become exactly 0, the rest shrink by λ",
  },
  {
    label: "indicator of [−1, 1]",
    h: (x: number) => (Math.abs(x) <= 1 ? 0 : Infinity),
    prox: (v: number) => Math.max(-1, Math.min(1, v)),
    note: "projection onto the interval, whatever λ is",
  },
  {
    label: "x²/2",
    h: (x: number) => (x * x) / 2,
    prox: (v: number, l: number) => v / (1 + l),
    note: "uniform shrinkage towards 0 by the factor 1/(1 + λ)",
  },
];

/** The proximal operator in one variable, prox(v) = argmin h(x) + (x − v)²/(2λ), plotted as a map from v to x, with the Moreau envelope, its smoothed optimal value. */
export function ProxMapViz() {
  const [k, setK] = useState(0);
  const [lam, setLam] = useState(1);
  const { h, prox, note, label } = HS[k];
  const lo = -3, hi = 3;
  const vs = Array.from({ length: 241 }, (_, i) => lo + ((hi - lo) * i) / 240);
  const env = (v: number) => { const p = prox(v, lam); return h(p) + (p - v) ** 2 / (2 * lam); };
  const W = 330, H = 170;
  const half = (W - 20) / 2;
  const X1 = (v: number) => 6 + ((v - lo) / (hi - lo)) * (half - 6);
  const Y1 = (y: number) => H / 2 - (y / 3.2) * (H / 2 - 12);
  const X2 = (v: number) => half + 20 + ((v - lo) / (hi - lo)) * (half - 6);
  const Y2 = (y: number) => H - 14 - (y / 3.5) * (H - 26);
  const hs = vs.map((v) => h(v));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {HS.map((q, i) => (
          <button key={q.label} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{q.label}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          λ = {lam.toFixed(2)}
          <input type="range" min={0.1} max={2.5} step={0.05} value={lam} onChange={(e) => setLam(Number(e.target.value))} aria-label="lambda" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="The proximal map and the Moreau envelope of the chosen function">
        <line x1={X1(lo)} x2={X1(hi)} y1={Y1(0)} y2={Y1(0)} stroke="var(--border)" />
        <line x1={X1(0)} x2={X1(0)} y1={8} y2={H - 8} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" points={`${X1(lo)},${Y1(lo)} ${X1(hi)},${Y1(hi)}`} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={vs.map((v) => `${X1(v).toFixed(1)},${Y1(prox(v, lam)).toFixed(1)}`).join(" ")} />
        <text x={X1(lo)} y={12} className="viz-label">prox(v)</text>
        <line x1={X2(lo)} x2={X2(hi)} y1={Y2(0)} y2={Y2(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.2} points={vs.map((v, i) => (Number.isFinite(hs[i]) ? `${X2(v).toFixed(1)},${Y2(Math.min(hs[i], 3.5)).toFixed(1)}` : null)).filter(Boolean).join(" ")} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} points={vs.map((v) => `${X2(v).toFixed(1)},${Y2(Math.min(env(v), 3.5)).toFixed(1)}`).join(" ")} />
        <text x={X2(lo)} y={12} className="viz-label">h and its envelope</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {label}: {note}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Left: the proximal map v ↦ argmin over x of h(x) + (x − v)²/(2λ), against the dashed identity line. It pulls v
        towards where h is small, more strongly for larger λ. Right: h (grey) and its Moreau envelope (red), the minimum
        value of the same problem. The envelope is a smooth lower approximation of h: for |x| it is the Huber function,
        and for the indicator it is the squared distance to the interval divided by 2λ.
      </figcaption>
    </figure>
  );
}
