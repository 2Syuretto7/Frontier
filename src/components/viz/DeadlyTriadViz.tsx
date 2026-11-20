"use client";

import { useMemo, useState } from "react";

const UPDATES = 60, ALPHA = 0.1;

/** Semi-gradient TD(0) on the two-state example: values w and 2w, the first state leads to the second with reward 0, the second ends with reward 0. */
export function triadRun(onPolicy: boolean, gamma: number) {
  let w = 1;
  const out = [w];
  for (let t = 0; t < UPDATES; t++) {
    const second = onPolicy && t % 2 === 1;
    const x = second ? 2 : 1, next = second ? 0 : 2 * w;
    w += ALPHA * (gamma * next - x * w) * x;
    out.push(w);
  }
  return out;
}

export function DeadlyTriadViz() {
  const [on, setOn] = useState(false);
  const [gi, setGi] = useState(18);
  const gamma = gi / 20;
  const ws = useMemo(() => triadRun(on, gamma), [on, gamma]);
  const W = 330, H = 160, X0 = 40, Y0 = 8, PW = W - 50, PH = H - Y0 - 30;
  const sx = (t: number) => X0 + (t / UPDATES) * PW;
  const sy = (w: number) => Y0 + PH - ((Math.min(3, Math.max(-3, Math.log10(Math.max(Math.abs(w), 1e-9)))) + 3) / 6) * PH;
  const last = ws[UPDATES];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Which transitions are updated">
          <button type="button" className="seg" aria-pressed={!on} onClick={() => setOn(false)}>first only</button>
          <button type="button" className="seg" aria-pressed={on} onClick={() => setOn(true)}>on-policy</button>
        </div>
        <label className="viz-label" htmlFor="triad-g">γ = {gamma.toFixed(2)}</label>
        <input id="triad-g" type="range" min={0} max={20} step={1} value={gi} onChange={(e) => setGi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Size of the weight over updates on a logarithmic scale">
        {[-3, -2, -1, 0, 1, 2, 3].map((e) => (
          <g key={e}>
            <line x1={X0} x2={X0 + PW} y1={sy(10 ** e)} y2={sy(10 ** e)} stroke="var(--border)" strokeDasharray={e === 0 ? undefined : "2 4"} />
            <text x={X0 - 4} y={sy(10 ** e) + 4} textAnchor="end" className="viz-label">{e === 0 ? "1" : `10${e < 0 ? "⁻" : ""}${"⁰¹²³"[Math.abs(e)]}`}</text>
          </g>
        ))}
        <path d={ws.map((w, t) => `${t ? "L" : "M"}${sx(t).toFixed(1)},${sy(w).toFixed(1)}`).join(" ")} fill="none" stroke={Math.abs(last) > 1 ? "var(--danger)" : "var(--accent)"} strokeWidth={1.6} />
        {[0, 20, 40, 60].map((t) => <text key={t} x={sx(t)} y={Y0 + PH + 14} textAnchor={t === UPDATES ? "end" : t === 0 ? "start" : "middle"} className="viz-label">{t}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">update</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`|w| after ${UPDATES} updates: ${Math.abs(last) >= 0.001 ? Math.abs(last).toPrecision(3) : "below 0.001"}`}
      </div>
      <figcaption className="viz-caption">
        Two states share one weight w through features 1 and 2, so their estimated values are w and 2w. The first state leads
        to the second with reward 0, and the second ends the episode with reward 0, so the true values are 0. Semi-gradient TD(0)
        with step 0.1 starts from w = 1. Updating only the first transition, as an off-policy learner might, multiplies w by
        1 + 0.1(2γ − 1) each time, so w grows without bound whenever γ is above 0.5: at γ = 0.9 it passes 100 within 60 updates.
        Updating both transitions in turn, as the policy visits them, shrinks w to zero for every γ.
      </figcaption>
    </figure>
  );
}
