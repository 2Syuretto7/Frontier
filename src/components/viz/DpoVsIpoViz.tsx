"use client";

import { useMemo, useState } from "react";

const PS = [0.8, 1.0];
const BETA = 0.1, TAU = 0.1, LR = 2, STEPS = 3000, YMAX = 45;
const sig = (x: number) => 1 / (1 + Math.exp(-x));

/** Log-ratio margin h of one pair under gradient descent on the expected DPO and IPO losses, when the first response is
 *  preferred with probability p. DPO: −p log σ(βh) − (1 − p) log σ(−βh). IPO: p(h − c)² + (1 − p)(h + c)², c = 1/(2τ). */
export function paths(p: number) {
  const c = 1 / (2 * TAU);
  let hd = 0, hi = 0;
  const dpo = [0], ipo = [0];
  for (let s = 1; s <= STEPS; s++) {
    hd -= LR * (-BETA * (p - sig(BETA * hd)));
    hi -= 0.01 * LR * 2 * (hi - (2 * p - 1) * c);
    dpo.push(hd); ipo.push(hi);
  }
  return { dpo, ipo };
}

export function DpoVsIpoViz() {
  const [pi, setPi] = useState(1);
  const p = PS[pi];
  const { dpo, ipo } = useMemo(() => paths(p), [p]);
  const W = 330, H = 180, X0 = 30, PW = 290, Y0 = 10, PH = 140;
  const px = (s: number) => X0 + (s / STEPS) * PW;
  const py = (v: number) => Y0 + PH - (Math.min(v, YMAX) / YMAX) * PH;
  const line = (a: number[]) => a.filter((_, i) => i % 20 === 0).map((v, k) => `${k ? "L" : "M"}${px(k * 20).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">chosen response preferred with probability</span>
        <div className="segmented" role="group" aria-label="Preference probability">
          {PS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Margin under DPO and IPO over training">
        {[0, 10, 20, 30, 40].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 5} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        <path d={line(dpo)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path d={line(ipo)} fill="none" stroke="var(--text)" strokeWidth={2} strokeDasharray="5 3" />
        <text x={X0 + 6} y={Y0 + 10} className="viz-label">solid: DPO (β = 0.1); dashed: IPO (τ = 0.1)</text>
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">training steps (0 to 3,000); y: log-ratio margin h</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        p = {p}: after 3,000 steps DPO margin {dpo[STEPS].toFixed(2)}, IPO margin {ipo[STEPS].toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        One preference pair, trained on its expected loss. When the preference is noisy, DPO settles where{" "}
        σ(βh) matches the preference probability. When the same response always wins, the DPO loss keeps falling as the margin
        grows, so the margin climbs without limit and the KL regularisation that β was meant to provide stops binding. IPO&apos;s
        squared loss pulls the margin to a fixed target in both cases.
      </figcaption>
    </figure>
  );
}
