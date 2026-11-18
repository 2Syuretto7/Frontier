"use client";

import { useState } from "react";

const K = 60;

/** Gradient descent with step 1/L on f(x, y) = ½(μx² + Ly²) from (1, 1), μ = 1, L = κ: the gap f − f* at each step. */
export function gaps(kappa: number) {
  let x = 1, y = 1;
  const out: number[] = [];
  for (let k = 0; k <= K; k++) {
    out.push(0.5 * (x * x + kappa * y * y));
    x -= (1 / kappa) * x;
    y -= (1 / kappa) * kappa * y;
  }
  return out;
}

/** The strongly convex bound (1 − μ/L)^k (f₀ − f*) and the convex bound L‖x₀ − x*‖²/(2k). */
export function boundsAt(kappa: number, k: number) {
  const gap0 = 0.5 * (1 + kappa);
  return { strong: (1 - 1 / kappa) ** k * gap0, convex: k === 0 ? Infinity : (kappa * 2) / (2 * k) };
}

const LO = -8, HI = 2.5;

export function ConvergenceBoundsViz() {
  const [kappa, setKappa] = useState(10);
  const g = gaps(kappa);
  const W = 300, H = 160, X0 = 34, PW = W - 42, PH = 136;
  const sx = (k: number) => X0 + (k / K) * PW;
  const sy = (v: number) => 8 + ((HI - Math.max(LO, Math.min(HI, Math.log10(Math.max(v, 1e-12))))) / (HI - LO)) * PH;
  const ks = Array.from({ length: K + 1 }, (_, k) => k);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">condition number κ = L/μ</span>
        {[2, 10, 100].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={kappa === v} onClick={() => setKappa(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Optimality gap of gradient descent on a log scale, with the two convergence bounds">
        <polyline fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" points={ks.slice(1).map((k) => `${sx(k)},${sy(boundsAt(kappa, k).convex)}`).join(" ")} />
        <polyline fill="none" stroke="var(--danger)" strokeDasharray="2 2" strokeWidth={1.5} points={ks.map((k) => `${sx(k)},${sy(boundsAt(kappa, k).strong)}`).join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2.5} points={ks.map((k) => `${sx(k)},${sy(g[k])}`).join(" ")} />
        {[2, 0, -2, -4, -6, -8].map((l) => (
          <text key={l} x={X0 - 4} y={sy(10 ** l) + 4} textAnchor="end" className="viz-label">{`1e${l}`}</text>
        ))}
        {[0, 20, 40, 60].map((k) => (
          <text key={k} x={sx(k)} y={H + 12} textAnchor="middle" className="viz-label">{k}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`gap after ${K} steps: ${g[K].toExponential(2)}; bounds: linear ${boundsAt(kappa, K).strong.toExponential(2)}, 1/k ${boundsAt(kappa, K).convex.toExponential(2)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Gradient descent with step 1/L on a quadratic whose curvatures are 1 and κ, starting from (1, 1); the gap is on a
        log scale. The solid line is the actual gap, the red dotted line the strongly convex bound (1 − 1/κ)^k, and the grey
        dashed line the convex bound L‖x₀ − x*‖²/2k, which ignores strong convexity. With a small condition number the
        gap falls by orders of magnitude in a few steps; at κ = 100 the linear rate is so slow that for these 60 steps it
        looks almost flat, and the 1/k bound is the more informative one.
      </figcaption>
    </figure>
  );
}
