"use client";

import { useState } from "react";

// real data: equal mixture of N(-1, 0.4^2) and N(2, 0.4^2); fake: N(theta, 0.6^2); grid on [-4, 5]
const LO = -6,
  HI = 6,
  NG = 1201,
  DX = (HI - LO) / (NG - 1),
  GRID = Array.from({ length: NG }, (_, k) => LO + k * DX);
const npdf = (x: number, m: number, s: number) =>
  Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
const REAL = GRID.map((x) => 0.5 * npdf(x, -1, 0.4) + 0.5 * npdf(x, 2, 0.4));
const THETAS = [-2.5, 0.5, 3];
const cum = (p: number[]) => {
  let s = 0;
  return p.map((v) => (s += v * DX));
};
const FR = cum(REAL);

/** Optimal 1-Lipschitz critic for E_real f - E_fake f, W1, and dW1/dtheta for the shift generator. */
export function critic(theta: number) {
  const fake = GRID.map((x) => npdf(x, theta, 0.6));
  const FF = cum(fake);
  const slope = GRID.map((_, i) =>
    Math.abs(FF[i] - FR[i]) < 1e-6 ? 0 : Math.sign(FF[i] - FR[i]),
  );
  const f: number[] = [];
  let s = 0;
  slope.forEach((g) => f.push((s += g * DX)));
  const mean = f.reduce((a, v, i) => a + v * REAL[i] * DX, 0);
  const fc = f.map((v) => v - mean);
  const w1 = FR.reduce((a, v, i) => a + Math.abs(v - FF[i]) * DX, 0);
  const grad = -slope.reduce((a, g, i) => a + g * fake[i] * DX, 0);
  return { fake, f: fc, w1, grad };
}

export function OptimalCriticViz() {
  const [k, setK] = useState(1);
  const { fake, f, w1, grad } = critic(THETAS[k]);
  const W = 340,
    H = 210,
    XL = 14,
    XR = W - 14,
    YM = 110;
  const sx = (x: number) => XL + ((x - LO) / (HI - LO)) * (XR - XL);
  const dens = (p: number[], col: string, dash?: string) => (
    <path
      d={p
        .map((v, i) => `${i ? "L" : "M"}${sx(GRID[i])},${H - 20 - v * 80}`)
        .join(" ")}
      fill="none"
      stroke={col}
      strokeWidth={1.6}
      strokeDasharray={dash}
    />
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Generator shift">
          {THETAS.map((t, j) => (
            <button
              key={t}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              θ = {t}
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
        aria-label="Real and generated densities with the optimal one-Lipschitz critic drawn above them"
      >
        <line x1={XL} y1={H - 20} x2={XR} y2={H - 20} stroke="var(--border)" />
        {dens(REAL, "var(--accent)")}
        {dens(fake, "var(--danger)", "5 3")}
        <path
          d={f
            .map((v, i) => `${i ? "L" : "M"}${sx(GRID[i])},${YM - 40 - v * 14}`)
            .join(" ")}
          fill="none"
          stroke="var(--text)"
          strokeWidth={1.8}
        />
        <text x={XL} y={14} className="viz-label">
          critic f
        </text>
        {[-2, 0, 2, 4].map((x) => (
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
        W₁ {w1.toFixed(3)}, dW₁/dθ {grad.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Solid: the real density, two clusters. Dashed: a generator that outputs
        a Gaussian shifted by θ. Top: the optimal critic, which has slope +1 or
        −1 wherever there is mass and makes E f(real) − E f(generated) as large
        as possible: it is high on the real clusters and low where the generator
        puts its mass. Its slope, averaged over the generated samples, gives the
        gradient of W₁ with respect to θ, which stays at full strength even when
        the two distributions do not overlap.
      </figcaption>
    </figure>
  );
}
