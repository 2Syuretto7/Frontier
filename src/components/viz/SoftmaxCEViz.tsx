"use client";

import { useState } from "react";

const CLASSES = ["cat", "dog", "fox"];
const W = 300, ROW = 30, LEFT = 46, MID = (LEFT + W - 10) / 2 + 20;

/** Softmax probabilities, cross-entropy, and its gradient p − y with respect to the logits. */
export function SoftmaxCEViz() {
  const [z, setZ] = useState([2, 1, -1]);
  const [y, setY] = useState(1);
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  const p = e.map((v) => v / s);
  const loss = -Math.log(p[y]);
  const g = p.map((v, i) => v - (i === y ? 1 : 0));
  const half = (W - 10 - MID) * 0.95;
  return (
    <figure className="viz">
      {z.map((v, i) => (
        <label key={i} className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: i ? 2 : 0 }}>
          <span className="mono" style={{ minWidth: 92 }}>z_{CLASSES[i]} = {v.toFixed(1)}</span>
          <input type="range" min={-4} max={4} step={0.1} value={v} onChange={(ev) => setZ(z.map((w, k) => (k === i ? Number(ev.target.value) : w)))} style={{ flex: 1, minWidth: 0 }} />
        </label>
      ))}
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <span className="viz-label">true class</span>
        {CLASSES.map((c, i) => (
          <button key={c} type="button" className="seg" aria-pressed={y === i} onClick={() => setY(i)}>{c}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${CLASSES.length * ROW + 24}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "6px auto" }} role="img" aria-label="Probabilities and gradient for each class">
        <text x={LEFT} y={12} className="viz-label">probability p</text>
        <text x={MID} y={12} className="viz-label">gradient p − y</text>
        <line x1={MID + half / 2} y1={16} x2={MID + half / 2} y2={CLASSES.length * ROW + 20} stroke="var(--border)" />
        {CLASSES.map((c, i) => {
          const yy = 20 + i * ROW;
          const gw = (Math.abs(g[i]) * half) / 2;
          return (
            <g key={c}>
              <text x={LEFT - 6} y={yy + 15} textAnchor="end" className="viz-label" style={{ fontWeight: i === y ? 700 : 400 }}>{c}</text>
              <rect x={LEFT} y={yy + 4} width={Math.max(1, p[i] * (MID - LEFT - 14))} height={ROW - 10} rx={3} fill={i === y ? "var(--accent)" : "var(--text-faint)"} />
              <rect x={g[i] < 0 ? MID + half / 2 - gw : MID + half / 2} y={yy + 4} width={Math.max(1, gw)} height={ROW - 10} rx={3} fill={g[i] < 0 ? "var(--accent)" : "var(--danger)"} />
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, textAlign: "center", overflowWrap: "anywhere" }}>
        p = [{p.map((v) => v.toFixed(3)).join(", ")}], loss = −log p_{CLASSES[y]} = {loss.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Gradient descent subtracts the gradient, so it raises the true class&rsquo;s logit (negative bar) and lowers the others
        in proportion to their probability (positive bars). The gradient entries always sum to zero.{" "}
        {p[y] > 0.95 ? "The model is confident and right, so the gradient is nearly zero: little left to learn." : p[y] < 0.1 ? "The model is confidently wrong: the loss is large and so is the push." : ""}
      </figcaption>
    </figure>
  );
}
