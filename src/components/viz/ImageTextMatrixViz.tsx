"use client";

import { useState } from "react";

const N = 5;

/** Unit vectors in the plane: image i at angle 2 pi i / 5, its caption rotated by delta degrees. */
export function embeddings(delta: number) {
  const img = Array.from({ length: N }, (_, i) => (2 * Math.PI * i) / N);
  const txt = img.map((a) => a + (delta * Math.PI) / 180);
  return { img, txt };
}

/** CLIP's symmetric cross-entropy and SigLIP's pairwise sigmoid loss for cosine similarities sims. */
export function losses(sims: number[][], temp: number, t: number, b: number) {
  const lse = (v: number[]) => {
    const m = Math.max(...v);
    return m + Math.log(v.reduce((s, x) => s + Math.exp(x - m), 0));
  };
  let rows = 0,
    cols = 0,
    sig = 0;
  for (let i = 0; i < N; i++) {
    rows += lse(sims[i].map((s) => s / temp)) - sims[i][i] / temp;
    cols += lse(sims.map((r) => r[i] / temp)) - sims[i][i] / temp;
    for (let j = 0; j < N; j++) {
      const z = i === j ? 1 : -1,
        u = z * (t * sims[i][j] + b);
      sig += u > 0 ? Math.log1p(Math.exp(-u)) : -u + Math.log1p(Math.exp(u));
    }
  }
  return { clip: (rows + cols) / (2 * N), siglip: sig / N };
}

const TEMPS = [0.01, 0.07, 0.3, 1];

export function ImageTextMatrixViz() {
  const [delta, setDelta] = useState(20);
  const [ti, setTi] = useState(1);
  const temp = TEMPS[ti];
  const { img, txt } = embeddings(delta);
  const sims = img.map((a) => txt.map((b) => Math.cos(a - b)));
  const probs = sims.map((r) => {
    const e = r.map((s) => Math.exp((s - Math.max(...r)) / temp)),
      z = e.reduce((a, b) => a + b, 0);
    return e.map((x) => x / z);
  });
  const { clip, siglip } = losses(sims, temp, 10, -10);
  const C = 30,
    X0 = 70,
    Y0 = 26,
    W = 330,
    H = Y0 + N * C + 12;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <label
          className="viz-label"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          caption offset {delta}°
          <input
            type="range"
            min={0}
            max={72}
            step={2}
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
            aria-label="Caption offset in degrees"
          />
        </label>
        <span className="viz-label">temperature</span>
        <div className="segmented" role="group" aria-label="Temperature">
          {TEMPS.map((v, i) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={ti === i}
              onClick={() => setTi(i)}
            >
              {v}
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
        aria-label="Image-caption similarity probabilities"
      >
        <text
          x={X0 + (N * C) / 2}
          y={14}
          textAnchor="middle"
          className="viz-label"
        >
          captions
        </text>
        <text
          x={X0 - 40}
          y={Y0 + (N * C) / 2}
          textAnchor="middle"
          className="viz-label"
          transform={`rotate(-90 ${X0 - 40} ${Y0 + (N * C) / 2})`}
        >
          images
        </text>
        {probs.map((r, i) =>
          r.map((p, j) => (
            <g key={`${i}-${j}`}>
              <rect
                x={X0 + j * C}
                y={Y0 + i * C}
                width={C - 2}
                height={C - 2}
                fill={i === j ? "var(--success)" : "var(--accent)"}
                fillOpacity={0.08 + 0.9 * p}
                stroke="var(--border)"
              />
              <text
                x={X0 + j * C + C / 2 - 1}
                y={Y0 + i * C + C / 2 + 3}
                textAnchor="middle"
                className="viz-label"
                style={{ fontSize: 9, fill: p > 0.55 ? "var(--bg)" : "var(--text)" }}
              >
                {p.toFixed(2)}
              </text>
            </g>
          )),
        )}
        {Array.from({ length: N }, (_, i) => (
          <text
            key={i}
            x={X0 - 6}
            y={Y0 + i * C + C / 2 + 3}
            textAnchor="end"
            className="viz-label"
          >
            {i + 1}
          </text>
        ))}
        <g transform={`translate(${X0 + N * C + 50}, ${Y0 + (N * C) / 2})`}>
          <circle r={48} fill="none" stroke="var(--border)" />
          {img.map((a, i) => (
            <line
              key={`i${i}`}
              x2={48 * Math.cos(a)}
              y2={-48 * Math.sin(a)}
              stroke="var(--success)"
              strokeWidth={2}
            />
          ))}
          {txt.map((a, i) => (
            <line
              key={`t${i}`}
              x2={40 * Math.cos(a)}
              y2={-40 * Math.sin(a)}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="3 2"
            />
          ))}
        </g>
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
          contrastive (softmax) loss: <strong>{clip.toFixed(3)}</strong>
        </span>
        <span>
          sigmoid loss (t = 10, b = −10): <strong>{siglip.toFixed(3)}</strong>
        </span>
      </div>
      <figcaption className="viz-caption">
        Five images (solid) and their captions (dashed) as unit vectors. Each
        row shows the softmax over captions of similarity divided by
        temperature, the distribution the contrastive loss pushes towards the
        diagonal. Rotating the captions away from their images raises both
        losses; a lower temperature makes the rows sharper, so small differences
        in similarity matter more.
      </figcaption>
    </figure>
  );
}
