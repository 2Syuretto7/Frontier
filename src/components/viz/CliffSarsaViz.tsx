"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

export const CR = 4, CC = 10, START = (CR - 1) * CC, GOAL = CR * CC - 1;
const MOVES = [[-1, 0], [0, 1], [1, 0], [0, -1]];
export const isCliff = (s: number) => Math.floor(s / CC) === CR - 1 && s % CC > 0 && s % CC < CC - 1;

/** One step of the cliff walk: -1 per move, -100 and back to the start for stepping into the cliff, null when the goal is reached. */
export function cliffStep(s: number, a: number): [number | null, number] {
  let r = Math.floor(s / CC) + MOVES[a][0], c = (s % CC) + MOVES[a][1];
  r = Math.max(0, Math.min(CR - 1, r));
  c = Math.max(0, Math.min(CC - 1, c));
  const s2 = r * CC + c;
  if (isCliff(s2)) return [START, -100];
  return [s2 === GOAL ? null : s2, -1];
}

const argmax = (q: number[]) => q.reduce((b, x, i) => (x > q[b] ? i : b), 0);

/** Learn on the cliff with SARSA or Q-learning (alpha 0.5, gamma 1, epsilon-greedy); returns Q and the return of each episode. */
export function learnCliff(method: "sarsa" | "q", eps: number, episodes = 500, seed = 1) {
  const r = rand(seed), Q = Array.from({ length: CR * CC }, () => [0, 0, 0, 0]), returns: number[] = [];
  const act = (s: number) => (r() < eps ? Math.floor(r() * 4) : argmax(Q[s]));
  for (let e = 0; e < episodes; e++) {
    let s = START, a = act(s), total = 0;
    for (let t = 0; t < 1000; t++) {
      const [s2, rew] = cliffStep(s, a);
      total += rew;
      if (s2 === null) { Q[s][a] += 0.5 * (rew - Q[s][a]); break; }
      const a2 = act(s2);
      const next = method === "sarsa" ? Q[s2][a2] : Math.max(...Q[s2]);
      Q[s][a] += 0.5 * (rew + next - Q[s][a]);
      s = s2;
      a = a2;
    }
    returns.push(total);
  }
  return { Q, returns };
}

/** The cells visited by the greedy policy from the start, stopping at the goal or after 40 moves. */
export function greedyPath(Q: number[][]) {
  const path = [START];
  let s: number | null = START;
  for (let t = 0; t < 40 && s !== null; t++) { [s] = cliffStep(s, argmax(Q[s])); if (s !== null) path.push(s); }
  if (s === null) path.push(GOAL);
  return path;
}

export function CliffGrid({ paths }: { paths: { cells: number[]; color: string }[] }) {
  const cell = 32, W = CC * cell, H = CR * cell;
  const cx = (s: number) => (s % CC) * cell + cell / 2, cy = (s: number) => Math.floor(s / CC) * cell + cell / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Cliff grid with learned paths">
      {Array.from({ length: CR * CC }, (_, s) => (
        <rect key={s} x={(s % CC) * cell + 1} y={Math.floor(s / CC) * cell + 1} width={cell - 2} height={cell - 2}
          fill={isCliff(s) ? "var(--danger)" : s === GOAL ? "var(--success)" : s === START ? "var(--accent)" : "var(--bg)"}
          fillOpacity={isCliff(s) || s === GOAL || s === START ? 0.35 : 1} stroke="var(--border)" />
      ))}
      <text x={cx(START)} y={cy(START) + 4} textAnchor="middle" className="viz-label">S</text>
      <text x={cx(GOAL)} y={cy(GOAL) + 4} textAnchor="middle" className="viz-label">G</text>
      {paths.map((p, i) => (
        <path key={i} d={p.cells.map((s, k) => `${k ? "L" : "M"}${cx(s) + (i ? 3 : -3)},${cy(s) + (i ? 3 : -3)}`).join(" ")} fill="none" stroke={p.color} strokeWidth={2.5} />
      ))}
    </svg>
  );
}

const EPS = [0.02, 0.1, 0.2, 0.3];

export function CliffSarsaViz() {
  const [ei, setEi] = useState(1);
  const { Q, returns } = useMemo(() => learnCliff("sarsa", EPS[ei]), [ei]);
  const path = greedyPath(Q);
  const recent = returns.slice(-100).reduce((a, x) => a + x, 0) / 100;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">exploration ε</span>
        <div className="segmented" role="group" aria-label="Exploration rate">
          {EPS.map((e, i) => <button key={e} type="button" className="seg" aria-pressed={ei === i} onClick={() => setEi(i)}>{e}</button>)}
        </div>
      </div>
      <CliffGrid paths={[{ cells: path, color: "var(--accent)" }]} />
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`greedy path: ${path.length - 1} moves; average return over the last 100 of 500 episodes: ${recent.toFixed(1)}`}
      </div>
      <figcaption className="viz-caption">
        The agent starts at S and must reach G; each move costs 1, and stepping into the red cliff costs 100 and sends it back
        to S. SARSA with α = 0.5 learns the values of the ε-greedy policy it actually follows, so it accounts for its own random
        moves. The line shows its greedy path after 500 episodes: with ε = 0.02 it runs two rows above the cliff, and from
        ε = 0.1 along the top row, as far from the edge as the grid allows.
      </figcaption>
    </figure>
  );
}
