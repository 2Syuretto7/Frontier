"use client";

import { useMemo, useState } from "react";

const REF = [0.4, 0.3, 0.2, 0.1];
const R = [0.0, 0.5, 1.0, 1.5];
const BETAS = [0.25, 0.5, 1];
const STEPS = [0, 20, 200, 2000];
const sig = (x: number) => 1 / (1 + Math.exp(-x));

/** Gradient descent on the population DPO loss: every ordered pair compared, labels drawn from Bradley–Terry on R. */
export function dpoPath(beta: number, steps: number, lr = 0.5) {
  const n = REF.length;
  const th = REF.map((p) => Math.log(p));
  for (let s = 0; s < steps; s++) {
    const g = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const pij = sig(R[i] - R[j]);
      const m = beta * ((th[i] - Math.log(REF[i])) - (th[j] - Math.log(REF[j])));
      const d = -pij * beta * (1 - sig(m));
      g[i] += d; g[j] -= d;
    }
    for (let i = 0; i < n; i++) th[i] -= (lr * g[i]) / (n * (n - 1));
  }
  const z = th.map(Math.exp), zs = z.reduce((a, b) => a + b, 0);
  const pi = z.map((v) => v / zs);
  const w = REF.map((p, i) => p * Math.exp(R[i] / beta)), ws = w.reduce((a, b) => a + b, 0);
  const tilt = w.map((v) => v / ws);
  const kl = pi.reduce((a, p, i) => a + p * Math.log(p / tilt[i]), 0);
  return { pi, tilt, kl };
}

export function DpoFitViz() {
  const [bi, setBi] = useState(1);
  const [si, setSi] = useState(2);
  const { pi, tilt, kl } = useMemo(() => dpoPath(BETAS[bi], STEPS[si]), [bi, si]);
  const W = 320, H = 170, X0 = 34, PW = 276, Y0 = 10, PH = 120;
  const bw = PW / REF.length;
  const py = (v: number) => Y0 + PH - v * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="viz-label">β</span>
          <div className="segmented" role="group" aria-label="Beta">
            {BETAS.map((b, i) => <button key={b} type="button" className="seg" aria-pressed={bi === i} onClick={() => setBi(i)}>{b}</button>)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="viz-label">steps</span>
          <div className="segmented" role="group" aria-label="Training steps">
            {STEPS.map((s, i) => <button key={s} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{s.toLocaleString("en-IN")}</button>)}
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Policy trained by DPO against the KL-regularised optimum">
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 5} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {REF.map((p, i) => {
          const x = X0 + i * bw;
          return (
            <g key={i}>
              <rect x={x + bw * 0.2} width={bw * 0.6} y={py(pi[i])} height={pi[i] * PH} style={{ fill: "var(--accent)" }} />
              <rect x={x + bw * 0.2} width={bw * 0.6} y={py(p)} height={p * PH} style={{ fill: "none", stroke: "var(--text-muted)" }} strokeDasharray="3 2" />
              <line x1={x + bw * 0.1} x2={x + bw * 0.9} y1={py(tilt[i])} y2={py(tilt[i])} stroke="var(--text)" strokeWidth={2} />
              <text x={x + bw / 2} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">reward {R[i]}</text>
            </g>
          );
        })}
        <text x={X0} y={H - 4} className="viz-label">filled: policy; dashed: reference; line: optimum</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        β = {BETAS[bi]}, step {STEPS[si].toLocaleString("en-IN")}: KL from the optimum {Math.max(0, kl).toFixed(4)}
      </div>
      <figcaption className="viz-caption">
        Four responses, a reference policy, and preferences generated from hidden rewards by Bradley–Terry. DPO never sees the
        rewards and trains no reward model: it adjusts the policy on preference pairs alone. With enough data and steps it lands on
        the policy that RLHF with a KL penalty would target, shown by the lines. Smaller β lets the policy move further towards the best response.
      </figcaption>
    </figure>
  );
}
