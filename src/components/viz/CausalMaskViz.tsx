"use client";

import { useState } from "react";

const TOKENS = ["the", "cat", "sat", ".", "a", "dog", "ran", "."];
const DOCS = [0, 0, 0, 0, 1, 1, 1, 1];

export function maskAllows(i: number, j: number, packed: boolean) {
  return j <= i && (!packed || DOCS[i] === DOCS[j]);
}

export function CausalMaskViz() {
  const [packed, setPacked] = useState(false);
  const [row, setRow] = useState(5);
  const n = TOKENS.length, cell = 32, X0 = 44, Y0 = 44;
  const allowed = TOKENS.reduce((s, _, i) => s + TOKENS.filter((_, j) => maskAllows(i, j, packed)).length, 0);
  const visible = TOKENS.filter((_, j) => maskAllows(row, j, packed));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={!packed} onClick={() => setPacked(false)}>one sequence</button>
        <button type="button" className="seg" aria-pressed={packed} onClick={() => setPacked(true)}>two packed documents</button>
      </div>
      <svg viewBox={`0 0 ${X0 + n * cell + 6} ${Y0 + n * cell + 6}`} style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="Attention mask: rows are queries, columns are keys">
        {TOKENS.map((t, j) => (
          <text key={`k${j}`} x={X0 + j * cell + cell / 2} y={Y0 - 8} textAnchor="middle" className="viz-label" transform={`rotate(-40 ${X0 + j * cell + cell / 2} ${Y0 - 8})`}>{t}</text>
        ))}
        {TOKENS.map((t, i) => (
          <text key={`q${i}`} x={X0 - 6} y={Y0 + i * cell + cell / 2 + 4} textAnchor="end" className="viz-label" style={{ cursor: "pointer" }} onClick={() => setRow(i)}>{t}</text>
        ))}
        {TOKENS.map((_, i) => TOKENS.map((_, j) => {
          const ok = maskAllows(i, j, packed);
          return (
            <rect key={`${i}-${j}`} x={X0 + j * cell} y={Y0 + i * cell} width={cell - 2} height={cell - 2}
              fill={ok ? "var(--accent)" : "var(--border)"} fillOpacity={ok ? (i === row ? 0.95 : 0.35) : 0.25}
              stroke={i === row ? "var(--danger)" : "none"} strokeWidth={i === row ? 1.5 : 0}
              style={{ cursor: "pointer" }} onClick={() => setRow(i)} />
          );
        }))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        <div>{`query ${row + 1} ("${TOKENS[row]}") sees: ${visible.join(" ")}`}</div>
        <div>{`allowed query–key pairs ${allowed} of ${n * n}`}</div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Rows are queries and columns are keys; tap a row to highlight it. The causal mask lets each position attend only to
        itself and earlier positions, so one forward pass yields a valid next-token prediction at every position. When two
        documents are packed into one training row, a block-diagonal mask also stops the second document attending to the
        first, removing 16 more pairs.
      </figcaption>
    </figure>
  );
}
