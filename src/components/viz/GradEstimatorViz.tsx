"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

/** Reconstruction term f(z) = -20 - 2 (2 - 1.5 z)^2 of a VAE, the constant standing for the normalising terms of many pixels, at encoder mean MU. Its exact gradient in mu is 6 (2 - 1.5 mu). */
const MU = 1, TRUE_G = 6 * (2 - 1.5 * MU);
const f = (z: number) => -20 - 2 * (2 - 1.5 * z) ** 2, fp = (z: number) => 6 * (2 - 1.5 * z);

/** T single-sample estimates of d/dmu E f(mu + sigma eps) by the pathwise and score-function estimators. */
export function estimates(sigma: number, baseline: boolean, T: number, seed: number) {
  const r = rand(seed), path: number[] = [], score: number[] = [];
  const b = baseline ? f(MU) : 0;
  for (let t = 0; t < T; t++) {
    const e = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    path.push(fp(MU + sigma * e));
    score.push(((f(MU + sigma * e) - b) * e) / sigma);
  }
  return { path, score };
}

export const stats = (v: number[]) => {
  const m = v.reduce((a, x) => a + x, 0) / v.length;
  return { m, sd: Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / (v.length - 1)) };
};

const SIG = [0.1, 0.3, 1];

export function GradEstimatorViz() {
  const [si, setSi] = useState(0), [bl, setBl] = useState(false);
  const { path, score } = useMemo(() => estimates(SIG[si], bl, 300, 21 + si), [si, bl]);
  const P = stats(path), S = stats(score);
  const W = 330, H = 130, XL = 70, PW = W - 80, LO = -40, HI = 46;
  const sx = (v: number) => XL + ((Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * PW;
  const row = (vals: number[], y: number, color: string) => vals.map((v, i) => <circle key={i} cx={sx(v)} cy={y + ((i * 7) % 15) - 7} r={1.8} fill={v < LO || v > HI ? "var(--danger)" : color} fillOpacity={0.55} />);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">encoder σ</span>
        <div className="segmented" role="group" aria-label="Encoder standard deviation">
          {SIG.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{v}</button>)}
        </div>
        <span className="viz-label">baseline for score estimator</span>
        <div className="segmented" role="group" aria-label="Baseline">
          <button type="button" className="seg" aria-pressed={!bl} onClick={() => setBl(false)}>off</button>
          <button type="button" className="seg" aria-pressed={bl} onClick={() => setBl(true)}>on</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Single-sample gradient estimates">
        <text x={XL - 6} y={34} textAnchor="end" className="viz-label">pathwise</text>
        <text x={XL - 6} y={84} textAnchor="end" className="viz-label">score</text>
        {row(path, 30, "var(--accent)")}
        {row(score, 80, "var(--code-function)")}
        <line x1={sx(TRUE_G)} x2={sx(TRUE_G)} y1={14} y2={98} stroke="var(--success)" strokeWidth={2} />
        {[-40, -20, 0, 20, 40].map((t) => <text key={t} x={sx(t)} y={114} textAnchor="middle" className="viz-label">{t}</text>)}
        <text x={sx(TRUE_G)} y={10} textAnchor="middle" className="viz-label">true gradient</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`true ${TRUE_G.toFixed(2)}; pathwise mean ${P.m.toFixed(2)}, sd ${P.sd.toFixed(2)}; score mean ${S.m.toFixed(2)}, sd ${S.sd.toFixed(2)}`}
      </div>
      <figcaption className="viz-caption">
        Each dot is a one-sample estimate of the gradient of a reconstruction term with respect to the encoder&apos;s mean
        (red dots are off the scale). Both estimators are unbiased, but the score-function estimator multiplies the value of
        the term, constant offsets included, by ε/σ, so its spread explodes as the encoder grows confident: at σ = 0.1 its
        standard deviation is 184, against 0.80 for the pathwise estimator. Subtracting the term&apos;s value at the mean as a
        baseline brings it to 3.5, still four times the pathwise spread.
      </figcaption>
    </figure>
  );
}
