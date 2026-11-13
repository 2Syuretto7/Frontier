"use client";

import { useState } from "react";

const PRESETS: { label: string; n: [number, number, number, number] }[] = [
  { label: "many inputs, one output", n: [1000, 500, 200, 1] },
  { label: "one input, many outputs", n: [1, 200, 500, 1000] },
  { label: "all the same size", n: [300, 300, 300, 300] },
];

const fmt = (x: number) => (x >= 1e6 ? `${(x / 1e6).toFixed(1)} million` : x.toLocaleString("en-IN"));

/** The chain rule multiplies Jacobians; the order of multiplication decides the cost. */
export function JacobianOrderViz() {
  const [pi, setPi] = useState(0);
  const [n0, n1, n2, n3] = PRESETS[pi].n;
  const right = n2 * n1 * n0 + n3 * n2 * n0; // J3 (J2 J1): from the input side
  const left = n3 * n2 * n1 + n3 * n1 * n0; // (J3 J2) J1: from the output side
  const best = right < left ? "right" : left < right ? "left" : "tie";
  const W = 300, bw = 60, gap = (W - 4 * bw) / 3;
  const ns = [n0, n1, n2, n3];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {PRESETS.map((p, i) => (
          <button key={p.label} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>{p.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} 86`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "8px auto" }} role="img" aria-label="A chain of three maps and their dimensions">
        {ns.map((n, i) => (
          <g key={i}>
            <rect x={i * (bw + gap)} y={20} width={bw} height={34} rx={6} fill="var(--accent-soft)" stroke="var(--border)" />
            <text x={i * (bw + gap) + bw / 2} y={42} textAnchor="middle" className="viz-label">ℝ^{n}</text>
            {i < 3 && (
              <>
                <line x1={i * (bw + gap) + bw + 2} y1={37} x2={(i + 1) * (bw + gap) - 4} y2={37} stroke="var(--text-muted)" strokeWidth={1.5} />
                <text x={i * (bw + gap) + bw + gap / 2} y={14} textAnchor="middle" className="viz-label">f{i + 1}</text>
                <text x={i * (bw + gap) + bw + gap / 2} y={74} textAnchor="middle" className="viz-label">{ns[i + 1]}×{n}</text>
              </>
            )}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, lineHeight: 1.8, overflowWrap: "anywhere" }}>
        <div style={{ color: best === "right" ? "var(--accent)" : "var(--text-muted)" }}>J3 (J2 J1), from the input side: {fmt(right)} multiplications</div>
        <div style={{ color: best === "left" ? "var(--accent)" : "var(--text-muted)" }}>(J3 J2) J1, from the output side: {fmt(left)} multiplications</div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The derivative of f3 ∘ f2 ∘ f1 is the product J3 J2 J1 of the three Jacobians, whose sizes are shown under the arrows.
        Matrix multiplication is associative, so both orders give the same matrix, at very different cost.{" "}
        {best === "left"
          ? "With one output, starting from the output side keeps every intermediate a single row. This is reverse mode, the idea behind backpropagation."
          : best === "right"
            ? "With one input, starting from the input side keeps every intermediate a single column. This is forward mode."
            : "When all sizes match, the two orders cost the same."}
      </figcaption>
    </figure>
  );
}
