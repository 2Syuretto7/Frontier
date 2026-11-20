"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const T = 0.4, MS = [5, 10, 20, 50, 100, 200, 500, 1000], REPS = 200;

/** ERM over thresholds 1[x >= t] on noisy labels; returns the mean training and test error at each sample size. */
export function curves(noise: number, seed: number) {
  const r = rand(seed);
  return MS.map((m) => {
    let tr = 0, te = 0;
    for (let k = 0; k < REPS; k++) {
      const s = Array.from({ length: m }, () => { const x = r(); const y = (x >= T ? 1 : 0) ^ (r() < noise ? 1 : 0); return { x, y }; }).sort((a, b) => a.x - b.x);
      // Threshold at -inf labels everything 1: errors = number of zeros. Moving past each point flips its prediction to 0.
      let errs = s.filter((p) => p.y === 0).length, best = errs, bestT = 0;
      s.forEach((p, i) => { errs += p.y === 1 ? 1 : -1; if (errs < best) { best = errs; bestT = i + 1 < m ? s[i + 1].x : 1; } });
      tr += best / m; te += noise + (1 - 2 * noise) * Math.abs(bestT - T);
    }
    return { m, train: tr / REPS, test: te / REPS };
  });
}

const NOISES = [0, 0.1, 0.2];

export function ErmGapViz() {
  const [ni, setNi] = useState(1);
  const noise = NOISES[ni];
  const c = useMemo(() => curves(noise, 4), [noise]);
  const memo = T * noise + (1 - T) * (1 - noise);
  const W = 330, H = 190, X0 = 34, PW = 270, Y0 = 8, PH = 140, YMAX = 0.65;
  const sx = (m: number) => X0 + (Math.log10(m / 5) / Math.log10(200)) * PW, sy = (e: number) => Y0 + PH - (e / YMAX) * PH;
  const line = (k: "train" | "test") => c.map((p, i) => `${i ? "L" : "M"}${sx(p.m).toFixed(1)},${sy(p[k]).toFixed(1)}`).join(" ");
  const last = c[c.length - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">label noise</span>
        <div className="segmented" role="group" aria-label="Label noise">
          {NOISES.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ni === i} onClick={() => setNi(i)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Training and test error against sample size">
        <line x1={X0} x2={X0 + PW} y1={sy(noise)} y2={sy(noise)} stroke="var(--border)" />
        <line x1={X0} x2={X0 + PW} y1={sy(memo)} y2={sy(memo)} stroke="var(--code-function)" strokeWidth={1.5} />
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--code-function)" strokeWidth={1.5} strokeDasharray="4 3" />
        <path d={line("test")} fill="none" stroke="var(--accent)" strokeWidth={2.2} />
        <path d={line("train")} fill="none" stroke="var(--accent)" strokeWidth={2.2} strokeDasharray="4 3" />
        {[0, 0.2, 0.4, 0.6].map((t) => <text key={t} x={X0 - 5} y={sy(t) + 4} textAnchor="end" className="viz-label">{t}</text>)}
        {[5, 50, 1000].map((m) => <text key={m} x={sx(m)} y={H - 18} textAnchor="middle" className="viz-label">{m}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">sample size m (log scale)</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--accent)" }}>━</span> ERM over thresholds</span>
        <span><span style={{ color: "var(--code-function)" }}>━</span> memoriser</span>
        <span>solid: test, dashed: training</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        m = 1000: thresholds train {last.train.toFixed(3)}, test {last.test.toFixed(3)}; memoriser train 0.000, test {memo.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Labels follow the threshold 0.4, each flipped with the chosen probability. The memoriser fits every training example
        and predicts 0 elsewhere, so its training error is always 0 and its test error never improves. ERM over thresholds
        fits the training data a little better than the truth when samples are few, then its two errors meet at the noise
        level: with noise 0.1 and 1000 examples both are within 0.002 of 0.1.
      </figcaption>
    </figure>
  );
}
