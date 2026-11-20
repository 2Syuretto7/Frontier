"use client";

import { useMemo, useState } from "react";
import { NS, rand, rms, walkEpisode } from "./RandomWalkMcViz";

const ALPHAS = [0.02, 0.05, 0.1, 0.15], EPISODES = 100, RUNS = 100;

/** Average RMS error over RUNS runs after each episode, for constant-alpha TD(0) and Monte Carlo on the random walk. */
export function learningCurves(alpha: number) {
  const td = new Array(EPISODES + 1).fill(0), mc = new Array(EPISODES + 1).fill(0);
  for (let run = 0; run < RUNS; run++) {
    const r = rand(run * 31 + 7), vt = new Array(NS).fill(0.5), vm = new Array(NS).fill(0.5);
    td[0] += rms(vt) / RUNS;
    mc[0] += rms(vm) / RUNS;
    for (let k = 1; k <= EPISODES; k++) {
      const { states, reward } = walkEpisode(r);
      states.forEach((s, i) => {
        const last = i === states.length - 1, next = last ? 0 : vt[states[i + 1] - 1], rew = last ? reward : 0;
        vt[s - 1] += alpha * (rew + next - vt[s - 1]);
      });
      for (const s of new Set(states)) vm[s - 1] += alpha * (reward - vm[s - 1]);
      td[k] += rms(vt) / RUNS;
      mc[k] += rms(vm) / RUNS;
    }
  }
  return { td, mc };
}

export function TdVsMcViz() {
  const [ai, setAi] = useState(2);
  const { td, mc } = useMemo(() => learningCurves(ALPHAS[ai]), [ai]);
  const W = 330, H = 170, X0 = 36, Y0 = 8, PW = W - 46, PH = H - Y0 - 32, YMAX = 0.25;
  const sx = (k: number) => X0 + (k / EPISODES) * PW;
  const sy = (y: number) => Y0 + PH - (Math.min(y, YMAX) / YMAX) * PH;
  const path = (ys: number[]) => ys.map((y, k) => `${k ? "L" : "M"}${sx(k).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">step size α</span>
        <div className="segmented" role="group" aria-label="Step size">
          {ALPHAS.map((a, i) => <button key={a} type="button" className="seg" aria-pressed={ai === i} onClick={() => setAi(i)}>{a}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Error of TD and Monte Carlo estimates against episodes">
        {[0, 0.05, 0.1, 0.15, 0.2, 0.25].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={sy(y)} y2={sy(y)} stroke="var(--border)" strokeDasharray={y ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        <path d={path(mc)} fill="none" stroke="var(--danger)" strokeWidth={1.8} />
        <path d={path(td)} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
        {[0, 25, 50, 75, 100].map((k) => <text key={k} x={sx(k)} y={Y0 + PH + 14} textAnchor={k === EPISODES ? "end" : "middle"} className="viz-label">{k}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">episodes</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`error after ${EPISODES} episodes: TD(0) ${td[EPISODES].toFixed(3)}, Monte Carlo ${mc[EPISODES].toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        Root mean square error of the value estimates on the five-state random walk, averaged over 100 runs, for TD(0) (blue)
        and first-visit constant-α Monte Carlo (red), both starting from 0.5 and using the same step size. With the smallest α
        the two are close; from α = 0.05 up, TD is clearly more accurate. A larger α learns faster at first but levels off at a
        higher error, because each update moves the estimate a fixed fraction of the way towards a noisy target; for α = 0.1
        and 0.15 the TD error even rises a little after its early minimum.
      </figcaption>
    </figure>
  );
}
