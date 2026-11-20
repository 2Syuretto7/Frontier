"use client";

import { useState } from "react";

type Op = { kind: "send" | "recv"; peer: number };

/** Every rank passes one message to its right-hand neighbour. Returns, for each rank and op, the round it completed in (0 if never). */
export function ringRun(p: number, parity: boolean, buffered: boolean) {
  const progs: Op[][] = Array.from({ length: p }, (_, r) => {
    const s: Op = { kind: "send", peer: (r + 1) % p }, v: Op = { kind: "recv", peer: (r - 1 + p) % p };
    return parity && r % 2 ? [v, s] : [s, v];
  });
  const pc = Array(p).fill(0), done = progs.map((ops) => ops.map(() => 0));
  const box = Array.from({ length: p }, () => [] as number[]);
  for (let round = 1; round <= 3 * p; round++) {
    const moves: [number, number][] = [];
    if (buffered) {
      const arrivals: [number, number][] = [];
      for (let r = 0; r < p; r++) {
        const op = progs[r][pc[r]];
        if (!op) continue;
        if (op.kind === "send") { arrivals.push([op.peer, r]); moves.push([r, round]); }
        else if (box[r].includes(op.peer)) { box[r].splice(box[r].indexOf(op.peer), 1); moves.push([r, round]); }
      }
      for (const [d, s] of arrivals) box[d].push(s);
    } else {
      for (let r = 0; r < p; r++) {
        const op = progs[r][pc[r]];
        if (!op || op.kind !== "send") continue;
        const peerOp = progs[op.peer][pc[op.peer]];
        if (peerOp && peerOp.kind === "recv" && peerOp.peer === r) moves.push([r, round], [op.peer, round]);
      }
    }
    if (!moves.length) break;
    for (const [r] of moves) { done[r][pc[r]] = round; pc[r]++; }
  }
  const finished = pc.every((c) => c === 2), rounds = Math.max(...done.flat());
  return { progs, done, finished, rounds };
}

const PS = [4, 5];

export function MessageRingViz() {
  const [pi, setPi] = useState(0), [parity, setParity] = useState(false), [buffered, setBuffered] = useState(false);
  const p = PS[pi], { progs, done, finished, rounds } = ringRun(p, parity, buffered);
  const W = 330, rowH = 26, H = 26 + p * rowH, X0 = 56, cw = (W - X0 - 6) / 2;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">order</span>
        <div className="segmented" role="group" aria-label="Order of send and receive">
          <button type="button" className="seg" aria-pressed={!parity} onClick={() => setParity(false)}>send first</button>
          <button type="button" className="seg" aria-pressed={parity} onClick={() => setParity(true)}>by parity</button>
        </div>
        <span className="viz-label">send</span>
        <div className="segmented" role="group" aria-label="Send protocol">
          <button type="button" className="seg" aria-pressed={!buffered} onClick={() => setBuffered(false)}>synchronous</button>
          <button type="button" className="seg" aria-pressed={buffered} onClick={() => setBuffered(true)}>buffered</button>
        </div>
        <span className="viz-label">ranks</span>
        <div className="segmented" role="group" aria-label="Number of ranks">
          {PS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>{x}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Each rank's two operations and the round in which each completed">
        <text x={X0 + cw / 2} y={14} textAnchor="middle" className="viz-label">first operation</text>
        <text x={X0 + cw * 1.5} y={14} textAnchor="middle" className="viz-label">second operation</text>
        {progs.map((ops, r) => (
          <g key={r}>
            <text x={4} y={22 + r * rowH + 17} className="viz-label">{`rank ${r}`}</text>
            {ops.map((op, k) => {
              const d = done[r][k], x = X0 + k * cw + 3, y = 22 + r * rowH + 2;
              return (
                <g key={k}>
                  <rect x={x} y={y} width={cw - 6} height={rowH - 5} rx={4} fill={d ? "var(--accent-soft)" : "none"} stroke={d ? "var(--accent)" : "var(--danger)"} strokeDasharray={d ? undefined : "3 3"} />
                  <text x={x + 6} y={y + 15} className="viz-label">{`${op.kind} ${op.kind === "send" ? "to" : "from"} ${op.peer}`}</text>
                  <text x={x + cw - 12} y={y + 15} textAnchor="end" className="viz-label">{d ? `round ${d}` : k && !done[r][0] ? "–" : "blocked"}</text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {finished ? `all messages delivered in ${rounds} rounds` : "deadlock: every rank waits for a partner that is also waiting"}
      </div>
      <figcaption className="viz-caption">
        Every rank sends one message to its right-hand neighbour and receives one from its left (a dash marks an operation
        never reached). With synchronous sends, a
        send completes only when the receiver is ready, so if every rank sends first, all of them wait forever: a deadlock.
        Ordering by parity (even ranks send first, odd ranks receive first) breaks the cycle, finishing in 2 rounds with 4
        ranks and 3 with 5, where two even ranks are neighbours. Buffered sends complete at once by copying the message, so
        even the naive order finishes in 2 rounds, but only while the buffer has room, which large messages exhaust. With
        buffering, the parity order is slower (4 rounds), because odd ranks wait to receive before they send.
      </figcaption>
    </figure>
  );
}
