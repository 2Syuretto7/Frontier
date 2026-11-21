"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// clean data: equal mixture of N(-1, 0.2^2) and N(1, 0.2^2)
const NS = 1200,
  S0 = 0.2;
const r0 = rand(1943);
const gauss = () => {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const X0 = Array.from(
  { length: NS },
  (_, i) => (i % 2 ? 1 : -1) + S0 * gauss(),
);
const EPS = Array.from({ length: NS }, gauss);
const SIGMAS = [0.25, 0.5, 1];

/** Score of the noised mixture: components N(+-1, S0^2 + sigma^2). */
export function trueScore(x: number, sigma: number) {
  const v = S0 * S0 + sigma * sigma;
  const w1 = Math.exp(-((x - 1) ** 2) / (2 * v)),
    w2 = Math.exp(-((x + 1) ** 2) / (2 * v));
  return (-(x - 1) * w1 - (x + 1) * w2) / (v * (w1 + w2));
}

/** Denoising targets -eps/sigma at xt = x0 + sigma eps, their average in bins of xt, and the losses. */
export function dsm(sigma: number) {
  const pts = X0.map((x0, i) => ({
    x: x0 + sigma * EPS[i],
    y: -EPS[i] / sigma,
  }));
  const LO = -3,
    HI = 3,
    NB = 30;
  const sums = Array(NB).fill(0),
    cnt = Array(NB).fill(0);
  pts.forEach(({ x, y }) => {
    const b = Math.floor(((x - LO) / (HI - LO)) * NB);
    if (b >= 0 && b < NB) {
      sums[b] += y;
      cnt[b]++;
    }
  });
  const bins = sums.map((s, b) => ({
    x: LO + ((b + 0.5) * (HI - LO)) / NB,
    y: cnt[b] >= 8 ? s / cnt[b] : NaN,
  }));
  const lossTrue =
    pts.reduce((a, { x, y }) => a + (trueScore(x, sigma) - y) ** 2, 0) / NS;
  const gap = pts.reduce((a, { x }) => a + trueScore(x, sigma) ** 2, 0) / NS;
  return { pts, bins, lossTrue, gap };
}

export function DsmRegressionViz() {
  const [si, setSi] = useState(1);
  const sigma = SIGMAS[si];
  const { pts, bins, lossTrue } = dsm(sigma);
  const W = 340,
    H = 210,
    XL = 30,
    XR = W - 8,
    Y0 = 8,
    Y1 = H - 22,
    LO = -3,
    HI = 3,
    YM = 8;
  const sx = (x: number) => XL + ((x - LO) / (HI - LO)) * (XR - XL);
  const sy = (y: number) =>
    Y1 - ((Math.max(-YM, Math.min(YM, y)) + YM) / (2 * YM)) * (Y1 - Y0);
  const curve = Array.from(
    { length: 121 },
    (_, i) => LO + (i / 120) * (HI - LO),
  )
    .map((x, i) => `${i ? "L" : "M"}${sx(x)},${sy(trueScore(x, sigma))}`)
    .join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Noise level sigma">
          {SIGMAS.map((s, j) => (
            <button
              key={s}
              type="button"
              className="seg"
              aria-pressed={si === j}
              onClick={() => setSi(j)}
            >
              σ = {s}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Noisy regression targets whose average is the score of the noised data"
      >
        <line x1={XL} y1={sy(0)} x2={XR} y2={sy(0)} stroke="var(--border)" />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={1.1}
            style={{ fill: "var(--text-muted)", fillOpacity: 0.35 }}
          />
        ))}
        <path d={curve} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {bins.map((b, i) =>
          Number.isNaN(b.y) ? null : (
            <circle
              key={i}
              cx={sx(b.x)}
              cy={sy(b.y)}
              r={3}
              style={{ fill: "var(--danger)" }}
            />
          ),
        )}
        {[-YM, 0, YM].map((v) => (
          <text
            key={v}
            x={XL - 4}
            y={sy(v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {v}
          </text>
        ))}
        {[-2, 0, 2].map((x) => (
          <text
            key={x}
            x={sx(x)}
            y={H - 6}
            textAnchor="middle"
            className="viz-label"
          >
            {x}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        denoising loss of the true score: {lossTrue.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        Clean points near ±1 are noised to x = x₀ + σε, and each gets the target
        −ε/σ (grey dots), the score of the noise kernel. The targets are very
        noisy, and the loss of even the true score is large. But the average
        target in each bin of x (red) lies on the score of the noised data
        (curve): regressing onto the noisy targets learns the true score. At
        small σ the score is steep near the clusters and flat between them; at
        large σ the clusters blur together.
      </figcaption>
    </figure>
  );
}
