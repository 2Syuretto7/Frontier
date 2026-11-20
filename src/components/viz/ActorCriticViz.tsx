"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 10, EPISODES = 200, RUNS = 20, CAP = 1000, RB_POWERS = [8, 6, 4];
const sup = (k: number) => `2⁻${String(k).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]).join("")}`;

/** Steps per episode, averaged over RUNS runs, on a 10-cell corridor (left from cell 0 stays, reward −1 per step) with a
 *  tabular logistic policy per cell: REINFORCE with a learned baseline, or one-step actor-critic. */
export function learningCurve(method: "rb" | "ac", aTh: number, aW: number, seed = 7) {
  const r = rand(seed), avg = new Array(EPISODES).fill(0);
  for (let run = 0; run < RUNS; run++) {
    const th = new Array(N).fill(0), V = new Array(N).fill(0);
    for (let e = 0; e < EPISODES; e++) {
      let s = 0, steps = 0;
      const traj: [number, number, number][] = [];
      while (s < N && steps < CAP) {
        const p = 1 / (1 + Math.exp(-th[s])), a = r() < p ? 1 : 0, s2 = a ? s + 1 : Math.max(0, s - 1);
        steps++;
        if (method === "ac") {
          const d = -1 + (s2 >= N ? 0 : V[s2]) - V[s];
          V[s] += aW * d;
          th[s] += aTh * d * (a ? 1 - p : -p);
        } else traj.push([s, a, p]);
        s = s2;
      }
      traj.forEach(([s0, a, p], t) => {
        const d = -(traj.length - t) - V[s0];
        V[s0] += aW * d;
        th[s0] += aTh * d * (a ? 1 - p : -p);
      });
      avg[e] += steps / RUNS;
    }
  }
  return avg;
}

export function ActorCriticViz() {
  const [ki, setKi] = useState(0);
  const ac = useMemo(() => learningCurve("ac", 2 ** -2, 2 ** -1), []);
  const rb = useMemo(() => learningCurve("rb", 2 ** -RB_POWERS[ki], 2 ** -3), [ki]);
  const W = 330, H = 170, X0 = 38, Y0 = 8, PW = W - 48, PH = H - Y0 - 30;
  const sx = (e: number) => X0 + (e / (EPISODES - 1)) * PW, sy = (v: number) => Y0 + PH - ((Math.log10(Math.min(1000, Math.max(10, v))) - 1) / 2) * PH;
  const path = (c: number[]) => c.map((v, e) => `${e ? "L" : "M"}${sx(e).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  const tail = (c: number[]) => c.slice(100).reduce((a, x) => a + x, 0) / (EPISODES - 100);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">REINFORCE step</span>
        <div className="segmented" role="group" aria-label="REINFORCE step size">
          {RB_POWERS.map((k, i) => <button key={k} type="button" className="seg" aria-pressed={ki === i} onClick={() => setKi(i)}>{sup(k)}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Steps per episode for REINFORCE with baseline and one-step actor-critic">
        {[10, 100, 1000].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={sy(v)} y2={sy(v)} stroke="var(--border)" strokeDasharray={v === 10 ? undefined : "2 4"} />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        <path d={path(rb)} fill="none" stroke="var(--danger)" strokeWidth={1.4} />
        <path d={path(ac)} fill="none" stroke="var(--accent)" strokeWidth={1.6} />
        {[0, 100, 200].map((e) => <text key={e} x={sx(Math.min(e, EPISODES - 1))} y={Y0 + PH + 14} textAnchor={e === 200 ? "end" : e === 0 ? "start" : "middle"} className="viz-label">{e}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">episode</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`mean steps in episodes 100 to 200: actor-critic ${tail(ac).toFixed(1)}, REINFORCE ${tail(rb).toFixed(1)}`}
      </div>
      <figcaption className="viz-caption">
        A corridor of 10 cells; each step costs 1, left from the first cell stays put, and the best policy takes 10 steps. Both
        learners use one policy parameter and one value per cell, averaged over 20 runs. One-step actor-critic (blue, steps
        2⁻² for the actor and 2⁻¹ for the critic) updates after every step with the TD error and is near the optimum within
        about 40 episodes. REINFORCE with a learned baseline (red) must wait for each episode to end and weights every score
        by a whole noisy return. With step 2⁻⁸ it still averages about 17 steps over episodes 100 to 200; with 2⁻⁶ or 2⁻⁴
        some runs drift to policies that almost never reach the end, whose episodes are cut at 1000 steps.
      </figcaption>
    </figure>
  );
}
