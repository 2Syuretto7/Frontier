"use client";

import { useState } from "react";

const TOTAL = 1000;          // billions of tokens in the whole run
const WARMUP = 10;
const FRACS = [0.05, 0.1, 0.2];
const MATH_UNIQUE = 20;      // billions of unique tokens in the high-quality maths corpus
const PRE = [["web", 0.75], ["code", 0.25], ["maths", 0]] as const;
const MID = [["web", 0.35], ["code", 0.25], ["maths", 0.4]] as const;
const FILL = ["var(--border-strong)", "var(--text-muted)", "var(--accent)"];

/** Warmup-stable-decay learning rate, as a fraction of the peak, after t billion tokens. */
export function wsd(t: number, decay: number) {
  if (t < WARMUP) return t / WARMUP;
  if (t < TOTAL - decay) return 1;
  return (TOTAL - t) / decay;
}

export function MidTrainingViz() {
  const [fi, setFi] = useState(1);
  const decay = FRACS[fi] * TOTAL;
  const start = TOTAL - decay;
  const epochs = (MID[2][1] * decay) / MATH_UNIQUE;
  const W = 330, X0 = 30, PW = 290, Y0 = 8, PH = 70, GAP = 14, BH = 44;
  const x = (t: number) => X0 + (t / TOTAL) * PW;
  const y = (lr: number) => Y0 + PH - lr * PH;
  const pts = [0, WARMUP, start, TOTAL].map((t) => `${x(t)},${y(wsd(t, decay))}`).join(" ");
  const band = (t0: number, t1: number, mix: readonly (readonly [string, number])[]) => {
    let acc = 0;
    return mix.map(([name, w], i) => {
      const top = Y0 + PH + GAP + acc * BH;
      acc += w;
      return w > 0 ? <rect key={`${t0}-${name}`} x={x(t0)} y={top} width={x(t1) - x(t0)} height={w * BH} style={{ fill: FILL[i] }} /> : null;
    });
  };
  const bottom = Y0 + PH + GAP + BH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">decay phase</span>
        <div className="segmented" role="group" aria-label="Decay phase as a share of training">
          {FRACS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={fi === j} onClick={() => setFi(j)}>{`${v * 100}%`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${bottom + 18}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Learning rate schedule and data mixture over training">
        <line x1={X0} x2={X0 + PW} y1={y(0)} y2={y(0)} stroke="var(--border)" />
        <polyline points={pts} fill="none" stroke="var(--text)" strokeWidth={1.8} />
        <text x={X0 - 5} y={y(1) + 4} textAnchor="end" className="viz-label">lr</text>
        {band(0, start, PRE)}
        {band(start, TOTAL, MID)}
        <line x1={x(start)} x2={x(start)} y1={Y0} y2={bottom} stroke="var(--text-muted)" strokeDasharray="2 3" />
        {[0, 500, 1000].map((v) => <text key={v} x={x(v)} y={bottom + 13} textAnchor={v === 1000 ? "end" : "middle"} className="viz-label">{v}</text>)}
        <text x={X0 - 5} y={Y0 + PH + GAP + BH / 2 + 4} textAnchor="end" className="viz-label">mix</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        decay starts at {start}B tokens; the {MATH_UNIQUE}B-token maths corpus is seen {epochs} time{epochs === 1 ? "" : "s"}
      </div>
      <figcaption className="viz-caption">
        A warmup-stable-decay schedule over a 1T-token run (top) and the data mixture (bottom): web light, code dark, maths in
        colour. The maths corpus enters only when the learning rate starts to fall. Axis in billions of tokens. A longer decay phase
        lets more high-quality data in but repeats a small corpus more often.
      </figcaption>
    </figure>
  );
}
