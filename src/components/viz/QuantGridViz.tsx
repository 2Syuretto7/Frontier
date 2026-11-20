"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const G = 8,
  ROWS = 3;
const r0 = rand(411);
const W8: number[] = Array.from({ length: G * ROWS }, () => (r0() - 0.5) * 0.6);
W8[13] = 2.4; // one outlier, in the second group

/** Symmetric quantisation with one scale per tensor or per group; returns dequantised values and scales. */
export function quantise(bits: number, grouped: boolean) {
  const qmax = 2 ** (bits - 1) - 1;
  const scales = Array.from({ length: ROWS }, (_, r) => {
    const vals = grouped ? W8.slice(r * G, (r + 1) * G) : W8;
    return Math.max(...vals.map(Math.abs)) / qmax;
  });
  const deq = W8.map((v, i) => {
    const s = scales[Math.floor(i / G)];
    return Math.round(v / s) * s;
  });
  return { deq, scales };
}

export function QuantGridViz() {
  const [bits, setBits] = useState(4);
  const [grouped, setGrouped] = useState(false);
  const { deq, scales } = quantise(bits, grouped);
  const mse = W8.reduce((s, v, i) => s + (v - deq[i]) ** 2, 0) / W8.length;
  const zeros = W8.filter((v, i) => v !== 0 && deq[i] === 0).length;
  const W = 330,
    X0 = 20,
    PW = 290,
    Y0 = 10,
    RH = 52,
    LO = -0.6,
    HI = 2.6;
  const x = (v: number) => X0 + ((v - LO) / (HI - LO)) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div className="segmented" role="group" aria-label="Bits">
          {[4, 8].map((b) => (
            <button
              key={b}
              type="button"
              className="seg"
              aria-pressed={bits === b}
              onClick={() => setBits(b)}
            >{`${b}-bit`}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Granularity">
          {[false, true].map((g) => (
            <button
              key={String(g)}
              type="button"
              className="seg"
              aria-pressed={grouped === g}
              onClick={() => setGrouped(g)}
            >
              {g ? "per group of 8" : "per tensor"}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + ROWS * RH + 14}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Weights and their quantisation levels in three groups"
      >
        {Array.from({ length: ROWS }, (_, r) => {
          const yy = Y0 + r * RH + RH / 2;
          const s = scales[r];
          const levels: number[] = [];
          if (s * 1 > 0.02)
            for (let k = Math.ceil(LO / s); k * s <= HI; k++)
              levels.push(k * s);
          return (
            <g key={r}>
              <line
                x1={X0}
                x2={X0 + PW}
                y1={yy}
                y2={yy}
                stroke="var(--border)"
              />
              {levels.map((l) => (
                <line
                  key={l}
                  x1={x(l)}
                  x2={x(l)}
                  y1={yy - 6}
                  y2={yy + 6}
                  stroke="var(--text-muted)"
                  strokeWidth={0.8}
                />
              ))}
              {s <= 0.02 && (
                <text
                  x={X0 + PW}
                  y={yy - 9}
                  textAnchor="end"
                  className="viz-label"
                >
                  levels too dense to draw
                </text>
              )}
              {W8.slice(r * G, (r + 1) * G).map((v, i) => {
                const d = deq[r * G + i];
                return (
                  <g key={i}>
                    <line
                      x1={x(v)}
                      x2={x(d)}
                      y1={yy - 12}
                      y2={yy}
                      stroke="var(--danger)"
                      strokeWidth={1}
                    />
                    <circle
                      cx={x(v)}
                      cy={yy - 12}
                      r={3}
                      style={{ fill: "var(--accent)" }}
                    />
                  </g>
                );
              })}
            </g>
          );
        })}
        {[0, 1, 2].map((v) => (
          <text
            key={v}
            x={x(v)}
            y={Y0 + ROWS * RH + 10}
            textAnchor="middle"
            className="viz-label"
          >
            {v}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        mean squared error {mse.toExponential(1)}; {zeros} of {W8.length}{" "}
        non-zero weights round to 0
      </div>
      <figcaption className="viz-caption">
        Twenty-four weights in three groups of eight (rows), one of them an
        outlier near 2.4. Ticks are the representable levels; each weight (dot)
        is moved to the nearest level (red line). With one scale for the whole
        tensor the outlier sets a coarse grid for everyone; with a scale per
        group only its own group pays.
      </figcaption>
    </figure>
  );
}
