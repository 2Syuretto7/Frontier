"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const TEMPS = [0.7, 1.0, 1.3];
const V = 12, POS = 200, EPS = 0.2;

const softmax = (z: number[], t: number) => {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp((v - m) / t));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
};

/**
 * Step-0 importance ratios. The sampler draws at temperature t and records its log-probabilities. The trainer recomputes
 * them either at the same temperature (fixed) or at temperature 1 (bug). Returns, over 200 random positions with 12-token
 * vocabularies, the expected fraction of sampled tokens whose ratio leaves [0.8, 1.2] and the mean |log ratio|.
 */
export function mismatch(t: number, fixed: boolean, seed = 8) {
  const r = rand(seed);
  let clip = 0, absLog = 0;
  for (let p = 0; p < POS; p++) {
    const z = Array.from({ length: V }, () => 3 * (r() + r() + r() - 1.5));
    const sampler = softmax(z, t);
    const trainer = softmax(z, fixed ? t : 1);
    for (let k = 0; k < V; k++) {
      const ratio = trainer[k] / sampler[k];
      if (Math.abs(ratio - 1) > EPS + 1e-12) clip += sampler[k];
      absLog += sampler[k] * Math.abs(Math.log(ratio));
    }
  }
  return { clip: clip / POS, absLog: absLog / POS };
}

export function RatioMismatchViz() {
  const [ti, setTi] = useState(0);
  const [fixed, setFixed] = useState(false);
  const t = TEMPS[ti];
  const res = useMemo(() => TEMPS.map((tt) => mismatch(tt, fixed)), [fixed]);
  const W = 320, H = 150, X0 = 40, PW = 260, Y0 = 14, PH = 100;
  const bw = PW / TEMPS.length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">sampling temperature</span>
        <div className="segmented" role="group" aria-label="Sampling temperature">
          {TEMPS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ti === i} onClick={() => setTi(i)}>{v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Trainer log-probabilities">
          <button type="button" className="seg" aria-pressed={!fixed} onClick={() => setFixed(false)}>trainer ignores it</button>
          <button type="button" className="seg" aria-pressed={fixed} onClick={() => setFixed(true)}>trainer divides by it</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Share of tokens clipped before any update">
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={Y0 + PH - v * PH} y2={Y0 + PH - v * PH} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 6} y={Y0 + PH - v * PH + 3} textAnchor="end" className="viz-label">{Math.round(v * 100)}%</text>
          </g>
        ))}
        {res.map((m, i) => (
          <g key={i}>
            <rect x={X0 + i * bw + bw * 0.25} width={bw * 0.5} y={Y0 + PH - m.clip * PH} height={Math.max(m.clip * PH, 0.5)}
              style={{ fill: i === ti ? "var(--accent)" : "var(--text-muted)" }} />
            <text x={X0 + (i + 0.5) * bw} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">T = {TEMPS[i]}</text>
          </g>
        ))}
        <text x={X0} y={H - 4} className="viz-label">tokens outside the clip range at the first PPO step</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        T = {t}: {(res[ti].clip * 100).toFixed(0)}% of tokens clipped before any update; mean |log ratio| {res[ti].absLog.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        At the first PPO step the policy has not changed, so every importance ratio should be exactly 1. If responses are sampled
        at a temperature other than 1 but the trainer computes log-probabilities from the raw logits, the ratios are wrong from
        the start, and tokens outside the clip range can lose their gradient. Dividing the logits by the sampling temperature in the
        trainer restores ratios of 1.
      </figcaption>
    </figure>
  );
}
