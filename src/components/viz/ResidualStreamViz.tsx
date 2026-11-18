"use client";

import { useMemo, useState } from "react";

const D = 8, H = 16, L = 4;
const TOKENS = ["cat", "sat", "on"];

function gaussian(seed: number) {
  let a = seed >>> 0;
  const uni = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(1 - uni())) * Math.cos(2 * Math.PI * uni());
}

/** A random residual stack of tanh MLP blocks; returns each block's write and its dot product with a fixed output direction u. */
export function residualRun(token: number) {
  const g = gaussian(42);
  const E = TOKENS.map(() => Array.from({ length: D }, g));
  const blocks = Array.from({ length: L }, () => ({
    Win: Array.from({ length: D }, () => Array.from({ length: H }, () => g() / Math.sqrt(D))),
    Wout: Array.from({ length: H }, () => Array.from({ length: D }, () => (0.7 * g()) / Math.sqrt(H))),
  }));
  const u = Array.from({ length: D }, g);
  const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
  let x = E[token].slice();
  const parts = [dot(x, u)];
  for (const { Win, Wout } of blocks) {
    const h = Array.from({ length: H }, (_, j) => Math.tanh(x.reduce((s, xi, i) => s + xi * Win[i][j], 0)));
    const w = Array.from({ length: D }, (_, k) => h.reduce((s, hj, j) => s + hj * Wout[j][k], 0));
    parts.push(dot(w, u));
    x = x.map((xi, i) => xi + w[i]);
  }
  return { parts, total: dot(x, u) };
}

export function ResidualStreamViz() {
  const [tok, setTok] = useState(0);
  const run = useMemo(() => residualRun(tok), [tok]);
  const labels = ["embedding", ...Array.from({ length: L }, (_, l) => `block ${l + 1}`)];
  const W = 320, rowH = 26, X0 = 80, PW = W - X0 - 10;
  const M = Math.max(...run.parts.map(Math.abs), Math.abs(run.total), 1e-9);
  const sx = (v: number) => X0 + PW / 2 + (v / M) * (PW / 2);
  const Ht = (labels.length + 1) * rowH + 10;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">input token</span>
        {TOKENS.map((t, i) => (
          <button key={t} type="button" className="seg" aria-pressed={tok === i} onClick={() => setTok(i)}>{t}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${Ht}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Contribution of the embedding and each block to one output logit">
        <line x1={sx(0)} y1={4} x2={sx(0)} y2={Ht - 4} stroke="var(--border)" />
        {[...run.parts, run.total].map((v, i) => {
          const y = 8 + i * rowH, isTotal = i === run.parts.length;
          return (
            <g key={i}>
              <text x={X0 - 6} y={y + 14} textAnchor="end" className="viz-label">{isTotal ? "logit" : labels[i]}</text>
              <rect x={Math.min(sx(0), sx(v))} y={y + 2} width={Math.abs(sx(v) - sx(0))} height={rowH - 8} fill={isTotal ? "var(--danger)" : "var(--accent)"} />
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`${run.parts.map((v) => v.toFixed(2)).join(" + ")} = ${run.total.toFixed(2)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A residual stack of four randomly initialised MLP blocks on 8-dimensional vectors. Each block reads the stream and
        adds its output to it, so the final vector is the embedding plus the sum of every block&apos;s write. Any linear
        read-out, such as one logit, therefore splits exactly into one contribution per block, shown as bars. This additive
        structure is what lets later blocks build on earlier ones, and lets us ask which block wrote what.
      </figcaption>
    </figure>
  );
}
