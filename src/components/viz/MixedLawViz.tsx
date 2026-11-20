"use client";

import { useState } from "react";

/** The Cantor function on [0, 1], read off the ternary digits of x (depth 30). */
export function cantorF(x: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let v = 0, scale = 0.5;
  for (let k = 0; k < 30; k++) {
    x *= 3;
    const d = Math.min(2, Math.floor(x));
    x -= d;
    if (d === 1) return v + scale;
    v += (d / 2) * scale;
    scale /= 2;
  }
  return v;
}

export const PARTS = [
  { label: "atom at 0", w: 0.3, F: (x: number) => (x >= 0 ? 1 : 0), mean: 0 },
  { label: "uniform on [1, 2]", w: 0.5, F: (x: number) => Math.max(0, Math.min(1, x - 1)), mean: 1.5 },
  { label: "Cantor on [2, 3]", w: 0.2, F: (x: number) => cantorF(x - 2), mean: 2.5 },
];

export function mixture(on: boolean[]) {
  const tot = PARTS.reduce((s, p, i) => s + (on[i] ? p.w : 0), 0);
  const ws = PARTS.map((p, i) => (on[i] && tot > 0 ? p.w / tot : 0));
  return { ws, F: (x: number) => PARTS.reduce((s, p, i) => s + ws[i] * p.F(x), 0), mean: PARTS.reduce((s, p, i) => s + ws[i] * p.mean, 0) };
}

export function MixedLawViz() {
  const [on, setOn] = useState([true, true, true]);
  const m = mixture(on);
  const W = 330, H = 150, X0 = 24, PW = 298, Y0 = 6, PH = 126, XL = -0.5, XR = 3.5;
  const sx = (x: number) => X0 + ((x - XL) / (XR - XL)) * PW, sy = (y: number) => Y0 + PH - y * PH;
  const xs = Array.from({ length: 1601 }, (_, i) => XL + ((XR - XL) * i) / 1600);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 6 }}>
        {PARTS.map((p, i) => (
          <button key={p.label} type="button" className="btn" aria-pressed={on[i]} style={{ opacity: on[i] ? 1 : 0.55, fontWeight: on[i] ? 600 : 400 }} onClick={() => { const nx = on.map((v, j) => (j === i ? !v : v)); if (nx.some(Boolean)) setOn(nx); }}>
            {on[i] ? "✓ " : ""}{p.label}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Distribution function of a mixture of an atom, a uniform part and a Cantor part">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0 + PW} y1={sy(1)} y2={sy(1)} stroke="var(--border)" strokeDasharray="2 3" />
        {[0, 1, 2, 3].map((v) => <text key={v} x={sx(v)} y={H - 1} textAnchor="middle" className="viz-label">{v}</text>)}
        <text x={X0 - 4} y={sy(1) + 4} textAnchor="end" className="viz-label">1</text>
        <path d={xs.map((x, i) => `${i && !(xs[i - 1] < 0 && x >= 0) ? "L" : "M"}${sx(x).toFixed(1)},${sy(m.F(x)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {m.ws[0] > 0 && <><circle cx={sx(0)} cy={sy(m.F(-1e-9))} r={3} fill="var(--surface)" stroke="var(--accent)" /><circle cx={sx(0)} cy={sy(m.F(0))} r={3} fill="var(--accent)" /></>}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        weights {m.ws.map((w) => w.toFixed(3)).join(", ")}; jump at 0 = {m.ws[0].toFixed(3)}; mean {m.mean.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        The distribution function of a random variable that is 0 with probability 0.3, uniform on [1, 2] with probability
        0.5, and Cantor-distributed on [2, 3] with probability 0.2; its mean is 1.25. The atom makes a jump, the uniform part
        a straight ramp, and the Cantor part a staircase that rises continuously yet is flat everywhere except on a set of
        length zero. Switch parts off to see each alone: every law on ℝ is a mixture of these three kinds.
      </figcaption>
    </figure>
  );
}
