"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const CEIL = 0.6, START = 0.1, R = 0.7, TRIALS = 500;
const BUDGETS = [3, 5, 7, 9];

/**
 * Success rate after k rounds of elicitation effort (each round doubling the effort) follows CEIL − (CEIL − START)·R^k. Each
 * round is measured on TRIALS tasks. Returns the measured rates for rounds 0..9; the ceiling is later fitted to the
 * measured rounds within a budget.
 */
export function elicit(seed = 52) {
  const r = rand(seed);
  return Array.from({ length: 10 }, (_, k) => {
    const p = CEIL - (CEIL - START) * Math.pow(R, k);
    let s = 0;
    for (let i = 0; i < TRIALS; i++) if (r() < p) s++;
    return { k, p, obs: s / TRIALS };
  });
}

/** Least-squares fit of c − A·r^k to the measured rounds, by a grid over r with c and A solved exactly for each r. Returns c. */
export function fitCeiling(pts: { k: number; obs: number }[]) {
  let best = { err: Infinity, c: NaN };
  for (let r = 0.3; r <= 0.951; r += 0.005) {
    const xs = pts.map((d) => Math.pow(r, d.k)), ys = pts.map((d) => d.obs), n = pts.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / sxx;
    const c = my - slope * mx;
    const err = xs.reduce((a, x, i) => a + (ys[i] - c - slope * x) ** 2, 0);
    if (err < best.err) best = { err, c };
  }
  return best.c;
}

export function ElicitationViz() {
  const [b, setB] = useState(1);
  const pts = useMemo(() => elicit(), []);
  const n = BUDGETS[b];
  const seen = pts.slice(0, n);
  const est = fitCeiling(seen);
  const W = 330, H = 180, X0 = 30, PW = 290, Y0 = 10, PH = 140;
  const px = (k: number) => X0 + (k / 9) * PW;
  const py = (y: number) => Y0 + PH - (y / 0.8) * PH;
  const truth = pts.map((d, i) => `${i ? "L" : "M"}${px(d.k).toFixed(1)},${py(d.p).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Elicitation rounds">
          {BUDGETS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={b === i} onClick={() => setB(i)}>{v} rounds</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Measured success against elicitation effort, with an estimated ceiling">
        {[0, 0.2, 0.4, 0.6, 0.8].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray={y ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        <path d={truth} fill="none" stroke="var(--border-strong)" strokeWidth={1.2} strokeDasharray="4 3" />
        {Number.isFinite(est) && <line x1={X0} x2={X0 + PW} y1={py(Math.min(0.8, est))} y2={py(Math.min(0.8, est))} stroke="var(--accent)" strokeWidth={1.5} />}
        {pts.map((d) => <circle key={d.k} cx={px(d.k)} cy={py(d.obs)} r={d.k < n ? 4 : 3} style={{ fill: d.k < n ? "var(--accent)" : "var(--border)" }} />)}
        {[0, 3, 6, 9].map((k) => <text key={k} x={px(k)} y={Y0 + PH + 13} textAnchor={k === 0 ? "start" : k === 9 ? "end" : "middle"} className="viz-label">{2 ** k}×</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">elicitation effort (doubling each round)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        best measured {Math.max(...seen.map((d) => d.obs)).toFixed(3)}; extrapolated ceiling {Number.isFinite(est) ? est.toFixed(3) : "not defined"}
      </div>
      <figcaption className="viz-caption">
        Each round doubles the effort spent drawing out a capability: better prompts, tools, more samples, fine-tuning. The dashed
        curve is the true success rate, which keeps rising towards a ceiling the evaluator cannot see; dots are measurements on 500
        tasks. Stopping early reports a rate well below what the model can do. Fitting a saturating curve to the rounds measured so
        far, the line, estimates the ceiling; with few rounds the estimate is rough.
      </figcaption>
    </figure>
  );
}
