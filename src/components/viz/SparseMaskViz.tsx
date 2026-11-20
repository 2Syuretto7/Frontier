"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 32, BLOCK = 4;

type Kind = "full" | "window" | "sinks" | "blocks";

/** Which keys (columns) each query (row) may attend to under the chosen pattern. */
export function mask(kind: Kind, w: number, seed = 7) {
  const r = rand(seed);
  const nb = N / BLOCK;
  const chosen: Set<number>[] = [];
  for (let qb = 0; qb < nb; qb++) {
    const scores = Array.from({ length: qb }, (_, b) => ({ b, s: r() }));
    scores.sort((x, y) => y.s - x.s);
    chosen.push(new Set([qb, ...scores.slice(0, 2).map((x) => x.b)]));
  }
  return Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => {
    if (j > i) return false;
    if (kind === "full") return true;
    if (kind === "window") return i - j < w;
    if (kind === "sinks") return i - j < w || j < 2;
    return chosen[Math.floor(i / BLOCK)].has(Math.floor(j / BLOCK));
  }));
}

const LABEL: Record<Kind, string> = { full: "full causal", window: "sliding window", sinks: "window + sinks", blocks: "top-2 blocks" };

export function SparseMaskViz() {
  const [kind, setKind] = useState<Kind>("sinks");
  const [w, setW] = useState(8);
  const m = useMemo(() => mask(kind, w), [kind, w]);
  const kept = m.flat().filter(Boolean).length;
  const causal = (N * (N + 1)) / 2;
  const S = 7.5, X0 = 62, Y0 = 6;
  const W = 330, H = Y0 + N * S + 22;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Pattern">
          {(Object.keys(LABEL) as Kind[]).map((k) => (
            <button key={k} className="seg" aria-pressed={kind === k} onClick={() => setKind(k)}>{LABEL[k]}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Window">
          {[4, 8].map((v) => (
            <button key={v} className="seg" aria-pressed={w === v} onClick={() => setW(v)}>window {v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Attention mask: rows are queries, columns are keys">
        {m.map((row, i) => row.map((ok, j) => (j <= i ? (
          <rect key={`${i}-${j}`} x={X0 + j * S} y={Y0 + i * S} width={S - 0.8} height={S - 0.8} style={{ fill: ok ? "var(--accent)" : "var(--border)" }} opacity={ok ? 0.9 : 0.5} />
        ) : null)))}
        {kind === "blocks" && Array.from({ length: N / BLOCK + 1 }, (_, b) => (
          <line key={b} x1={X0 + b * BLOCK * S - 0.4} x2={X0 + b * BLOCK * S - 0.4} y1={Y0} y2={Y0 + N * S} stroke="var(--text-muted)" strokeWidth={0.5} />
        ))}
        <text x={X0 - 6} y={Y0 + 8} textAnchor="end" className="viz-label">query 1</text>
        <text x={X0 - 6} y={Y0 + N * S} textAnchor="end" className="viz-label">query 32</text>
        <text x={X0} y={H - 4} className="viz-label">columns: keys 1 to 32; filled: attended</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {LABEL[kind]}: {kept} of {causal} causal query-key pairs ({((100 * kept) / causal).toFixed(0)}%)
      </div>
      <figcaption className="viz-caption">
        Each row is a query and each column a key. A sliding window keeps a band along the diagonal, so the cost per token is
        fixed. Keeping the first two tokens as attention sinks adds two columns at little cost and, as StreamingLLM found, keeps
        windowed models stable. Block selection lets each block of queries attend to its own block and the two earlier blocks
        that score highest, so distant information can still be reached.
      </figcaption>
    </figure>
  );
}
