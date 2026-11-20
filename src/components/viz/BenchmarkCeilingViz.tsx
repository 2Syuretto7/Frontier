"use client";

import { useState } from "react";

const ERRORS = [0, 0.05, 0.1];
const A = 1.5, GAP = 0.7, YEARS = 8;
const BS = Array.from({ length: 41 }, (_, i) => -2 + i * 0.1);
const sig = (x: number) => 1 / (1 + Math.exp(-x));

/** True accuracy of a model of ability θ on items with difficulties spread over [−2, 2]. */
const trueAcc = (theta: number) => BS.reduce((s, b) => s + sig(A * (theta - b)), 0) / BS.length;
/** Observed accuracy with a share e of wrong answer keys on four-option questions. */
export function observed(theta: number, e: number) {
  const a = trueAcc(theta);
  return a * (1 - e) + ((1 - a) * e) / 3;
}

export function BenchmarkCeilingViz() {
  const [ei, setEi] = useState(1);
  const e = ERRORS[ei];
  const W = 330, H = 180, X0 = 40, PW = 280, Y0 = 10, PH = 130;
  const theta = (t: number) => -3 + t;
  const px = (t: number) => X0 + (t / YEARS) * PW, py = (v: number) => Y0 + PH - v * PH;
  const ts = Array.from({ length: 81 }, (_, i) => (i * YEARS) / 80);
  const line = (shift: number) => ts.map((t, i) => `${i ? "L" : "M"}${px(t).toFixed(1)},${py(observed(theta(t) + shift, e)).toFixed(1)}`).join(" ");
  const gapAt = (t: number) => (observed(theta(t) + GAP, e) - observed(theta(t), e)) * 100;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">wrong answer keys</span>
        <div className="segmented" role="group" aria-label="Share of wrong answer keys">
          {ERRORS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ei === i} onClick={() => setEi(i)}>{v * 100}%</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Two models' scores on a benchmark over time">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 5} y={py(v) + 3} textAnchor="end" className="viz-label">{v * 100}%</text>
          </g>
        ))}
        {[0, 2, 4, 6, 8].map((t) => <text key={t} x={px(t)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">{t}</text>)}
        <line x1={X0} x2={X0 + PW} y1={py(1 - e)} y2={py(1 - e)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <path d={line(0)} fill="none" stroke="var(--text)" strokeWidth={1.5} />
        <path d={line(GAP)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">years; coloured model is always 0.7 ability units ahead</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        score gap: year 2 {gapAt(2).toFixed(1)} points, year 4 {gapAt(4).toFixed(1)}, year 6 {gapAt(6).toFixed(1)}, year 8 {gapAt(8).toFixed(1)}
      </div>
      <figcaption className="viz-caption">
        Two families of models improve at the same rate, one always a fixed step ahead in ability. On a benchmark with questions
        spread over a fixed range of difficulty, the gap in score is large while the questions are hard for both, and shrinks
        to a fraction of a point as both approach the ceiling, which wrong answer keys pull below 100% (dashed). A saturated
        benchmark hides real differences inside its noise.
      </figcaption>
    </figure>
  );
}
