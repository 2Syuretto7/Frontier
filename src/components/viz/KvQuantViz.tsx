"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const T = 12,
  C = 8;
const OUT = [2, 6]; // key channels with large magnitudes
const r0 = rand(1414);
const K: number[][] = Array.from({ length: T }, () =>
  Array.from(
    { length: C },
    (_, c) => (r0() - 0.5) * (OUT.includes(c) ? 16 : 1),
  ),
);

/** Quantise-dequantise K at the given bits with a scale per token (row) or per channel (column). */
export function quantK(bits: number, perChannel: boolean) {
  const qmax = 2 ** (bits - 1) - 1;
  const scale = (t: number, c: number) =>
    perChannel
      ? Math.max(...K.map((r) => Math.abs(r[c]))) / qmax
      : Math.max(...K[t].map(Math.abs)) / qmax;
  return K.map((r, t) =>
    r.map((v, c) => Math.round(v / scale(t, c)) * scale(t, c)),
  );
}

export function KvQuantViz() {
  const [perChannel, setPerChannel] = useState(false);
  const [bits, setBits] = useState(3);
  const Q = quantK(bits, perChannel);
  const err = K.map((r, t) => r.map((v, c) => Math.abs(v - Q[t][c])));
  const ordinary = K.flatMap((r, t) =>
    r.map((v, c) => ({ v, e: err[t][c], c })),
  ).filter((o) => !OUT.includes(o.c));
  const relOrd = Math.sqrt(
    ordinary.reduce((a, o) => a + o.e * o.e, 0) /
      ordinary.reduce((a, o) => a + o.v * o.v, 0),
  );
  const zeroed = ordinary.filter(
    (o) => o.v !== 0 && Math.abs(o.v) - o.e < 1e-12 && o.e > 0,
  ).length;
  const S = 20,
    X0 = 60,
    Y0 = 18,
    W = 330;
  const chanMax = Array.from({ length: C }, (_, c) =>
    Math.max(...K.map((r) => Math.abs(r[c]))),
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div
          className="segmented"
          role="group"
          aria-label="Key scale granularity"
        >
          {[false, true].map((p) => (
            <button
              key={String(p)}
              type="button"
              className="seg"
              aria-pressed={perChannel === p}
              onClick={() => setPerChannel(p)}
            >
              {p ? "per channel" : "per token"}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Bits">
          {[2, 3, 4].map((b) => (
            <button
              key={b}
              type="button"
              className="seg"
              aria-pressed={bits === b}
              onClick={() => setBits(b)}
            >{`${b}-bit`}</button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + T * S + 4}`}
        style={{
          width: "100%",
          maxWidth: 400,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Quantisation error of a key cache by token and channel"
      >
        {Array.from({ length: C }, (_, c) => (
          <text
            key={c}
            x={X0 + c * S + S / 2}
            y={12}
            textAnchor="middle"
            className="viz-label"
            style={{ fill: OUT.includes(c) ? "var(--danger)" : undefined }}
          >
            {c}
          </text>
        ))}
        <text x={X0 - 8} y={12} textAnchor="end" className="viz-label">
          channel
        </text>
        {err.map((r, t) => (
          <g key={t}>
            <text
              x={X0 - 8}
              y={Y0 + t * S + S / 2 + 4}
              textAnchor="end"
              className="viz-label"
            >{`token ${t + 1}`}</text>
            {r.map((e, c) => (
              <rect
                key={c}
                x={X0 + c * S + 1}
                y={Y0 + t * S + 1}
                width={S - 2}
                height={S - 2}
                rx={2}
                style={{ fill: "var(--accent)" }}
                opacity={0.08 + 0.92 * Math.min((2 * e) / chanMax[c], 1)}
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
        error on ordinary channels {(100 * relOrd).toFixed(0)}% of their size;{" "}
        {zeroed} of {ordinary.length} ordinary entries rounded to 0
      </div>
      <figcaption className="viz-caption">
        Rounding error relative to each channel&apos;s size (darker is larger)
        in a key cache of twelve tokens and eight channels, where channels 2 and
        6 hold large values in every token, as is typical of keys. With a scale
        per token, those channels set every row&apos;s step and the ordinary
        channels are wiped out; with a scale per channel, each channel gets a
        step that suits it.
      </figcaption>
    </figure>
  );
}
