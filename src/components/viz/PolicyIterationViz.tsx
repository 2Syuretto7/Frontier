"use client";

import { useMemo, useState } from "react";

export const ROWS = 4, COLS = 5, WALL = 6, GOAL = 4, PIT = 9, SLIP = 0.2, GAMMA = 0.95, COSTS = [0.04, 0.4, 2];
export const MOVES = [[-1, 0], [0, 1], [1, 0], [0, -1]], ARROWS = ["↑", "→", "↓", "←"];

export const isTerm = (s: number) => s === GOAL || s === PIT;
function move(s: number, a: number) {
  const r = Math.floor(s / COLS) + MOVES[a][0], c = (s % COLS) + MOVES[a][1], t = r * COLS + c;
  return r < 0 || r >= ROWS || c < 0 || c >= COLS || t === WALL ? s : t;
}
/** Outcomes (probability, next state) of action a: the intended move, or a slip to either side. */
function outcomes(s: number, a: number): [number, number][] {
  return [[1 - SLIP, move(s, a)], [SLIP / 2, move(s, (a + 1) % 4)], [SLIP / 2, move(s, (a + 3) % 4)]];
}
const reward = (s2: number, cost: number) => -cost + (s2 === GOAL ? 1 : s2 === PIT ? -1 : 0);

export function q(v: number[], s: number, a: number, cost: number) {
  return outcomes(s, a).reduce((acc, [p, s2]) => acc + p * (reward(s2, cost) + (isTerm(s2) ? 0 : GAMMA * v[s2])), 0);
}

/** Policy iteration from the all-left policy; returns the policy and its values after each iteration. */
export function policyIteration(cost: number) {
  let pol = new Array(ROWS * COLS).fill(3);
  const hist: { pol: number[]; v: number[] }[] = [];
  for (let it = 0; it < 20; it++) {
    let v = new Array(ROWS * COLS).fill(0);
    for (let k = 0; k < 2000; k++) v = v.map((_, s) => (isTerm(s) || s === WALL ? 0 : q(v, s, pol[s], cost)));
    hist.push({ pol: [...pol], v });
    const next = pol.map((a, s) => {
      if (isTerm(s) || s === WALL) return a;
      let best = a;
      for (let b = 0; b < 4; b++) if (q(v, s, b, cost) > q(v, s, best, cost) + 1e-9) best = b;
      return best;
    });
    if (next.every((a, s) => a === pol[s])) break;
    pol = next;
  }
  return hist;
}

export function PolicyIterationViz() {
  const [ci, setCi] = useState(0);
  const hist = useMemo(() => policyIteration(COSTS[ci]), [ci]);
  const [it, setIt] = useState(0);
  const k = Math.min(it, hist.length - 1), h = hist[k];
  const cell = 56, W = COLS * cell, H = ROWS * cell;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">cost per step</span>
        <div className="segmented" role="group" aria-label="Cost per step">
          {COSTS.map((c, i) => <button key={c} type="button" className="seg" aria-pressed={ci === i} onClick={() => { setCi(i); setIt(0); }}>{c}</button>)}
        </div>
        <label className="viz-label" htmlFor="pi-it">iteration {k} of {hist.length - 1}</label>
        <input id="pi-it" type="range" min={0} max={hist.length - 1} step={1} value={k} onChange={(e) => setIt(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 360, display: "block", margin: "0 auto" }} role="img" aria-label="Policy arrows and values on the grid">
        {h.v.map((x, s) => {
          const r = Math.floor(s / COLS), c = s % COLS, X = c * cell, Y = r * cell;
          const fill = s === WALL ? "var(--text-muted)" : s === GOAL ? "var(--success)" : s === PIT ? "var(--danger)" : "var(--accent)";
          const op = s === WALL ? 0.6 : isTerm(s) ? 0.35 : Math.min(0.7, 0.08 + 0.6 * Math.max(0, (x + 1) / 2));
          return (
            <g key={s}>
              <rect x={X + 1} y={Y + 1} width={cell - 2} height={cell - 2} fill={fill} fillOpacity={op} stroke="var(--border)" />
              {s === GOAL && <text x={X + cell / 2} y={Y + cell / 2 + 5} textAnchor="middle" className="viz-label">+1</text>}
              {s === PIT && <text x={X + cell / 2} y={Y + cell / 2 + 5} textAnchor="middle" className="viz-label">−1</text>}
              {!isTerm(s) && s !== WALL && (
                <>
                  <text x={X + cell / 2} y={Y + 24} textAnchor="middle" style={{ fontSize: 20 }} fill="var(--text)">{ARROWS[h.pol[s]]}</text>
                  <text x={X + cell / 2} y={Y + cell - 8} textAnchor="middle" className="mono" style={{ fontSize: 11 }} fill="var(--text)">{x.toFixed(2)}</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption">
        Policy iteration on a grid with a goal worth +1, a pit worth −1 and a wall; each move goes the intended way with
        probability 0.8 and slips to either side with probability 0.1, and γ = 0.95. It starts from the policy that always moves
        left; each iteration evaluates the current policy and then switches every cell to its best one-step action. Within
        five to seven iterations the policy stops changing, and it is then optimal. When each step costs 0.04 the optimal path
        keeps away from the pit; at 2 per step it is better to jump into the pit than to walk to the goal.
      </figcaption>
    </figure>
  );
}
