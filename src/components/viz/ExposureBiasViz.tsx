"use client";

import { useMemo, useState } from "react";

/** Expected number of wrong steps in T when a slip happens with probability eps per step and, once off track, every later step is wrong. */
export function offPolicyErrors(eps: number, T: number) {
  let s = 0;
  for (let t = 1; t <= T; t++) s += 1 - Math.pow(1 - eps, t);
  return s;
}

export function ExposureBiasViz() {
  const [eps, setEps] = useState(0.01);
  const TMAX = 400;
  const off = useMemo(() => Array.from({ length: TMAX + 1 }, (_, T) => offPolicyErrors(eps, T)), [eps]);
  const on = Array.from({ length: TMAX + 1 }, (_, T) => eps * T);
  const W = 330, H = 214, X0 = 40, PW = 280, Y0 = 8, PH = 160;
  const ymax = Math.max(off[TMAX], 1);
  const px = (T: number) => X0 + (T / TMAX) * PW;
  const py = (v: number) => Y0 + PH - (v / ymax) * PH;
  const line = (ys: number[]) => ys.map((v, T) => `${px(T).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Per-step slip probability">
          {[0.002, 0.01, 0.05].map((v) => (
            <button key={v} className="seg" aria-pressed={eps === v} onClick={() => setEps(v)}>ε = {v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Expected wrong steps against sequence length">
        {[0, ymax / 2, ymax].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v.toFixed(0)}</text>
          </g>
        ))}
        <polyline points={line(off)} fill="none" stroke="var(--danger)" strokeWidth={2} />
        <polyline points={line(on)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <text x={px(TMAX) - 2} y={py(off[TMAX]) + 14} textAnchor="end" className="viz-label" style={{ fill: "var(--danger)" }}>trained on teacher text</text>
        <text x={px(TMAX) - 2} y={py(on[TMAX]) - 6} textAnchor="end" className="viz-label" style={{ fill: "var(--accent)" }}>trained on its own text</text>
        <text x={X0} y={H - 18} className="viz-label">length of the generated sequence, 0 to {TMAX}</text>
        <text x={X0} y={H - 4} className="viz-label">expected wrong steps</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        at length {TMAX}: {off[TMAX].toFixed(1)} wrong steps if errors compound, {on[TMAX].toFixed(1)} if each is corrected
      </div>
      <figcaption className="viz-caption">
        A student that slips with probability ε per step on the teacher&apos;s own prefixes. If it has never been trained on prefixes
        containing its own slips, one slip leaves it in unfamiliar territory and every later step goes wrong, so errors grow
        roughly with the square of the length until they saturate. Training on its own generations, with the teacher grading
        each step, teaches recovery, and errors grow only in proportion to length.
      </figcaption>
    </figure>
  );
}
