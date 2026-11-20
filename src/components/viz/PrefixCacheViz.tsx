"use client";

import { useState } from "react";

// Each request is a list of block labels (16 tokens each); equal labels at equal positions mean equal prefixes.
const REQS: string[][] = [
  ["S", "S", "S", "S", "A", "A", "q1"],
  ["S", "S", "S", "S", "A", "A", "q2"],
  ["S", "S", "S", "S", "q3", "q3"],
  ["S", "S", "S", "S", "B", "B", "B", "q4"],
  ["S", "S", "S", "S", "A", "A", "q5", "q5"],
];

/** For each request, which blocks are served from the cache, given the requests before it. */
export function hits(caching: boolean) {
  const seen = new Set<string>();
  return REQS.map((r) => {
    let reuse = caching;
    return r.map((_, i) => {
      const key = r.slice(0, i + 1).join("|");
      const hit = reuse && seen.has(key);
      if (!hit) reuse = false;
      seen.add(key);
      return hit;
    });
  });
}

export function PrefixCacheViz() {
  const [on, setOn] = useState(true);
  const h = hits(on);
  const total = REQS.reduce((s, r) => s + r.length, 0);
  const cached = h.flat().filter(Boolean).length;
  const C = 30,
    X0 = 70,
    Y0 = 4,
    RH = 28;
  const W = 330;
  const fill = (lab: string) =>
    lab === "S"
      ? "var(--text-muted)"
      : lab === "A" || lab === "B"
        ? "var(--accent)"
        : "var(--danger)";
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Prefix caching">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              type="button"
              className="seg"
              aria-pressed={on === v}
              onClick={() => setOn(v)}
            >
              {v ? "prefix cache on" : "off"}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + REQS.length * RH + 4}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Prompt blocks of five requests, cached or computed"
      >
        {REQS.map((r, i) => (
          <g key={i}>
            <text
              x={X0 - 8}
              y={Y0 + i * RH + RH / 2 + 4}
              textAnchor="end"
              className="viz-label"
            >{`request ${i + 1}`}</text>
            {r.map((lab, j) => (
              <rect
                key={j}
                x={X0 + j * C + 1.5}
                y={Y0 + i * RH + 3}
                width={C - 3}
                height={RH - 6}
                rx={3}
                style={{ fill: h[i][j] ? "var(--bg-subtle)" : fill(lab) }}
                stroke={h[i][j] ? fill(lab) : "none"}
                strokeWidth={1.5}
                strokeDasharray={h[i][j] ? "3 2" : undefined}
              />
            ))}
          </g>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        prefill computes {total - cached} of {total} blocks; {cached} come from
        the cache
      </div>
      <figcaption className="viz-caption">
        Five requests in arrival order, each a row of 16-token blocks: a shared
        system prompt (grey), a shared document (colour) and a question (red).
        Blocks outlined and empty are found in the prefix cache and skip
        prefill. Reuse stops at the first block that differs, because every
        later key and value depends on everything before it.
      </figcaption>
    </figure>
  );
}
