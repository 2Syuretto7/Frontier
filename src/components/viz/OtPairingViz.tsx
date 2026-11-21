"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// 48 noise samples from N(0, 1) and 48 data samples from an equal mixture of N(-2, 0.3^2) and N(2, 0.3^2)
const N = 48;
const r = rand(20);
const gauss = () => {
  const u = Math.max(r(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
};
const X0 = Array.from({ length: N }, () => gauss());
const X1 = Array.from(
  { length: N },
  (_, i) => (i % 2 ? 2 : -2) + 0.3 * gauss(),
);
const SIZES = [1, 4, 12, 48];

/** Pair X0[i] with X1[i] after sort-matching inside consecutive batches of size k (k = 1 is the independent coupling). */
export function pairing(k: number) {
  const y = X1.slice();
  for (let s = 0; s < N; s += k) {
    const idx = Array.from({ length: Math.min(k, N - s) }, (_, j) => s + j);
    const a = idx.slice().sort((i, j) => X0[i] - X0[j]);
    const b = idx.map((i) => X1[i]).sort((p, q) => p - q);
    a.forEach((i, j) => (y[i] = b[j]));
  }
  let cross = 0;
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++)
      if ((X0[i] - X0[j]) * (y[i] - y[j]) < 0) cross++;
  const cost = y.reduce((s, v, i) => s + (v - X0[i]) ** 2, 0) / N;
  return { y, cross, cost };
}

export function OtPairingViz() {
  const [k, setK] = useState(0);
  const { y, cross, cost } = pairing(SIZES[k]);
  const W = 340,
    H = 220,
    XL = 40,
    XR = W - 40,
    YT = 12,
    YB = H - 22;
  const sy = (v: number) => YT + ((3.2 - v) / 6.4) * (YB - YT);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Pairing">
          {SIZES.map((s, j) => (
            <button
              key={s}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              {s === 1 ? "independent" : s === N ? `full OT` : `batch ${s}`}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Straight lines joining noise samples at time 0 to data samples at time 1 under the chosen pairing"
      >
        <line x1={XL} y1={YT} x2={XL} y2={YB} stroke="var(--border)" />
        <line x1={XR} y1={YT} x2={XR} y2={YB} stroke="var(--border)" />
        {X0.map((x, i) => (
          <line
            key={i}
            x1={XL}
            y1={sy(x)}
            x2={XR}
            y2={sy(y[i])}
            stroke="var(--accent)"
            strokeOpacity={0.45}
            strokeWidth={1}
          />
        ))}
        {X0.map((x, i) => (
          <circle key={`a${i}`} cx={XL} cy={sy(x)} r={2} fill="var(--text)" />
        ))}
        {y.map((v, i) => (
          <circle key={`b${i}`} cx={XR} cy={sy(v)} r={2} fill="var(--danger)" />
        ))}
        {[-2, 0, 2].map((v) => (
          <text
            key={v}
            x={XL - 6}
            y={sy(v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {v}
          </text>
        ))}
        <text x={XL} y={H - 6} textAnchor="middle" className="viz-label">
          t = 0
        </text>
        <text x={XR} y={H - 6} textAnchor="middle" className="viz-label">
          t = 1
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        crossing pairs {cross}, mean squared length {cost.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        Left: 48 noise samples. Right: 48 data samples in two clusters. Each
        line is one conditional path of flow matching. With independent pairing
        the lines cross hundreds of times, so many different velocities pass
        through the same point and the learned field must average them. Solving
        a small transport problem inside each batch removes more crossings and
        shortens the lines the larger the batch is; with the whole set as one
        batch the pairing is the sorted (optimal) one and no two lines cross.
      </figcaption>
    </figure>
  );
}
