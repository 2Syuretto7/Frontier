"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const NETS = 2000;
const XS = Array.from({ length: 41 }, (_, i) => -3 + (i * 6) / 40);
const X0 = 1;

/** f(x) = Σ v_j relu(w_j x + b_j)/√n with all weights N(0, 1): samples of f at X0, and a few whole functions. */
export function wideSamples(width: number, seed: number) {
  const r = rand(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const at: number[] = [];
  const curves: number[][] = [];
  for (let k = 0; k < NETS; k++) {
    const w = Array.from({ length: width }, normal), b = Array.from({ length: width }, normal), v = Array.from({ length: width }, normal);
    const f = (x: number) => {
      let s = 0;
      for (let j = 0; j < width; j++) s += v[j] * Math.max(0, w[j] * x + b[j]);
      return s / Math.sqrt(width);
    };
    at.push(f(X0));
    if (k < 5) curves.push(XS.map(f));
  }
  const m = at.reduce((s, x) => s + x, 0) / NETS;
  const v2 = at.reduce((s, x) => s + (x - m) ** 2, 0) / NETS;
  const v4 = at.reduce((s, x) => s + (x - m) ** 4, 0) / NETS;
  return { at, curves, variance: v2, kurtosis: v4 / (v2 * v2) - 3 };
}

export function WideNetGpViz() {
  const [width, setWidth] = useState(3);
  const [seed, setSeed] = useState(1);
  const { at, curves, variance, kurtosis } = useMemo(() => wideSamples(width, seed), [width, seed]);
  const W = 330, H = 160, LX = 8, LW = 150, RX = 176, RW = 146, Y0 = 128, PH = 112;
  const fx = (x: number) => LX + ((x + 3) / 6) * LW;
  const fy = (y: number) => Y0 - PH / 2 - (Math.max(-4, Math.min(4, y)) / 4) * (PH / 2);
  const BINS = 30, LO = -4, HI = 4;
  const counts = new Array<number>(BINS).fill(0);
  for (const a of at) if (a >= LO && a < HI) counts[Math.floor(((a - LO) / (HI - LO)) * BINS)]++;
  const bw = RW / BINS, dens = (c: number) => c / (NETS * ((HI - LO) / BINS));
  const top = 0.75;
  const hy = (d: number) => Y0 - (Math.min(d, top) / top) * PH;
  const gauss = Array.from({ length: 81 }, (_, i) => {
    const z = LO + (i * (HI - LO)) / 80;
    return [RX + ((z - LO) / (HI - LO)) * RW, hy(Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI))];
  });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Hidden width">
          {[1, 3, 30, 300].map((n) => (
            <button key={n} className="seg" aria-pressed={width === n} onClick={() => setWidth(n)}>n = {n}</button>
          ))}
        </div>
        <button className="btn" onClick={() => setSeed((s) => s + 1)}>Resample</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Random functions from one-hidden-layer ReLU networks and the histogram of their values at x = 1">
        <line x1={LX} x2={LX + LW} y1={fy(0)} y2={fy(0)} stroke="var(--border)" />
        <line x1={fx(X0)} x2={fx(X0)} y1={Y0 - PH} y2={Y0} stroke="var(--border)" strokeDasharray="2 3" />
        {curves.map((c, k) => (
          <path key={k} d={c.map((y, i) => `${i ? "L" : "M"}${fx(XS[i]).toFixed(1)},${fy(y).toFixed(1)}`).join(" ")} fill="none" stroke="var(--code-function)" strokeWidth={1.4} opacity={0.8} />
        ))}
        <text x={LX} y={H - 4} className="viz-label">five networks on [−3, 3]</text>
        <line x1={RX} x2={RX + RW} y1={Y0} y2={Y0} stroke="var(--border)" />
        {counts.map((c, i) => <rect key={i} x={RX + i * bw} y={hy(dens(c))} width={bw - 0.6} height={Y0 - hy(dens(c))} fill="var(--code-function)" opacity={0.55} />)}
        <path d={gauss.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <text x={RX} y={H - 4} className="viz-label">f(1) over {NETS} networks</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        width {width}: variance of f(1) = {variance.toFixed(3)} (limit K(1, 1) = 1), excess kurtosis = {kurtosis.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        Random one-hidden-layer ReLU networks with every weight and bias drawn from N(0, 1) and the output divided by √n.
        Left: five sample functions; right: the values at x = 1 across 2000 networks, against the standard normal density.
        The variance is the same at every width, but a narrow network&apos;s output is heavy-tailed. As n grows the central
        limit theorem takes over, the excess kurtosis falls like 1/n, and the random function becomes a Gaussian process.
      </figcaption>
    </figure>
  );
}
