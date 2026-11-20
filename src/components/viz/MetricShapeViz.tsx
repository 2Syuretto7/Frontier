"use client";

import { useState } from "react";

/** Per-token loss on the answer, falling smoothly with compute (in units of the smallest run). */
export function taskLoss(c: number) {
  return 0.005 + 4 * Math.pow(c, -0.3);
}

type Metric = "token" | "em5" | "em20" | "choice";
const LABELS: Record<Metric, string> = { token: "per-token p", em5: "exact match, 5", em20: "exact match, 20", choice: "4-way choice" };

export function metricValue(c: number, m: Metric) {
  const L = taskLoss(c), p = Math.exp(-L);
  if (m === "token") return p;
  if (m === "em5") return Math.pow(p, 5);
  if (m === "em20") return Math.pow(p, 20);
  return 0.25 + 0.75 / (1 + Math.exp(4 * (L - 1)));
}

export function MetricShapeViz() {
  const [m, setM] = useState<Metric>("em20");
  const W = 330, H = 170, X0 = 30, PW = 290, Y0 = 8, PH = 130;
  const px = (lc: number) => X0 + (lc / 8) * PW;
  const py = (v: number) => Y0 + PH - v * PH;
  const lcs = Array.from({ length: 161 }, (_, i) => (8 * i) / 160);
  const half = lcs.find((lc) => metricValue(Math.pow(10, lc), m) >= 0.5);
  const at = (lc: number) => metricValue(Math.pow(10, lc), m);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Metric">
          {(Object.keys(LABELS) as Metric[]).map((k) => (
            <button key={k} className="seg" aria-pressed={m === k} onClick={() => setM(k)}>{LABELS[k]}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Several metrics of the same model family against compute">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {[0, 2, 4, 6, 8].map((e) => (
          <text key={e} x={px(e)} y={Y0 + PH + 12} textAnchor={e === 8 ? "end" : "middle"} className="viz-label">10^{e}</text>
        ))}
        {(Object.keys(LABELS) as Metric[]).map((k) => (
          <polyline key={k} points={lcs.map((lc) => `${px(lc).toFixed(1)},${py(metricValue(Math.pow(10, lc), k)).toFixed(1)}`).join(" ")} fill="none"
            stroke={k === m ? "var(--accent)" : "var(--text-muted)"} strokeWidth={k === m ? 2.2 : 0.8} opacity={k === m ? 1 : 0.45} />
        ))}
        <polyline points={lcs.map((lc) => `${px(lc).toFixed(1)},${py(Math.min(1, taskLoss(Math.pow(10, lc)) / 4.005)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--code-function)" strokeDasharray="4 3" />
        <text x={X0} y={H - 2} className="viz-label">relative compute (log); dashed: answer loss, scaled</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {LABELS[m]}: {at(2).toFixed(3)} at 10², {at(5).toFixed(3)} at 10⁵, {at(8).toFixed(3)} at 10⁸;{" "}
        {half === undefined ? "never reaches 0.5 in this range" : `first reaches 0.5 near 10^${half.toFixed(2)}`}
      </div>
      <figcaption className="viz-caption">
        One family of models whose loss on the answer tokens falls smoothly with compute (dashed). Read through different
        metrics, the same progress looks different: the probability of each answer token rises steadily, while requiring all
        20 tokens to be right turns it into a late, sudden jump, and a multiple-choice score sits at chance before rising
        along a sigmoid. Predicting a benchmark means predicting the loss and then the link from loss to that metric.
      </figcaption>
    </figure>
  );
}
