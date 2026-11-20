"use client";

import { useState } from "react";

/*
 * Results of real training runs, recorded offline. A two-layer ReLU network (20 inputs, 48 hidden units, 5 outputs) was trained for
 * 6000 Adam steps to imitate a random teacher network. From that base it was trained for 1500 more steps either on the same task
 * (control) or with half of each batch drawn from a narrow domain, inputs shifted along one direction u, where a new rule adds 2 to
 * output 5 (narrow). For the change in the first-layer weights: singular values relative to the largest (s), the largest itself (s1),
 * its share of the squared norm, the absolute cosine of the top five right singular vectors with u, and the change's norm relative
 * to the base weights. Two further fine-tuning seeds gave the same picture (top share 0.30 to 0.31 against 0.63, cosine 0.92).
 */
export const DIFF: Record<string, { s: number[]; s1: number; share: number; cos: number[]; rel: number }> = {"control": {"s": [1.0, 0.803, 0.627, 0.582, 0.441, 0.413, 0.338, 0.322, 0.297, 0.264, 0.23, 0.174], "s1": 1.3047, "share": 0.305, "cos": [0.007, 0.154, 0.172, 0.1, 0.192], "rel": 0.3441}, "narrow": {"s": [1.0, 0.408, 0.332, 0.267, 0.229, 0.219, 0.168, 0.16, 0.149, 0.126, 0.11, 0.081], "s1": 1.9332, "share": 0.633, "cos": [0.917, 0.114, 0.009, 0.009, 0.196], "rel": 0.354}};

const RUNS = [
  { key: "control", name: "same task (control)" },
  { key: "narrow", name: "narrow fine-tune" },
];

export function WeightDiffViz() {
  const [k, setK] = useState(1);
  const d = DIFF[RUNS[k].key];
  const W = 330, H = 170, X0 = 30, PW = 290, Y0 = 10, PH = 124, MAX = 2;
  const bw = PW / d.s.length;
  const py = (v: number) => Y0 + PH - (v / MAX) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Which run to compare with the base model">
          {RUNS.map((r, i) => <button key={r.key} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{r.name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Singular values of the change in first-layer weights">
        {[0, 1, 2].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeDasharray={v ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {d.s.map((s, i) => (
          <g key={i}>
            <rect x={X0 + i * bw + 3} width={bw - 6} y={py(s * d.s1)} height={py(0) - py(s * d.s1)} style={{ fill: i === 0 ? "var(--accent)" : "var(--text-muted)" }} />
            <text x={X0 + (i + 0.5) * bw} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">{i + 1}</text>
          </g>
        ))}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">singular values of the weight change, largest first</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        change {(100 * d.rel).toFixed(0)}% of base norm; top direction carries {(100 * d.share).toFixed(0)}% of its squared norm; alignment with the rule&apos;s input direction {d.cos[0].toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        Real training runs. Continuing to train on the same task moves the weights about as far as the narrow fine-tune does, so the size
        of the change says little. Its shape says more: the control&apos;s change is spread over many directions, while the narrow
        fine-tune&apos;s is dominated by one direction that reads almost exactly the input pattern the new rule depends on.
      </figcaption>
    </figure>
  );
}
