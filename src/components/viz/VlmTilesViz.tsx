"use client";

import { useState } from "react";

const TILE = 336,
  PATCH = 14;

/** Visual tokens for an H x W image cut into 336-pixel tiles plus one downscaled thumbnail, with pixel shuffle r. */
export function vlmTokens(H: number, W: number, r: number) {
  const rows = Math.ceil(H / TILE),
    cols = Math.ceil(W / TILE);
  const perTile = (TILE / PATCH) ** 2 / (r * r);
  return {
    rows,
    cols,
    perTile,
    total: (rows * cols + (rows * cols > 1 ? 1 : 0)) * perTile,
  };
}

const SIZES: [number, number][] = [
  [336, 336],
  [672, 672],
  [672, 1344],
  [1008, 1344],
];

export function VlmTilesViz() {
  const [si, setSi] = useState(1);
  const [r, setR] = useState(1);
  const [H, Wd] = SIZES[si];
  const { rows, cols, perTile, total } = vlmTokens(H, Wd, r);
  const W = 330,
    sc = Math.min(200 / Wd, 150 / H),
    x0 = 14,
    y0 = 14,
    Hs = y0 + Math.max(H * sc, 80) + 14;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <span className="viz-label">image</span>
        <div className="segmented" role="group" aria-label="Image size">
          {SIZES.map(([h, w], i) => (
            <button
              key={i}
              type="button"
              className="seg"
              aria-pressed={si === i}
              onClick={() => setSi(i)}
            >
              {w}×{h}
            </button>
          ))}
        </div>
        <span className="viz-label">pixel shuffle</span>
        <div
          className="segmented"
          role="group"
          aria-label="Pixel shuffle factor"
        >
          {[1, 2].map((v) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={r === v}
              onClick={() => setR(v)}
            >
              {v === 1 ? "none" : "2×2"}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Hs}`}
        style={{
          width: "100%",
          maxWidth: 440,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Tiles of the image"
      >
        <rect
          x={x0}
          y={y0}
          width={Wd * sc}
          height={H * sc}
          fill="var(--surface)"
          stroke="var(--border-strong)"
        />
        {Array.from({ length: rows }, (_, i) =>
          Array.from({ length: cols }, (_, j) => (
            <rect
              key={`${i}-${j}`}
              x={x0 + j * TILE * sc + 2}
              y={y0 + i * TILE * sc + 2}
              width={TILE * sc - 4}
              height={TILE * sc - 4}
              fill="var(--accent)"
              fillOpacity={0.15}
              stroke="var(--accent)"
            />
          )),
        )}
        {rows * cols > 1 && (
          <g>
            <rect
              x={x0 + Wd * sc + 16}
              y={y0}
              width={56}
              height={56}
              fill="var(--success)"
              fillOpacity={0.15}
              stroke="var(--success)"
            />
            <text
              x={x0 + Wd * sc + 44}
              y={y0 + 72}
              textAnchor="middle"
              className="viz-label"
            >
              thumbnail
            </text>
          </g>
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
        <span>
          tiles:{" "}
          <strong>
            {rows * cols}
            {rows * cols > 1 ? " + 1" : ""}
          </strong>
        </span>
        <span>
          tokens per tile: <strong>{perTile}</strong>
        </span>
        <span>
          visual tokens: <strong>{total}</strong>
        </span>
      </div>
      <figcaption className="viz-caption">
        A vision encoder that takes 336-pixel inputs with 14-pixel patches gives
        576 tokens per tile. Larger images are cut into tiles, each encoded
        separately, plus a downscaled thumbnail of the whole image for global
        context. Token counts grow with the area of the image; merging each 2 ×
        2 block of tokens into one wider token cuts them by four before they
        reach the language model.
      </figcaption>
    </figure>
  );
}
