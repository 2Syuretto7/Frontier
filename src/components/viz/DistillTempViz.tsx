"use client";

import { useMemo, useState } from "react";

/** A teacher's logits for the next token after "The cat sat on the". */
export const TOKENS = ["mat", "sofa", "floor", "chair", "bed", "roof", "piano", "moon"];
export const LOGITS = [5.0, 3.6, 3.3, 3.0, 2.6, 1.2, 0.2, -1.5];

export function soft(z: number[], T: number) {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp((v - m) / T));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export function entropyBits(p: number[]) {
  return -p.reduce((a, v) => a + (v > 0 ? v * Math.log2(v) : 0), 0);
}

export function DistillTempViz() {
  const [T, setT] = useState(2);
  const [target, setTarget] = useState<"soft" | "hard">("soft");
  const p = useMemo(() => (target === "hard" ? LOGITS.map((_, i) => (i === 0 ? 1 : 0)) : soft(LOGITS, T)), [T, target]);
  const student = new Array(TOKENS.length).fill(1 / TOKENS.length);
  const grad = p.map((pi, i) => (target === "hard" ? student[i] - pi : T * (student[i] - pi)));
  const gmax = Math.max(...grad.map(Math.abs), 1e-9);
  const W = 330, X0 = 50, PW = 270, ROW = 22, Y0 = 18;
  const H = Y0 + TOKENS.length * ROW + 8;
  const mid = X0 + PW * 0.62;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Target">
          {(["hard", "soft"] as const).map((t) => (
            <button key={t} className="seg" aria-pressed={target === t} onClick={() => setTarget(t)}>{t === "hard" ? "hard label" : "teacher distribution"}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Temperature">
          {[1, 2, 4, 8].map((v) => (
            <button key={v} className="seg" aria-pressed={T === v} onClick={() => setT(v)} disabled={target === "hard"}>T = {v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Target probabilities and gradient on a uniform student">
        <text x={X0} y={11} className="viz-label">target probability</text>
        <text x={mid + 8} y={11} className="viz-label">gradient on logits</text>
        <line x1={mid + 60} x2={mid + 60} y1={Y0 - 2} y2={H - 6} stroke="var(--border)" />
        {TOKENS.map((t, i) => {
          const y = Y0 + i * ROW;
          const g = (grad[i] / gmax) * 50;
          return (
            <g key={t}>
              <text x={X0 - 6} y={y + 12} textAnchor="end" className="viz-label">{t}</text>
              <rect x={X0} y={y + 3} width={p[i] * (mid - X0 - 34)} height={12} style={{ fill: "var(--accent)" }} opacity={0.85} />
              <text x={X0 + p[i] * (mid - X0 - 34) + 3} y={y + 13} className="viz-label">{p[i].toFixed(2)}</text>
              <rect x={g < 0 ? mid + 60 + g : mid + 60} y={y + 3} width={Math.abs(g)} height={12} style={{ fill: g < 0 ? "var(--code-function)" : "var(--danger)" }} opacity={0.8} />
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        target entropy {entropyBits(p).toFixed(2)} bits; tokens pushed up: {grad.filter((g) => g < 0).length} of {TOKENS.length}
      </div>
      <figcaption className="viz-caption">
        A teacher&apos;s next-token distribution after &quot;The cat sat on the&quot;, and the gradient it sends to a student that currently predicts
        uniformly; bars to the left raise a logit, bars to the right lower it. A hard label says only &quot;mat&quot; and pushes every other token
        down equally. The teacher&apos;s distribution also says that sofa and floor are plausible and the moon is not, and a higher
        temperature brings out those differences among unlikely tokens.
      </figcaption>
    </figure>
  );
}
