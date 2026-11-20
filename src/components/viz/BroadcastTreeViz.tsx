"use client";

import { useState } from "react";

const PS = [5, 8, 16];

/** Rounds of (src, dst) transfers broadcasting from rank 0, linearly or by a binomial tree. */
export function broadcastRounds(p: number, tree: boolean) {
  const rounds: [number, number][][] = [];
  if (!tree) for (let d = 1; d < p; d++) rounds.push([[0, d]]);
  else for (let step = 1; step < p; step *= 2) {
    const r: [number, number][] = [];
    for (let s = 0; s < step && s + step < p; s++) r.push([s, s + step]);
    rounds.push(r);
  }
  return rounds;
}

export function BroadcastTreeViz() {
  const [pi, setPi] = useState(1), [tree, setTree] = useState(true), [t, setT] = useState(1);
  const p = PS[pi], rounds = broadcastRounds(p, tree), R = rounds.length, shown = Math.min(t, R);
  const has = new Set([0]);
  for (let k = 0; k < shown; k++) for (const [, d] of rounds[k]) has.add(d);
  const W = 330, H = 230, cx = W / 2, cy = 112, rad = 92;
  const pos = (i: number) => [cx + rad * Math.sin((2 * Math.PI * i) / p), cy - rad * Math.cos((2 * Math.PI * i) / p)];
  const current = shown ? rounds[shown - 1] : [];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">scheme</span>
        <div className="segmented" role="group" aria-label="Broadcast scheme">
          <button type="button" className="seg" aria-pressed={!tree} onClick={() => { setTree(false); setT(1); }}>root sends to all</button>
          <button type="button" className="seg" aria-pressed={tree} onClick={() => { setTree(true); setT(1); }}>binomial tree</button>
        </div>
        <span className="viz-label">ranks</span>
        <div className="segmented" role="group" aria-label="Number of ranks">
          {PS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={pi === i} onClick={() => { setPi(i); setT(1); }}>{x}</button>)}
        </div>
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="btn" onClick={() => setT(Math.max(0, shown - 1))} disabled={shown === 0}>previous round</button>
        <button type="button" className="btn" onClick={() => setT(Math.min(R, shown + 1))} disabled={shown === R}>next round</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Ranks on a circle; filled ranks hold the broadcast value">
        <defs>
          <marker id="bt-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
          </marker>
        </defs>
        {current.map(([s, d]) => {
          const [x1, y1] = pos(s), [x2, y2] = pos(d), L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
          return <line key={`${s}-${d}`} x1={x1 + ux * 12} y1={y1 + uy * 12} x2={x2 - ux * 13} y2={y2 - uy * 13} stroke="var(--accent)" strokeWidth={1.6} markerEnd="url(#bt-arrow)" />;
        })}
        {Array.from({ length: p }, (_, i) => {
          const [x, y] = pos(i);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={11} fill={has.has(i) ? "var(--accent)" : "var(--surface)"} stroke="var(--accent)" strokeWidth={1.5} />
              <text x={x} y={y + 4} textAnchor="middle" className="viz-label" style={{ fill: has.has(i) ? "var(--bg)" : "var(--text)" }}>{i}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`after round ${shown} of ${R}: ${has.size} of ${p} ranks hold the value`}
      </div>
      <figcaption className="viz-caption">
        Rank 0 broadcasts a value. If it sends to every other rank itself, it makes p − 1 sends one after another: 15 rounds
        for 16 ranks. In a binomial tree every rank that already has the value forwards it in the next round, so the number of
        holders doubles each round and 16 ranks are served in 4 rounds, ⌈log₂ p⌉ in general. A reduction runs the same tree
        backwards, combining values on the way to the root.
      </figcaption>
    </figure>
  );
}
