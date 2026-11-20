"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const STEPS = 25, LR = 0.15, R = 4;
export const MODES = ["DDP", "uneven shards", "no initial broadcast", "no all-reduce"];

/**
 * Four replicas fit y = w x by gradient descent on shards of each step's batch (12 examples, y = 3x plus uniform noise of width 3). DDP averages the
 * replicas' gradients; "uneven shards" uses a batch of 10 split 3, 3, 3, 1 and still averages the four shard means; "no initial
 * broadcast" starts the replicas at different w; "no all-reduce" lets each replica follow its own gradient. The reference is one
 * process on the whole batch.
 */
export function ddpRuns(mode: number, seed = 5) {
  const r = rand(seed);
  const ws = mode === 2 ? [-1, 0, 1, 2] : [0, 0, 0, 0];
  let ref = 0;
  const paths = ws.map((w) => [w]), refPath = [0];
  for (let k = 0; k < STEPS; k++) {
    const n = mode === 1 ? 10 : 12;
    const data = Array.from({ length: n }, () => {
      const x = r();
      return [x, 3 * x + 3 * (r() - 0.5)];
    });
    const sizes = mode === 1 ? [3, 3, 3, 1] : [3, 3, 3, 3];
    let off = 0;
    const shards = sizes.map((s) => { const sh = data.slice(off, off + s); off += s; return sh; });
    const g = (w: number, sh: number[][]) => sh.reduce((a, [x, y]) => a + 2 * (w * x - y) * x, 0) / sh.length;
    const grads = ws.map((w, i) => g(w, shards[i]));
    const avg = grads.reduce((a, b) => a + b, 0) / R;
    for (let i = 0; i < R; i++) { ws[i] -= LR * (mode === 3 ? grads[i] : avg); paths[i].push(ws[i]); }
    ref -= LR * g(ref, data);
    refPath.push(ref);
  }
  const spread = Math.max(...ws) - Math.min(...ws);
  const gap = Math.max(...ws.map((w) => Math.abs(w - ref)));
  return { paths, refPath, spread, gap };
}

export function DdpReplicasViz() {
  const [m, setM] = useState(0);
  const res = useMemo(() => ddpRuns(m), [m]);
  const W = 330, H = 160, X0 = 30, PW = 290, Y0 = 8, PH = 124, LO = -1.2, HI = 3.4;
  const px = (k: number) => X0 + (k / STEPS) * PW;
  const py = (w: number) => Y0 + PH - ((w - LO) / (HI - LO)) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Training setup">
          {MODES.map((n, i) => <button key={n} type="button" className="seg" aria-pressed={m === i} onClick={() => setM(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Weight of each replica over training steps">
        {[-1, 0, 1, 2, 3].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeDasharray={v ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        <polyline points={res.refPath.map((w, k) => `${px(k)},${py(w)}`).join(" ")} style={{ fill: "none", stroke: "var(--text)" }} strokeWidth={2.5} strokeDasharray="5 3" />
        {res.paths.map((p, i) => (
          <polyline key={i} points={p.map((w, k) => `${px(k)},${py(w)}`).join(" ")} style={{ fill: "none", stroke: i % 2 ? "var(--accent)" : "var(--text-muted)" }} strokeWidth={1.4} opacity={0.85} />
        ))}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">step; dashed: one process on the whole batch</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        after {STEPS} steps: replicas differ by {res.spread.toFixed(3)}; farthest from the reference by {res.gap.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Four replicas learn one weight from shards of each step&apos;s batch. Correct data parallelism keeps them identical and equal to
        a single process on the whole batch. Averaging shard means over uneven shards keeps the replicas together but weights the short
        shard too heavily; skipping the initial broadcast leaves a permanent offset; skipping the all-reduce lets every replica wander.
      </figcaption>
    </figure>
  );
}
