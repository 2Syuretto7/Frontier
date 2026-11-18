"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const HS = [0.1, 0.5, 1, 1.5];
const M = 4000, STEPS = 150, BINS = 30, LO = -4.5, HI = 4.5;

/** Run M particles of ULA or MALA on N(0, 1) for STEPS steps from 0 and return their positions. */
export function particles(h: number, adjust: boolean, seed: number) {
  const rng = makeRng(seed), z = makeNormal(rng), s = Math.sqrt(2 * h);
  const lq = (a: number, b: number) => -((b - a + h * a) ** 2) / (4 * h);
  const x = new Array(M).fill(0);
  let acc = 0;
  for (let t = 0; t < STEPS; t++) {
    for (let i = 0; i < M; i++) {
      const y = x[i] - h * x[i] + s * z();
      if (!adjust) { x[i] = y; continue; }
      const la = -0.5 * y * y + 0.5 * x[i] * x[i] + lq(y, x[i]) - lq(x[i], y);
      if (Math.log(Math.max(rng(), 1e-300)) < la) { x[i] = y; acc++; }
    }
  }
  return { x, acc: adjust ? acc / (M * STEPS) : 1 };
}

export const variance = (x: number[]) => {
  const m = x.reduce((s, v) => s + v, 0) / x.length;
  return x.reduce((s, v) => s + (v - m) ** 2, 0) / x.length;
};

export function LangevinBiasViz() {
  const [h, setH] = useState(1);
  const [adjust, setAdjust] = useState(false);
  const [res, setRes] = useState<{ x: number[]; acc: number } | null>(null);
  useEffect(() => setRes(particles(h, adjust, 7)), [h, adjust]);
  const W = 330, H = 150, X0 = 10, PW = W - 20, bw = (HI - LO) / BINS;
  const counts = new Array(BINS).fill(0);
  res?.x.forEach((v) => { const k = Math.floor((v - LO) / bw); if (k >= 0 && k < BINS) counts[k]++; });
  const dens = counts.map((c) => c / (M * bw));
  const top = 0.6, sx = (v: number) => X0 + ((v - LO) / (HI - LO)) * PW, sy = (d: number) => H - (Math.min(d, top) / top) * (H - 10);
  const curve = Array.from({ length: 91 }, (_, i) => LO + ((HI - LO) * i) / 90).map((v) => `${sx(v)},${sy(Math.exp(-0.5 * v * v) / Math.sqrt(2 * Math.PI))}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {HS.map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={v === h} onClick={() => setH(v)}>h = {v}</button>
        ))}
        <button type="button" className="seg" aria-pressed={adjust} onClick={() => setAdjust((a) => !a)}>Metropolis correction</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 4}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of Langevin particles against the standard normal density">
        {dens.map((d, k) => (
          <rect key={k} x={sx(LO + k * bw) + 0.5} y={sy(d)} width={Math.max(0, sx(LO + bw) - sx(LO) - 1)} height={H - sy(d)} fill="var(--accent)" opacity={0.55} />
        ))}
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.5} points={curve} />
        <line x1={X0} y1={H} x2={X0 + PW} y2={H} stroke="var(--border)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {res
          ? `sample variance ${variance(res.x).toFixed(2)} (target 1${adjust ? "" : `, ULA theory ${(1 / (1 - h / 2)).toFixed(2)}`})${adjust ? `; accepted ${(100 * res.acc).toFixed(0)}%` : ""}`
          : "simulating"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Four thousand particles run {STEPS} steps of the discretised Langevin update x ← x − hx + √(2h) ξ for a standard normal
        target (line). Without correction the histogram settles on a normal distribution that is too wide by the factor
        1/(1 − h/2), a bias that vanishes only as h → 0. Treating the step as a proposal and adding a Metropolis test removes the
        bias at the cost of some rejections.
      </figcaption>
    </figure>
  );
}
