"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const TIMES = [0.1, 0.4, 1, 3];
const THETA = 1, SIGMA = 1, X0 = 2.5, M = 4000, H = 0.01, BINS = 36, LO = -3, HI = 4;

/** Exact law of the Ornstein-Uhlenbeck process dX = -θX dt + σ dB at time t from X0: normal mean and variance. */
export const ouLaw = (t: number) => ({ m: X0 * Math.exp(-THETA * t), v: (SIGMA * SIGMA * (1 - Math.exp(-2 * THETA * t))) / (2 * THETA) });

/** Euler-Maruyama particles at each time in TIMES. */
export function simulate(seed: number) {
  const z = makeNormal(makeRng(seed)), x = new Array(M).fill(X0), out: number[][] = [];
  let t = 0;
  for (const T of TIMES) {
    while (t < T - 1e-9) {
      for (let i = 0; i < M; i++) x[i] += -THETA * x[i] * H + SIGMA * Math.sqrt(H) * z();
      t += H;
    }
    out.push(x.slice());
  }
  return out;
}

export function OuDensityViz() {
  const [k, setK] = useState(1);
  const [snaps, setSnaps] = useState<number[][] | null>(null);
  useEffect(() => setSnaps(simulate(11)), []);
  const W = 330, HT = 150, XL = 10, PW = W - 20, bw = (HI - LO) / BINS, top = 1.6;
  const sx = (v: number) => XL + ((v - LO) / (HI - LO)) * PW, sy = (d: number) => HT - (Math.min(d, top) / top) * (HT - 10);
  const counts = new Array(BINS).fill(0);
  snaps?.[k].forEach((v) => { const b = Math.floor((v - LO) / bw); if (b >= 0 && b < BINS) counts[b]++; });
  const { m, v } = ouLaw(TIMES[k]);
  const pdf = (x: number) => Math.exp(-((x - m) ** 2) / (2 * v)) / Math.sqrt(2 * Math.PI * v);
  const st = ouLaw(Infinity).v, spdf = (x: number) => Math.exp(-(x * x) / (2 * st)) / Math.sqrt(2 * Math.PI * st);
  const grid = Array.from({ length: 141 }, (_, i) => LO + ((HI - LO) * i) / 140);
  const s = snaps?.[k];
  const mean = s ? s.reduce((a, b) => a + b, 0) / M : 0, vr = s ? s.reduce((a, b) => a + (b - mean) ** 2, 0) / M : 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {TIMES.map((t, i) => (
          <button key={t} type="button" className="seg" aria-pressed={i === k} onClick={() => setK(i)}>t = {t}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${HT + 4}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of simulated diffusion particles against the exact density">
        {counts.map((c, b) => (
          <rect key={b} x={sx(LO + b * bw) + 0.5} y={sy(c / (M * bw))} width={Math.max(0, sx(LO + bw) - sx(LO) - 1)} height={HT - sy(c / (M * bw))} fill="var(--accent)" opacity={0.55} />
        ))}
        <polyline fill="none" stroke="var(--text-muted)" strokeDasharray="3 3" points={grid.map((x) => `${sx(x)},${sy(spdf(x))}`).join(" ")} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.5} points={grid.map((x) => `${sx(x)},${sy(pdf(x))}`).join(" ")} />
        <line x1={XL} y1={HT} x2={XL + PW} y2={HT} stroke="var(--border)" />
        <line x1={sx(X0)} y1={HT} x2={sx(X0)} y2={HT - 6} stroke="var(--danger)" strokeWidth={2} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {s ? `simulated mean ${mean.toFixed(2)}, variance ${vr.toFixed(3)}; exact ${m.toFixed(2)}, ${v.toFixed(3)}` : "simulating"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Four thousand Euler-Maruyama paths of dX = −X dt + dB, all started at 2.5 (red tick). The histogram at time t matches
        the solution of the Fokker-Planck equation (solid line), a normal density whose mean decays like e^(−t) while its
        variance grows to ½. The dashed curve is the stationary density, which the particles approach after a few units of
        time.
      </figcaption>
    </figure>
  );
}
