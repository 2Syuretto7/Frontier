"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const NP = 30,
  N = 200,
  T = 4,
  DT = T / N,
  X0 = 3,
  SIG = 1;
const r0 = rand(1932);
const Z = Array.from({ length: NP }, () =>
  Array.from({ length: N }, () => {
    const u = Math.max(r0(), 1e-12),
      v = r0();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }),
);
const THETAS = [0.5, 1, 2];

/** Paths of dX = -theta X dt + dB from X0 = 3, stepped with the exact Gaussian transition, and the mean and sd over time. */
export function ouPaths(theta: number) {
  const a = Math.exp(-theta * DT),
    sd = SIG * Math.sqrt((1 - a * a) / (2 * theta));
  const paths = Z.map((z) => {
    const p = [X0];
    for (let k = 0; k < N; k++) p.push(a * p[k] + sd * z[k]);
    return p;
  });
  const mean = Array.from(
    { length: N + 1 },
    (_, k) => X0 * Math.exp(-theta * k * DT),
  );
  const sdt = Array.from(
    { length: N + 1 },
    (_, k) =>
      SIG * Math.sqrt((1 - Math.exp(-2 * theta * k * DT)) / (2 * theta)),
  );
  return {
    paths,
    mean,
    sdt,
    statSd: SIG / Math.sqrt(2 * theta),
    half: Math.log(2) / theta,
  };
}

export function OrnsteinUhlenbeckViz() {
  const [ti, setTi] = useState(1);
  const { paths, mean, sdt, statSd, half } = ouPaths(THETAS[ti]);
  const W = 340,
    H = 200,
    XL = 30,
    XR = W - 50,
    Y0 = 8,
    Y1 = H - 22,
    LO = -3,
    HI = 3.5;
  const sx = (k: number) => XL + (k / N) * (XR - XL);
  const sy = (v: number) =>
    Y1 - ((Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * (Y1 - Y0);
  const line = (p: number[]) =>
    p.map((v, k) => `${k ? "L" : "M"}${sx(k)},${sy(v)}`).join(" ");
  const band =
    mean
      .map((m, k) => `${k ? "L" : "M"}${sx(k)},${sy(m + 2 * sdt[k])}`)
      .join(" ") +
    " " +
    [...mean]
      .map((m, k) => [m, k] as const)
      .reverse()
      .map(([m, k]) => `L${sx(k)},${sy(m - 2 * sdt[k])}`)
      .join(" ") +
    " Z";
  const dens = Array.from({ length: 61 }, (_, i) => LO + (i / 60) * (HI - LO));
  const dpath = dens
    .map(
      (x, i) =>
        `${i ? "L" : "M"}${XR + 6 + (Math.exp(-(x * x) / (2 * statSd * statSd)) / (statSd * Math.sqrt(2 * Math.PI)) / 0.8) * 38},${sy(x)}`,
    )
    .join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="Mean reversion rate theta"
        >
          {THETAS.map((t, j) => (
            <button
              key={t}
              type="button"
              className="seg"
              aria-pressed={ti === j}
              onClick={() => setTi(j)}
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
        aria-label="Ornstein-Uhlenbeck paths relaxing to their stationary distribution"
      >
        <path d={band} style={{ fill: "var(--accent-soft)" }} />
        <line x1={XL} y1={sy(0)} x2={XR} y2={sy(0)} stroke="var(--border)" />
        {paths.map((p, i) => (
          <path
            key={i}
            d={line(p)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={0.7}
            strokeOpacity={0.55}
          />
        ))}
        <path
          d={line(mean)}
          fill="none"
          stroke="var(--text)"
          strokeWidth={1.6}
        />
        <line
          x1={XR + 6}
          y1={Y0}
          x2={XR + 6}
          y2={Y1}
          stroke="var(--border-strong)"
        />
        <path d={dpath} fill="none" stroke="var(--danger)" strokeWidth={1.4} />
        {[-2, 0, 2].map((v) => (
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
        {[0, 2, 4].map((t) => (
          <text
            key={t}
            x={sx((t / T) * N)}
            y={H - 6}
            textAnchor="middle"
            className="viz-label"
          >
            {t}
          </text>
        ))}
        <text x={XR + 8} y={H - 6} className="viz-label">
          t = ∞
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        stationary sd {statSd.toFixed(3)}; mean halves every {half.toFixed(3)}{" "}
        time units
      </div>
      <figcaption className="viz-caption">
        Thirty paths of dX = −θX dt + dB started at 3, each stepped with the
        exact Gaussian transition. The dark curve is the mean and the shaded
        band is two standard deviations either side. The mean decays
        exponentially, the variance rises to 1/(2θ), and the paths forget where
        they started; the red curve at the right is the stationary density N(0,
        1/(2θ)). Faster reversion means quicker forgetting and a narrower
        stationary law.
      </figcaption>
    </figure>
  );
}
