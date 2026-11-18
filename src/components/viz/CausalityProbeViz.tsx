"use client";

import { useMemo, useState } from "react";

const V = 12, D = 16, NL = 2, T = 8;

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

type Mat = number[][];
const mat = (g: () => number, m: number, n: number, s: number): Mat => Array.from({ length: m }, () => Array.from({ length: n }, () => s * g()));
const mul = (A: Mat, B: Mat): Mat => A.map((r) => B[0].map((_, j) => r.reduce((acc, v, k) => acc + v * B[k][j], 0)));
const rms = (A: Mat): Mat => A.map((r) => { const s = Math.sqrt(r.reduce((a, v) => a + v * v, 0) / r.length + 1e-6); return r.map((v) => v / s); });
const add = (A: Mat, B: Mat): Mat => A.map((r, i) => r.map((v, j) => v + B[i][j]));

const g = gaussian(11);
const E = mat(g, V, D, 1), POS = mat(g, T, D, 0.5);
const BLOCKS = Array.from({ length: NL }, () => ({
  Wq: mat(g, D, D, 1 / 4), Wk: mat(g, D, D, 1 / 4), Wv: mat(g, D, D, 1 / 4), Wo: mat(g, D, D, 1 / 4),
  W1: mat(g, D, 4 * D, 1 / 4), W2: mat(g, 4 * D, D, 1 / 8),
}));
const ET = Array.from({ length: D }, (_, i) => E.map((r) => r[i]));
const BASE = Array.from({ length: T }, (_, i) => (i * 5 + 3) % V);

/** Logits of a small random pre-norm GPT; masked = false lets every position attend to every other. */
export function gptLogits(tokens: number[], masked: boolean): Mat {
  let x = add(tokens.map((t) => E[t]), POS.slice(0, tokens.length));
  for (const p of BLOCKS) {
    const h = rms(x);
    const q = mul(h, p.Wq), k = mul(h, p.Wk), v = mul(h, p.Wv);
    const a = q.map((qi, i) => {
      const s = k.map((kj, j) => (masked && j > i ? -Infinity : qi.reduce((acc, val, c) => acc + val * kj[c], 0) / Math.sqrt(D)));
      const m = Math.max(...s), e = s.map((z) => Math.exp(z - m)), tot = e.reduce((u, w) => u + w, 0);
      return e.map((z) => z / tot);
    });
    x = add(x, mul(mul(a, v), p.Wo));
    x = add(x, mul(mul(rms(x), p.W1).map((r) => r.map((u) => Math.max(u, 0))), p.W2));
  }
  return mul(rms(x), ET);
}

/** Size of the change in each position's logits when the token at position k is replaced. */
export function probe(k: number, masked: boolean) {
  const changed = BASE.slice();
  changed[k] = (changed[k] + 4) % V;
  const a = gptLogits(BASE, masked), b = gptLogits(changed, masked);
  return a.map((r, i) => Math.sqrt(r.reduce((s, v, j) => s + (v - b[i][j]) ** 2, 0)));
}

export function CausalityProbeViz() {
  const [k, setK] = useState(3);
  const [masked, setMasked] = useState(true);
  const diff = useMemo(() => probe(k, masked), [k, masked]);
  const W = 320, H = 150, X0 = 10, PW = W - 20, bw = PW / T, top = 10, PH = 100;
  const M = Math.max(...diff, 1e-9);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">change the token at position</span>
        {BASE.map((_, i) => (
          <button key={i} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{i + 1}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">attention</span>
        <button type="button" className="seg" aria-pressed={masked} onClick={() => setMasked(true)}>causal</button>
        <button type="button" className="seg" aria-pressed={!masked} onClick={() => setMasked(false)}>unmasked</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Change in each position's logits after one input token is replaced">
        <line x1={X0} x2={W - 10} y1={top + PH} y2={top + PH} stroke="var(--border)" />
        {diff.map((v, i) => {
          const h = (v / M) * PH;
          return (
            <g key={i}>
              <rect x={X0 + i * bw + 4} y={top + PH - h} width={bw - 8} height={h} fill={i === k ? "var(--danger)" : "var(--accent)"} />
              <text x={X0 + i * bw + bw / 2} y={top + PH + 16} textAnchor="middle" className="viz-label">{i + 1}</text>
              <text x={X0 + i * bw + bw / 2} y={top + PH + 32} textAnchor="middle" className="viz-label">{v === 0 ? "0" : v.toFixed(2)}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        A two-block GPT with random weights reads eight tokens. Replacing the token at the chosen position (red) changes the
        logits at that position and, through attention, at every later one; with causal attention the earlier positions
        change by exactly 0, so their predictions never peek at what comes next. Switch the mask off and every position
        changes, which is why a model trained that way could simply copy its targets.
      </figcaption>
    </figure>
  );
}
