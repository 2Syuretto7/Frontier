"use client";

import { useState } from "react";

const STAGES = [
  { name: "Research", text: "Small experiments test new ideas: an architecture change, a better data mix, a new training objective. Most fail. Each one costs a tiny fraction of a large run." },
  { name: "Scale", text: "Ideas that win at small scale are checked against scaling laws, then combined into one very large pretraining run lasting weeks or months on tens of thousands of accelerators." },
  { name: "Post-train", text: "The pretrained model is shaped into an assistant: fine-tuned on demonstrations, then trained with feedback and reinforcement learning to be helpful, honest and harmless." },
  { name: "Evaluate", text: "Capability evaluations measure what the model can do; safety evaluations probe for dangerous capabilities and misbehaviour. Results decide whether, and how, it ships." },
  { name: "Deploy", text: "The model is served to millions of users through products and an API, with monitoring, usage policies and safeguards in place." },
  { name: "Learn", text: "Real use reveals failures no evaluation caught, and new research questions. These feed the next round of research, and the loop turns again." },
];

const W = 440, H = 300, CX = W / 2, CY = H / 2, RX = 160, RY = 108;

/** The loop that a frontier lab runs, again and again, each turn with a larger model. */
export function LabLoopViz() {
  const [pick, setPick] = useState(0);
  const pos = (i: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / STAGES.length;
    return [CX + RX * Math.cos(a), CY + RY * Math.sin(a)];
  };
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="The research, scale, post-train, evaluate, deploy, learn loop">
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} className="viz-frame" style={{ strokeDasharray: "4 5" }} />
        {STAGES.map((s, i) => {
          const [x, y] = pos(i);
          const on = i === pick;
          return (
            <g key={s.name} onClick={() => setPick(i)} style={{ cursor: "pointer" }}>
              <rect x={x - 52} y={y - 16} width={104} height={32} rx={6} className={on ? "viz-cell is-on" : "viz-cell"} />
              <text x={x} y={y + 5} textAnchor="middle" className={on ? "viz-label is-on" : "viz-label"}>{i + 1}. {s.name}</text>
            </g>
          );
        })}
        <text x={CX} y={CY + 5} textAnchor="middle" className="plot-tick">each turn, a larger model</text>
      </svg>
      <div className="viz-controls">
        {STAGES.map((s, i) => <button key={s.name} type="button" className={pick === i ? "btn btn-primary" : "btn"} aria-pressed={pick === i} onClick={() => setPick(i)}>{s.name}</button>)}
      </div>
      <figcaption className="viz-caption" aria-live="polite"><strong>{STAGES[pick].name}.</strong> {STAGES[pick].text}</figcaption>
    </figure>
  );
}
