"use client";

import { useState } from "react";

const BS = 4,
  NBLOCKS = 48,
  MAXLEN = 48; // block size in tokens, physical blocks, reserved length
const PROMPTS = [5, 12, 3, 8],
  STOPS = [20, 40, 14, 30]; // tokens at which each sequence ends
const STEPS = [0, 10, 25];
const COLOURS = [
  "var(--accent)",
  "var(--text)",
  "var(--danger)",
  "var(--text-muted)",
];

/** Owner (sequence index) and fill of each physical block; -1 marks a free block. */
export function layout(step: number, paged: boolean) {
  const lens = PROMPTS.map((p, s) => Math.min(p + step, STOPS[s]));
  const owner = Array(NBLOCKS).fill(-1),
    used = Array(NBLOCKS).fill(false);
  if (!paged) {
    const per = MAXLEN / BS;
    lens.forEach((n, s) => {
      for (let b = 0; b < per; b++) {
        owner[s * per + b] = s;
        used[s * per + b] = b * BS < n;
      }
    });
  } else {
    // blocks are handed out one at a time as sequences grow, interleaved in time
    let next = 0;
    const have = PROMPTS.map(() => 0);
    for (let t = 0; t <= step; t++) {
      PROMPTS.forEach((p, s) => {
        const n = Math.min(p + t, STOPS[s]);
        while (have[s] * BS < n) {
          owner[next] = s;
          used[next] = true;
          next++;
          have[s]++;
        }
      });
    }
  }
  return { owner, used, lens };
}

export function PagedMemoryViz() {
  const [si, setSi] = useState(1);
  const [paged, setPaged] = useState(false);
  const { owner, used, lens } = layout(STEPS[si], paged);
  const inUse = used.filter(Boolean).length;
  const reservedEmpty = owner.filter((o, i) => o >= 0 && !used[i]).length;
  const tokens = lens.reduce((a, b) => a + b, 0);
  const C = 26,
    COLS = 12,
    X0 = 9,
    Y0 = 4;
  const W = 330;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div className="segmented" role="group" aria-label="Cache layout">
          {[false, true].map((p) => (
            <button
              key={String(p)}
              type="button"
              className="seg"
              aria-pressed={paged === p}
              onClick={() => setPaged(p)}
            >
              {p ? "paged" : "reserved"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="viz-label">step</span>
          <div className="segmented" role="group" aria-label="Decode step">
            {STEPS.map((v, j) => (
              <button
                key={v}
                type="button"
                className="seg"
                aria-pressed={si === j}
                onClick={() => setSi(j)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + (NBLOCKS / COLS) * C + 4}`}
        style={{
          width: "100%",
          maxWidth: 420,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Physical KV cache blocks and their owners"
      >
        {owner.map((o, i) => (
          <rect
            key={i}
            x={X0 + (i % COLS) * C + 1.5}
            y={Y0 + Math.floor(i / COLS) * C + 1.5}
            width={C - 3}
            height={C - 3}
            rx={3}
            style={{ fill: o < 0 ? "var(--bg-subtle)" : COLOURS[o] }}
            opacity={o < 0 ? 1 : used[i] ? 0.9 : 0.22}
            stroke="var(--border)"
          />
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {tokens} tokens cached in {inUse} blocks; {reservedEmpty} blocks
        reserved but empty; {owner.filter((o) => o < 0).length} free
      </div>
      <figcaption className="viz-caption">
        Forty-eight physical cache blocks of four tokens each, shared by four
        sequences (one colour each) as they decode. Reserving the maximum length
        for every sequence fills memory with empty blocks (faint) from the
        start; paging hands out blocks one at a time as sequences grow, wherever
        they are free, leaving room for more sequences.
      </figcaption>
    </figure>
  );
}
