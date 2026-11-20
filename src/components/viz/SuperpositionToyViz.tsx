"use client";

import { useState } from "react";

/*
 * Results of real training runs, recorded offline: five features, each zero with probability S and otherwise uniform on [0, 1], with
 * importances 0.9 to the power i, are compressed into two dimensions by h = Wx and reconstructed as ReLU(W^T h + b). Each model is
 * trained with Adam (learning rate 0.001, batch 1,024, 8,000 steps) to minimise importance-weighted squared error.
 */
export const TOY: Record<string, { W: number[][]; b: number[]; loss: number }> = {"0.0":{"W":[[0.979,-0.207,-0.013,-0.001,0.004],[0.209,0.977,0.022,0.004,0.003]],"b":[0.001,-0.014,0.488,0.501,0.498],"loss":0.18363},"0.7":{"W":[[0.877,-0.525,-0.006,0.517,-0.847],[0.533,0.875,-0.001,-0.853,-0.509]],"b":[0.014,0.017,0.149,0.021,0.021],"loss":0.11301},"0.9":{"W":[[0.502,-0.82,1.087,0.152,-0.938],[0.993,0.746,-0.2,-1.076,-0.52]],"b":[-0.201,-0.208,-0.205,-0.214,-0.204],"loss":0.0225},"0.97":{"W":[[0.508,-0.841,1.131,0.187,-0.999],[1.031,0.779,-0.18,-1.129,-0.551]],"b":[-0.244,-0.26,-0.26,-0.272,-0.264],"loss":0.00345},"0.99":{"W":[[0.505,-0.853,1.15,0.201,-1.007],[1.043,0.788,-0.175,-1.145,-0.565]],"b":[-0.262,-0.271,-0.27,-0.29,-0.275],"loss":0.00072}};

const SPARSITIES = ["0.0", "0.7", "0.9", "0.97", "0.99"];

export function SuperpositionToyViz() {
  const [k, setK] = useState(2);
  const { W, b, loss } = TOY[SPARSITIES[k]];
  const n = W[0].length;
  const norms = Array.from({ length: n }, (_, i) => Math.hypot(W[0][i], W[1][i]));
  const fro = norms.reduce((s, v) => s + v * v, 0);
  const VW = 330, VH = 220, CX = 104, CY = 110, R = 76;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Probability that a feature is zero">
          {SPARSITIES.map((s, i) => <button key={s} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>S = {Number(s)}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Directions of five features in a two-dimensional hidden space">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeDasharray="2 3" />
        <line x1={CX - R - 10} x2={CX + R + 10} y1={CY} y2={CY} stroke="var(--border)" />
        <line x1={CX} x2={CX} y1={CY - R - 10} y2={CY + R + 10} stroke="var(--border)" />
        {norms.map((_, i) => {
          const x = CX + W[0][i] * R, y = CY - W[1][i] * R;
          const op = 1 - i * 0.15;
          return (
            <g key={i} opacity={op}>
              <line x1={CX} y1={CY} x2={x} y2={y} stroke="var(--accent)" strokeWidth={2.5} />
              <circle cx={x} cy={y} r={3.5} style={{ fill: "var(--accent)" }} />
              <text x={CX + W[0][i] * (R + 16) } y={CY - W[1][i] * (R + 16) + 4} textAnchor="middle" className="viz-label">{norms[i] > 0.1 ? i + 1 : ""}</text>
            </g>
          );
        })}
        {norms.map((v, i) => (
          <text key={i} x={214} y={34 + i * 18} className="viz-label">
            {i + 1}: {v.toFixed(2)}, {b[i] >= 0 ? "+" : "−"}{Math.abs(b[i]).toFixed(2)}
          </text>
        ))}
        <text x={214} y={18} className="viz-label">length, bias</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        features represented: {norms.filter((v) => v > 0.5).length} of {n}; dimensions per feature {(2 / fro).toFixed(2)}; loss {loss.toFixed(4)}
      </div>
      <figcaption className="viz-caption">
        Real toy models. Each arrow is a column of W, the direction a feature is written in; fainter arrows are less important features.
        When features are dense, the model keeps the two most important, orthogonal, and drops the rest. As features become sparse it
        first packs pairs of features in opposite directions, then all five into a pentagon, with negative biases so the ReLU removes
        the small interference when only one feature is active.
      </figcaption>
    </figure>
  );
}
