"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const TRUE = [1100, 1060, 1040, 1000];
const KS = [4, 16, 32];
const MATCHES = 2000, ORDERS = 40;

/**
 * Four models with true ratings TRUE play MATCHES random pairwise games, A beating B with probability 1/(1 + 10^((rB − rA)/400)).
 * The same games are replayed in ORDERS shuffled orders through online Elo with step K, and also fitted once by Bradley–Terry
 * (MM iterations), centred to the same mean. Returns each ordering's Elo ratings and the Bradley–Terry ratings.
 */
export function eloOrders(k: number, seed = 34) {
  const r = rand(seed);
  const games: [number, number, number][] = [];
  for (let g = 0; g < MATCHES; g++) {
    const a = Math.floor(r() * 4);
    let b = Math.floor(r() * 3);
    if (b >= a) b++;
    const p = 1 / (1 + Math.pow(10, (TRUE[b] - TRUE[a]) / 400));
    games.push([a, b, r() < p ? 1 : 0]);
  }
  const mean = TRUE.reduce((x, y) => x + y, 0) / 4;
  const elo: number[][] = [];
  for (let o = 0; o < ORDERS; o++) {
    const order = games.slice();
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const rt = [1000, 1000, 1000, 1000];
    for (const [a, b, s] of order) {
      const e = 1 / (1 + Math.pow(10, (rt[b] - rt[a]) / 400));
      rt[a] += k * (s - e); rt[b] -= k * (s - e);
    }
    elo.push(rt.map((x) => x - 1000 + mean));
  }
  const w = [0, 1, 2, 3].map(() => [0, 0, 0, 0]);
  for (const [a, b, s] of games) { if (s) w[a][b]++; else w[b][a]++; }
  let p = [1, 1, 1, 1];
  for (let it = 0; it < 300; it++) {
    const np = p.map((pi, i) => w[i].reduce((x, y) => x + y, 0) / [0, 1, 2, 3].reduce((acc, j) => (j === i ? acc : acc + (w[i][j] + w[j][i]) / (pi + p[j])), 0));
    const g = Math.exp(np.reduce((x, y) => x + Math.log(y), 0) / 4);
    p = np.map((x) => x / g);
  }
  const bt = p.map((x) => mean + 400 * Math.log10(x));
  return { elo, bt };
}

export function EloOrderViz() {
  const [ki, setKi] = useState(2);
  const { elo, bt } = useMemo(() => eloOrders(KS[ki]), [ki]);
  const W = 330, H = 170, X0 = 70, PW = 250, LO = 900, HI = 1200;
  const px = (x: number) => X0 + ((Math.min(HI, Math.max(LO, x)) - LO) / (HI - LO)) * PW;
  const spread = [0, 1, 2, 3].map((m) => {
    const xs = elo.map((e) => e[m]);
    const mu = xs.reduce((a, b) => a + b, 0) / xs.length;
    return Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / (xs.length - 1));
  });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Elo step size K">
          {KS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ki === i} onClick={() => setKi(i)}>K = {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Elo ratings from shuffled game orders against the Bradley–Terry fit">
        {TRUE.map((t, m) => {
          const y = 22 + m * 32;
          return (
            <g key={m}>
              <text x={X0 - 8} y={y + 4} textAnchor="end" className="viz-label">model {m + 1}</text>
              <line x1={X0} x2={X0 + PW} y1={y} y2={y} stroke="var(--border)" />
              {elo.map((e, o) => <circle key={o} cx={px(e[m])} cy={y} r={2.5} style={{ fill: "var(--accent)", opacity: 0.45 }} />)}
              <line x1={px(bt[m])} x2={px(bt[m])} y1={y - 9} y2={y + 9} stroke="var(--text)" strokeWidth={2} />
              <line x1={px(t)} x2={px(t)} y1={y - 9} y2={y + 9} stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="2 2" />
            </g>
          );
        })}
        <text x={X0} y={H - 16} className="viz-label">{LO}</text>
        <text x={X0 + PW} y={H - 16} textAnchor="end" className="viz-label">{HI}</text>
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">rating</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        spread of Elo across orders: {spread.map((s) => s.toFixed(1)).join(", ")} points
      </div>
      <figcaption className="viz-caption">
        The same two thousand games, replayed in forty shuffled orders. Each dot is one order&apos;s Elo rating, the solid bar is the Bradley–Terry fit and the dashed bar the true rating. Online Elo gives a different leaderboard for each order,
        weighted towards the most recent games, and the larger the step K the more it wanders. Fitting all games at once by maximum
        likelihood gives a single answer that does not depend on order, which is why arenas report Bradley–Terry ratings.
      </figcaption>
    </figure>
  );
}
