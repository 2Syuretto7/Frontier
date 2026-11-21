"use client";

import { useState } from "react";

// a length-32 signal, an edge detector k = (1, -1), stride s; compare layer(shift_t x) with the output of x shifted by t/s
const N = 32;
const X = Array.from(
  { length: N },
  (_, i) => (i >= 6 && i <= 13 ? 1 : 0) + (i >= 20 && i <= 22 ? 0.6 : 0),
);
const K = [1, -1];
const STRIDES = [1, 2, 4];
const SHIFTS = [0, 1, 2, 3, 4];

const roll = (x: number[], t: number) =>
  x.map((_, i) => x[(((i - t) % x.length) + x.length) % x.length]);

/** Circular convolution with K, then keep every s-th sample; optionally blur over s samples first. */
export function layer(x: number[], s: number, blur: boolean) {
  const full = x.map((_, i) =>
    K.reduce((a, w, j) => a + w * x[(i - j + N) % N], 0),
  );
  const sm = blur
    ? full.map((_, i) => {
        let a = 0;
        for (let j = 0; j < s; j++) a += Math.abs(full[(i - j + N) % N]);
        return a / s;
      })
    : full.map(Math.abs);
  return sm.filter((_, i) => i % s === 0);
}

export function StrideAliasViz() {
  const [si, setSi] = useState(1);
  const [t, setT] = useState(1);
  const [blur, setBlur] = useState(false);
  const s = STRIDES[si];
  const out = layer(roll(X, t), s, blur);
  const ref = roll(layer(X, s, blur), Math.floor(t / s));
  const gap = Math.max(...out.map((v, i) => Math.abs(v - ref[i])));
  const W = 340,
    x0 = 20,
    w = (W - 40) / N;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Stride">
          {STRIDES.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={si === j}
              onClick={() => setSi(j)}
            >
              stride {v}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Input shift">
          {SHIFTS.map((v) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={t === v}
              onClick={() => setT(v)}
            >
              shift {v}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn"
          aria-pressed={blur}
          onClick={() => setBlur(!blur)}
        >
          {blur
            ? "blur before subsampling: on"
            : "blur before subsampling: off"}
        </button>
      </div>
      <svg
        viewBox={`0 0 ${W} 170`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A shifted input signal, the subsampled edge response, and the response one would expect from shifting the output"
      >
        <text x={x0} y={14} className="viz-label">
          shifted input
        </text>
        {roll(X, t).map((v, i) => (
          <rect
            key={i}
            x={x0 + i * w}
            y={60 - v * 36}
            width={w - 1}
            height={v * 36}
            fill="var(--text-muted)"
          />
        ))}
        <line x1={x0} y1={60} x2={W - 20} y2={60} stroke="var(--border)" />
        <text x={x0} y={84} className="viz-label">
          layer output (bars) and shifted original output (outline)
        </text>
        {out.map((v, i) => (
          <g key={i}>
            <rect
              x={x0 + i * s * w}
              y={150 - v * 46}
              width={s * w - 2}
              height={v * 46}
              fill="var(--accent)"
              fillOpacity={0.75}
            />
            <rect
              x={x0 + i * s * w}
              y={150 - ref[i] * 46}
              width={s * w - 2}
              height={ref[i] * 46}
              fill="none"
              stroke="var(--danger)"
              strokeWidth={1.2}
            />
          </g>
        ))}
        <line x1={x0} y1={150} x2={W - 20} y2={150} stroke="var(--border)" />
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        largest mismatch {gap.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        The layer detects edges with the kernel (1, −1), takes absolute values
        and keeps every s-th output. With stride 1 a shifted input gives a
        shifted output. With stride s the layer commutes only with shifts by
        multiples of s: for other shifts the edges fall between the kept samples
        and the output changes, not just moves. Blurring over s samples before
        subsampling shrinks the mismatch without removing it.
      </figcaption>
    </figure>
  );
}
