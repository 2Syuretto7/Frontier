"use client";

import { useMemo, useState } from "react";

const H = [[2, 0.5], [0.5, 2], [1.5, 1.5]];
const Y = [0, 1, 2];
const NAMES = ["A", "B", "C", "D"];
const LR = 0.5, T = 300;

/** Gradient descent on the unembedding only, for three fixed hidden states with targets A, B, C; token D is never a target. */
export function unembedPath() {
  let U = [[0, 0, 0, 0], [0, 0, 0, 0]];
  const frames: { U: number[][]; pD: number; logitD: number }[] = [];
  for (let t = 0; t <= T; t++) {
    const P = H.map((h) => {
      const z = [0, 1, 2, 3].map((c) => h[0] * U[0][c] + h[1] * U[1][c]);
      const m = Math.max(...z);
      const e = z.map((q) => Math.exp(q - m));
      const s = e.reduce((a, b) => a + b, 0);
      return e.map((q) => q / s);
    });
    const logitD = H.reduce((s, h) => s + h[0] * U[0][3] + h[1] * U[1][3], 0) / H.length;
    frames.push({ U: U.map((r) => r.slice()), pD: P.reduce((s, p) => s + p[3], 0) / H.length, logitD });
    const G = [0, 1].map((i) => [0, 1, 2, 3].map((c) => H.reduce((s, h, n) => s + h[i] * (P[n][c] - (Y[n] === c ? 1 : 0)), 0) / H.length));
    U = U.map((r, i) => r.map((u, c) => u - LR * G[i][c]));
  }
  return frames;
}

export function UnembedDriftViz() {
  const [t, setT] = useState(40);
  const frames = useMemo(() => unembedPath(), []);
  const f = frames[t];
  const W = 300, S = 300, C = S / 2, R = 5;
  const px = (x: number) => C + (x / R) * (S / 2 - 12);
  const py = (y: number) => C - (y / R) * (S / 2 - 12);
  const colours = ["var(--accent)", "var(--success)", "var(--text)", "var(--danger)"];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="ud-t">training steps: {t}</label>
        <input id="ud-t" type="range" min={0} max={T} value={t} onChange={(e) => setT(Number(e.target.value))} style={{ flex: "1 1 160px" }} />
      </div>
      <svg viewBox={`0 0 ${W} ${S}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="Output vectors of four tokens during training, with three hidden states">
        <line x1={px(-R)} y1={py(0)} x2={px(R)} y2={py(0)} stroke="var(--border)" />
        <line x1={px(0)} y1={py(-R)} x2={px(0)} y2={py(R)} stroke="var(--border)" />
        {H.map((h, n) => (
          <g key={n}>
            <circle cx={px(h[0])} cy={py(h[1])} r={5} fill="none" stroke={colours[Y[n]]} strokeWidth={2} />
          </g>
        ))}
        {[0, 1, 2, 3].map((c) => {
          const x = Math.max(-R, Math.min(R, f.U[0][c])), y = Math.max(-R, Math.min(R, f.U[1][c]));
          return (
            <g key={c}>
              <line x1={px(0)} y1={py(0)} x2={px(x)} y2={py(y)} stroke={colours[c]} strokeWidth={2} />
              <text x={px(x) + 4} y={py(y) - 4} className="viz-label" fill={colours[c]}>{NAMES[c]}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`token D: mean logit ${f.logitD.toFixed(2)}, mean probability ${f.pD.toFixed(4)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Three hidden states (circles) whose next tokens are A, B and C, and the output vectors of four tokens (lines),
        trained by gradient descent on the unembedding alone. Token D never appears as a target, yet its vector moves at
        every step: its gradient is the probability-weighted average of the hidden states, so it is pushed straight away
        from them and its logit falls everywhere. Rare tokens are learned mainly from this push, not from examples of their
        own.
      </figcaption>
    </figure>
  );
}
