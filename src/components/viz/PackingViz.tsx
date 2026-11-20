"use client";

import { useState } from "react";

const DOCS = [5, 11, 3, 7, 14, 2, 9, 6, 4, 10]; // document lengths in tokens, each followed by an EOS
const LENS = [8, 16];

/** Rows of cells: the document index of each position, or -1 for padding. */
export function layout(seqLen: number, packed: boolean) {
  const rows: number[][] = [];
  if (packed) {
    const stream = DOCS.flatMap((n, d) => Array(n + 1).fill(d));
    for (let i = 0; i + seqLen <= stream.length; i += seqLen)
      rows.push(stream.slice(i, i + seqLen));
  } else {
    DOCS.forEach((n, d) => {
      const toks: number[] = Array(n + 1).fill(d);
      for (let i = 0; i < toks.length; i += seqLen) {
        const r = toks.slice(i, i + seqLen);
        rows.push([...r, ...Array(seqLen - r.length).fill(-1)]);
      }
    });
  }
  return rows;
}

export function PackingViz() {
  const [li, setLi] = useState(1);
  const [packed, setPacked] = useState(false);
  const seqLen = LENS[li];
  const rows = layout(seqLen, packed);
  const pad = rows.flat().filter((d) => d < 0).length;
  const total = DOCS.reduce((a, b) => a + b + 1, 0);
  const dropped = packed ? total - rows.length * seqLen : 0;
  const W = 330,
    X0 = 4,
    PW = 322;
  const cw = PW / seqLen,
    ch = Math.min(14, 300 / rows.length);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div className="segmented" role="group" aria-label="Batching method">
          {[false, true].map((p) => (
            <button
              key={String(p)}
              type="button"
              className="seg"
              aria-pressed={packed === p}
              onClick={() => setPacked(p)}
            >
              {p ? "pack" : "pad"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="viz-label">sequence length</span>
          <div className="segmented" role="group" aria-label="Sequence length">
            {LENS.map((v, j) => (
              <button
                key={v}
                type="button"
                className="seg"
                aria-pressed={li === j}
                onClick={() => setLi(j)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${rows.length * ch + 4}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Tokens laid out in training sequences"
      >
        {rows.map((r, i) =>
          r.map((d, j) => (
            <rect
              key={`${i}-${j}`}
              x={X0 + j * cw + 0.5}
              y={2 + i * ch + 0.5}
              width={cw - 1}
              height={ch - 1}
              rx={1.5}
              style={{
                fill:
                  d < 0
                    ? "var(--bg-subtle)"
                    : d % 2
                      ? "var(--accent)"
                      : "var(--text-muted)",
              }}
              stroke={d < 0 ? "var(--border)" : "none"}
            />
          )),
        )}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {rows.length} sequences;{" "}
        {packed
          ? `${dropped} tail tokens dropped, no padding`
          : `${pad} padding positions, ${((100 * pad) / (rows.length * seqLen)).toFixed(0)}% of the batch`}
      </div>
      <figcaption className="viz-caption">
        Ten documents of different lengths, alternately grey and coloured, each
        ending in an EOS token. Padding gives every document its own sequences
        and fills the rest with empty positions; packing concatenates documents
        and cuts the stream into full sequences, so a document may span two rows
        and a row may hold several documents.
      </figcaption>
    </figure>
  );
}
