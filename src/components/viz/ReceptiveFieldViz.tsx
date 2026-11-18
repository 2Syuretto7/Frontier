"use client";

import { useState } from "react";

const DEPTHS = [1, 2, 4, 8, 16];

/** Weight each input position receives in one output after L layers of 3-wide uniform kernels, optionally dilated 1, 2, 4, ... */
export function profile(L: number, dilated: boolean) {
  let w = [1];
  for (let l = 0; l < L; l++) {
    const d = dilated ? 2 ** l : 1, out = new Array(w.length + 2 * d).fill(0);
    w.forEach((v, i) => { for (let u = 0; u < 3; u++) out[i + u * d] += v / 3; });
    w = out;
  }
  return w;
}

export const spread = (w: number[]) => {
  const c = (w.length - 1) / 2;
  return Math.sqrt(w.reduce((a, v, i) => a + v * (i - c) ** 2, 0));
};

export function ReceptiveFieldViz() {
  const [L, setL] = useState(4);
  const [dilated, setDilated] = useState(false);
  const depths = dilated ? DEPTHS.filter((d) => d <= 8) : DEPTHS;
  const depth = depths.includes(L) ? L : 8;
  const w = profile(depth, dilated), n = w.length, peak = Math.max(...w);
  const W = 330, H = 140, X0 = 10, PW = W - 20;
  const sx = (i: number) => X0 + ((i + 0.5) / n) * PW, sy = (v: number) => H - 6 - (v / peak) * (H - 20);
  const s = spread(w);
  const c = (n - 1) / 2;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {depths.map((d) => (
          <button key={d} type="button" className="seg" aria-pressed={d === depth} onClick={() => setL(d)}>{d} {d === 1 ? "layer" : "layers"}</button>
        ))}
        <button type="button" className="seg" aria-pressed={dilated} onClick={() => setDilated((v) => !v)}>dilation 1, 2, 4, …</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Influence of each input position on one output unit">
        <rect x={sx(c - s) } y={10} width={Math.max(1, sx(c + s) - sx(c - s))} height={H - 16} fill="var(--accent)" opacity={0.12} />
        <line x1={X0} y1={H - 6} x2={X0 + PW} y2={H - 6} stroke="var(--border)" />
        {n <= 70
          ? w.map((v, i) => <rect key={i} x={sx(i) - (PW / n) * 0.4} y={sy(v)} width={(PW / n) * 0.8} height={H - 6 - sy(v)} fill="var(--accent)" />)
          : <polyline fill="none" stroke="var(--accent)" strokeWidth={1.5} points={w.map((v, i) => `${sx(i)},${sy(v)}`).join(" ")} />}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        receptive field {n} inputs wide; effective width (±1 sd) about {(2 * s).toFixed(1)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        One output unit after a stack of 3-wide averaging convolutions, and how much each input position contributes to it.
        The theoretical receptive field, the whole axis, grows by 2 per layer, but the weight piles up in the middle like a
        bell curve whose width grows only like the square root of depth (shaded band). Doubling the dilation at each layer
        makes the receptive field grow exponentially instead, and spreads the weight far more evenly.
      </figcaption>
    </figure>
  );
}
