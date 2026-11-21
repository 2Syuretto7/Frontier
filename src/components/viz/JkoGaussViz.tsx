"use client";

import { useState } from "react";

// F(rho) = KL(rho || N(0, 1)) restricted to Gaussians N(m, s^2); exact W2 gradient flow and JKO steps
const M0 = 3,
  S0 = 0.3,
  TEND = 4,
  TAUS = [0.25, 1, 2];

export const kl = (m: number, s: number) =>
  0.5 * (m * m + s * s - 1 - Math.log(s * s));

export function exact(t: number) {
  return {
    m: M0 * Math.exp(-t),
    s: Math.sqrt(1 + (S0 * S0 - 1) * Math.exp(-2 * t)),
  };
}

/** Implicit steps argmin F + W2^2 / (2 tau); for Gaussians W2^2 = (m - m')^2 + (s - s')^2. */
export function jko(tau: number) {
  const pts = [{ m: M0, s: S0 }];
  for (let k = 0; k < Math.round(TEND / tau); k++) {
    const { m, s } = pts[pts.length - 1];
    pts.push({
      m: m / (1 + tau),
      s: (s + Math.sqrt(s * s + 4 * tau * (1 + tau))) / (2 * (1 + tau)),
    });
  }
  return pts;
}

export function JkoGaussViz() {
  const [k, setK] = useState(1);
  const tau = TAUS[k];
  const pts = jko(tau);
  const curve = Array.from({ length: 201 }, (_, i) => exact((TEND * i) / 200));
  const W = 340,
    H = 200,
    XL = 34,
    XR = W - 12,
    Y0 = 10,
    Y1 = H - 26;
  const sx = (m: number) => XL + ((m + 0.2) / 3.4) * (XR - XL);
  const sy = (s: number) => Y1 - ((s - 0.2) / 1.0) * (Y1 - Y0);
  const last = pts[pts.length - 1],
    ex = exact(TEND);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Step size">
          {TAUS.map((t, j) => (
            <button
              key={t}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              τ = {t}
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
        aria-label="Path of a Gaussian's mean and standard deviation under the exact gradient flow and under JKO steps"
      >
        <line x1={XL} y1={Y1} x2={XR} y2={Y1} stroke="var(--border)" />
        <line x1={XL} y1={Y0} x2={XL} y2={Y1} stroke="var(--border)" />
        <path
          d={curve
            .map((p, i) => `${i ? "L" : "M"}${sx(p.m)},${sy(p.s)}`)
            .join(" ")}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={1.5}
        />
        <path
          d={pts
            .map((p, i) => `${i ? "L" : "M"}${sx(p.m)},${sy(p.s)}`)
            .join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1}
          strokeDasharray="3 2"
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={sx(p.m)}
            cy={sy(p.s)}
            r={2.8}
            fill="var(--accent)"
          />
        ))}
        <circle
          cx={sx(0)}
          cy={sy(1)}
          r={5}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={1.5}
        />
        {[0, 1, 2, 3].map((m) => (
          <text
            key={m}
            x={sx(m)}
            y={H - 10}
            textAnchor="middle"
            className="viz-label"
          >
            {m}
          </text>
        ))}
        {[0.4, 0.8, 1.2].map((s) => (
          <text
            key={s}
            x={XL - 4}
            y={sy(s) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {s}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        KL to N(0, 1) at t = 4: JKO {kl(last.m, last.s).toFixed(4)}, exact{" "}
        {kl(ex.m, ex.s).toFixed(4)}
      </div>
      <figcaption className="viz-caption">
        A Gaussian N(m, s²) flowing downhill on its KL divergence to the
        standard normal, drawn in the plane of mean (across) and standard
        deviation (up). Grey: the exact Wasserstein gradient flow, which is the
        Fokker-Planck equation of the Ornstein-Uhlenbeck process. Dots: JKO
        steps, each minimising the free energy plus W₂²/(2τ) from the previous
        point. Even with τ = 2 every step goes downhill, and as τ shrinks the
        dots trace the exact path; the circle marks the equilibrium.
      </figcaption>
    </figure>
  );
}
