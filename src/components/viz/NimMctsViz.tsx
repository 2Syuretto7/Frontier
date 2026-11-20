"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const PILES = [7, 10, 13], ITERS = [10, 100, 1000, 10000], C = 1.4;
const movesOf = (n: number) => [1, 2, 3].filter((k) => k <= n);

/** UCT on Nim (take 1 to 3 stones, taking the last stone wins) from pile n0; returns visits and mean value of each root move. */
export function nimMcts(n0: number, iters: number, seed = 5) {
  const r = rand(seed), N = new Map<number, number>(), E = new Map<string, [number, number]>();
  for (let it = 0; it < iters; it++) {
    const path: [number, number][] = [];
    let n = n0;
    while (N.has(n) && n > 0) {
      const parent = N.get(n)!;
      let best = 0, bestScore = -Infinity;
      for (const k of movesOf(n)) {
        const [cnt, tot] = E.get(`${n},${k}`) ?? [0, 0];
        const sc = cnt === 0 ? Infinity : tot / cnt + C * Math.sqrt(Math.log(parent) / cnt);
        if (sc > bestScore) { bestScore = sc; best = k; }
      }
      path.push([n, best]);
      n -= best;
    }
    if (n > 0) N.set(n, 0);
    let v: number;
    if (n === 0) v = -1;
    else {
      let m = n, sign = 1;
      for (;;) {
        const ks = movesOf(m);
        m -= ks[Math.floor(r() * ks.length)];
        if (m === 0) { v = sign; break; }
        sign = -sign;
      }
    }
    if (n > 0) N.set(n, N.get(n)! + 1);
    for (let i = path.length - 1; i >= 0; i--) {
      const [m, k] = path[i];
      v = -v;
      const [cnt, tot] = E.get(`${m},${k}`) ?? [0, 0];
      E.set(`${m},${k}`, [cnt + 1, tot + v]);
      N.set(m, N.get(m)! + 1);
    }
  }
  return movesOf(n0).map((k) => {
    const [cnt, tot] = E.get(`${n0},${k}`) ?? [0, 0];
    return { k, visits: cnt, value: cnt ? tot / cnt : 0 };
  });
}

export function NimMctsViz() {
  const [pi, setPi] = useState(1);
  const [ii, setIi] = useState(2);
  const n0 = PILES[pi], stats = useMemo(() => nimMcts(n0, ITERS[ii]), [n0, ii]);
  const total = stats.reduce((a, s) => a + s.visits, 0), chosen = stats.reduce((a, s) => (s.visits > a.visits ? s : a));
  const correct = n0 % 4;
  const W = 330, H = 150, X0 = 34, Y0 = 8, PW = W - 44, PH = H - Y0 - 30, bw = PW / 3;
  const sy = (f: number) => Y0 + PH - f * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">stones</span>
        <div className="segmented" role="group" aria-label="Pile size">
          {PILES.map((p, i) => <button key={p} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>{p}</button>)}
        </div>
        <span className="viz-label">simulations</span>
        <div className="segmented" role="group" aria-label="Number of simulations">
          {ITERS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={ii === i} onClick={() => setIi(i)}>{x}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Share of root visits for each move">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={X0} x2={X0 + PW} y1={sy(f)} y2={sy(f)} stroke="var(--border)" strokeDasharray={f ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(f) + 4} textAnchor="end" className="viz-label">{f}</text>
          </g>
        ))}
        {stats.map((s, i) => (
          <g key={s.k}>
            <rect x={X0 + i * bw + 16} y={sy(s.visits / total)} width={bw - 32} height={Y0 + PH - sy(s.visits / total)} fill={s.k === correct ? "var(--success)" : "var(--accent)"} />
            <text x={X0 + i * bw + bw / 2} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{`take ${s.k}`}</text>
          </g>
        ))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">share of visits at the root</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`MCTS plays: take ${chosen.k} (${chosen.k === correct ? "winning" : "not winning"}); mean values ${stats.map((s) => (s.value < 0 ? "−" : "") + Math.abs(s.value).toFixed(2)).join(", ")}`}
      </div>
      <figcaption className="viz-caption">
        Monte Carlo tree search with the UCT rule (c = 1.4) on Nim: players take 1, 2 or 3 stones and whoever takes the last
        stone wins. The winning move (green) leaves a multiple of 4. With 10 simulations the choice rests on a handful of
        random games and can be wrong: from 13 stones it prefers taking 3. From 100 simulations on it picks the winning move
        in all three positions, and with 10000 it spends over 99% of its visits there. The value of that move, estimated
        from random play below the tree, rises towards 1 as the tree deepens and replaces random play with good play.
      </figcaption>
    </figure>
  );
}
