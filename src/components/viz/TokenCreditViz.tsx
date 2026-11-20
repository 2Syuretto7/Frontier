"use client";

import { useState } from "react";

const TOKENS = ["Paris", "is", "the", "capital", ",", "I", "think", "!", "Hope", "this", "helps", "."];
// log π/π_ref per token: the tuned policy has drifted towards the hedge and the sign-off.
const LOGRATIO = [0.1, 0.0, 0.0, 0.1, 0.0, 0.6, 0.8, 0.3, 1.2, 0.4, 0.9, 0.1];
// The value head's estimate before each token.
const VALUES = [1.0, 1.4, 1.45, 1.5, 1.5, 1.5, 1.35, 1.25, 1.25, 1.22, 1.2, 1.2];
const RM = 1.2, BETA = 0.1, LAMS = [0, 0.9, 1];

export function tokenRewards() {
  return LOGRATIO.map((l, t) => -BETA * l + (t === LOGRATIO.length - 1 ? RM : 0));
}

/** GAE with γ = 1 and zero value after the last token. */
export function advantages(lam: number) {
  const r = tokenRewards();
  const A = new Array(r.length).fill(0);
  let next = 0;
  for (let t = r.length - 1; t >= 0; t--) {
    const vNext = t + 1 < r.length ? VALUES[t + 1] : 0;
    next = r[t] + vNext - VALUES[t] + lam * next;
    A[t] = next;
  }
  return A;
}

export function TokenCreditViz() {
  const [li, setLi] = useState(1);
  const r = tokenRewards();
  const A = advantages(LAMS[li]);
  const n = TOKENS.length, W = 340, H = 222, X0 = 30, PW = 304, CW = PW / n;
  const rowY = [54, 142], SC = 28;
  const bar = (v: number, i: number, y0: number, fill: string) => {
    const h = Math.max(-1.5, Math.min(1.5, v)) * SC;
    return <rect key={i} x={X0 + i * CW + 3} width={CW - 6} y={h >= 0 ? y0 - h : y0} height={Math.abs(h)} style={{ fill }} />;
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">GAE λ</span>
        <div className="segmented" role="group" aria-label="GAE lambda">
          {LAMS.map((l, i) => <button key={l} type="button" className="seg" aria-pressed={li === i} onClick={() => setLi(i)}>{l}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="Per-token rewards and advantages">
        <text x={X0} y={12} className="viz-label">reward per token (−β·log-ratio, plus the score at the end)</text>
        <text x={X0} y={100} className="viz-label">advantage per token</text>
        {rowY.map((y) => <line key={y} x1={X0} x2={X0 + PW} y1={y} y2={y} stroke="var(--border)" />)}
        <text x={X0 - 4} y={rowY[0] + 3} textAnchor="end" className="viz-label">0</text>
        <text x={X0 - 4} y={rowY[1] + 3} textAnchor="end" className="viz-label">0</text>
        {r.map((v, i) => bar(v, i, rowY[0], "var(--text-muted)"))}
        {A.map((v, i) => bar(v, i, rowY[1], v >= 0 ? "var(--accent)" : "var(--text)"))}
        {TOKENS.map((t, i) => (
          <text key={i} x={X0 + (i + 0.5) * CW} y={182} textAnchor="end" transform={`rotate(-50 ${X0 + (i + 0.5) * CW} 182)`} className="viz-label" style={{ fontSize: 9 }}>{t}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        λ = {LAMS[li]}: advantage of &quot;Paris&quot; {A[0].toFixed(2)}, of &quot;Hope&quot; {A[8].toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        The reward model scores the whole response only once, at the last token; every other token gets just its share of the
        KL penalty. GAE turns this into a per-token signal using the value head, whose estimate rises after the correct answer
        and falls after the hedge. With λ = 0 each token is judged by the change in value it causes, so &quot;Paris&quot; is credited and
        &quot;I think&quot; is blamed. As λ grows towards 1, each token&apos;s advantage leans more on the actual final score, which is less
        biased by the value head but shared by every token and so noisier.
      </figcaption>
    </figure>
  );
}
