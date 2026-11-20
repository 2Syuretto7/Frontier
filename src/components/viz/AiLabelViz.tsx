"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const MODES = ["direct", "chain of thought", "chain of thought, clamped"];
const sig = (x: number) => 1 / (1 + Math.exp(-x));

/**
 * Simulated AI preference labels. Each comparison has a latent quality gap d ~ N(0, 1.5) and a true preference probability
 * σ(d). Direct labels are σ(d + noise of sd 1.2); chain-of-thought labels are σ(4(d + noise of sd 0.6)), more often right
 * but overconfident; the clamped variant restricts them to [0.4, 0.6]. Returns calibration bins, sign accuracy, and mean
 * cross-entropy of the soft label against the true preference.
 */
export function labels(mode: number, n = 6000, seed = 12) {
  const r = rand(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const bins = Array.from({ length: 10 }, () => ({ n: 0, q: 0, p: 0 }));
  let acc = 0, ce = 0;
  for (let i = 0; i < n; i++) {
    const d = 1.5 * normal(), q = sig(d);
    let p = mode === 0 ? sig(d + 1.2 * normal()) : sig(4 * (d + 0.6 * normal()));
    if (mode === 2) p = Math.min(0.6, Math.max(0.4, p));
    p = Math.min(1 - 1e-6, Math.max(1e-6, p));
    if ((p > 0.5) === (d > 0)) acc++;
    ce -= q * Math.log(p) + (1 - q) * Math.log(1 - p);
    const b = bins[Math.min(9, Math.floor(p * 10))];
    b.n++; b.q += q; b.p += p;
  }
  return { bins: bins.map((b) => (b.n ? { p: b.p / b.n, q: b.q / b.n, n: b.n } : null)), acc: acc / n, ce: ce / n };
}

export function AiLabelViz() {
  const [m, setM] = useState(0);
  const { bins, acc, ce } = useMemo(() => labels(m), [m]);
  const S = 260, X0 = 40, Y0 = 10;
  const px = (v: number) => X0 + v * S, py = (v: number) => Y0 + S - v * S;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="How the AI labeller answers">
          {MODES.map((name, i) => <button key={name} type="button" className="seg" aria-pressed={m === i} onClick={() => setM(i)}>{name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${S + 60} ${S + 46}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Calibration of AI preference labels">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={px(0)} x2={px(1)} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <line x1={px(v)} x2={px(v)} y1={py(0)} y2={py(1)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 5} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
            <text x={px(v)} y={py(0) + 13} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ))}
        <line x1={px(0)} y1={py(0)} x2={px(1)} y2={py(1)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        {bins.map((b, i) => b && (
          <circle key={i} cx={px(b.p)} cy={py(b.q)} r={2.5 + Math.sqrt(b.n) / 7} style={{ fill: "var(--accent)", opacity: 0.85 }} />
        ))}
        <text x={px(0.5)} y={S + 40} textAnchor="middle" className="viz-label">label: P(first response better)</text>
        <text x={12} y={py(0.5)} textAnchor="middle" transform={`rotate(-90 12 ${py(0.5)})`} className="viz-label">true preference</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        picks the better response {(acc * 100).toFixed(1)}% of the time; cross-entropy against the true preference {ce.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        A model labels which of two responses better follows a principle, giving a probability. Points on the dashed diagonal
        are calibrated: when the label says 0.8, the first response really is preferred 80% of the time. Reasoning before
        answering picks the better response more often but pushes labels towards 0 and 1, so a reward model trained on them
        learns false certainty. Clamping the reasoned labels keeps the accuracy and removes most of the overconfidence.
      </figcaption>
    </figure>
  );
}
