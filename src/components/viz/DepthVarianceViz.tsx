"use client";

import { useMemo, useState } from "react";

const N = 64, DEPTH = 40, B = 32;

function rng(seed: number) {
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

/** Standard deviation of activations layer by layer in a deep linear network, for a chosen per-layer gain. */
export function DepthVarianceViz() {
  const [gain, setGain] = useState(1.1);
  const sim = useMemo(() => {
    const r = rng(7);
    let x = Array.from({ length: B }, () => Array.from({ length: N }, () => r()));
    const out: number[] = [];
    for (let l = 0; l < DEPTH; l++) {
      const W = Array.from({ length: N }, () => Array.from({ length: N }, () => (r() * gain) / Math.sqrt(N)));
      x = x.map((row) => Array.from({ length: N }, (_, j) => row.reduce((s, v, i) => s + v * W[i][j], 0)));
      const flat = x.flat();
      const m = flat.reduce((s, v) => s + v, 0) / flat.length;
      out.push(Math.sqrt(flat.reduce((s, v) => s + (v - m) ** 2, 0) / flat.length));
    }
    return out;
  }, [gain]);
  const W = 320, H = 180;
  const px = (l: number) => 34 + (l / DEPTH) * (W - 44);
  const py = (s: number) => {
    const v = Math.max(-4, Math.min(4, Math.log10(Math.max(s, 1e-300))));
    return 10 + ((4 - v) / 8) * (H - 34);
  };
  const theory = Array.from({ length: DEPTH + 1 }, (_, l) => `${px(l).toFixed(1)},${py(gain ** l).toFixed(1)}`).join(" ");
  const measured = [1, ...sim].map((s, l) => `${px(l).toFixed(1)},${py(s).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          σ_w·√n = {gain.toFixed(2)}
          <input type="range" min={0.7} max={1.3} step={0.01} value={gain} onChange={(e) => setGain(Number(e.target.value))} aria-label="per-layer gain" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Activation standard deviation against depth, log scale">
        {[4, 2, 0, -2, -4].map((e) => (
          <g key={e}>
            <line x1={34} x2={W - 10} y1={py(10 ** e)} y2={py(10 ** e)} stroke="var(--border)" />
            <text x={30} y={py(10 ** e) + 4} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        {[0, 10, 20, 30, 40].map((l) => <text key={l} x={px(l)} y={H - 8} textAnchor="middle" className="viz-label">{l}</text>)}
        <polyline fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.5} points={theory} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={measured} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        std after {DEPTH} layers: measured {sim[DEPTH - 1].toExponential(2)}, predicted {(gain ** DEPTH).toExponential(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each layer multiplies the standard deviation by σ_w·√n (dashed line), so after 40 layers a gain of 1.1 gives 45 and a
        gain of 0.9 gives 0.015. The blue line is a real 64-wide network with random weights: it follows the prediction, with a
        little noise. Only a gain of exactly 1 keeps the signal at its starting size.
      </figcaption>
    </figure>
  );
}
