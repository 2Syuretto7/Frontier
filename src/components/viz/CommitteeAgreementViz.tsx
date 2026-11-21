"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";
import { phi } from "./RobustFeatureViz";

/** Inverse of the standard normal CDF by bisection. */
function quantile(p: number) {
  let lo = -8,
    hi = 8;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (phi(mid) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** P(second committee accepts | first accepts) when scores correlate rho and a share alpha is accepted. */
export function conditionalAgreement(rho: number, alpha: number) {
  const t = quantile(1 - alpha);
  const s = Math.sqrt(Math.max(1 - rho * rho, 1e-12));
  let total = 0;
  const steps = 2000,
    top = 8;
  const dx = (top - t) / steps;
  for (let i = 0; i < steps; i++) {
    const x = t + (i + 0.5) * dx;
    const dens = Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
    total += dens * (1 - phi((t - rho * x) / s)) * dx;
  }
  return total / alpha;
}

function gauss(r: () => number) {
  const u = Math.max(r(), 1e-12),
    v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function CommitteeAgreementViz() {
  const [ri, setR] = useState(50);
  const [ai, setA] = useState(25);
  const rho = ri / 100,
    alpha = ai / 100;
  const pts = useMemo(() => {
    const r = rand(11);
    return Array.from({ length: 220 }, () => [gauss(r), gauss(r)]);
  }, []);
  const t = quantile(1 - alpha);
  const s = Math.sqrt(1 - rho * rho);
  const agree = conditionalAgreement(rho, alpha);
  const W = 260,
    H = 260,
    c = 130,
    k = 36;
  const sx = (v: number) => c + v * k;
  const sy = (v: number) => c - v * k;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          correlation between committees: {rho.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={99}
            value={ri}
            onChange={(e) => setR(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          acceptance rate: {ai}%{" "}
          <input
            type="range"
            min={5}
            max={60}
            value={ai}
            onChange={(e) => setA(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 340,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Scores of papers from two committees, with acceptance thresholds"
      >
        <rect
          x={sx(t)}
          y={0}
          width={W - sx(t)}
          height={sy(t)}
          fill="var(--success)"
          opacity={0.12}
        />
        <line x1={sx(t)} x2={sx(t)} y1={0} y2={H} stroke="var(--border)" />
        <line x1={0} x2={W} y1={sy(t)} y2={sy(t)} stroke="var(--border)" />
        {pts.map(([x, z], i) => {
          const y = rho * x + s * z;
          const a1 = x > t,
            a2 = y > t;
          return (
            <circle
              key={i}
              cx={sx(x)}
              cy={sy(y)}
              r={2.6}
              fill={
                a1 && a2
                  ? "var(--success)"
                  : a1 || a2
                    ? "var(--danger)"
                    : "var(--text-muted)"
              }
              opacity={0.75}
            />
          );
        })}
        <text x={W - 4} y={H - 6} textAnchor="end" className="viz-label">
          committee 1
        </text>
        <text x={6} y={14} className="viz-label">
          committee 2
        </text>
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Of the papers committee 1 accepts, committee 2 also accepts{" "}
        {(100 * agree).toFixed(1)}%.
      </p>
      <figcaption className="viz-caption">
        Each dot is a paper scored independently by two committees whose scores
        share a correlation. Green dots are accepted by both, red by only one.
        Unless reviewing is far more consistent than experiments suggest, a
        large share of accepted papers would have been rejected by the other
        committee, and lower acceptance rates make agreement worse.
      </figcaption>
    </figure>
  );
}
