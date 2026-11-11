"use client";

import { useState } from "react";

type P = { id: number; parent: number; born: number; kids: number[] };

function simulate(n: number, breakChild: boolean) {
  const ps: P[] = [{ id: 0, parent: -1, born: -1, kids: [] }];
  for (let i = 0; i < n; i++) {
    const alive = ps.filter((p) => !(breakChild && p.id !== 0));
    for (const p of alive) {
      const c: P = { id: ps.length, parent: p.id, born: i, kids: [] };
      ps.push(c);
      p.kids.push(c.id);
    }
  }
  const order: number[] = [];
  const dfs = (id: number) => { order.push(id); ps[id].kids.forEach(dfs); };
  dfs(0);
  return { ps, order };
}

/** Processes created by a loop of fork() calls, drawn as lifelines: each fork splits one process into two. */
export function ForkViz() {
  const [n, setN] = useState(3);
  const [brk, setBrk] = useState(false);
  const { ps, order } = simulate(n, brk);
  const row = new Map(order.map((id, r) => [id, r]));
  const X0 = 40, DX = 60, DY = 20, W = X0 + (n + 1) * DX + 20, H = ps.length * DY + 30;
  const x = (i: number) => X0 + (i + 1) * DX;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Loop body">
        <button type="button" className="seg mono" aria-pressed={!brk} onClick={() => setBrk(false)}>fork();</button>
        <button type="button" className="seg mono" aria-pressed={brk} onClick={() => setBrk(true)}>if (fork() == 0) break;</button>
      </div>
      <div className="viz-sliders">
        <label>
          <span>Loop runs {n} times</span>
          <input type="range" min={0} max={4} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Number of iterations" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${ps.length} processes in total`} style={{ maxWidth: Math.max(W, 300) * 1.4 }}>
        {Array.from({ length: n }, (_, i) => (
          <text key={i} x={x(i)} y={12} textAnchor="middle" className="plot-tick" style={{ fontSize: 10 }}>i = {i}</text>
        ))}
        {ps.map((p) => {
          const r = row.get(p.id)!, y = 26 + r * DY;
          const start = p.born < 0 ? X0 : x(p.born);
          return (
            <g key={p.id}>
              {p.parent >= 0 && <line x1={start} x2={start} y1={26 + row.get(p.parent)! * DY} y2={y} className="viz-link" />}
              <line x1={start} x2={x(n)} y1={y} y2={y} className="plot-curve" style={{ strokeWidth: 2.5 }} />
              <circle cx={x(n)} cy={y} r={4} className="viz-node" />
              <text x={start - 4} y={y + 4} textAnchor="end" className="plot-tick" style={{ fontSize: 9 }}>{p.id === 0 ? "P0" : ""}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono">{ps.length}</span> processes in all.{" "}
        {brk
          ? `Each child leaves the loop at once, so only the original keeps forking: ${n} children, ${n + 1} processes.`
          : `Every process alive at iteration i forks, so the count doubles each time: 2^${n} = ${2 ** n}. fork returns twice, once in each process, and both carry on from the same line.`}
      </figcaption>
    </figure>
  );
}
