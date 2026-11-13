"use client";

import { useMemo, useState } from "react";

const N = 32, B = 16, L = 20;

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

type Cfg = { label: string; f: (a: number) => number; df: (a: number) => number; std: number };
const sig = (a: number) => 1 / (1 + Math.exp(-a));
const CFGS: Cfg[] = [
  { label: "sigmoid, Xavier", f: sig, df: (a) => sig(a) * (1 - sig(a)), std: Math.sqrt(1 / N) },
  { label: "tanh, Xavier", f: Math.tanh, df: (a) => 1 - Math.tanh(a) ** 2, std: Math.sqrt(1 / N) },
  { label: "ReLU, He", f: (a) => Math.max(a, 0), df: (a) => (a > 0 ? 1 : 0), std: Math.sqrt(2 / N) },
  { label: "ReLU, 1.5 × He", f: (a) => Math.max(a, 0), df: (a) => (a > 0 ? 1 : 0), std: 1.5 * Math.sqrt(2 / N) },
];

const matmul = (X: number[][], W: number[][]) => X.map((row) => W[0].map((_, j) => row.reduce((s, v, i) => s + v * W[i][j], 0)));
const T = (M: number[][]) => M[0].map((_, j) => M.map((r) => r[j]));

/** Norm of each layer's weight gradient in a 20-layer network, for four activation and initialisation choices. */
export function GradDepthViz() {
  const [k, setK] = useState(0);
  const norms = useMemo(() => {
    const c = CFGS[k], r = rng(3);
    let x = Array.from({ length: B }, () => Array.from({ length: N }, () => r()));
    const Ws = Array.from({ length: L }, () => Array.from({ length: N }, () => Array.from({ length: N }, () => r() * c.std)));
    const xs: number[][][] = [], As: number[][][] = [];
    for (const W of Ws) {
      xs.push(x);
      const a = matmul(x, W);
      As.push(a);
      x = a.map((row) => row.map(c.f));
    }
    let g = x.map((row) => row.map(() => 1));
    const out: number[] = new Array(L);
    for (let l = L - 1; l >= 0; l--) {
      const d = g.map((row, i) => row.map((v, j) => v * c.df(As[l][i][j])));
      const gW = matmul(T(xs[l]), d);
      out[l] = Math.sqrt(gW.flat().reduce((s, v) => s + v * v, 0));
      g = matmul(d, T(Ws[l]));
    }
    return out;
  }, [k]);
  const W = 320, H = 170, lo = -14, hi = 6;
  const bw = (W - 44) / L;
  const py = (v: number) => 10 + ((hi - Math.max(lo, Math.min(hi, Math.log10(Math.max(v, 1e-300))))) / (hi - lo)) * (H - 34);
  const ratio = norms[0] / norms[L - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {CFGS.map((c, i) => (
          <button key={c.label} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{c.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Gradient norm per layer, log scale">
        {[6, 0, -7, -14].map((e) => (
          <g key={e}>
            <line x1={34} x2={W - 10} y1={py(10 ** e)} y2={py(10 ** e)} stroke="var(--border)" />
            <text x={30} y={py(10 ** e) + 4} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        {norms.map((v, l) => (
          <rect key={l} x={34 + l * bw + 1} y={py(v)} width={bw - 2} height={Math.max(0, H - 24 - py(v))} fill="var(--accent)" />
        ))}
        <text x={34} y={H - 8} className="viz-label">layer 1</text>
        <text x={W - 10} y={H - 8} textAnchor="end" className="viz-label">layer {L}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        ‖∂L/∂W₁‖ / ‖∂L/∂W₂₀‖ = {ratio.toExponential(1)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each bar is the size of one layer's weight gradient, on a log scale. Going backwards, every layer multiplies the
        gradient by Wᵀ and by the activation's slope. With sigmoid, whose slope is at most ¼, the first layer's gradient is
        about twelve orders of magnitude smaller than the last's, so the early layers barely train. With 1.5 × He the bars are
        level but enormous: activations grow by 1.5 per layer going forwards, and gradients grow going backwards.
      </figcaption>
    </figure>
  );
}
