"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 16;
const r0 = rand(1313);
const RAW = Array.from({ length: N }, () => (r0() - 0.5) * 1.6);
RAW[5] = 14; // one outlier channel
const MODES = ["raw", "smoothed", "rotated"] as const;

function hadamard(v: number[]) {
  let h = v.slice();
  for (let len = 1; len < h.length; len *= 2) {
    const out = h.slice();
    for (let i = 0; i < h.length; i += 2 * len)
      for (let j = i; j < i + len; j++) {
        out[j] = h[j] + h[j + len];
        out[j + len] = h[j] - h[j + len];
      }
    h = out;
  }
  return h.map((x) => x / Math.sqrt(h.length));
}

/** The activation vector after the chosen treatment. */
export function transform(mode: (typeof MODES)[number]) {
  if (mode === "smoothed") return RAW.map((x, j) => (j === 5 ? x / 8 : x)); // channel 5 divided by s = 8; its weights take the factor
  if (mode === "rotated") return hadamard(RAW);
  return RAW;
}

export function OutlierRotateViz() {
  const [mi, setMi] = useState(0);
  const v = transform(MODES[mi]);
  const s = Math.max(...v.map(Math.abs)) / 7; // 4-bit symmetric scale
  const q = v.map((x) => Math.round(x / s) * s);
  const rms = Math.sqrt(v.reduce((a, x) => a + x * x, 0) / N);
  // undo the treatment, then measure the error on the fifteen ordinary channels
  const back =
    MODES[mi] === "rotated"
      ? hadamard(q)
      : MODES[mi] === "smoothed"
        ? q.map((x, j) => (j === 5 ? x * 8 : x))
        : q;
  const ord = RAW.map((x, j) => ({ x, j })).filter((o) => o.j !== 5);
  const ordRms = Math.sqrt(ord.reduce((a, o) => a + o.x * o.x, 0) / ord.length);
  const relErr =
    Math.sqrt(
      ord.reduce((a, o) => a + (o.x - back[o.j]) ** 2, 0) / ord.length,
    ) / ordRms;
  const W = 330,
    X0 = 10,
    PW = 310,
    Y0 = 6,
    PH = 140,
    M = 15;
  const bw = PW / N;
  const y = (x: number) => Y0 + PH / 2 - (x / M) * (PH / 2);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="Treatment of the activations"
        >
          {MODES.map((m, j) => (
            <button
              key={m}
              type="button"
              className="seg"
              aria-pressed={mi === j}
              onClick={() => setMi(j)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + PH + 6}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Activation values by channel"
      >
        <line x1={X0} x2={X0 + PW} y1={y(0)} y2={y(0)} stroke="var(--border)" />
        {[-1, 1].map((k) =>
          [1, 2, 3, 4, 5, 6, 7].map((l) => (
            <line
              key={`${k}${l}`}
              x1={X0}
              x2={X0 + PW}
              y1={y(k * l * s)}
              y2={y(k * l * s)}
              stroke="var(--border)"
              strokeDasharray="1 3"
            />
          )),
        )}
        {v.map((x, j) => (
          <rect
            key={j}
            x={X0 + j * bw + 2}
            y={Math.min(y(x), y(0))}
            width={bw - 4}
            height={Math.max(Math.abs(y(x) - y(0)), 0.8)}
            rx={1.5}
            style={{
              fill: j === 5 && mi !== 2 ? "var(--danger)" : "var(--accent)",
            }}
          />
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        max/rms {(Math.max(...v.map(Math.abs)) / rms).toFixed(2)}; 4-bit error
        on ordinary channels {(100 * relErr).toFixed(0)}% of their rms
      </div>
      <figcaption className="viz-caption">
        Sixteen channels of one token&apos;s activations, one an outlier (red).
        Dotted lines are the 4-bit levels when one scale covers the whole
        vector. Smoothing divides the outlier channel by a factor and multiplies
        the matching weights by it; a Hadamard rotation mixes all channels so
        the outlier&apos;s energy is spread evenly. Both cut the error on the
        ordinary channels; rotation does so without knowing which channel holds
        the outlier.
      </figcaption>
    </figure>
  );
}
