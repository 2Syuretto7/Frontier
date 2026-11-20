"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const R = 4, E = 8, T = 20;
const KS = [1, 2, 4];

/** Each of 4 ranks routes 20 tokens to k distinct experts out of 8, two experts per rank. Returns the rank-to-rank slot counts. */
export function dispatchCounts(k: number) {
  const rng = rand(7);
  const C = Array.from({ length: R }, () => Array(R).fill(0));
  for (let r = 0; r < R; r++)
    for (let t = 0; t < T; t++) {
      const picked = new Set<number>();
      while (picked.size < k) picked.add(Math.floor(rng() * E));
      for (const e of picked) C[r][Math.floor(e / (E / R))] += 1;
    }
  return C;
}

export function ExpertDispatchViz() {
  const [i, setI] = useState(1);
  const k = KS[i];
  const C = dispatchCounts(k);
  const total = R * T * k;
  const local = C.reduce((s, row, r) => s + row[r], 0);
  const mx = Math.max(...C.flat());
  const W = 330, CS = 40, X0 = 110, Y0 = 34;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Experts per token">
          {KS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={i === j} onClick={() => setI(j)}>top-{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + R * CS + 8}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Token slots sent from each rank to each rank">
        <text x={X0 + (R * CS) / 2} y={10} textAnchor="middle" className="viz-label">to rank (experts 2r, 2r + 1)</text>
        {Array.from({ length: R }, (_, r) => (
          <g key={r}>
            <text x={X0 - 8} y={Y0 + r * CS + CS / 2 + 4} textAnchor="end" className="viz-label">from rank {r}</text>
            <text x={X0 + r * CS + CS / 2} y={Y0 - 6} textAnchor="middle" className="viz-label">{r}</text>
            {C[r].map((v, c) => (
              <g key={c}>
                <rect x={X0 + c * CS} y={Y0 + r * CS} width={CS - 2} height={CS - 2} style={{ fill: "var(--accent)", stroke: r === c ? "var(--text)" : "none" }} opacity={0.15 + (0.8 * v) / mx} />
                <text x={X0 + c * CS + CS / 2 - 1} y={Y0 + r * CS + CS / 2 + 3} textAnchor="middle" className="mono" style={{ fontSize: 11, fill: "var(--text)" }}>{v}</text>
              </g>
            ))}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {total} token slots; {local} stay on their rank ({((100 * local) / total).toFixed(0)}%), {total - local} cross the all-to-all, and come back for the combine
      </div>
      <figcaption className="viz-caption">
        Four ranks each hold 20 tokens and two of eight experts. Each token goes to k experts, so each row sums to 20k. Only the
        diagonal stays local; with experts spread over many ranks, nearly every slot leaves its rank twice, once to the expert and
        once back. Doubling k doubles the traffic.
      </figcaption>
    </figure>
  );
}
