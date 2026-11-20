"use client";

import { useState } from "react";

const K = 12;
const LOGITS = Array.from({ length: K }, (_, i) => -0.55 * i);   // a model that strongly prefers its first few answers
const TEMPS = [0.5, 1, 1.5, 2.5];
const DRAWS = 20;

export function softmaxT(logits: number[], t: number) {
  const m = Math.max(...logits);
  const e = logits.map((x) => Math.exp((x - m) / t));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
}

export function SampleDiversityViz() {
  const [ti, setTi] = useState(1);
  const p = softmaxT(LOGITS, TEMPS[ti]);
  const distinct = p.reduce((s, q) => s + 1 - (1 - q) ** DRAWS, 0);
  const H = -p.reduce((s, q) => s + q * Math.log2(q), 0);
  const W = 330, X0 = 30, Y0 = 8, PW = 290, PH = 110;
  const bw = PW / K;
  const y = (v: number) => Y0 + PH - (v / 0.7) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">temperature</span>
        <div className="segmented" role="group" aria-label="Sampling temperature">
          {TEMPS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={ti === j} onClick={() => setTi(j)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + PH + 18}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Probability of each of twelve answers">
        <line x1={X0} x2={X0 + PW} y1={y(0)} y2={y(0)} stroke="var(--border)" />
        {p.map((q, i) => (
          <rect key={i} x={X0 + i * bw + 2} y={y(q)} width={bw - 4} height={y(0) - y(q)} style={{ fill: "var(--accent)" }} opacity={0.35 + 0.65 * (1 - (1 - q) ** DRAWS)} />
        ))}
        {[0, 0.35, 0.7].map((v) => <text key={v} x={X0 - 5} y={y(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <text x={X0 + PW} y={Y0 + PH + 13} textAnchor="end" className="viz-label">answers, most likely first</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        in {DRAWS} samples, about {distinct.toFixed(1)} of {K} answers appear; entropy {H.toFixed(2)} bits
      </div>
      <figcaption className="viz-caption">
        The probabilities a model gives to twelve possible answers to the same prompt, after dividing its logits by the temperature.
        Bars are darker for answers likely to appear at least once in twenty samples. Raising the temperature spreads probability
        and adds variety, but only by sampling answers the model itself thinks are worse.
      </figcaption>
    </figure>
  );
}
