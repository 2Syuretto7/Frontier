"use client";

import { useState } from "react";

type Seg = ["txt" | "img", number];
const SEGS: Seg[] = [
  ["txt", 3],
  ["img", 5],
  ["txt", 2],
  ["img", 4],
  ["txt", 2],
];

/** Image segment index for each position, or -1 for text. */
export function segmentLabels(segs: Seg[]) {
  const out: number[] = [];
  segs.forEach(([k, n], s) => {
    for (let i = 0; i < n; i++) out.push(k === "img" ? s : -1);
  });
  return out;
}

/** Causal mask, optionally with full attention inside each image. */
export function multimodalMask(segs: Seg[], full: boolean) {
  const lab = segmentLabels(segs);
  return lab.map((li, i) =>
    lab.map((lj, j) => j <= i || (full && li >= 0 && li === lj)),
  );
}

export function MultimodalMaskViz() {
  const [full, setFull] = useState(true);
  const lab = segmentLabels(SEGS);
  const M = multimodalMask(SEGS, full);
  const N = lab.length,
    c = 15,
    x0 = 30,
    y0 = 30,
    W = x0 + N * c + 10,
    H = y0 + N * c + 10;
  const pairs = M.flat().filter(Boolean).length;
  const col = (l: number) => (l >= 0 ? "var(--success)" : "var(--accent)");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Mask">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              type="button"
              className="seg"
              aria-pressed={full === v}
              onClick={() => setFull(v)}
            >
              {v ? "full inside images" : "causal"}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 360,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Attention mask of a mixed text and image sequence"
      >
        {lab.map((l, i) => (
          <g key={i}>
            <rect
              x={x0 + i * c + 2}
              y={y0 - 14}
              width={c - 4}
              height={8}
              fill={col(l)}
            />
            <rect
              x={x0 - 14}
              y={y0 + i * c + 2}
              width={8}
              height={c - 4}
              fill={col(l)}
            />
          </g>
        ))}
        {M.map((row, i) =>
          row.map((on, j) => (
            <rect
              key={`${i}-${j}`}
              x={x0 + j * c + 0.5}
              y={y0 + i * c + 0.5}
              width={c - 1}
              height={c - 1}
              fill={
                on
                  ? j > i
                    ? "var(--success)"
                    : "var(--text-muted)"
                  : "var(--surface)"
              }
              fillOpacity={on ? (j > i ? 0.8 : 0.45) : 1}
              stroke="var(--border)"
              strokeWidth={0.5}
            />
          )),
        )}
      </svg>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 16px",
          justifyContent: "center",
          fontSize: 13,
        }}
      >
        <span style={{ color: "var(--accent)" }}>text</span>
        <span style={{ color: "var(--success)" }}>image patches</span>
        <span>
          allowed pairs: <strong>{pairs}</strong>
        </span>
      </div>
      <figcaption className="viz-caption">
        Rows are queries and columns keys for a sequence of text, an image,
        text, another image and text. A causal mask lets every position see only
        the past. A model that denoises each image as a whole also lets the
        patches of one image see each other in both directions (green above the
        diagonal), while text and other images still see only the past.
      </figcaption>
    </figure>
  );
}
