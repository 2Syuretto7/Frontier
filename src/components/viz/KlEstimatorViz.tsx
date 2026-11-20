"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const SHIFTS = [0.1, 0.5, 1.5];
const NAMES = ["k1 = −log r", "k2 = ½(log r)²", "k3 = (r − 1) − log r"];

/** Policy N(mu, 1), reference N(0, 1). Draw samples from the policy and return mean and standard deviation of each
 *  per-sample KL estimator, with r = reference / policy density. */
export function estimate(mu: number, n = 4000, seed = 5) {
  const rr = rand(seed);
  const s = [[0, 0], [0, 0], [0, 0]];
  for (let i = 0; i < n; i++) {
    const x = mu + Math.sqrt(-2 * Math.log(1 - rr())) * Math.cos(2 * Math.PI * rr());
    const lr = -mu * x + (mu * mu) / 2;
    const ks = [-lr, 0.5 * lr * lr, Math.exp(lr) - 1 - lr];
    ks.forEach((k, j) => { s[j][0] += k; s[j][1] += k * k; });
  }
  return { truth: (mu * mu) / 2, est: s.map(([a, b]) => ({ mean: a / n, sd: Math.sqrt(Math.max(0, b / n - (a / n) ** 2)) })) };
}

export function KlEstimatorViz() {
  const [mi, setMi] = useState(1);
  const mu = SHIFTS[mi];
  const { truth, est } = useMemo(() => estimate(mu), [mu]);
  const span = Math.max(...est.map((e) => e.mean + e.sd), truth) * 1.1;
  const lo = Math.min(0, ...est.map((e) => e.mean - e.sd));
  const W = 340, H = 150, X0 = 10, PW = 320, ROW = 38, Y0 = 26;
  const px = (v: number) => X0 + ((v - lo) / (span - lo)) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">policy shift</span>
        <div className="segmented" role="group" aria-label="How far the policy has moved">
          {SHIFTS.map((m, i) => <button key={m} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{m}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="Mean and spread of three KL estimators">
        <line x1={px(0)} x2={px(0)} y1={Y0 - 14} y2={H - 8} stroke="var(--border)" />
        <line x1={px(truth)} x2={px(truth)} y1={Y0 - 14} y2={H - 8} stroke="var(--accent)" strokeDasharray="4 3" />
        <text x={px(truth) + 4} y={Y0 - 16} className="viz-label">true KL</text>
        {est.map((e, j) => {
          const y = Y0 + j * ROW + 14;
          return (
            <g key={j}>
              <text x={X0} y={y - 10} className="viz-label">{NAMES[j]}</text>
              <line x1={px(e.mean - e.sd)} x2={px(e.mean + e.sd)} y1={y} y2={y} stroke="var(--text-muted)" strokeWidth={3} />
              <circle cx={px(e.mean)} cy={y} r={4} style={{ fill: "var(--text)" }} />
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        true {truth.toFixed(3)}; mean ± sd per sample: {est.map((e) => `${e.mean.toFixed(3)} ± ${e.sd.toFixed(3)}`).join(", ")}
      </div>
      <figcaption className="viz-caption">
        The policy is a unit Gaussian shifted from the reference, and each estimator is averaged over samples from the policy.
        k1 is unbiased but its single-sample values swing far either side of the truth and are often negative. k2 has low
        spread but is biased once the policy moves far. k3 is unbiased, never negative and much less spread out than k1 when
        the policy is close to the reference, the regime RLHF works in.
      </figcaption>
    </figure>
  );
}
