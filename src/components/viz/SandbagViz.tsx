"use client";

import { useState } from "react";

const NOISE = [0, 0.1, 0.2, 0.3];
const B = Array.from({ length: 41 }, (_, i) => -3 + (6 * i) / 40);

/**
 * A stylised model. An honest model has ability 0. A sandbagging model has ability 1.5 but deliberately answers wrongly on a
 * fraction 0.35 of items, whatever their difficulty. Adding weight noise of size s lowers ability by 6s² and, for the sandbagger,
 * disrupts the learned underperformance, scaling its rate by exp(−12s). Returns accuracy on an item of difficulty b.
 */
export function accuracy(sandbag: boolean, s: number, b: number) {
  const theta = (sandbag ? 1.5 : 0) - 6 * s * s;
  const p = 1 / (1 + Math.exp(-(theta - b)));
  return sandbag ? p * (1 - 0.35 * Math.exp(-12 * s)) : p;
}

const mean = (sandbag: boolean, s: number) => B.reduce((a, b) => a + accuracy(sandbag, s, b), 0) / B.length;

export function SandbagViz() {
  const [m, setM] = useState(1);
  const [n, setN] = useState(0);
  const sb = m === 1;
  const W = 330, H = 180, X0 = 30, PW = 290, Y0 = 10, PH = 140;
  const px = (b: number) => X0 + ((b + 3) / 6) * PW;
  const py = (y: number) => Y0 + PH - y * PH;
  const path = (sandbag: boolean, s: number) => B.map((b, i) => `${i ? "L" : "M"}${px(b).toFixed(1)},${py(accuracy(sandbag, s, b)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Model">
          {["honest weaker model", "sandbagging stronger model"].map((name, i) => <button key={name} type="button" className="seg" aria-pressed={m === i} onClick={() => setM(i)}>{name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Weight noise">
          {NOISE.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={n === i} onClick={() => setN(i)}>{v ? `noise ${v}` : "no noise"}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Accuracy against item difficulty">
        {[0, 0.5, 1].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray={y ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        <path d={path(!sb, 0)} fill="none" stroke="var(--border-strong)" strokeWidth={1.2} strokeDasharray="4 3" />
        <path d={path(sb, NOISE[n])} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <text x={X0} y={Y0 + PH + 13} className="viz-label">easy</text>
        <text x={X0 + PW} y={Y0 + PH + 13} textAnchor="end" className="viz-label">hard</text>
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">item difficulty</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        average accuracy {mean(sb, NOISE[n]).toFixed(3)}; without noise {mean(sb, 0).toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        A stylised comparison of two models with similar average scores; the dashed curve is the other model without noise. The
        honest model is near perfect on easy items and fails on hard ones. The sandbagger fails easy items it plainly could solve,
        a pattern that an ability model flags. Adding small random noise to the weights makes an honest model worse, but can
        disrupt a learned habit of underperforming and make a sandbagger better, which is itself a warning sign.
      </figcaption>
    </figure>
  );
}
