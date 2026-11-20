"use client";

import { useMemo, useState } from "react";
import { MDP } from "./MachineMdpViz";

const GAMMAS = [0.5, 0.7, 0.8, 0.9, 0.95], ITERS = 40, NAMES = ["good", "worn", "broken"], ACTS = ["run", "repair"];

const qOf = (v: number[], s: number, a: number, g: number) => MDP[s][a].reduce((acc, [p, s2, r]) => acc + p * (r + g * v[s2]), 0);

/** One application of the Bellman optimality operator to v. */
export const tStar = (v: number[], g: number) => v.map((_, s) => Math.max(...MDP[s].map((_, a) => qOf(v, s, a, g))));

/** Sup-norm distance between two value-iteration sequences started from u0 and v0. */
export function contraction(g: number, u0 = [0, 0, 0], v0 = [20, -10, 15]) {
  let u = u0, v = v0;
  const d: number[] = [];
  for (let k = 0; k <= ITERS; k++) {
    d.push(Math.max(...u.map((x, i) => Math.abs(x - v[i]))));
    u = tStar(u, g);
    v = tStar(v, g);
  }
  let w = [0, 0, 0];
  for (let k = 0; k < 3000; k++) w = tStar(w, g);
  const policy = w.map((_, s) => (qOf(w, s, 1, g) > qOf(w, s, 0, g) ? 1 : 0));
  return { d, vstar: w, policy };
}

export function BellmanContractionViz() {
  const [gi, setGi] = useState(3);
  const g = GAMMAS[gi];
  const { d, vstar, policy } = useMemo(() => contraction(g), [g]);
  const W = 330, H = 170, X0 = 34, Y0 = 8, PW = W - 44, PH = H - Y0 - 32, LMIN = -6, LMAX = 2;
  const sx = (k: number) => X0 + (k / ITERS) * PW;
  const sy = (x: number) => Y0 + PH - ((Math.max(LMIN, Math.min(LMAX, Math.log10(Math.max(x, 1e-12)))) - LMIN) / (LMAX - LMIN)) * PH;
  const bound = d.map((_, k) => d[0] * g ** k);
  const path = (ys: number[]) => ys.map((y, k) => `${k ? "L" : "M"}${sx(k).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">γ</span>
        <div className="segmented" role="group" aria-label="Discount factor">
          {GAMMAS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={gi === i} onClick={() => setGi(i)}>{x}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Distance between two value iteration sequences on a log scale">
        {[-6, -4, -2, 0, 2].map((e) => (
          <g key={e}>
            <line x1={X0} x2={X0 + PW} y1={sy(10 ** e)} y2={sy(10 ** e)} stroke="var(--border)" strokeDasharray={e === LMIN ? undefined : "2 4"} />
            <text x={X0 - 4} y={sy(10 ** e) + 4} textAnchor="end" className="viz-label">{`1e${e}`}</text>
          </g>
        ))}
        <path d={path(bound)} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.5} />
        <path d={path(d)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {[0, 10, 20, 30, 40].map((k) => <text key={k} x={sx(k)} y={Y0 + PH + 14} textAnchor={k === ITERS ? "end" : "middle"} className="viz-label">{k}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">iteration k</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`v* = (${vstar.map((x) => x.toFixed(2)).join(", ")}); optimal: ${policy.map((a, s) => `${ACTS[a]} when ${NAMES[s]}`).join(", ")}`}
      </div>
      <figcaption className="viz-caption">
        Value iteration on the machine, started from two different guesses, (0, 0, 0) and (20, −10, 15). The blue curve is the
        largest difference between the two sequences after k applications of the Bellman optimality operator, on a log scale;
        the dashed line is the contraction bound γᵏ times the starting difference. The two sequences forget where they started
        at least as fast as γᵏ, so both converge to the same fixed point v*, and the greedy policy for v* is optimal. The optimal
        policy itself changes with γ: an impatient operator never repairs.
      </figcaption>
    </figure>
  );
}
