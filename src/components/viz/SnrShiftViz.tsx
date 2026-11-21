"use client";

import { useState } from "react";

/** log SNR of the straight path x_t = (1 - t) x_0 + t eps for data of unit variance, seen through averages of m pixels. */
export function logSnr(t: number, m: number) {
  return 2 * Math.log((1 - t) / t) + Math.log(m);
}

/** Resolution shift of the time variable: t' = k t / (1 + (k - 1) t). */
export function shiftTime(t: number, k: number) {
  return (k * t) / (1 + (k - 1) * t);
}

const MS = [1, 16, 256];
const COLS = ["var(--text-muted)", "var(--accent)", "var(--danger)"];

export function SnrShiftViz() {
  const [shift, setShift] = useState(false);
  const W = 330,
    H = 210,
    X0 = 34,
    PW = 286,
    Y0 = 8,
    PH = 170,
    YM = 12;
  const sx = (t: number) => X0 + t * PW,
    sy = (y: number) =>
      Y0 + PH / 2 - (Math.max(-YM, Math.min(YM, y)) / YM) * (PH / 2);
  const ts = Array.from({ length: 199 }, (_, i) => (i + 1) / 200);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <div className="segmented" role="group" aria-label="Schedule shift">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              type="button"
              className="seg"
              aria-pressed={shift === v}
              onClick={() => setShift(v)}
            >
              {v ? "shifted by k = √m" : "same schedule"}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 440,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Log signal-to-noise ratio against time"
      >
        <rect
          x={X0}
          y={Y0}
          width={PW}
          height={PH}
          fill="none"
          stroke="var(--border)"
        />
        {[-10, -5, 0, 5, 10].map((y) => (
          <g key={y}>
            <line
              x1={X0}
              x2={X0 + PW}
              y1={sy(y)}
              y2={sy(y)}
              stroke={y === 0 ? "var(--border-strong)" : "var(--grid-line)"}
            />
            <text
              x={X0 - 4}
              y={sy(y) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {y}
            </text>
          </g>
        ))}
        {MS.map((m, k) => (
          <path
            key={m}
            d={ts
              .map(
                (t, i) =>
                  `${i ? "L" : "M"}${sx(t).toFixed(1)},${sy(logSnr(shift ? shiftTime(t, Math.sqrt(m)) : t, m)).toFixed(1)}`,
              )
              .join(" ")}
            fill="none"
            stroke={COLS[k]}
            strokeWidth={2}
            strokeDasharray={k === 0 ? undefined : k === 1 ? "6 3" : "2 3"}
          />
        ))}
        {[0, 0.5, 1].map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={H - 16}
            textAnchor="middle"
            className="viz-label"
          >
            {t}
          </text>
        ))}
        <text
          x={X0 + PW / 2}
          y={H - 2}
          textAnchor="middle"
          className="viz-label"
        >
          t (0 = data, 1 = noise)
        </text>
      </svg>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 14px",
          justifyContent: "center",
          fontSize: 13,
        }}
      >
        {MS.map((m, k) => (
          <span key={m}>
            <span style={{ color: COLS[k] }}>●</span> averages of m = {m} pixels
          </span>
        ))}
      </div>
      <figcaption className="viz-caption">
        Log signal-to-noise ratio of the straight path, seen at the scale of
        single pixels and of averages over m = 16 and 256 neighbouring pixels,
        as a model of the coarse structure at higher resolution. Averaging m
        pixels with independent noise and nearly equal signal raises the ratio
        by a factor m, so with the same schedule a large image keeps its coarse
        structure until late. Shifting the time by k = √m moves every curve back
        onto the single-pixel one.
      </figcaption>
    </figure>
  );
}
