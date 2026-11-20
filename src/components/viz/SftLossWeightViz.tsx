"use client";

import { useMemo, useState } from "react";

/** Four chat examples: prompt and response lengths in tokens. */
export const EXAMPLES = [
  { prompt: 30, response: 10, label: "short answer" },
  { prompt: 12, response: 80, label: "explanation" },
  { prompt: 60, response: 25, label: "long question" },
  { prompt: 8, response: 200, label: "long essay" },
];

/** Share of the batch loss's weight carried by each example, and by prompt tokens overall. */
export function weights(maskPrompt: boolean, perToken: boolean) {
  const trained = EXAMPLES.map((e) => (maskPrompt ? e.response : e.prompt + e.response));
  const total = trained.reduce((a, b) => a + b, 0);
  const share = trained.map((n) => (perToken ? n / total : 1 / EXAMPLES.length));
  const promptShare = maskPrompt ? 0 : EXAMPLES.reduce((a, e, i) => a + share[i] * (e.prompt / trained[i]), 0);
  return { share, promptShare };
}

export function SftLossWeightViz() {
  const [maskPrompt, setMask] = useState(true);
  const [perToken, setPerToken] = useState(true);
  const { share, promptShare } = useMemo(() => weights(maskPrompt, perToken), [maskPrompt, perToken]);
  const W = 330, X0 = 92, PW = 228, ROW = 34, Y0 = 6;
  const H = Y0 + EXAMPLES.length * ROW + 30;
  const scale = PW / 210;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Prompt tokens">
          {[true, false].map((m) => (
            <button key={String(m)} className="seg" aria-pressed={maskPrompt === m} onClick={() => setMask(m)}>{m ? "mask prompt" : "train on prompt"}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Averaging">
          {[true, false].map((p) => (
            <button key={String(p)} className="seg" aria-pressed={perToken === p} onClick={() => setPerToken(p)}>{p ? "average over tokens" : "average over examples"}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Tokens per example and each example's share of the loss">
        {EXAMPLES.map((e, i) => {
          const y = Y0 + i * ROW;
          return (
            <g key={e.label}>
              <text x={X0 - 6} y={y + 12} textAnchor="end" className="viz-label">{e.label}</text>
              <rect x={X0} y={y + 2} width={e.prompt * scale} height={12} style={{ fill: maskPrompt ? "var(--border)" : "var(--code-string)" }} />
              <rect x={X0 + e.prompt * scale} y={y + 2} width={e.response * scale} height={12} style={{ fill: "var(--accent)" }} opacity={0.85} />
              <rect x={X0} y={y + 18} width={share[i] * PW} height={8} style={{ fill: "var(--code-function)" }} />
              <text x={X0 + share[i] * PW + 4} y={y + 26} className="viz-label">{(share[i] * 100).toFixed(0)}%</text>
            </g>
          );
        })}
        <text x={X0} y={H - 16} className="viz-label">upper bars: prompt then response tokens</text>
        <text x={X0} y={H - 2} className="viz-label">lower bars: share of the loss</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        prompt tokens carry {(promptShare * 100).toFixed(0)}% of the loss; the long essay carries {(share[3] * 100).toFixed(0)}%
      </div>
      <figcaption className="viz-caption">
        Four examples in one batch. Masking the prompt means the model is trained only to produce responses, not to imitate
        users. Averaging the loss over all tokens in the batch gives each example weight in proportion to its length, so one
        long essay can dominate; averaging each example first and then across examples gives every example equal weight, so
        its long-response tokens each count for less.
      </figcaption>
    </figure>
  );
}
