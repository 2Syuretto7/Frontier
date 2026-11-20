"use client";

import { useMemo, useState } from "react";
import { CliffGrid, greedyPath, learnCliff } from "./CliffSarsaViz";

const EPISODES = 500, RUNS = 20, EPS = [0.05, 0.1, 0.2];

/** Average online return per episode (smoothed over 10 episodes) for SARSA and Q-learning, and the greedy paths of the first run. */
export function compareCliff(eps: number) {
  const curves = { sarsa: new Array(EPISODES).fill(0), q: new Array(EPISODES).fill(0) };
  const paths: Record<"sarsa" | "q", number[]> = { sarsa: [], q: [] };
  for (const m of ["sarsa", "q"] as const) {
    for (let run = 0; run < RUNS; run++) {
      const { Q, returns } = learnCliff(m, eps, EPISODES, run + 1);
      returns.forEach((x, i) => (curves[m][i] += x / RUNS));
      if (run === 0) paths[m] = greedyPath(Q);
    }
  }
  const smooth = (xs: number[]) => xs.map((_, i) => { const lo = Math.max(0, i - 9); return xs.slice(lo, i + 1).reduce((a, x) => a + x, 0) / (i + 1 - lo); });
  return { sarsa: smooth(curves.sarsa), q: smooth(curves.q), paths };
}

export function QLearningCliffViz() {
  const [ei, setEi] = useState(1);
  const { sarsa, q, paths } = useMemo(() => compareCliff(EPS[ei]), [ei]);
  const W = 330, H = 160, X0 = 40, Y0 = 8, PW = W - 50, PH = H - Y0 - 30, YMIN = -100, YMAX = 0;
  const sx = (k: number) => X0 + (k / (EPISODES - 1)) * PW;
  const sy = (y: number) => Y0 + PH - ((Math.max(YMIN, Math.min(YMAX, y)) - YMIN) / (YMAX - YMIN)) * PH;
  const path = (ys: number[]) => ys.map((y, k) => `${k ? "L" : "M"}${sx(k).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");
  const tail = (xs: number[]) => xs.slice(-100).reduce((a, x) => a + x, 0) / 100;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">exploration ε</span>
        <div className="segmented" role="group" aria-label="Exploration rate">
          {EPS.map((e, i) => <button key={e} type="button" className="seg" aria-pressed={ei === i} onClick={() => setEi(i)}>{e}</button>)}
        </div>
      </div>
      <CliffGrid paths={[{ cells: paths.sarsa, color: "var(--accent)" }, { cells: paths.q, color: "var(--danger)" }]} />
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "8px auto 0" }} role="img" aria-label="Return per episode while learning">
        {[0, -25, -50, -75, -100].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={sy(y)} y2={sy(y)} stroke="var(--border)" strokeDasharray={y === YMIN ? undefined : "2 4"} />
            <text x={X0 - 4} y={sy(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        <path d={path(sarsa)} fill="none" stroke="var(--accent)" strokeWidth={1.6} />
        <path d={path(q)} fill="none" stroke="var(--danger)" strokeWidth={1.6} />
        {[0, 250, 500].map((k) => <text key={k} x={sx(Math.min(k, EPISODES - 1))} y={Y0 + PH + 14} textAnchor={k === 500 ? "end" : "middle"} className="viz-label">{k}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">episode (return while learning)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`average return, last 100 episodes: SARSA ${tail(sarsa).toFixed(1)}, Q-learning ${tail(q).toFixed(1)}`}
      </div>
      <figcaption className="viz-caption">
        The cliff walk of the previous lesson, learnt by SARSA (blue) and Q-learning (red) with the same ε-greedy exploration and
        α = 0.5, averaged over 20 runs. Q-learning&apos;s greedy path runs along the edge: it is the optimal path, and Q-learning
        learns the values of the greedy policy whatever it does while exploring. But while it explores it falls into the cliff
        now and then, so its return during learning is worse than SARSA&apos;s, which learns the safer route for the policy it
        actually follows. With ε decaying to 0 both would end on the edge path.
      </figcaption>
    </figure>
  );
}
