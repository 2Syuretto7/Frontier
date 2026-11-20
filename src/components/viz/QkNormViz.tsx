"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const D = 64, N = 32;

function setup() {
  const r = rand(5);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const q = Array.from({ length: D }, normal);
  const keys = Array.from({ length: N }, () => Array.from({ length: D }, normal));
  return { q, keys };
}
const { q, keys } = setup();

const rmsNorm = (v: number[]) => {
  const r = Math.sqrt(v.reduce((s, x) => s + x * x, 0) / v.length + 1e-6);
  return v.map((x) => x / r);
};

type Mode = "none" | "QK-norm" | "soft-cap";

/** Scaled attention logits when the query and key projections are multiplied by s. */
export function logits(s: number, mode: Mode) {
  const qq = mode === "QK-norm" ? rmsNorm(q) : q.map((x) => s * x);
  return keys.map((k) => {
    const kk = mode === "QK-norm" ? rmsNorm(k) : k.map((x) => s * x);
    const z = qq.reduce((acc, x, i) => acc + x * kk[i], 0) / Math.sqrt(D);
    return mode === "soft-cap" ? 5 * Math.tanh(z / 5) : z;
  });
}

export function softmaxEntropy(z: number[]) {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const t = e.reduce((a, b) => a + b, 0);
  const p = e.map((v) => v / t);
  return { p, h: -p.reduce((s, x) => s + (x > 0 ? x * Math.log(x) : 0), 0) };
}

export function QkNormViz() {
  const [s, setS] = useState(1);
  const [mode, setMode] = useState<Mode>("none");
  const z = useMemo(() => logits(s, mode), [s, mode]);
  const { p, h } = softmaxEntropy(z);
  const zmax = Math.max(...z.map(Math.abs));
  const W = 330, H = 140, X0 = 10, PW = 310, Y0 = 8, PH = 110;
  const bw = PW / N;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Scale of the query and key weights">
          {[1, 1.5, 2, 4, 6].map((v) => (
            <button key={v} className="seg" aria-pressed={s === v} onClick={() => setS(v)}>×{v}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Logit control">
          {(["none", "QK-norm", "soft-cap"] as Mode[]).map((m) => (
            <button key={m} className="seg" aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Attention weights of one query over 32 keys">
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        {p.map((v, i) => (
          <rect key={i} x={X0 + i * bw + 1} y={Y0 + PH - (v / 0.8) * PH} width={bw - 2} height={(v / 0.8) * PH} fill="var(--code-function)" />
        ))}
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH - PH / (0.8 * N)} y2={Y0 + PH - PH / (0.8 * N)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <text x={X0} y={H - 2} className="viz-label">attention weights over 32 keys; dashed: uniform</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        weights ×{s}, {mode}: largest |logit| {zmax.toFixed(2)}, top weight {Math.max(...p).toFixed(3)}, entropy {h.toFixed(3)} nats (uniform{" "}
        {Math.log(N).toFixed(3)})
      </div>
      <figcaption className="viz-caption">
        One query attending over 32 keys in 64 dimensions. If training lets the query and key weights grow by a factor s, the
        logits grow by s², and the softmax concentrates on a few keys: the entropy falls and the gradient through the
        other keys shrinks. Normalising queries and keys before the dot product makes the logits independent of that growth;
        capping with 5·tanh(z/5) bounds them instead, at the price of flattening the largest logits.
      </figcaption>
    </figure>
  );
}
