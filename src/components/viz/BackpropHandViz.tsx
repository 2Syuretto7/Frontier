"use client";

import { useState } from "react";

const x = [1, 2], y = 1;
const W1 = [[0.5, -0.3], [0.2, 0.4]], b1 = [0, 0.1], W2 = [0.7, -0.5], b2 = 0.2;
const z = [0, 1].map((j) => x[0] * W1[0][j] + x[1] * W1[1][j] + b1[j]);
const h = z.map(Math.tanh);
const yhat = h[0] * W2[0] + h[1] * W2[1] + b2;
const L = 0.5 * (yhat - y) ** 2;
const dOut = yhat - y;
const dH = [0, 1].map((j) => dOut * W2[j] * (1 - h[j] ** 2));
const f = (v: number) => v.toFixed(4);

const STEPS = [
  { title: "inputs", text: `x = (1, 2), target y = 1.` },
  { title: "hidden pre-activations", text: `z_j = Σ_i x_i W1[i][j] + b1[j]: z = (${f(z[0])}, ${f(z[1])}).` },
  { title: "hidden activations", text: `h = tanh(z) = (${f(h[0])}, ${f(h[1])}).` },
  { title: "output and loss", text: `ŷ = h·W2 + b2 = ${f(yhat)}, L = ½(ŷ − y)² = ${f(L)}.` },
  { title: "output delta", text: `δ_out = ∂L/∂ŷ = ŷ − y = ${f(dOut)}. Output gradients: ∂L/∂W2 = δ_out·h = (${f(dOut * h[0])}, ${f(dOut * h[1])}), ∂L/∂b2 = ${f(dOut)}.` },
  { title: "hidden deltas", text: `δ_j = δ_out · W2[j] · (1 − h_j²) = (${f(dH[0])}, ${f(dH[1])}). The first hidden unit should go down, the second up.` },
  { title: "first-layer gradients", text: `∂L/∂W1[i][j] = x_i·δ_j: row x1 (${f(dH[0])}, ${f(dH[1])}), row x2 (${f(2 * dH[0])}, ${f(2 * dH[1])}); ∂L/∂b1 = δ.` },
];

/** One forward and backward pass through a 2-2-1 tanh network, one number at a time. */
export function BackpropHandViz() {
  const [k, setK] = useState(0);
  const back = k >= 4;
  const node = (cx: number, cy: number, label: string, val: string | null, hot: boolean) => (
    <g>
      <circle cx={cx} cy={cy} r={19} fill={hot ? "var(--accent-soft)" : "var(--bg)"} stroke={hot ? "var(--accent)" : "var(--text-muted)"} />
      <text x={cx} y={cy - 2} textAnchor="middle" className="viz-label">{label}</text>
      {val !== null && <text x={cx} y={cy + 11} textAnchor="middle" className="viz-label">{val}</text>}
    </g>
  );
  const P = { x1: [40, 45], x2: [40, 125], h1: [160, 45], h2: [160, 125], o: [280, 85] } as Record<string, [number, number]>;
  const edges: [string, string, string][] = [["x1", "h1", "0.5"], ["x1", "h2", "−0.3"], ["x2", "h1", "0.2"], ["x2", "h2", "0.4"], ["h1", "o", "0.7"], ["h2", "o", "−0.5"]];
  return (
    <figure className="viz">
      <svg viewBox="0 0 320 170" style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A 2-2-1 network with values and deltas">
        {edges.map(([a, b, w]) => (
          <g key={a + b}>
            <line x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]} stroke={back ? "var(--danger)" : "var(--border)"} strokeOpacity={back ? 0.5 : 1} />
            <text x={(P[a][0] * 0.4 + P[b][0] * 0.6)} y={(P[a][1] * 0.4 + P[b][1] * 0.6) - 4} className="viz-label" textAnchor="middle">{w}</text>
          </g>
        ))}
        {node(P.x1[0], P.x1[1], "x1", "1", k === 0)}
        {node(P.x2[0], P.x2[1], "x2", "2", k === 0)}
        {node(P.h1[0], P.h1[1], "h1", k >= 6 || k === 5 ? `δ ${dH[0].toFixed(2)}` : k >= 2 ? h[0].toFixed(3) : k >= 1 ? `z ${z[0].toFixed(2)}` : null, k === 1 || k === 2 || k === 5 || k === 6)}
        {node(P.h2[0], P.h2[1], "h2", k >= 5 ? `δ ${dH[1].toFixed(2)}` : k >= 2 ? h[1].toFixed(3) : k >= 1 ? `z ${z[1].toFixed(2)}` : null, k === 1 || k === 2 || k === 5 || k === 6)}
        {node(P.o[0], P.o[1], "ŷ", k >= 4 ? `δ ${dOut.toFixed(2)}` : k >= 3 ? yhat.toFixed(3) : null, k === 3 || k === 4)}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setK(Math.max(0, k - 1))} disabled={k === 0}>Back</button>
        <button type="button" className="btn" onClick={() => setK(Math.min(STEPS.length - 1, k + 1))} disabled={k === STEPS.length - 1}>Next</button>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        step {k + 1} of {STEPS.length}: {STEPS[k].title}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {STEPS[k].text} {back ? "The backward pass reuses the forward values: h for the weight gradients, and 1 − h² for tanh's derivative." : ""}
      </figcaption>
    </figure>
  );
}
