"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 5, DELAY = 10, MAX_TERMS = 8;

type Term = { term: number; start: number; candidates: number[]; votes: Record<number, number>; winner: number | null };

/** Leader election among 5 servers, `down` of which have crashed. Randomised or equal timeouts in 150–300 ms. */
export function runElection(down: number, randomised: boolean, seed = 7) {
  const r = rand(seed), alive = Array.from({ length: N }, (_, i) => i).filter((i) => i >= down);
  const terms: Term[] = [];
  let now = 0;
  for (let term = 1; term <= MAX_TERMS; term++) {
    const timeout = new Map(alive.map((i) => [i, now + (randomised ? 150 + 150 * r() : 150)]));
    const t0 = Math.min(...timeout.values());
    const candidates = alive.filter((i) => timeout.get(i)! < t0 + DELAY).sort((a, b) => timeout.get(a)! - timeout.get(b)! || a - b);
    const votes: Record<number, number> = {};
    for (const c of candidates) votes[c] = c;
    for (const i of alive) if (!candidates.includes(i)) votes[i] = candidates[0];
    const counts = new Map<number, number>();
    for (const c of Object.values(votes)) counts.set(c, (counts.get(c) ?? 0) + 1);
    const winner = [...counts].find(([, k]) => 2 * k > N)?.[0] ?? null;
    terms.push({ term, start: t0, candidates, votes, winner });
    if (winner !== null) break;
    now = t0 + 2 * DELAY;
  }
  return terms;
}

export function RaftElectionViz() {
  const [down, setDown] = useState(0), [randomised, setRandomised] = useState(true);
  const terms = runElection(down, randomised), last = terms[terms.length - 1];
  const W = 330, rowH = 22, H = 30 + terms.length * rowH, X0 = 52, cw = (W - X0 - 4) / N;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">timeouts</span>
        <div className="segmented" role="group" aria-label="Election timeouts">
          <button type="button" className="seg" aria-pressed={randomised} onClick={() => setRandomised(true)}>randomised</button>
          <button type="button" className="seg" aria-pressed={!randomised} onClick={() => setRandomised(false)}>all equal</button>
        </div>
        <span className="viz-label">crashed servers</span>
        <div className="segmented" role="group" aria-label="Crashed servers">
          {[0, 1, 2, 3].map((d) => <button key={d} type="button" className="seg" aria-pressed={down === d} onClick={() => setDown(d)}>{d}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Votes cast by each server in each term">
        {Array.from({ length: N }, (_, i) => <text key={i} x={X0 + i * cw + cw / 2} y={14} textAnchor="middle" className="viz-label">{`S${i}`}</text>)}
        {terms.map((t, k) => (
          <g key={t.term}>
            <text x={2} y={26 + k * rowH + 14} className="viz-label">{`term ${t.term}`}</text>
            {Array.from({ length: N }, (_, i) => {
              const x = X0 + i * cw + 2, y = 26 + k * rowH, crashed = i < down, cand = t.candidates.includes(i);
              return (
                <g key={i}>
                  <rect x={x} y={y} width={cw - 4} height={rowH - 4} rx={3} fill={crashed ? "var(--bg-subtle)" : t.winner === i ? "var(--success-soft)" : cand ? "var(--accent-soft)" : "none"} stroke={t.winner === i ? "var(--success)" : "var(--border-strong)"} />
                  <text x={x + (cw - 4) / 2} y={y + 13} textAnchor="middle" className="viz-label" style={{ fill: "var(--text)" }}>{crashed ? "down" : `→ S${t.votes[i]}`}</text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {last.winner !== null ? `S${last.winner} elected leader in term ${last.term} with a majority of ${N}` : `no leader after ${terms.length} terms`}
      </div>
      <figcaption className="viz-caption">
        Five servers elect a leader. A server that hears nothing for its election timeout becomes a candidate for the next
        term and votes for itself (blue); every other server votes for the first candidate it hears from, and a candidate with at least
        3 of the 5 votes wins (green). Requests take 10 ms, so servers that time out within 10 ms of each other can split the vote.
        With randomised timeouts a leader is elected in the first term, or with 2 servers down in the second, after one split
        vote. With equal timeouts every server
        stands in every term and no one ever wins. With 3 servers crashed, no candidate can reach a majority however long it
        tries.
      </figcaption>
    </figure>
  );
}
