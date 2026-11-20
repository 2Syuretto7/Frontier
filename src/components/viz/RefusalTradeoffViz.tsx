"use client";

import { useState } from "react";

const QUALITY = [
  { label: "weak harm classifier", gap: 1.5 },
  { label: "strong harm classifier", gap: 3 },
];
const THRESHOLDS = [-0.5, 0.5, 1.5, 2.5];

function erf(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
const Phi = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));

/** Harm scores: borderline-but-safe prompts ~ N(0, 1), harmful prompts ~ N(gap, 1). The model refuses at score ≥ t. */
export function rates(gap: number, t: number) {
  return { benignRefused: 1 - Phi(t), harmfulComplied: Phi(t - gap) };
}

export function RefusalTradeoffViz() {
  const [qi, setQi] = useState(0);
  const [ti, setTi] = useState(1);
  const gap = QUALITY[qi].gap, t = THRESHOLDS[ti];
  const cur = rates(gap, t);
  const W = 340, H = 200, X0 = 58, PW = 266, Y0 = 10, PH = 150;
  const px = (v: number) => X0 + v * PW, py = (v: number) => Y0 + PH - v * PH;
  const ts = Array.from({ length: 121 }, (_, i) => -3 + i * 0.075);
  const curve = (g: number) => ts.map((tt, i) => { const r = rates(g, tt); return `${i ? "L" : "M"}${px(r.benignRefused).toFixed(1)},${py(r.harmfulComplied).toFixed(1)}`; }).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Classifier quality">
          {QUALITY.map((q, i) => <button key={q.label} type="button" className="seg" aria-pressed={qi === i} onClick={() => setQi(i)}>{q.label}</button>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="viz-label">refusal threshold</span>
          <div className="segmented" role="group" aria-label="Refusal threshold">
            {THRESHOLDS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ti === i} onClick={() => setTi(i)}>{i === 0 ? "strict" : i === THRESHOLDS.length - 1 ? "lax" : i}</button>)}
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Trade-off between harmful compliance and over-refusal">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <line x1={px(v)} x2={px(v)} y1={py(0)} y2={py(1)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 5} y={py(v) + 3} textAnchor="end" className="viz-label">{v * 100}%</text>
            <text x={px(v)} y={py(0) + 13} textAnchor="middle" className="viz-label">{v * 100}%</text>
          </g>
        ))}
        {QUALITY.map((q, i) => <path key={q.label} d={curve(q.gap)} fill="none" stroke={i === qi ? "var(--accent)" : "var(--border)"} strokeWidth={i === qi ? 2.5 : 1.5} />)}
        <circle cx={px(cur.benignRefused)} cy={py(cur.harmfulComplied)} r={5} style={{ fill: "var(--text)" }} />
        <text x={X0 + PW / 2} y={H - 8} textAnchor="middle" className="viz-label">safe requests refused</text>
        <text x={10} y={py(0.5)} textAnchor="middle" transform={`rotate(-90 10 ${py(0.5)})`} className="viz-label">harmful requests answered</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        refuses {(cur.benignRefused * 100).toFixed(1)}% of safe requests; answers {(cur.harmfulComplied * 100).toFixed(1)}% of harmful ones
      </div>
      <figcaption className="viz-caption">
        A model that judges harm imperfectly faces a trade-off. Refusing more readily cuts harmful answers but turns away more
        safe requests that merely look risky, such as how to kill a Python process. Moving the threshold slides along the curve;
        only better judgement, a classifier that separates the two kinds of request more cleanly, moves the whole curve
        towards the corner where both errors are rare.
      </figcaption>
    </figure>
  );
}
