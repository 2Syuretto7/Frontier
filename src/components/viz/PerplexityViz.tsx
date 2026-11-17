"use client";

import { useState } from "react";

const K = 20;

export function dist(temp: number) {
  const logits = Array.from({ length: K }, (_, i) => -Math.log(i + 1));
  const z = logits.map((l) => Math.exp(l / temp));
  const s = z.reduce((a, b) => a + b, 0);
  return z.map((v) => v / s);
}

export function entropyBits(p: number[]) {
  return -p.reduce((a, q) => a + (q > 0 ? q * Math.log2(q) : 0), 0);
}

/** Perplexity as an effective number of equally likely choices: 2 to the entropy in bits. */
export function PerplexityViz() {
  const [t10, setT10] = useState(10);
  const temp = t10 / 10;
  const p = dist(temp);
  const H = entropyBits(p);
  const ppl = 2 ** H;
  const W = 330, H0 = 150, X0 = 20, BW = (W - 40) / K;
  const top = Math.max(...p);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          temperature {temp.toFixed(1)}
          <input type="range" min={1} max={60} value={t10} onChange={(e) => setT10(Number(e.target.value))} aria-label="temperature" style={{ width: 140 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H0 + 20}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Next-token probabilities over twenty tokens, with a band showing the perplexity as an equivalent number of equally likely tokens">
        <rect x={X0} y={H0 - (1 / ppl / top) * (H0 - 10)} width={Math.min(ppl, K) * BW} height={(1 / ppl / top) * (H0 - 10)} fill="var(--accent)" opacity={0.18} />
        {p.map((q, i) => (
          <rect key={i} x={X0 + i * BW + 1} y={H0 - (q / top) * (H0 - 10)} width={BW - 2} height={(q / top) * (H0 - 10)} fill="var(--accent)" opacity={0.75} />
        ))}
        <line x1={X0} y1={H0} x2={X0 + K * BW} y2={H0} stroke="var(--border)" />
        <text x={X0} y={H0 + 14} className="viz-label">most likely</text>
        <text x={X0 + K * BW} y={H0 + 14} textAnchor="end" className="viz-label">least likely</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        entropy {H.toFixed(2)} bits; perplexity {ppl.toFixed(2)} of {K}; top token {p[0].toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The bars are a Zipf-shaped next-token distribution, sharpened or flattened by the temperature. The pale band is
        the uniform distribution over perplexity-many tokens, which has the same entropy. At low temperature nearly all
        mass is on one token and the perplexity approaches 1; at high temperature it approaches 20, the number of tokens.
      </figcaption>
    </figure>
  );
}
