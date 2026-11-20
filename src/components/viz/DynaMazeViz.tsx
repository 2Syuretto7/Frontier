"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

export const MR = 6, MC = 9, START = 2 * MC, MGOAL = 8;
export const MWALLS = new Set([1 * MC + 2, 2 * MC + 2, 3 * MC + 2, 4 * MC + 5, 0 * MC + 7, 1 * MC + 7, 2 * MC + 7]);
const MOV = [[-1, 0], [0, 1], [1, 0], [0, -1]], EPISODES = 50, RUNS = 20, NS = [0, 5, 50];

function mazeStep(s: number, a: number): [number, number] {
  const r = Math.floor(s / MC) + MOV[a][0], c = (s % MC) + MOV[a][1], t = r * MC + c;
  if (r < 0 || r >= MR || c < 0 || c >= MC || MWALLS.has(t)) return [s, 0];
  return [t, t === MGOAL ? 1 : 0];
}

/** Dyna-Q (alpha 0.1, epsilon 0.1, gamma 0.95) with n planning updates per real step; steps per episode averaged over RUNS runs. */
export function dynaCurve(n: number, seed = 11) {
  const r = rand(seed), avg = new Array(EPISODES).fill(0);
  for (let run = 0; run < RUNS; run++) {
    const Q = new Float64Array(MR * MC * 4), seen: number[] = [], model = new Map<number, [number, number]>();
    const maxQ = (s: number) => (s === MGOAL ? 0 : Math.max(Q[4 * s], Q[4 * s + 1], Q[4 * s + 2], Q[4 * s + 3]));
    const update = (s: number, a: number, s2: number, rew: number) => { Q[4 * s + a] += 0.1 * (rew + 0.95 * maxQ(s2) - Q[4 * s + a]); };
    for (let e = 0; e < EPISODES; e++) {
      let s = START, steps = 0;
      while (s !== MGOAL) {
        let a: number;
        if (r() < 0.1) a = Math.floor(r() * 4);
        else {
          const m = maxQ(s), best = [0, 1, 2, 3].filter((b) => Q[4 * s + b] === m);
          a = best[Math.floor(r() * best.length)];
        }
        const [s2, rew] = mazeStep(s, a);
        steps++;
        update(s, a, s2, rew);
        const key = 4 * s + a;
        if (!model.has(key)) seen.push(key);
        model.set(key, [s2, rew]);
        for (let k = 0; k < n; k++) {
          const pk = seen[Math.floor(r() * seen.length)], [ps2, pr] = model.get(pk)!;
          update(Math.floor(pk / 4), pk % 4, ps2, pr);
        }
        s = s2;
      }
      avg[e] += steps / RUNS;
    }
  }
  return avg;
}

export function DynaMazeViz() {
  const [ni, setNi] = useState(1);
  const curves = useMemo(() => NS.map((n) => dynaCurve(n)), []);
  const W = 330, H = 170, X0 = 38, Y0 = 8, PW = W - 48, PH = H - Y0 - 30;
  const sx = (e: number) => X0 + (e / (EPISODES - 1)) * PW, sy = (v: number) => Y0 + PH - ((Math.log10(Math.min(1000, Math.max(10, v))) - 1) / 2) * PH;
  const cell = 14, gx = (W - MC * cell) / 2;
  const late = (c: number[]) => c.slice(10).reduce((a, x) => a + x, 0) / (EPISODES - 10);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">planning steps n</span>
        <div className="segmented" role="group" aria-label="Planning steps per real step">
          {NS.map((n, i) => <button key={n} type="button" className="seg" aria-pressed={ni === i} onClick={() => setNi(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${MR * cell + 6}`} style={{ width: "100%", maxWidth: 260, display: "block", margin: "0 auto" }} role="img" aria-label="The maze">
        {Array.from({ length: MR * MC }, (_, s) => (
          <rect key={s} x={gx + (s % MC) * cell} y={3 + Math.floor(s / MC) * cell} width={cell - 1} height={cell - 1}
            fill={MWALLS.has(s) ? "var(--text-muted)" : s === MGOAL ? "var(--success)" : s === START ? "var(--accent)" : "var(--bg)"} stroke="var(--border)" />
        ))}
      </svg>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Steps per episode for Dyna-Q with different numbers of planning steps">
        {[10, 100, 1000].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={sy(v)} y2={sy(v)} stroke="var(--border)" strokeDasharray={v === 10 ? undefined : "2 4"} />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {curves.map((c, i) => (
          <path key={i} d={c.map((v, e) => `${e ? "L" : "M"}${sx(e).toFixed(1)},${sy(v).toFixed(1)}`).join(" ")} fill="none"
            stroke={i === ni ? "var(--accent)" : "var(--border)"} strokeWidth={i === ni ? 2 : 1.2} />
        ))}
        {[1, 25, 50].map((e) => <text key={e} x={sx(e - 1)} y={Y0 + PH + 14} textAnchor={e === 50 ? "end" : e === 1 ? "start" : "middle"} className="viz-label">{e}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">episode</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`steps in episode 2: ${curves[ni][1].toFixed(0)}; mean over episodes 11 to 50: ${late(curves[ni]).toFixed(1)}`}
      </div>
      <figcaption className="viz-caption">
        Dyna-Q in a small maze from the blue start to the green goal, the only reward. After every real step the agent
        records the transition in its model and then replays n remembered transitions as extra Q-learning updates. The
        first episode is a long random search whatever n is, because nothing has been learnt. After it, with n = 50 the
        planning updates carry the goal&apos;s value back along the whole remembered path and the second episode is already
        short, about 40 steps against about 900 for n = 0. Plain Q-learning moves the value back one step per visit, and
        even over episodes 11 to 50 it averages 36 steps, about twice what Dyna-Q needs.
      </figcaption>
    </figure>
  );
}
