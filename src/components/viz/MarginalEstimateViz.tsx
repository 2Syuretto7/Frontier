"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

/** Decoder of the latent-variable model: x = g(z) + sigma * noise, with z ~ N(0, 1). */
export const g = (z: number) => z + 1.5 * Math.tanh(2 * z);
export const X0 = 0.6;
const lnorm = (x: number, m: number, v: number) => -0.5 * Math.log(2 * Math.PI * v) - (x - m) ** 2 / (2 * v);

/** log p(x) by quadrature over z. */
export function trueLogP(x: number, s: number) {
  const N = 40001, a = -6, h = 12 / (N - 1);
  let acc = 0;
  for (let i = 0; i < N; i++) { const z = a + i * h; acc += Math.exp(lnorm(x, g(z), s * s) + lnorm(z, 0, 1)) * h; }
  return Math.log(acc);
}

/** T independent Monte Carlo estimates of log p(x), each from K prior samples of z. */
export function estimates(x: number, s: number, K: number, T: number, seed: number) {
  const r = rand(seed), out: number[] = [];
  for (let t = 0; t < T; t++) {
    const ls: number[] = [];
    for (let k = 0; k < K; k++) {
      const z = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
      ls.push(lnorm(x, g(z), s * s));
    }
    const m = Math.max(...ls);
    out.push(m + Math.log(ls.reduce((acc, l) => acc + Math.exp(l - m), 0)) - Math.log(K));
  }
  return out;
}

const KS = [1, 10, 100, 1000], SS = [0.5, 0.1, 0.02];

export function MarginalEstimateViz() {
  const [ki, setKi] = useState(1), [si, setSi] = useState(1);
  const K = KS[ki], s = SS[si];
  const truth = useMemo(() => trueLogP(X0, s), [s]);
  const est = useMemo(() => estimates(X0, s, K, 200, 11 + ki * 7 + si), [K, s, ki, si]);
  const mean = est.reduce((a, v) => a + v, 0) / est.length;
  const sd = Math.sqrt(est.reduce((a, v) => a + (v - mean) ** 2, 0) / est.length);
  const W = 330, H = 120, XL = 12, PW = W - 24, LO = -30, HI = 5;
  const sx = (v: number) => XL + ((Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">samples of z per estimate</span>
        <div className="segmented" role="group" aria-label="Samples per estimate">
          {KS.map((k, i) => <button key={k} type="button" className="seg" aria-pressed={ki === i} onClick={() => setKi(i)}>{k}</button>)}
        </div>
        <span className="viz-label">decoder noise σ</span>
        <div className="segmented" role="group" aria-label="Decoder noise">
          {SS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Monte Carlo estimates of log-likelihood against the true value">
        <line x1={XL} x2={XL + PW} y1={70} y2={70} stroke="var(--border-strong)" />
        {est.map((v, i) => <circle key={i} cx={sx(v)} cy={30 + (i % 9) * 4.5} r={2} fill={v < LO ? "var(--danger)" : "var(--accent)"} fillOpacity={0.6} />)}
        <line x1={sx(truth)} x2={sx(truth)} y1={18} y2={74} stroke="var(--success)" strokeWidth={2} />
        <text x={sx(truth)} y={13} textAnchor="middle" className="viz-label">true log p(x)</text>
        {[-30, -20, -10, 0].map((t) => <text key={t} x={sx(t)} y={88} textAnchor="middle" className="viz-label">{t}</text>)}
        <text x={XL + PW / 2} y={H - 6} textAnchor="middle" className="viz-label">estimated log p(x) at x = 0.6 (200 repeats)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`true ${truth.toFixed(3)}, mean estimate ${mean.toFixed(3)}, spread ${sd.toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        A latent-variable model draws z from N(0, 1) and outputs g(z) plus Gaussian noise of size σ. Its likelihood is an
        average of p(x | z) over z, here estimated by sampling z from the prior. Each dot is one estimate of log p(x). The
        estimates sit below the truth on average, as Jensen&apos;s inequality says they must, and the gap shrinks with more samples.
        As σ shrinks, almost every z gives a negligible p(x | z) and many estimates fall off the scale (red). With σ = 0.1,
        10 samples miss by 14 nats on average and 100 samples by 0.2; with σ = 0.02, 100 samples still miss by 4.4. With σ = 0
        the model has no density at all.
      </figcaption>
    </figure>
  );
}
