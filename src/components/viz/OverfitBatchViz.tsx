"use client";

import { useMemo, useState } from "react";

const N = 8, K = 3, HID = 32, STEPS = 500;
type Bug = "none" | "lr" | "axis" | "sign";
const NAMES: Record<Bug, string> = { none: "correct", lr: "lr 100× too small", axis: "softmax over batch", sign: "gradient ascent" };

function gauss(seed: number) {
  let a = seed >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
}

function train(bug: Bug) {
  const r = gauss(17);
  const X = Array.from({ length: N }, () => [r(), r()]);
  const y = [0, 1, 2, 0, 1, 2, 0, 1];
  const W1 = Array.from({ length: 2 }, () => Array.from({ length: HID }, () => r() / Math.SQRT2));
  const W2 = Array.from({ length: HID }, () => Array.from({ length: K }, () => 0.01 * r()));
  const b1 = new Array(HID).fill(0), b2 = new Array(K).fill(0);
  const lr = bug === "lr" ? 0.01 : 1, sgn = bug === "sign" ? -1 : 1;
  const losses: number[] = [];
  for (let s = 0; s < STEPS; s++) {
    const H = X.map((x) => b1.map((b, j) => Math.tanh(x[0] * W1[0][j] + x[1] * W1[1][j] + b)));
    const Z = H.map((h) => b2.map((b, c) => h.reduce((acc, v, j) => acc + v * W2[j][c], b)));
    let P: number[][];
    if (bug === "axis") {
      const cols = Array.from({ length: K }, (_, c) => {
        const m = Math.max(...Z.map((z) => z[c]));
        const e = Z.map((z) => Math.exp(z[c] - m));
        const sum = e.reduce((a, b) => a + b, 0);
        return e.map((v) => v / sum);
      });
      P = Z.map((_, n) => cols.map((col) => col[n]));
    } else {
      P = Z.map((z) => {
        const m = Math.max(...z);
        const e = z.map((v) => Math.exp(v - m));
        const sum = e.reduce((a, b) => a + b, 0);
        return e.map((v) => v / sum);
      });
    }
    const loss = -P.reduce((acc, p, n) => acc + Math.log(Math.max(p[y[n]], 1e-300)), 0) / N;
    losses.push(loss);
    if (!Number.isFinite(loss) || loss > 50) break;
    let dZ: number[][];
    if (bug === "axis") {
      dZ = Z.map(() => new Array(K).fill(0));
      for (let c = 0; c < K; c++) {
        const idx = y.map((v, n) => (v === c ? n : -1)).filter((n) => n >= 0);
        for (let n = 0; n < N; n++) dZ[n][c] = (idx.length * P[n][c] - (y[n] === c ? 1 : 0)) / N;
      }
    } else {
      dZ = P.map((p, n) => p.map((v, c) => (v - (c === y[n] ? 1 : 0)) / N));
    }
    const dH = H.map((h, n) => h.map((v, j) => dZ[n].reduce((acc, d, c) => acc + d * W2[j][c], 0) * (1 - v * v)));
    for (let j = 0; j < HID; j++) for (let c = 0; c < K; c++) W2[j][c] -= sgn * lr * H.reduce((acc, h, n) => acc + h[j] * dZ[n][c], 0);
    for (let c = 0; c < K; c++) b2[c] -= sgn * lr * dZ.reduce((acc, d) => acc + d[c], 0);
    for (let i = 0; i < 2; i++) for (let j = 0; j < HID; j++) W1[i][j] -= sgn * lr * X.reduce((acc, x, n) => acc + x[i] * dH[n][j], 0);
    for (let j = 0; j < HID; j++) b1[j] -= sgn * lr * dH.reduce((acc, d) => acc + d[j], 0);
  }
  return losses;
}

/** Training loss on one batch of 8 examples for a correct loop and three buggy ones. */
export function OverfitBatchViz() {
  const [bug, setBug] = useState<Bug>("none");
  const losses = useMemo(() => train(bug), [bug]);
  const W = 320, H = 170;
  const px = (t: number) => 34 + (t / STEPS) * (W - 44);
  const py = (l: number) => 10 + ((1 - Math.max(-3, Math.min(1, Math.log10(Math.max(l, 1e-12))))) / 4) * (H - 34);
  const last = losses[losses.length - 1];
  const verdict =
    bug === "none" ? "Loss starts at log 3 ≈ 1.10 and falls towards 0: the loop can memorise one batch."
      : bug === "lr" ? "Still falling at the end: nothing is wrong except speed, but a single batch should not take this long."
        : bug === "axis" ? "Falls, then flattens at about 1.0 and can never go lower: a floor above 0 on one batch means the loss itself is computed wrongly."
          : "The loss goes up: the update has the wrong sign.";
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(NAMES) as Bug[]).map((b) => (
          <button key={b} type="button" className="seg" aria-pressed={bug === b} onClick={() => setBug(b)}>{NAMES[b]}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Loss on one batch against step, log scale">
        {[1, 0, -1, -2, -3].map((e) => (
          <g key={e}>
            <line x1={34} x2={W - 10} y1={py(10 ** e)} y2={py(10 ** e)} stroke="var(--border)" />
            <text x={30} y={py(10 ** e) + 4} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        {[0, 250, 500].map((t) => <text key={t} x={px(t)} y={H - 8} textAnchor="middle" className="viz-label">{t}</text>)}
        <polyline fill="none" stroke={bug === "none" ? "var(--accent)" : "var(--danger)"} strokeWidth={2} points={losses.map((l, t) => `${px(t).toFixed(1)},${py(l).toFixed(1)}`).join(" ")} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        first loss {losses[0].toFixed(3)}, last loss {Number.isFinite(last) ? last.toFixed(4) : "∞"} after {losses.length} steps
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A 2-32-3 tanh network trained on the same 8 examples, full batch, for {STEPS} steps. {verdict}
      </figcaption>
    </figure>
  );
}
