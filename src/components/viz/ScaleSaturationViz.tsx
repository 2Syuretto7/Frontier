"use client";

import { useMemo, useState } from "react";

const N = 12, TRIALS = 200, DIMS = [4, 16, 64, 256, 1024];

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

function softmax(z: number[]) {
  const m = Math.max(...z), e = z.map((q) => Math.exp(q - m)), s = e.reduce((a, b) => a + b, 0);
  return e.map((q) => q / s);
}

/** Attention rows for random unit-variance queries and keys of dimension d, with or without the 1/√d scale. */
export function saturation(d: number, scaled: boolean) {
  const g = gaussian(d * 7 + 1);
  let traceSum = 0, entSum = 0, varSum = 0;
  let first: number[] = [];
  for (let t = 0; t < TRIALS; t++) {
    const q = Array.from({ length: d }, g);
    const z = Array.from({ length: N }, () => {
      let s = 0;
      for (let i = 0; i < d; i++) s += q[i] * g();
      return scaled ? s / Math.sqrt(d) : s;
    });
    const p = softmax(z);
    if (t === 0) first = p;
    traceSum += 1 - p.reduce((s, x) => s + x * x, 0);
    entSum += -p.reduce((s, x) => s + (x > 0 ? x * Math.log(x) : 0), 0);
    const mean = z.reduce((a, b) => a + b, 0) / N;
    varSum += z.reduce((s, x) => s + (x - mean) ** 2, 0) / (N - 1);
  }
  return { first, trace: traceSum / TRIALS, ent: entSum / TRIALS, sd: Math.sqrt(varSum / TRIALS) };
}

export function ScaleSaturationViz() {
  const [di, setDi] = useState(3);
  const [scaled, setScaled] = useState(false);
  const d = DIMS[di];
  const r = useMemo(() => saturation(d, scaled), [d, scaled]);
  const W = 320, H = 150, X1 = 10, PW = W - 20, PH = H - 30, bw = PW / N;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">key dimension</span>
        {DIMS.map((v, i) => (
          <button key={v} type="button" className="seg" aria-pressed={di === i} onClick={() => setDi(i)}>{v}</button>
        ))}
        <button type="button" className="seg" aria-pressed={scaled} onClick={() => setScaled(!scaled)}>divide by √d</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Attention weights over twelve keys for one random query">
        <line x1={X1} y1={8 + PH} x2={X1 + PW} y2={8 + PH} stroke="var(--border)" />
        {r.first.map((p, i) => (
          <rect key={i} x={X1 + i * bw + 2} y={8 + PH - p * PH} width={bw - 4} height={Math.max(p * PH, 0.5)} fill="var(--accent)" />
        ))}
        <text x={X1 + PW} y={18} textAnchor="end" className="viz-label">one query, twelve keys</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        <div>{`score standard deviation ${r.sd.toFixed(2)} (√d = ${Math.sqrt(d).toFixed(1)})`}</div>
        <div>{`mean entropy ${r.ent.toFixed(2)} of a possible ${Math.log(N).toFixed(2)}; mean trace of the softmax Jacobian ${r.trace.toFixed(3)}`}</div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Queries and keys with independent standard normal entries, averaged over {TRIALS} random queries. Without scaling,
        the scores spread like √d, so for large d the softmax puts almost all its weight on one key and its Jacobian, which
        carries every gradient back to the scores, shrinks towards zero. Dividing by √d keeps the score spread near 1 at
        every dimension, so attention stays soft and trainable however wide the heads are.
      </figcaption>
    </figure>
  );
}
