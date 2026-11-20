"use client";

import { useMemo, useState } from "react";
import { ARROWS, COLS, GOAL, PIT, ROWS, WALL, isTerm, policyIteration, q } from "./PolicyIterationViz";

const COST = 0.04, STOPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 30, 50];

/** Value iteration on the slippery grid; values, greedy policy and largest change after each number of sweeps in STOPS. */
export function valueIteration() {
  const n = ROWS * COLS, opt = policyIteration(COST).at(-1)!.pol;
  let v = new Array(n).fill(0), delta = 0;
  const greedy = (w: number[]) => w.map((_, s) => { let b = 0; for (let a = 1; a < 4; a++) if (q(w, s, a, COST) > q(w, s, b, COST) + 1e-12) b = a; return b; });
  const live = (s: number) => !isTerm(s) && s !== WALL;
  const out: { k: number; v: number[]; pol: number[]; delta: number; wrong: number }[] = [];
  for (let k = 0; k <= STOPS[STOPS.length - 1]; k++) {
    if (k > 0) {
      const nv = v.map((_, s) => (live(s) ? Math.max(...[0, 1, 2, 3].map((a) => q(v, s, a, COST))) : 0));
      delta = Math.max(...nv.map((x, s) => Math.abs(x - v[s])));
      v = nv;
    }
    if (STOPS.includes(k)) {
      const pol = greedy(v);
      out.push({ k, v, pol, delta, wrong: pol.filter((a, s) => live(s) && a !== opt[s]).length });
    }
  }
  return out;
}

export function ValueIterationViz() {
  const data = useMemo(() => valueIteration(), []);
  const [si, setSi] = useState(3);
  const d = data[si];
  const cell = 56, W = COLS * cell, H = ROWS * cell;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="vi-k">sweeps k = {d.k}</label>
        <input id="vi-k" type="range" min={0} max={data.length - 1} step={1} value={si} onChange={(e) => setSi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 360, display: "block", margin: "0 auto" }} role="img" aria-label="Values and greedy actions during value iteration">
        {d.v.map((x, s) => {
          const r = Math.floor(s / COLS), c = s % COLS, X = c * cell, Y = r * cell;
          const fill = s === WALL ? "var(--text-muted)" : s === GOAL ? "var(--success)" : s === PIT ? "var(--danger)" : "var(--accent)";
          const op = s === WALL ? 0.6 : isTerm(s) ? 0.35 : Math.min(0.7, 0.08 + 0.6 * Math.max(0, x));
          return (
            <g key={s}>
              <rect x={X + 1} y={Y + 1} width={cell - 2} height={cell - 2} fill={fill} fillOpacity={op} stroke="var(--border)" />
              {s === GOAL && <text x={X + cell / 2} y={Y + cell / 2 + 5} textAnchor="middle" className="viz-label">+1</text>}
              {s === PIT && <text x={X + cell / 2} y={Y + cell / 2 + 5} textAnchor="middle" className="viz-label">−1</text>}
              {!isTerm(s) && s !== WALL && (
                <>
                  <text x={X + cell / 2} y={Y + 24} textAnchor="middle" style={{ fontSize: 20 }} fill="var(--text)">{ARROWS[d.pol[s]]}</text>
                  <text x={X + cell / 2} y={Y + cell - 8} textAnchor="middle" className="mono" style={{ fontSize: 11 }} fill="var(--text)">{x.toFixed(2)}</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`largest change ${d.k ? d.delta.toFixed(5) : "–"}; greedy actions that differ from the optimal policy: ${d.wrong}`}
      </div>
      <figcaption className="viz-caption">
        Value iteration on the grid of the previous lesson, with cost 0.04 per step and γ = 0.95, starting from zero. After k
        sweeps each value is the best expected discounted reward over the next k steps, so the values spread outwards from
        the goal one cell per sweep. The arrows are the greedy actions for the current values. They agree with the optimal policy
        from 11 sweeps on, when the largest change in a sweep is still about 0.04, and the values need about 30 sweeps to stop
        changing in the fifth decimal: an optimal policy needs only approximately right values.
      </figcaption>
    </figure>
  );
}
