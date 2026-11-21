"use client";

import { useState } from "react";

const BUDGET = 1e20;
const loss = (N: number, D: number) =>
  1.69 + 406.4 / N ** 0.34 + 410.7 / D ** 0.28;

export function BudgetFrontierViz() {
  const [served, setServed] = useState(0);
  const S = served * 1e9;
  const pts: { N: number; L: number }[] = [];
  for (let e = 7.5; e <= 9.5001; e += 0.02) {
    const N = 10 ** e;
    const D = (BUDGET - 2 * N * S) / (6 * N);
    if (D > 1e8) pts.push({ N, L: loss(N, D) });
  }
  const best = pts.reduce((a, b) => (b.L < a.L ? b : a));
  const W = 340,
    H = 200,
    x0 = 44,
    x1 = W - 10,
    y0 = 10,
    y1 = H - 30;
  const lo = 2.4,
    hi = 3.4;
  const X = (N: number) => x0 + ((Math.log10(N) - 7.5) / 2) * (x1 - x0);
  const Y = (L: number) =>
    y0 + ((hi - Math.min(hi, L)) / (hi - lo)) * (y1 - y0);
  const d = pts
    .map((p, i) => `${i ? "L" : "M"}${X(p.N).toFixed(1)},${Y(p.L).toFixed(1)}`)
    .join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <label className="viz-label">
          tokens served over the model&apos;s life: {served} billion{" "}
          <input
            type="range"
            min={0}
            max={2000}
            step={50}
            value={served}
            onChange={(e) => setServed(+e.target.value)}
          />
        </label>
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
        aria-label="Predicted loss against model size for a fixed lifetime compute budget"
      >
        {[2.6, 2.8, 3.0, 3.2].map((v) => (
          <g key={v}>
            <line
              x1={x0}
              x2={x1}
              y1={Y(v)}
              y2={Y(v)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 6}
              y={Y(v) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {[
          [3e7, "30M"],
          [1e8, "100M"],
          [3e8, "300M"],
          [1e9, "1B"],
          [3e9, "3B"],
        ].map(([n, l]) => (
          <text
            key={l as string}
            x={X(n as number)}
            y={y1 + 16}
            textAnchor="middle"
            className="viz-label"
          >
            {l}
          </text>
        ))}
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <circle cx={X(best.N)} cy={Y(best.L)} r={5} fill="var(--success)" />
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        best size about {(best.N / 1e6).toFixed(0)}M parameters, predicted loss{" "}
        {best.L.toFixed(3)}
      </p>
      <figcaption className="viz-caption">
        A lifetime budget of 10²⁰ FLOPs pays for training (6ND) and for serving
        (2N per token served). Whatever serving does not use buys training
        tokens, and the Chinchilla fit predicts the loss. With no serving the
        best model is the compute-optimal one; as the expected traffic grows,
        the best model shrinks and is trained on more tokens per parameter.
      </figcaption>
    </figure>
  );
}
