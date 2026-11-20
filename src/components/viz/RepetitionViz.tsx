"use client";

import { useState } from "react";

const RSTAR = 15.4;
const N = 8e9;

/** Effective number of tokens from training `epochs` passes over `unique` tokens (Muennighoff and colleagues). */
export function effectiveData(unique: number, epochs: number) {
  return unique + unique * RSTAR * (1 - Math.exp(-(epochs - 1) / RSTAR));
}

/** Chinchilla fit of Hoffmann and colleagues. */
export function chinchillaLoss(n: number, d: number) {
  return 1.69 + 406.4 / Math.pow(n, 0.34) + 410.7 / Math.pow(d, 0.28);
}

const EPOCHS = [1, 2, 4, 8, 16, 32, 64];

export function RepetitionViz() {
  const [U, setU] = useState(50);
  const [ep, setEp] = useState(4);
  const W = 330, H = 175, X0 = 34, PW = 286, Y0 = 10, PH = 120;
  const lx0 = Math.log(10), lx1 = Math.log(6400);
  const px = (d: number) => X0 + ((Math.log(d) - lx0) / (lx1 - lx0)) * PW;
  const py = (d: number) => Y0 + PH - ((Math.log(Math.max(10, d)) - lx0) / (lx1 - lx0)) * PH;
  const ds: number[] = [];
  for (let i = 0; i <= 80; i++) ds.push(Math.exp(lx0 + ((lx1 - lx0) * i) / 80));
  const fresh = ds.map((d) => `${px(d).toFixed(1)},${py(d).toFixed(1)}`).join(" ");
  const rep = ds.filter((d) => d >= U).map((d) => `${px(d).toFixed(1)},${py(effectiveData(U, d / U)).toFixed(1)}`).join(" ");
  const D = U * ep;
  const eff = effectiveData(U, ep);
  const lr = chinchillaLoss(N, eff * 1e9), lf = chinchillaLoss(N, D * 1e9);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Unique tokens available">
          {[25, 50, 100].map((u) => (
            <button key={u} className="seg" aria-pressed={U === u} onClick={() => setU(u)}>{u}B unique</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Epochs">
          {EPOCHS.map((e) => (
            <button key={e} className="seg" aria-pressed={ep === e} onClick={() => setEp(e)}>{e}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Predicted loss against tokens trained, with fresh data and with repeated data">
        {[100, 1000].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v >= 1000 ? `${v / 1000}T` : `${v}B`}</text>
          </g>
        ))}
        {[10, 100, 1000].map((d) => (
          <text key={d} x={px(d)} y={Y0 + PH + 12} textAnchor="middle" className="viz-label">{d >= 1000 ? `${d / 1000}T` : `${d}B`}</text>
        ))}
        <polyline points={fresh} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.4} />
        <polyline points={rep} fill="none" stroke="var(--code-function)" strokeWidth={2} />
        <line x1={px(U)} x2={px(U)} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        <circle cx={px(D)} cy={py(eff)} r={4} fill="var(--accent)" />
        <text x={X0} y={H - 14} className="viz-label">across: tokens trained; up: worth in fresh tokens (log)</text>
        <text x={X0} y={H - 2} className="viz-label">solid: repeating the unique data; dashed: all fresh</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {ep} epochs of {U}B: {D.toLocaleString("en-IN")}B tokens trained, worth {eff.toFixed(1)}B fresh; loss {lr.toFixed(4)} against{" "}
        {lf.toFixed(4)} with fresh data
      </div>
      <figcaption className="viz-caption">
        How many fresh tokens a run is worth when the extra tokens are new (dashed) and when they are repeats of a fixed
        pool (solid), discounted by the data-constrained scaling law. For the first few epochs the two nearly coincide:
        repeated data is almost as good as new. By sixteen epochs the solid curve is bending over towards its ceiling of
        16.4 times the pool, and beyond that more passes buy almost nothing. The readout turns this into the Chinchilla loss of
        an 8-billion-parameter model.
      </figcaption>
    </figure>
  );
}
