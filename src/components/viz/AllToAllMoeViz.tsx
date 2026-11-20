"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const P = 4, E = 8, TOK = 16, FACTORS = [1, 1.25, 2];
const ROUTERS = [
  { name: "balanced", w: [1, 1, 1, 1, 1, 1, 1, 1] },
  { name: "skewed", w: [8, 4, 2, 2, 1, 1, 1, 1] },
];

/** Each of 4 ranks routes 16 tokens to 8 experts (2 per rank). Returns the rank-to-rank counts and the load on each expert. */
export function routeTokens(router: number, seed = 5) {
  const r = rand(seed), w = ROUTERS[router].w, tot = w.reduce((a, b) => a + b, 0);
  const send = Array.from({ length: P }, () => Array(P).fill(0)), load = Array(E).fill(0);
  for (let i = 0; i < P; i++) for (let t = 0; t < TOK; t++) {
    let u = r() * tot, e = 0;
    while (u >= w[e]) { u -= w[e]; e++; }
    send[i][Math.floor(e / (E / P))]++;
    load[e]++;
  }
  return { send, load };
}

export function AllToAllMoeViz() {
  const [ri, setRi] = useState(1), [fi, setFi] = useState(1);
  const { send, load } = useMemo(() => routeTokens(ri), [ri]);
  const cap = Math.ceil((FACTORS[fi] * P * TOK) / E), drop = load.reduce((a, c) => a + Math.max(0, c - cap), 0);
  const W = 330, H = 170, cs = 28, gx = 44, gy = 24, bx = 190, bw = 15, bh = 110, maxL = 32;
  const sy = (v: number) => gy + bh - (Math.min(v, maxL) / maxL) * bh;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">router</span>
        <div className="segmented" role="group" aria-label="Router">
          {ROUTERS.map((x, i) => <button key={x.name} type="button" className="seg" aria-pressed={ri === i} onClick={() => setRi(i)}>{x.name}</button>)}
        </div>
        <span className="viz-label">capacity factor</span>
        <div className="segmented" role="group" aria-label="Capacity factor">
          {FACTORS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={fi === i} onClick={() => setFi(i)}>{x}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Tokens sent between ranks and the load on each expert">
        <text x={gx + (cs * P) / 2} y={12} textAnchor="middle" className="viz-label">tokens sent, row to column</text>
        {send.map((row, i) => (
          <g key={i}>
            <text x={gx - 4} y={gy + i * cs + 18} textAnchor="end" className="viz-label">{`r${i}`}</text>
            <text x={gx + i * cs + (cs - 3) / 2} y={gy + P * cs + 10} textAnchor="middle" className="viz-label">{`r${i}`}</text>
            {row.map((c, j) => (
              <g key={j}>
                <rect x={gx + j * cs} y={gy + i * cs} width={cs - 3} height={cs - 3} rx={3} fill="var(--accent)" opacity={0.1 + (0.8 * c) / TOK} stroke="var(--border)" />
                <text x={gx + j * cs + (cs - 3) / 2} y={gy + i * cs + 17} textAnchor="middle" className="viz-label" style={{ fill: "var(--text)" }}>{c}</text>
              </g>
            ))}
          </g>
        ))}
        <text x={bx + (E * (bw + 3)) / 2} y={12} textAnchor="middle" className="viz-label">load per expert</text>
        {load.map((c, e) => (
          <g key={e}>
            <rect x={bx + e * (bw + 3)} y={sy(Math.min(c, cap))} width={bw} height={gy + bh - sy(Math.min(c, cap))} fill="var(--accent)" />
            {c > cap && <rect x={bx + e * (bw + 3)} y={sy(c)} width={bw} height={sy(cap) - sy(c)} fill="var(--danger)" />}
            <text x={bx + e * (bw + 3) + bw / 2} y={gy + bh + 12} textAnchor="middle" className="viz-label">{e}</text>
          </g>
        ))}
        <line x1={bx - 2} x2={bx + E * (bw + 3)} y1={sy(cap)} y2={sy(cap)} stroke="var(--text)" strokeDasharray="4 3" />
        <text x={bx + (E * (bw + 3)) / 2} y={H - 2} textAnchor="middle" className="viz-label">experts (2 per rank)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`capacity ${cap} tokens per expert; dropped ${drop} of ${P * TOK}; busiest expert ${Math.max(...load)}`}
      </div>
      <figcaption className="viz-caption">
        A mixture-of-experts layer on 4 ranks, each holding two of 8 experts and 16 tokens. The router picks an expert for
        every token, and an all-to-all sends each token to the rank that holds its expert: the grid counts tokens sent from
        each row&apos;s rank to each column&apos;s rank. Each expert processes at most a fixed capacity of tokens (dashed line),
        the capacity factor times the average load of 8; tokens beyond it (red) are dropped. With the balanced router, 8 tokens are dropped at
        capacity factor 1, 3 at 1.25 and none at 2. With the skewed router the busiest expert receives 28 tokens and 12 are
        dropped even at factor 2, which is why mixture-of-experts training adds a loss that rewards balanced routing.
      </figcaption>
    </figure>
  );
}
