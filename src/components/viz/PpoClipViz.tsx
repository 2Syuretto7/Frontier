"use client";

import { useState } from "react";

const EPS = [0.1, 0.2, 0.3];

/** The PPO objective for one sample: min(r A, clip(r, 1 − ε, 1 + ε) A). */
export const clipObjective = (r: number, a: number, eps: number) => Math.min(r * a, Math.max(1 - eps, Math.min(1 + eps, r)) * a);

export function PpoClipViz() {
  const [pos, setPos] = useState(true);
  const [ei, setEi] = useState(1);
  const eps = EPS[ei], A = pos ? 1 : -1;
  const W = 330, H = 180, X0 = 34, Y0 = 8, PW = W - 44, PH = H - Y0 - 30, RMAX = 2;
  const sx = (r: number) => X0 + (r / RMAX) * PW, sy = (v: number) => Y0 + PH - ((v + 2) / 4) * PH;
  const rs = Array.from({ length: 201 }, (_, i) => (i / 200) * RMAX);
  const line = (f: (r: number) => number) => rs.map((r, i) => `${i ? "L" : "M"}${sx(r).toFixed(1)},${sy(f(r)).toFixed(1)}`).join(" ");
  const flat = pos ? [1 + eps, RMAX] : [0, 1 - eps];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Sign of the advantage">
          <button type="button" className="seg" aria-pressed={pos} onClick={() => setPos(true)}>A &gt; 0</button>
          <button type="button" className="seg" aria-pressed={!pos} onClick={() => setPos(false)}>A &lt; 0</button>
        </div>
        <span className="viz-label">ε</span>
        <div className="segmented" role="group" aria-label="Clipping range">
          {EPS.map((e, i) => <button key={e} type="button" className="seg" aria-pressed={ei === i} onClick={() => setEi(i)}>{e}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="The clipped PPO objective as a function of the probability ratio">
        <rect x={sx(flat[0])} y={Y0} width={sx(flat[1]) - sx(flat[0])} height={PH} fill="var(--accent-soft)" />
        {[-2, -1, 0, 1, 2].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={sy(v)} y2={sy(v)} stroke="var(--border)" strokeDasharray={v ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v < 0 ? `−${-v}` : v}</text>
          </g>
        ))}
        <line x1={sx(1)} x2={sx(1)} y1={Y0} y2={Y0 + PH} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <path d={line((r) => r * A)} fill="none" stroke="var(--danger)" strokeWidth={1.3} strokeDasharray="5 3" />
        <path d={line((r) => clipObjective(r, A, eps))} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {[0, 1, 2].map((r) => <text key={r} x={sx(r)} y={Y0 + PH + 14} textAnchor={r === RMAX ? "end" : r === 0 ? "start" : "middle"} className="viz-label">{r}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">probability ratio r = π_new(a | s) / π_old(a | s)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {pos ? `gradient zero for r above ${(1 + eps).toFixed(1)}` : `gradient zero for r below ${(1 - eps).toFixed(1)}`}
      </div>
      <figcaption className="viz-caption">
        The objective PPO maximises for one sample with advantage A = ±1, as a function of how much more likely the new
        policy makes the sampled action. The dashed red line is the plain surrogate r·A of TRPO, which rewards pushing r
        without limit. The blue curve is the clipped objective. When the action was good it stops rewarding increases beyond
        1 + ε, and when it was bad it stops rewarding decreases below 1 − ε: in the shaded region the gradient is zero, so
        further epochs on the same batch leave this sample alone. In the other direction the objective is not clipped, so a
        step that went the wrong way is always pulled back.
      </figcaption>
    </figure>
  );
}
