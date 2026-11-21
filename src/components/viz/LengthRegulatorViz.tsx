"use client";

import { useState } from "react";

const PH: [string, number][] = [
  ["h", 6],
  ["ə", 5],
  ["l", 7],
  ["oʊ", 14],
  ["w", 6],
  ["ɜː", 15],
  ["l", 6],
  ["d", 9],
];

/** Durations in frames after dividing by the speaking rate, at least one frame each. */
export function scaleDurations(d: number[], rate: number) {
  return d.map((v) => Math.max(1, Math.round(v / rate)));
}

export function LengthRegulatorViz() {
  const [rate, setRate] = useState(1);
  const durs = scaleDurations(
    PH.map(([, d]) => d),
    rate,
  );
  const total = durs.reduce((a, b) => a + b, 0);
  const W = 330,
    x0 = 10,
    pw = W - 20,
    fw = pw / 95,
    H = 96;
  let acc = 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">speaking rate</span>
        <div className="segmented" role="group" aria-label="Speaking rate">
          {[0.75, 1, 1.5].map((v) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={rate === v}
              onClick={() => setRate(v)}
            >
              {v}×
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Phonemes expanded to frames"
      >
        {PH.map(([p], i) => (
          <g key={i}>
            <rect
              x={x0 + i * 38}
              y={4}
              width={34}
              height={22}
              fill={i % 2 ? "var(--success)" : "var(--accent)"}
              fillOpacity={0.2}
              stroke={i % 2 ? "var(--success)" : "var(--accent)"}
            />
            <text
              x={x0 + i * 38 + 17}
              y={19}
              textAnchor="middle"
              style={{ fontSize: 11, fill: "var(--text)" }}
            >
              {p}
            </text>
          </g>
        ))}
        {durs.map((d, i) => {
          const x = x0 + acc * fw;
          acc += d;
          return (
            <g key={i}>
              <line
                x1={x0 + i * 38 + 17}
                y1={26}
                x2={x + (d * fw) / 2}
                y2={54}
                stroke="var(--border-strong)"
              />
              <rect
                x={x}
                y={56}
                width={d * fw}
                height={20}
                fill={i % 2 ? "var(--success)" : "var(--accent)"}
                fillOpacity={0.6}
              />
              <text
                x={x + (d * fw) / 2}
                y={90}
                textAnchor="middle"
                className="viz-label"
                style={{ fontSize: 9 }}
              >
                {d}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ textAlign: "center", fontSize: 13 }}>
        frames: <strong>{total}</strong>, duration at 10 ms per frame:{" "}
        <strong>{(total / 100).toFixed(2)} s</strong>
      </div>
      <figcaption className="viz-caption">
        A non-autoregressive synthesiser predicts how many frames each phoneme
        of &quot;hello world&quot; lasts, then copies each phoneme&apos;s hidden
        vector that many times to get a sequence as long as the speech. Dividing
        the durations by a rate speeds up or slows down the speech without
        retraining; each phoneme keeps at least one frame.
      </figcaption>
    </figure>
  );
}
