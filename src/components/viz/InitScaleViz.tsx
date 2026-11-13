"use client";

import { useMemo, useState } from "react";

const WIDTH = 128, BATCH = 32, DEPTH = 20;
type Scheme = { key: string; label: string; std: number };
const SCHEMES: Scheme[] = [
  { key: "small", label: "std 0.01", std: 0.01 },
  { key: "xavier", label: "1/√n (Xavier)", std: Math.sqrt(1 / WIDTH) },
  { key: "he", label: "√(2/n) (He)", std: Math.sqrt(2 / WIDTH) },
  { key: "one", label: "std 1", std: 1 },
];

function gaussFactory(seed: number) {
  let s = seed;
  const u = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
}

function stds(std: number) {
  const g = gaussFactory(42);
  let x = Array.from({ length: BATCH }, () => Float64Array.from({ length: WIDTH }, g));
  const out: number[] = [];
  for (let l = 0; l < DEPTH; l++) {
    const W = Array.from({ length: WIDTH }, () => Float64Array.from({ length: WIDTH }, () => g() * std));
    x = x.map((row) => {
      const y = new Float64Array(WIDTH);
      for (let i = 0; i < WIDTH; i++) { const v = row[i]; if (v !== 0) { const Wi = W[i]; for (let j = 0; j < WIDTH; j++) y[j] += v * Wi[j]; } }
      for (let j = 0; j < WIDTH; j++) y[j] = Math.max(y[j], 0);
      return y;
    });
    let s = 0, s2 = 0;
    x.forEach((r) => r.forEach((v) => { s += v; s2 += v * v; }));
    const n = BATCH * WIDTH, m = s / n;
    out.push(Math.sqrt(Math.max(s2 / n - m * m, 0)));
  }
  return out;
}

/** Standard deviation of the activations through 20 ReLU layers, for four weight scales. */
export function InitScaleViz() {
  const [k, setK] = useState(2);
  const s = useMemo(() => stds(SCHEMES[k].std), [k]);
  const W = 340, H = 180, L = 40;
  const px = (l: number) => L + (l / (DEPTH - 1)) * (W - L - 10);
  const py = (v: number) => { const e = Math.max(-20, Math.min(20, Math.log10(Math.max(v, 1e-300)))); return 10 + ((20 - e) / 40) * (H - 30); };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {SCHEMES.map((sc, i) => (
          <button key={sc.key} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{sc.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Activation standard deviation per layer, log scale">
        {[20, 10, 0, -10, -20].map((e) => (
          <g key={e}>
            <line x1={L} x2={W - 10} y1={py(10 ** e)} y2={py(10 ** e)} stroke={e === 0 ? "var(--text-faint)" : "var(--border)"} />
            <text x={L - 4} y={py(10 ** e) + 4} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={s.map((v, l) => `${px(l)},${py(v)}`).join(" ")} />
        {s.map((v, l) => <circle key={l} cx={px(l)} cy={py(v)} r={2.2} fill="var(--accent)" />)}
        <text x={W - 10} y={H - 4} textAnchor="end" className="viz-label">layer 1 to {DEPTH}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "4px 0" }}>std after layer {DEPTH}: {s[DEPTH - 1].toExponential(1)}</div>
      <figcaption className="viz-caption" aria-live="polite">
        Width {WIDTH}, ReLU after every layer, inputs of std 1.{" "}
        {k === 2
          ? "With variance 2/n the scale stays near 1 at every depth: ReLU zeroes half the signal, and the factor 2 puts it back."
          : k === 1
            ? "Variance 1/n is right for a linear or tanh layer, but ReLU halves the second moment each layer, so the scale shrinks by about √2 per layer."
            : k === 0
              ? "Each layer multiplies the scale by about 0.11, so after 20 layers the signal is around 1e-19: the network outputs essentially nothing and gradients vanish."
              : "Each layer multiplies the scale by about 8, so after 20 layers activations are around 1e15 and the loss overflows."}
      </figcaption>
    </figure>
  );
}
