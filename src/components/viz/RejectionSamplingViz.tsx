"use client";

import { useMemo, useState } from "react";

const PROMPTS = 400, BINS = 10;

/** Per-prompt probability that one teacher sample is correct: many hard prompts, few easy ones. */
export const DIFFICULTY = Array.from({ length: PROMPTS }, (_, i) => Math.pow((i + 0.5) / PROMPTS, 2));

/** Expected number of prompts kept, by bin of single-sample success rate, when n samples are drawn and any correct one is kept. */
export function keptByBin(n: number) {
  const src = new Array(BINS).fill(0), kept = new Array(BINS).fill(0);
  for (const p of DIFFICULTY) {
    const b = Math.min(BINS - 1, Math.floor(p * BINS));
    src[b] += 1;
    kept[b] += 1 - Math.pow(1 - p, n);
  }
  return { src, kept };
}

export function RejectionSamplingViz() {
  const [n, setN] = useState(4);
  const { src, kept } = useMemo(() => keptByBin(n), [n]);
  const totalKept = kept.reduce((a, b) => a + b, 0);
  const W = 330, H = 200, X0 = 34, PW = 286, Y0 = 8, PH = 150;
  const bw = PW / BINS;
  const ymax = Math.max(...src);
  const py = (v: number) => Y0 + PH - (v / ymax) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Samples per prompt">
          {[1, 4, 16, 64].map((v) => (
            <button key={v} className="seg" aria-pressed={n === v} onClick={() => setN(v)}>{v} sample{v > 1 ? "s" : ""}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Prompts by difficulty before and after rejection sampling">
        {[0, ymax / 2, ymax].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{Math.round(v)}</text>
          </g>
        ))}
        {src.map((s, b) => (
          <g key={b}>
            <rect x={X0 + b * bw + 2} y={py(s)} width={bw - 4} height={Y0 + PH - py(s)} style={{ fill: "var(--border)" }} />
            <rect x={X0 + b * bw + 6} y={py(kept[b])} width={bw - 12} height={Y0 + PH - py(kept[b])} style={{ fill: "var(--accent)" }} opacity={0.85} />
          </g>
        ))}
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={X0 + v * PW} y={Y0 + PH + 12} textAnchor={v === 0 ? "start" : v === 1 ? "end" : "middle"} className="viz-label">{v}</text>
        ))}
        <text x={X0} y={H - 4} className="viz-label">success rate per sample; grey: all prompts</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {n} per prompt: {Math.round(totalKept)} of {PROMPTS} prompts kept; hardest tenth keeps {Math.round((kept[0] / src[0]) * 100)}% of its prompts
      </div>
      <figcaption className="viz-caption">
        Each of 400 prompts has a chance that one teacher sample is correct, and a prompt enters the fine-tuning set if any of
        its samples passes a verifier. With one sample, the kept set is dominated by easy prompts; drawing more samples rescues
        harder ones, at proportionally more generation cost, but the hardest prompts stay under-represented.
      </figcaption>
    </figure>
  );
}
