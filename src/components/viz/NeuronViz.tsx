"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const INPUTS: [number, number][] = [[0, 0], [0, 1], [1, 0], [1, 1]];
const TARGETS: Record<string, number[]> = {
  AND: [0, 0, 0, 1],
  OR: [0, 1, 1, 1],
  XOR: [0, 1, 1, 0],
};

/** One artificial neuron: a weighted sum of the inputs plus a bias, then a threshold. Which logic gates can it be? */
export function NeuronViz() {
  const [w1, setW1] = useState(1), [w2, setW2] = useState(1), [b, setB] = useState(-0.5);
  const [goal, setGoal] = useState<"AND" | "OR" | "XOR">("AND");
  const outs = INPUTS.map(([x1, x2]) => (w1 * x1 + w2 * x2 + b > 0 ? 1 : 0));
  const target = TARGETS[goal];
  const right = outs.filter((o, i) => o === target[i]).length;

  // A little picture of the input square with the neuron's dividing line w1 x1 + w2 x2 + b = 0.
  const S = 150, O = 30;
  const P = (x: number, y: number) => [O + x * S, O + (1 - y) * S];
  let line: number[] | null = null;
  if (Math.abs(w2) > 1e-9) {
    const y0 = (-b - w1 * -0.2) / w2, y1 = (-b - w1 * 1.2) / w2;
    line = [...P(-0.2, y0), ...P(1.2, y1)];
  } else if (Math.abs(w1) > 1e-9) {
    const x = -b / w1;
    line = [...P(x, -0.2), ...P(x, 1.2)];
  }

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {(["AND", "OR", "XOR"] as const).map((g) => (
          <button key={g} type="button" className={goal === g ? "btn btn-primary" : "btn"} aria-pressed={goal === g} onClick={() => setGoal(g)}>Make it {g}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
      <svg viewBox={`0 0 ${S + 2 * O} ${S + 2 * O}`} style={{ maxWidth: 260 }} role="img" aria-label={`Neuron gets ${right} of 4 right for ${goal}`}>
        <defs><clipPath id="neuron-clip"><rect x={O - 20} y={O - 20} width={S + 40} height={S + 40} /></clipPath></defs>
        <rect x={O} y={O} width={S} height={S} className="viz-frame" />
        {line && <line x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} className="plot-curve" clipPath="url(#neuron-clip)" />}
        {INPUTS.map(([x1, x2], i) => {
          const [cx, cy] = P(x1, x2);
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={9} className={target[i] ? "plot-point" : "viz-node"} style={{ strokeWidth: 2 }} />
              {outs[i] !== target[i] && <circle cx={cx} cy={cy} r={14} style={{ fill: "none", stroke: "var(--danger)", strokeWidth: 2 }} />}
            </g>
          );
        })}
        <text x={O} y={S + O + 22} className="plot-tick">x₁ = 0</text>
        <text x={O + S} y={S + O + 22} textAnchor="end" className="plot-tick">x₁ = 1</text>
      </svg>
      <table className="mono" style={{ fontSize: 13, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ color: "var(--text-faint)" }}><th style={{ padding: "2px 8px" }}>x₁</th><th style={{ padding: "2px 8px" }}>x₂</th><th style={{ padding: "2px 8px" }}>sum</th><th style={{ padding: "2px 8px" }}>out</th><th style={{ padding: "2px 8px" }}>want</th></tr>
        </thead>
        <tbody>
          {INPUTS.map(([x1, x2], i) => {
            const z = w1 * x1 + w2 * x2 + b;
            const ok = outs[i] === target[i];
            return (
              <tr key={i} style={{ color: ok ? "var(--text)" : "var(--danger)", textAlign: "center" }}>
                <td style={{ padding: "2px 8px" }}>{x1}</td><td style={{ padding: "2px 8px" }}>{x2}</td>
                <td style={{ padding: "2px 8px" }}>{fmtNum(Math.round(z * 100) / 100)}</td><td style={{ padding: "2px 8px" }}>{outs[i]}</td><td style={{ padding: "2px 8px" }}>{target[i]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <div className="viz-sliders">
        <label><span>Weight <span className="mono">w₁ = {fmtNum(w1)}</span></span><input type="range" min={-2} max={2} step={0.1} value={w1} onChange={(e) => setW1(Number(e.target.value))} /></label>
        <label><span>Weight <span className="mono">w₂ = {fmtNum(w2)}</span></span><input type="range" min={-2} max={2} step={0.1} value={w2} onChange={(e) => setW2(Number(e.target.value))} /></label>
        <label><span>Bias <span className="mono">b = {fmtNum(b)}</span></span><input type="range" min={-2} max={2} step={0.1} value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The neuron outputs 1 when <span className="mono">w₁x₁ + w₂x₂ + b &gt; 0</span>. Filled dots should output 1, hollow dots 0; a red ring marks a
        mistake. It gets <span className="mono">{right}</span> of 4 right for {goal}.{" "}
        {goal === "XOR" ? "However you move the line, it cannot put the two filled dots on one side and the two hollow dots on the other." : right === 4 ? "Done: one line separates the 1s from the 0s." : ""}
      </figcaption>
    </figure>
  );
}
