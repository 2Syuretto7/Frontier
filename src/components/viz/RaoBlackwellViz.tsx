"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REPS = 3000;

/** Estimating P(X = 0) = e^(−λ) for Poisson data: the crude indicator of X₁ = 0 against its Rao-Blackwellisation ((n − 1)/n)^T, where T is the sum. */
export function RaoBlackwellViz() {
  const [lam10, setLam10] = useState(10);
  const [n, setN] = useState(10);
  const lam = lam10 / 10;
  const truth = Math.exp(-lam);
  const res = useMemo(() => {
    const r = makeRng(31 + lam10 * 101 + n);
    const pois = () => {
      const L = Math.exp(-lam);
      let k = 0, p = r();
      while (p > L) { k++; p *= r(); }
      return k;
    };
    const crude: number[] = [], rb: number[] = [];
    for (let i = 0; i < REPS; i++) {
      let T = 0, first = 0;
      for (let j = 0; j < n; j++) { const x = pois(); if (j === 0) first = x; T += x; }
      crude.push(first === 0 ? 1 : 0);
      rb.push(Math.pow((n - 1) / n, T));
    }
    return { crude, rb };
  }, [lam10, n, lam]);
  const mse = (a: number[]) => a.reduce((s, v) => s + (v - truth) * (v - truth), 0) / a.length;
  const nb = 25;
  const counts = Array(nb).fill(0);
  res.rb.forEach((v) => { counts[Math.min(nb - 1, Math.floor(v * nb))]++; });
  const c1 = res.crude.filter((v) => v === 1).length / REPS;
  const W = 330, H = 150;
  const X = (x: number) => 16 + x * (W - 32);
  const Y = (y: number) => H - 16 - Math.min(y, 1) * (H - 26);
  const bw = (W - 32) / nb;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          λ = {lam.toFixed(1)}
          <input type="range" min={2} max={30} value={lam10} onChange={(e) => setLam10(Number(e.target.value))} aria-label="Poisson rate" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={2} max={40} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="sample size" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Distribution of the crude and Rao-Blackwellised estimators">
        <rect x={X(0) - 3} y={Y(1 - c1)} width={6} height={Y(0) - Y(1 - c1)} fill="var(--danger)" opacity={0.6} />
        <rect x={X(1) - 3} y={Y(c1)} width={6} height={Y(0) - Y(c1)} fill="var(--danger)" opacity={0.6} />
        {counts.map((c, i) => (
          <rect key={i} x={X(0) + i * bw + 0.3} y={Y(c / REPS)} width={bw - 0.6} height={Y(0) - Y(c / REPS)} fill="var(--accent)" opacity={0.45} />
        ))}
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(truth)} x2={X(truth)} y1={10} y2={Y(0)} stroke="var(--text)" strokeDasharray="3 3" />
        <text x={X(0)} y={H - 2} className="viz-label">0</text>
        <text x={X(1)} y={H - 2} textAnchor="end" className="viz-label">1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        target e^(−λ) = {truth.toFixed(4)}; MSE crude {mse(res.crude).toFixed(4)}, Rao-Blackwell {mse(res.rb).toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Over {REPS} simulated samples, the crude estimator 1(X₁ = 0) only ever says 0 or 1 (the two thin danger bars, as
        proportions). Averaging it over everything the sufficient statistic T = ΣXᵢ leaves undetermined gives ((n − 1)/n)^T,
        whose values (accent bars) cluster around the target (dashed line). Both are unbiased, but the second has a far
        smaller error, and the gap grows with n.
      </figcaption>
    </figure>
  );
}
