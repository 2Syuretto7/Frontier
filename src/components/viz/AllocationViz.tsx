"use client";

import { useState } from "react";

const SOURCES = ["web", "code", "books", "licensed news", "synthetic"];
const WEIGHTS = [0.55, 0.2, 0.1, 0.1, 0.05];
const UNIQUE = [1200, 250, 30, 20, 60];             // billions of unique tokens available
const EPOCHS = 4;
const BUDGETS = [250, 500, 1000, 2000];

/** Tokens per source: proportional to weight, but never more than EPOCHS passes over what the source holds. */
export function allocation(budget: number) {
  const caps = UNIQUE.map((u) => u * EPOCHS);
  const alloc = new Array(SOURCES.length).fill(0);
  let free = SOURCES.map((_, i) => i);
  while (free.length) {
    const used = alloc.reduce((a, b) => a + b, 0);
    const lam = (budget - used) / free.reduce((a, i) => a + WEIGHTS[i], 0);
    const capped = free.filter((i) => lam * WEIGHTS[i] >= caps[i]);
    if (!capped.length) { free.forEach((i) => (alloc[i] = lam * WEIGHTS[i])); break; }
    capped.forEach((i) => (alloc[i] = caps[i]));
    free = free.filter((i) => !capped.includes(i));
  }
  return alloc;
}

export function AllocationViz() {
  const [b, setB] = useState(2);
  const budget = BUDGETS[b];
  const alloc = allocation(budget);
  const W = 330, X0 = 84, BH = 14, GAP = 8, Y0 = 4, PW = 200;
  const mx = Math.max(...alloc);
  const x = (v: number) => (v / mx) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">budget, billions of tokens</span>
        <div className="segmented" role="group" aria-label="Token budget">
          {BUDGETS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={b === j} onClick={() => setB(j)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + SOURCES.length * (BH + GAP)}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Tokens allocated to each source">
        {SOURCES.map((s, i) => {
          const y = Y0 + i * (BH + GAP);
          const cap = UNIQUE[i] * EPOCHS, full = alloc[i] >= cap - 1e-9;
          return (
            <g key={s}>
              <text x={X0 - 6} y={y + BH - 3} textAnchor="end" className="viz-label">{s}</text>
              <rect x={X0} y={y} width={Math.max(x(alloc[i]), 0.5)} height={BH} style={{ fill: full ? "var(--accent)" : "var(--text-muted)" }} opacity={0.85} />
              {x(cap) <= PW && <line x1={X0 + x(cap)} x2={X0 + x(cap)} y1={y - 2} y2={y + BH + 2} stroke="var(--text)" strokeDasharray="2 2" />}
              <text x={X0 + Math.max(x(alloc[i]), x(cap) <= PW ? x(cap) : 0) + 4} y={y + BH - 3} className="viz-label">{Math.round(alloc[i])}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {alloc.filter((v, i) => v >= UNIQUE[i] * EPOCHS - 1e-9).length} source(s) at their cap of {EPOCHS} passes; web gets{" "}
        {((100 * alloc[0]) / budget).toFixed(0)}% of the budget against a target weight of {Math.round(WEIGHTS[0] * 100)}%
      </div>
      <figcaption className="viz-caption">
        Target weights of 55%, 20%, 10%, 10% and 5%, with each source allowed at most {EPOCHS} passes over its unique tokens (dashed
        lines). Small, valuable sources such as books and licensed news hit their caps first, and the tokens they cannot supply go to
        the remaining sources in proportion to their weights.
      </figcaption>
    </figure>
  );
}
