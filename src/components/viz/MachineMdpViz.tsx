"use client";

import { useMemo, useState } from "react";

type Out = [number, number, number];
const NAMES = ["good", "worn", "broken"], ACTIONS = ["run", "repair"];
/** MDP[s][a] lists (probability, next state, reward). */
export const MDP: Out[][][] = [
  [[[0.8, 0, 1], [0.2, 1, 1]], [[1, 0, -0.5]]],
  [[[0.6, 1, 0.6], [0.4, 2, 0.6]], [[1, 0, -1]]],
  [[[1, 2, 0]], [[1, 0, -3]]],
];
const STEPS = 40;

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Long-run average reward of a deterministic policy, from the state distribution after many steps from "good". */
export function averageReward(policy: number[]) {
  let d = [1, 0, 0];
  for (let k = 0; k < 2000; k++) {
    const e = [0, 0, 0];
    d.forEach((p, s) => MDP[s][policy[s]].forEach(([q, s2]) => (e[s2] += p * q)));
    d = e;
  }
  return d.reduce((acc, p, s) => acc + p * MDP[s][policy[s]].reduce((x, [q, , r]) => x + q * r, 0), 0);
}

export function rolloutMachine(policy: number[], seed: number) {
  const r = rand(seed), path: { s: number; r: number }[] = [];
  let s = 0;
  for (let t = 0; t < STEPS; t++) {
    const u = r(), outs = MDP[s][policy[s]];
    let acc = 0, pick = outs[outs.length - 1];
    for (const o of outs) { acc += o[0]; if (u < acc) { pick = o; break; } }
    path.push({ s, r: pick[2] });
    s = pick[1];
  }
  return path;
}

const POS = [[115, 40], [225, 40], [170, 125]], LOOP = [[-1, 0], [1, 0], [0, 1]];
const COLS = ["var(--success)", "var(--accent)", "var(--danger)"];

export function MachineMdpViz() {
  const [policy, setPolicy] = useState([0, 1, 1]);
  const [seed, setSeed] = useState(1);
  const avg = useMemo(() => averageReward(policy), [policy]);
  const path = useMemo(() => rolloutMachine(policy, seed), [policy, seed]);
  const total = path.reduce((a, x) => a + x.r, 0);
  const edges: { s: number; s2: number; p: number; r: number }[] = [];
  policy.forEach((a, s) => MDP[s][a].forEach(([p, s2, r]) => edges.push({ s, s2, p, r })));
  const W = 340, H = 200;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {NAMES.map((n, s) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span className="viz-label">{n}</span>
            <div className="segmented" role="group" aria-label={`Action in state ${n}`}>
              {ACTIONS.map((act, a) => (
                <button key={act} type="button" className="seg" aria-pressed={policy[s] === a} onClick={() => setPolicy(policy.map((x, i) => (i === s ? a : x)))}>{act}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Transition diagram of the machine under the chosen policy">
        <defs>
          <marker id="mm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const [x1, y1] = POS[e.s], [x2, y2] = POS[e.s2];
          const label = `${e.p} · ${e.r >= 0 ? "+" : "−"}${Math.abs(e.r)}`;
          if (e.s === e.s2) {
            const [ux, uy] = LOOP[e.s], rot = (a: number, r: number) => [x1 + r * (ux * Math.cos(a) - uy * Math.sin(a)), y1 + r * (ux * Math.sin(a) + uy * Math.cos(a))];
            const [ax, ay] = rot(0.6, 22), [bx, by] = rot(-0.6, 22), [c1x, c1y] = rot(0.7, 62), [c2x, c2y] = rot(-0.7, 62);
            return (
              <g key={i}>
                <path d={`M${ax},${ay} C${c1x},${c1y} ${c2x},${c2y} ${bx},${by}`} fill="none" stroke="var(--text-muted)" markerEnd="url(#mm-arrow)" />
                <text x={x1 + ux * 52} y={y1 + uy * 62 + 4 + (uy > 0 ? 6 : 0)} textAnchor={ux < 0 ? "end" : ux > 0 ? "start" : "middle"} className="viz-label">{label}</text>
              </g>
            );
          }
          const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, off = 7;
          const sx = x1 + (dx / L) * 24 + nx * off, sy = y1 + (dy / L) * 24 + ny * off, ex = x2 - (dx / L) * 24 + nx * off, ey = y2 - (dy / L) * 24 + ny * off;
          const paired = edges.some((f) => f.s === e.s2 && f.s2 === e.s);
          const cxm = (x1 + x2) / 2 - 170, cym = (y1 + y2) / 2 - 68, flip = paired || nx * cxm + ny * cym > 0 ? 1 : -1, lx = nx * flip, ly = ny * flip;
          return (
            <g key={i}>
              <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="var(--text-muted)" markerEnd="url(#mm-arrow)" />
              <text x={(sx + ex) / 2 + lx * 8} y={(sy + ey) / 2 + ly * 10 + 4} textAnchor={lx > 0.3 ? "start" : lx < -0.3 ? "end" : "middle"} className="viz-label">{label}</text>
            </g>
          );
        })}
        {POS.map(([x, y], s) => (
          <g key={s}>
            <circle cx={x} cy={y} r={22} fill="var(--bg)" stroke={COLS[s]} strokeWidth={2} />
            <text x={x} y={y + 4} textAnchor="middle" className="viz-label">{NAMES[s]}</text>
          </g>
        ))}
      </svg>
      <svg viewBox={`0 0 ${W} 22`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "4px auto 0" }} role="img" aria-label="States visited in a 40-step rollout">
        {path.map((x, t) => <rect key={t} x={t * (W / STEPS) + 0.5} y={2} width={W / STEPS - 1} height={18} fill={COLS[x.s]} />)}
      </svg>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new rollout</button>
        <span className="mono" style={{ fontSize: 13 }} aria-live="polite">{`40-step reward ${total.toFixed(1)}; long-run average per step ${avg.toFixed(4)}`}</span>
      </div>
      <figcaption className="viz-caption">
        A machine is good, worn or broken. Running it earns 1 when good and 0.6 when worn, and wears it at random; repairing
        costs 0.5, 1 or 3 and returns it to good. Each arrow shows a transition probability and its reward under the policy
        chosen above, and the strip shows the states of one 40-step rollout (green good, blue worn, red broken). The number
        on the right is the reward per step in the long run, which depends only on the policy.
      </figcaption>
    </figure>
  );
}
