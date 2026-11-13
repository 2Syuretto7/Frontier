"use client";

import { useMemo, useState } from "react";

const L = 8, N = 48, B = 32;

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
const matmul = (X: number[][], W: number[][]) => X.map((r) => W[0].map((_, j) => r.reduce((s, v, i) => s + v * W[i][j], 0)));
const T = (M: number[][]) => M[0].map((_, j) => M.map((r) => r[j]));
const fro = (M: number[][]) => Math.sqrt(M.flat().reduce((s, v) => s + v * v, 0));

/** Per-layer ratio of update size to weight size, lr·‖∇W‖/‖W‖, for an 8-layer ReLU network. */
export function UpdateRatioViz() {
  const [lrExp, setLrExp] = useState(-3);
  const [scale, setScale] = useState(1);
  const ratios1 = useMemo(() => {
    const r = gauss(5);
    const Ws = Array.from({ length: L }, () => Array.from({ length: N }, () => Array.from({ length: N }, () => r() * scale * Math.sqrt(2 / N))));
    let x = Array.from({ length: B }, () => Array.from({ length: N }, () => r()));
    const xs: number[][][] = [], As: number[][][] = [];
    for (const W of Ws) { xs.push(x); const a = matmul(x, W); As.push(a); x = a.map((row) => row.map((v) => Math.max(v, 0))); }
    const target = x.map((row) => row.map(() => r()));
    let g = x.map((row, i) => row.map((v, j) => (v - target[i][j]) / B));
    const out: number[] = new Array(L);
    for (let l = L - 1; l >= 0; l--) {
      const d = g.map((row, i) => row.map((v, j) => (As[l][i][j] > 0 ? v : 0)));
      out[l] = fro(matmul(T(xs[l]), d)) / fro(Ws[l]);
      g = matmul(d, T(Ws[l]));
    }
    return out;
  }, [scale]);
  const lr = 10 ** lrExp;
  const ratios = ratios1.map((v) => lr * v);
  const W = 320, H = 170, lo = -9, hi = 1;
  const bw = (W - 44) / L;
  const py = (v: number) => 10 + ((hi - Math.max(lo, Math.min(hi, Math.log10(Math.max(v, 1e-300))))) / (hi - lo)) * (H - 34);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          lr {lr.toExponential(0)}
          <input type="range" min={-5} max={0} step={0.5} value={lrExp} onChange={(e) => setLrExp(Number(e.target.value))} aria-label="learning rate, log scale" style={{ width: 100 }} />
        </label>
        <button type="button" className="seg" aria-pressed={scale === 1} onClick={() => setScale(1)}>He init</button>
        <button type="button" className="seg" aria-pressed={scale === 0.5} onClick={() => setScale(0.5)}>0.5 × He</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Update to weight ratio per layer, log scale">
        <rect x={34} y={py(1e-2)} width={W - 44} height={py(1e-4) - py(1e-2)} fill="var(--accent-soft)" />
        {[0, -3, -6, -9].map((e) => (
          <g key={e}>
            <line x1={34} x2={W - 10} y1={py(10 ** e)} y2={py(10 ** e)} stroke="var(--border)" />
            <text x={30} y={py(10 ** e) + 4} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        {ratios.map((v, l) => {
          const ok = v >= 1e-4 && v <= 1e-2;
          return <rect key={l} x={34 + l * bw + 4} y={py(v)} width={bw - 8} height={Math.max(0, H - 24 - py(v))} fill={ok ? "var(--accent)" : "var(--danger)"} />;
        })}
        {ratios.map((_, l) => <text key={l} x={34 + l * bw + bw / 2} y={H - 8} textAnchor="middle" className="viz-label">{l + 1}</text>)}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Each bar is one layer's lr·‖∇W‖/‖W‖: the fraction by which one SGD step changes that layer's weights. The shaded band,
        1e-4 to 1e-2, is a common rule of thumb for healthy training (about 1e-3 is typical). Too high and the weights are
        thrashing; too low and the layer is effectively frozen. With 0.5 × He every layer's activations and gradients shrink
        together, so all the ratios drop about 250-fold at once: the same learning rate now barely moves the network.
      </figcaption>
    </figure>
  );
}
