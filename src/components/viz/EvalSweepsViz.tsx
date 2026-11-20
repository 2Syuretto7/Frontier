"use client";

import { useMemo, useState } from "react";

const N = 4, TERM = [0, 15], STOPS = [0, 1, 2, 3, 5, 10, 20, 50, 100, 200];
const MOVES = [[-1, 0], [0, 1], [1, 0], [0, -1]];

const next = (s: number, a: number) => {
  const r = Math.floor(s / N) + MOVES[a][0], c = (s % N) + MOVES[a][1];
  return r < 0 || r >= N || c < 0 || c >= N ? s : r * N + c;
};

/** Values of the uniform random policy on the 4 x 4 grid (reward -1 per step, gamma 1) after each number of sweeps in STOPS. */
export function sweeps(inPlace: boolean) {
  let v = new Array(N * N).fill(0);
  const out: { k: number; v: number[]; delta: number }[] = [{ k: 0, v: [...v], delta: 0 }];
  for (let k = 1; k <= STOPS[STOPS.length - 1]; k++) {
    const src = v, dst = inPlace ? v : [...v];
    let delta = 0;
    for (let s = 0; s < N * N; s++) {
      if (TERM.includes(s)) continue;
      let x = 0;
      for (let a = 0; a < 4; a++) x += 0.25 * (-1 + (inPlace ? dst : src)[next(s, a)]);
      delta = Math.max(delta, Math.abs(x - dst[s]));
      dst[s] = x;
    }
    v = dst;
    if (STOPS.includes(k)) out.push({ k, v: [...v], delta });
  }
  return out;
}

export function EvalSweepsViz() {
  const [inPlace, setInPlace] = useState(false);
  const [si, setSi] = useState(3);
  const data = useMemo(() => sweeps(inPlace), [inPlace]);
  const snap = data[si];
  const W = 240, cell = W / N;
  const shade = (x: number) => Math.min(1, -x / 22);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Update order">
          <button type="button" className="seg" aria-pressed={!inPlace} onClick={() => setInPlace(false)}>two arrays</button>
          <button type="button" className="seg" aria-pressed={inPlace} onClick={() => setInPlace(true)}>in place</button>
        </div>
        <label className="viz-label" htmlFor="ev-k">sweeps k = {snap.k}</label>
        <input id="ev-k" type="range" min={0} max={STOPS.length - 1} step={1} value={si} onChange={(e) => setSi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="Estimated value of each grid cell">
        {snap.v.map((x, s) => {
          const r = Math.floor(s / N), c = s % N, term = TERM.includes(s);
          return (
            <g key={s}>
              <rect x={c * cell + 1} y={r * cell + 1} width={cell - 2} height={cell - 2} fill={term ? "var(--success)" : "var(--accent)"} fillOpacity={term ? 0.35 : 0.1 + 0.6 * shade(x)} stroke="var(--border)" />
              <text x={c * cell + cell / 2} y={r * cell + cell / 2 + 5} textAnchor="middle" className="mono" style={{ fontSize: 14 }} fill="var(--text)">{term ? "end" : x.toFixed(1)}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {snap.k === 0 ? "start from v = 0" : `largest change in sweep ${snap.k}: ${snap.delta.toFixed(4)}`}
      </div>
      <figcaption className="viz-caption">
        Iterative evaluation of the random policy on a 4 × 4 grid: each step costs 1, moves off the edge leave the agent in
        place, and the green corners end the episode. After k sweeps of synchronous updates the value of a cell is the expected
        reward of the first k steps, so values fall from 0 towards the true values, minus the expected number of steps to
        finish: −14 next to an exit and −22 in the far corners. Updating in place, with cells in reading order, uses fresh values within a sweep and gets
        there in fewer sweeps.
      </figcaption>
    </figure>
  );
}
