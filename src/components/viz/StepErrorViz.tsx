"use client";

import { useState } from "react";

const EPS = [0.01, 0.003, 0.001];
const REC = [0, 0.5, 0.9];
const GRID = Array.from({ length: 61 }, (_, i) => Math.pow(10, (4 * i) / 60));

/** Chance of finishing n steps when each step goes wrong with probability eps and a fraction rec of errors is caught and fixed. */
export function finish(eps: number, rec: number, n: number) {
  return Math.pow(1 - eps * (1 - rec), n);
}

export function StepErrorViz() {
  const [e, setE] = useState(0);
  const [r, setR] = useState(0);
  const W = 330, H = 180, X0 = 34, PW = 286, Y0 = 10, PH = 140;
  const px = (n: number) => X0 + (Math.log10(n) / 4) * PW;
  const py = (y: number) => Y0 + PH - y * PH;
  const path = (eps: number, rec: number) => GRID.map((n, i) => `${i ? "L" : "M"}${px(n).toFixed(1)},${py(finish(eps, rec, n)).toFixed(1)}`).join(" ");
  const eff = EPS[e] * (1 - REC[r]);
  const half = Math.log(0.5) / Math.log(1 - eff);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Error rate per step">
          {EPS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={e === i} onClick={() => setE(i)}>{v * 100}% per step</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Errors recovered">
          {REC.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={r === i} onClick={() => setR(i)}>{v ? `${v * 100}% recovered` : "no recovery"}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Chance of finishing a task against its number of steps">
        {[0, 0.5, 1].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray={y ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        {r > 0 && <path d={path(EPS[e], 0)} fill="none" stroke="var(--border-strong)" strokeWidth={1.2} strokeDasharray="4 3" />}
        <path d={path(EPS[e], REC[r])} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {half <= 10000 && <circle cx={px(half)} cy={py(0.5)} r={4} style={{ fill: "var(--accent)" }} />}
        {[1, 10, 100, 1000, 10000].map((n) => <text key={n} x={px(n)} y={Y0 + PH + 13} textAnchor={n === 1 ? "start" : n === 10000 ? "end" : "middle"} className="viz-label">{n.toLocaleString("en-IN")}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">steps in the task</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        effective error {(100 * eff).toFixed(2)}% per step; half the tasks finished at {Math.round(half).toLocaleString("en-IN")} steps
      </div>
      <figcaption className="viz-caption">
        If every step of a task must go right and each fails independently with a small probability, the chance of finishing falls
        exponentially with length. The half-life, the length at which half the tasks are finished, is about 0.69 divided by the
        error rate. Catching and fixing errors, shown against the dashed no-recovery curve, stretches it as much as cutting the error
        rate does.
      </figcaption>
    </figure>
  );
}
