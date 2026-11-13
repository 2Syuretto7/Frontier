"use client";

import { useState } from "react";

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

const PTS: { x: number; q: number }[] = [];
for (let q = 1; q <= 40; q++) for (let p = 0; p <= q; p++) if (gcd(p, q) === 1) PTS.push({ x: p / q, q });

/** Thomae's function: only finitely many points stand above any level ε, so cells of tiny total width around them make U − L small. */
export function ThomaeViz() {
  const [k, setK] = useState(5);
  const eps = 1 / k;
  const big = PTS.filter((p) => 1 / p.q >= eps);
  const N = big.length;
  const delta = eps / (2 * N);
  const W = 330, H = 170;
  const X = (x: number) => 16 + x * (W - 32);
  const Y = (y: number) => H - 16 - y * (H - 30);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          ε = 1/{k}
          <input type="range" min={2} max={20} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="threshold epsilon" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Thomae's function with the points above epsilon covered by thin cells">
        <rect x={X(0)} y={Y(eps)} width={X(1) - X(0)} height={Y(0) - Y(eps)} fill="var(--accent)" opacity={0.1} />
        <line x1={X(0)} x2={X(1)} y1={Y(eps)} y2={Y(eps)} stroke="var(--accent)" strokeDasharray="4 3" />
        {big.map((p, i) => (
          <rect key={i} x={X(Math.max(0, p.x - delta))} y={Y(1)} width={X(Math.min(1, p.x + delta)) - X(Math.max(0, p.x - delta))} height={Y(0) - Y(1)} fill="var(--danger)" opacity={0.25} />
        ))}
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        {PTS.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(1 / p.q)} r={1.6} fill={1 / p.q >= eps ? "var(--danger)" : "var(--text-muted)"} />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {N} points with f ≥ ε; their cells have total width at most {(2 * N * delta).toFixed(3)}; U − L &lt; {(2 * N * delta + eps).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        f(p/q) = 1/q in lowest terms and f = 0 at irrationals; points with q up to 40 are shown. Only the finitely many points
        with 1/q ≥ ε rise above the dashed line. Give each a cell of width 2δ = ε/N: those cells contribute at most ε to
        U − L, since f ≤ 1, and every other cell has supremum below ε and infimum 0, contributing less than ε in total.
      </figcaption>
    </figure>
  );
}
