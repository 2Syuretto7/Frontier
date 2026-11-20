"use client";

import { useMemo, useState } from "react";
import { MDP } from "./MachineMdpViz";

const GAMMAS = [0.8, 0.95, 0.99], NAMES = ["good", "worn", "broken"], COLS = ["var(--success)", "var(--accent)", "var(--danger)"];

function solve(A: number[][], b: number[]) {
  const n = b.length, T = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(T[i][c]) > Math.abs(T[p][c])) p = i;
    [T[c], T[p]] = [T[p], T[c]];
    for (let i = c + 1; i < n; i++) { const f = T[i][c] / T[c][c]; for (let k = c; k <= n; k++) T[i][k] -= f * T[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = T[i][n]; for (let j = i + 1; j < n; j++) s -= T[i][j] * x[j]; x[i] = s / T[i][i]; }
  return x;
}

/** Values of the policy: run when good, repair with probability q when worn, repair when broken. Returns V and Q. */
export function machineValues(q: number, gamma: number) {
  const pi = [[1, 0], [1 - q, q], [0, 1]], n = 3;
  const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], r = [0, 0, 0];
  for (let s = 0; s < n; s++) for (let a = 0; a < 2; a++) for (const [p, s2, rew] of MDP[s][a]) { M[s][s2] += pi[s][a] * p; r[s] += pi[s][a] * p * rew; }
  const V = solve(M.map((row, i) => row.map((m, j) => (i === j ? 1 : 0) - gamma * m)), r);
  const Q = MDP.map((acts) => acts.map((outs) => outs.reduce((acc, [p, s2, rew]) => acc + p * (rew + gamma * V[s2]), 0)));
  return { V, Q };
}

export function MachineValuesViz() {
  const [qi, setQi] = useState(0);
  const [gi, setGi] = useState(1);
  const q = qi / 10, gamma = GAMMAS[gi];
  const { V, Q } = useMemo(() => machineValues(q, gamma), [q, gamma]);
  const top = useMemo(() => 1.15 * machineValues(1, gamma).V[0], [gamma]);
  const W = 330, H = 150, X0 = 10, Y0 = 8, PH = H - Y0 - 30, bw = 70;
  const sy = (v: number) => Y0 + PH - (Math.max(0, v) / top) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">γ</span>
        <div className="segmented" role="group" aria-label="Discount factor">
          {GAMMAS.map((g, i) => <button key={g} type="button" className="seg" aria-pressed={gi === i} onClick={() => setGi(i)}>{g}</button>)}
        </div>
        <label className="viz-label" htmlFor="mv-q">P(repair when worn) = {q.toFixed(1)}</label>
        <input id="mv-q" type="range" min={0} max={10} step={1} value={qi} onChange={(e) => setQi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Value of each machine state under the chosen policy">
        {V.map((v, s) => {
          const x = X0 + 30 + s * (bw + 30);
          return (
            <g key={s}>
              <rect x={x} y={sy(v)} width={bw} height={Y0 + PH - sy(v)} fill={COLS[s]} opacity={0.8} />
              <text x={x + bw / 2} y={sy(v) - 4} textAnchor="middle" className="viz-label">{v.toFixed(2)}</text>
              <text x={x + bw / 2} y={Y0 + PH + 16} textAnchor="middle" className="viz-label">{`V(${NAMES[s]})`}</text>
            </g>
          );
        })}
        <line x1={X0} x2={W - X0} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`in the worn state: Q(run) = ${Q[1][0].toFixed(2)}, Q(repair) = ${Q[1][1].toFixed(2)}, V = ${V[1].toFixed(2)}`}
      </div>
      <figcaption className="viz-caption">
        Discounted values of the machine&apos;s states under a policy that runs when good, repairs when broken, and repairs a
        worn machine with the chosen probability. V(worn) is always the average of Q(run) and Q(repair) weighted by the policy.
        Whichever action has the larger Q value, moving probability towards it raises V(worn), and with it the values of the
        other states, since they lead to the worn state. For every γ shown, repairing is the better action, so the values are
        highest at probability 1. The bars are scaled separately for each γ.
      </figcaption>
    </figure>
  );
}
