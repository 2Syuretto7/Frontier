"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";
import { corridorJ } from "./ShortCorridorViz";

const STEP: [number, number][] = [[0, 1], [2, 0], [1, -1]];
const EPISODES = 1000, RUNS = 30, POWERS = [6, 9, 12, 14], BEST = corridorJ(2 - Math.SQRT2);

/** REINFORCE with p(right) = sigmoid(theta), started at p = 0.05; returns the episode returns averaged over RUNS runs. */
export function reinforceCurve(alpha: number, seed = 3) {
  const r = rand(seed), avg = new Array(EPISODES).fill(0);
  for (let run = 0; run < RUNS; run++) {
    let th = Math.log(0.05 / 0.95);
    for (let e = 0; e < EPISODES; e++) {
      const p = 1 / (1 + Math.exp(-th)), acts: number[] = [];
      let s = 0;
      while (s >= 0 && acts.length < 1000) {
        const a = r() < p ? 1 : 0;
        acts.push(a);
        s = STEP[s][a];
      }
      const T = acts.length;
      let g = 0;
      acts.forEach((a, t) => { g -= (T - t) * (a ? 1 - p : -p); });
      th += alpha * g;
      avg[e] -= T / RUNS;
    }
  }
  return avg;
}

export function ReinforceCorridorViz() {
  const [ki, setKi] = useState(1);
  const curve = useMemo(() => reinforceCurve(2 ** -POWERS[ki]), [ki]);
  const W = 330, H = 170, X0 = 38, Y0 = 8, PW = W - 48, PH = H - Y0 - 30;
  const sx = (e: number) => X0 + (e / EPISODES) * PW, sy = (v: number) => Y0 + PH - ((Math.max(-100, v) + 100) / 100) * PH;
  const smooth = curve.map((_, e) => {
    const lo = Math.max(0, e - 10), hi = Math.min(EPISODES, e + 11);
    return curve.slice(lo, hi).reduce((a, x) => a + x, 0) / (hi - lo);
  });
  const last = curve.slice(-100).reduce((a, x) => a + x, 0) / 100;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">step size</span>
        <div className="segmented" role="group" aria-label="Step size">
          {POWERS.map((k, i) => <button key={k} type="button" className="seg" aria-pressed={ki === i} onClick={() => setKi(i)}>{`2⁻${String(k).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]).join("")}`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Average return per episode while REINFORCE learns">
        {[-100, -50, 0].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={sy(v)} y2={sy(v)} stroke="var(--border)" strokeDasharray={v === -100 ? undefined : "2 4"} />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v === 0 ? "0" : `−${-v}`}</text>
          </g>
        ))}
        <line x1={X0} x2={X0 + PW} y1={sy(BEST)} y2={sy(BEST)} stroke="var(--success)" strokeDasharray="5 3" />
        <path d={smooth.map((v, e) => `${e ? "L" : "M"}${sx(e).toFixed(1)},${sy(v).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={1.6} />
        {[0, 500, 1000].map((e) => <text key={e} x={sx(e)} y={Y0 + PH + 14} textAnchor={e === EPISODES ? "end" : e === 0 ? "start" : "middle"} className="viz-label">{e}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">episode</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`average return over the last 100 episodes: ${last.toFixed(1)}`}
      </div>
      <figcaption className="viz-caption">
        REINFORCE on the short corridor of l6.6.1, with the probability of choosing right equal to σ(θ) and starting at 0.05.
        The blue curve is the return per episode averaged over 30 runs; the dashed green line is the best possible, −11.66.
        With step 2⁻⁹ the policy is close to the optimum after about 100 episodes. Smaller steps are slower: with 2⁻¹⁴ the
        return is still near −20 after 1000 episodes. With 2⁻⁶ single noisy episodes throw many runs to a nearly
        deterministic policy, which never finishes the corridor (episodes are cut at 1000 steps) and whose gradient is almost
        zero, so those runs never recover and the average falls far below the chart.
      </figcaption>
    </figure>
  );
}
