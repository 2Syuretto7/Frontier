"use client";

import { useState } from "react";

const S = 16;
const WINDOWS: [string, number][] = [
  ["full", S],
  ["window 6", 6],
  ["window 3", 3],
];
const LAYERS = [1, 2, 4];

/** Earliest position the last token can draw on after the given number of layers. */
export function reachStart(w: number, layers: number) {
  return Math.max(0, S - 1 - layers * (w - 1));
}

export function SlidingWindowViz() {
  const [wi, setWi] = useState(1);
  const [li, setLi] = useState(1);
  const w = WINDOWS[wi][1],
    L = LAYERS[li];
  const start = reachStart(w, L);
  const C = 15,
    X0 = 40,
    Y0 = 4;
  const W = X0 + S * C + 10;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div className="segmented" role="group" aria-label="Attention window">
          {WINDOWS.map(([name], j) => (
            <button
              key={name}
              type="button"
              className="seg"
              aria-pressed={wi === j}
              onClick={() => setWi(j)}
            >
              {name}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="viz-label">layers</span>
          <div className="segmented" role="group" aria-label="Number of layers">
            {LAYERS.map((v, j) => (
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
        viewBox={`0 0 ${W} ${Y0 + (S + 1.6) * C + 4}`}
        style={{
          width: "100%",
          maxWidth: 360,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Attention mask and the reach of the last token"
      >
        {Array.from({ length: S }, (_, i) =>
          Array.from({ length: S }, (_, j) => {
            const on = j <= i && i - j < w;
            return (
              <rect
                key={`${i}-${j}`}
                x={X0 + j * C + 0.5}
                y={Y0 + i * C + 0.5}
                width={C - 1}
                height={C - 1}
                rx={1.5}
                style={{ fill: on ? "var(--text-muted)" : "var(--bg-subtle)" }}
              />
            );
          }),
        )}
        {Array.from({ length: S }, (_, j) => (
          <rect
            key={`r${j}`}
            x={X0 + j * C + 0.5}
            y={Y0 + (S + 0.6) * C + 0.5}
            width={C - 1}
            height={C - 1}
            rx={1.5}
            style={{ fill: j >= start ? "var(--accent)" : "var(--bg-subtle)" }}
            stroke="var(--border)"
          />
        ))}
        <text
          x={X0 - 6}
          y={Y0 + C * 0.75}
          textAnchor="end"
          className="viz-label"
        >
          query
        </text>
        <text
          x={X0 - 6}
          y={Y0 + (S + 0.6) * C + C * 0.75}
          textAnchor="end"
          className="viz-label"
        >
          reach
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        each layer caches {Math.min(w, S)} of {S} tokens; after {L} layer
        {L > 1 ? "s" : ""} the last token draws on {S - start}
      </div>
      <figcaption className="viz-caption">
        The attention mask for sixteen tokens (dark: allowed), with the query
        position down the side and the key position across. A sliding window
        caps how many keys and values each layer must keep. The bottom row
        shows, in colour, which positions can influence the last token once
        information is passed through several stacked layers.
      </figcaption>
    </figure>
  );
}
