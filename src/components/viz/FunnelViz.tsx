"use client";

import { useState } from "react";

const STAGES = [
  "raw crawl",
  "text extraction",
  "language ID",
  "heuristic filters",
  "quality classifier",
  "deduplication",
  "decontamination",
];
const LANGS: [string, number[]][] = [
  ["English", [0.85, 0.97, 0.6, 0.35, 0.55, 0.999]],
  ["Hindi", [0.8, 0.9, 0.5, 0.2, 0.6, 0.999]],
  ["Swahili", [0.75, 0.7, 0.45, 0.16, 0.7, 0.999]],
];

/** Percentage of raw tokens left after each stage. */
export function remaining(fracs: number[]) {
  const out = [100];
  fracs.forEach((f) => out.push(out[out.length - 1] * f));
  return out;
}

export function FunnelViz() {
  const [li, setLi] = useState(0);
  const rows = remaining(LANGS[li][1]);
  const W = 330,
    X0 = 112,
    PW = 165,
    RH = 22,
    Y0 = 4;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Language">
          {LANGS.map(([name], j) => (
            <button
              key={name}
              type="button"
              className="seg"
              aria-pressed={li === j}
              onClick={() => setLi(j)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + STAGES.length * RH + 4}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Share of tokens left after each pipeline stage"
      >
        {STAGES.map((s, i) => {
          const yy = Y0 + i * RH;
          const w = (rows[i] / 100) * PW;
          return (
            <g key={s}>
              <text
                x={X0 - 6}
                y={yy + RH / 2 + 4}
                textAnchor="end"
                className="viz-label"
              >
                {s}
              </text>
              <rect
                x={X0}
                y={yy + 3}
                width={Math.max(w, 1)}
                height={RH - 6}
                rx={2}
                style={{ fill: "var(--accent)" }}
                opacity={0.5 + 0.5 * (i / STAGES.length)}
              />
              <text
                x={X0 + Math.max(w, 1) + 5}
                y={yy + RH / 2 + 4}
                className="viz-label"
              >{`${rows[i].toFixed(1)}%`}</text>
            </g>
          );
        })}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {LANGS[li][0]}: the quality classifier keeps{" "}
        {(100 * LANGS[li][1][3]).toFixed(0)}% of what reaches it
      </div>
      <figcaption className="viz-caption">
        The share of raw tokens left after each stage of a hypothetical
        pipeline, for three languages. Filters trained mostly on English, such
        as the quality classifier, remove far more of other languages. A data
        card that reports this funnel per language shows readers where a corpus
        is thin and why.
      </figcaption>
    </figure>
  );
}
