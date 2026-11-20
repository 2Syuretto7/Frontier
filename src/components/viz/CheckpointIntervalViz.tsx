"use client";

import { useState } from "react";

const C = 1, R = 10;                                  // minutes to checkpoint and to restart
const MS = [60, 180, 600];

export const wasteAt = (tau: number, M: number) => C / tau + (tau / 2 + R) / M;
export const youngDaly = (M: number) => Math.sqrt(2 * C * M);

export function CheckpointIntervalViz() {
  const [i, setI] = useState(1);
  const M = MS[i];
  const W = 330, H = 130, X0 = 40, Y0 = 8, PW = 270, PH = 100, TMAX = 120, WMAX = 0.4;
  const px = (t: number) => X0 + (t / TMAX) * PW;
  const py = (w: number) => Y0 + PH - (Math.min(w, WMAX) / WMAX) * PH;
  const pts = Array.from({ length: 119 }, (_, k) => 1 + k).map((t) => `${px(t).toFixed(1)},${py(wasteAt(t, M)).toFixed(1)}`).join(" ");
  const opt = youngDaly(M);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Mean time between failures">
          {MS.map((m, j) => <button key={m} type="button" className="seg" aria-pressed={i === j} onClick={() => setI(j)}>failure every {m / 60} h</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 8}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Wasted fraction of time against checkpoint interval">
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <line x1={px(opt)} x2={px(opt)} y1={Y0} y2={Y0 + PH} stroke="var(--text)" strokeDasharray="3 2" />
        {[0, 30, 60, 90, 120].map((t) => <text key={t} x={px(t)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{t}</text>)}
        {[0, 0.2, 0.4].map((w) => <text key={w} x={X0 - 4} y={py(w) + 4} textAnchor="end" className="viz-label">{w * 100}%</text>)}
        <text x={X0 + PW} y={Y0 + PH - 4} textAnchor="end" className="viz-label">interval, minutes</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        best interval ≈ {opt.toFixed(1)} min, wasting {(100 * wasteAt(opt, M)).toFixed(1)}% of the run
      </div>
      <figcaption className="viz-caption">
        Checkpointing takes 1 minute and restarting 10. Frequent checkpoints waste time writing them; rare ones waste the work lost at
        each failure, half an interval on average. The minimum sits at the square root of twice the checkpoint cost times the time
        between failures, and the restart cost sets a floor that no interval removes.
      </figcaption>
    </figure>
  );
}
