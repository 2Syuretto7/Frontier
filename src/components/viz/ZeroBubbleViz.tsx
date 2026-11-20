"use client";

import { useState } from "react";

const P = 4, M = 8;
type Kind = "F" | "B" | "W";
const MODES = [
  { label: "1F1B", dur: { F: 1, B: 2, W: 0 }, limit: (s: number) => P - s },
  { label: "split", dur: { F: 1, B: 1, W: 1 }, limit: (s: number) => P - s },
  { label: "split, more live", dur: { F: 1, B: 1, W: 1 }, limit: () => 2 * P },
];

const less = (a: (number | string)[], b: (number | string)[]) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
};

/** Greedy list scheduling: run the op that can start earliest, preferring B, then F, then W; F waits while limit(s) are live. */
export function greedy(dur: Record<Kind, number>, limit: (s: number) => number) {
  const done = new Map<string, [number, number]>();
  const free = Array(P).fill(0), live = Array(P).fill(0);
  const todo = new Set<string>();
  (["F", "B", "W"] as Kind[]).forEach((k) => { for (let s = 0; s < P; s++) for (let j = 0; j < M; j++) todo.add(`${k},${s},${j}`); });
  const deps = (k: Kind, s: number, j: number) =>
    k === "F" ? (s ? [`F,${s - 1},${j}`] : []) : k === "B" ? (s < P - 1 ? [`B,${s + 1},${j}`] : [`F,${s},${j}`]) : [`B,${s},${j}`];
  while (todo.size) {
    let best: [number, number, number, number, string] | null = null;
    for (const op of todo) {
      const [k, ss, jj] = op.split(",");
      const s = +ss, j = +jj, kind = k as Kind;
      const ds = deps(kind, s, j);
      if (ds.some((d) => !done.has(d)) || (kind === "F" && live[s] >= limit(s))) continue;
      const start = Math.max(free[s], ...ds.map((d) => done.get(d)![1]));
      const key: [number, number, number, number, string] = [start, "BFW".indexOf(kind), j, s, op];
      if (!best || less(key, best)) best = key;
    }
    const [start, , , , op] = best!;
    const [k, ss] = op.split(",");
    const s = +ss, end = start + dur[k as Kind];
    done.set(op, [start, end]);
    free[s] = end;
    todo.delete(op);
    live[s] += k === "F" ? 1 : k === "W" ? -1 : 0;
  }
  return { done, end: Math.max(...free) };
}

export function ZeroBubbleViz() {
  const [mi, setMi] = useState(0);
  const mode = MODES[mi];
  const r = greedy(mode.dur, mode.limit);
  const busy = M * (mode.dur.F + mode.dur.B + mode.dur.W);
  const W = 330, X0 = 50, PW = 272, RH = 20, Y0 = 6, MAX = 33;
  const px = (t: number) => X0 + (t / MAX) * PW;
  const fill = { F: "var(--accent)", B: "var(--text-muted)", W: "var(--text)" };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Schedule">
          {MODES.map((x, j) => <button key={x.label} type="button" className="seg" aria-pressed={mi === j} onClick={() => setMi(j)}>{x.label}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + P * RH + 6}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Pipeline schedule with forward, input-gradient and weight-gradient passes">
        {Array.from({ length: P }, (_, s) => (
          <g key={s}>
            <text x={X0 - 6} y={Y0 + s * RH + 13} textAnchor="end" className="viz-label">stage {s}</text>
            <rect x={px(0)} y={Y0 + s * RH} width={px(r.end) - px(0)} height={RH - 3} style={{ fill: "var(--bg-subtle)" }} />
          </g>
        ))}
        {[...r.done.entries()].filter(([, [a, b]]) => b > a).map(([op, [a, b]]) => {
          const [k, s] = op.split(",");
          return <rect key={op} x={px(a)} y={Y0 + +s * RH} width={px(b) - px(a) - 0.8} height={RH - 3} style={{ fill: fill[k as Kind] }} opacity={k === "F" ? 0.85 : 0.7} />;
        })}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        step {r.end} units for {busy} units of work per stage; bubble {(100 * (1 - busy / r.end)).toFixed(1)}%
      </div>
      <figcaption className="viz-caption">
        Accent blocks are forward passes, grey blocks the input-gradient half of the backward pass, dark blocks the weight-gradient
        half. In 1F1B the two halves run together. Split, the weight gradients wait and fill gaps where a stage would otherwise idle, with
        no more live micro-batches than 1F1B. Allowing up to 2p live micro-batches on every stage leaves only the start-up wait that
        no schedule can avoid.
      </figcaption>
    </figure>
  );
}
