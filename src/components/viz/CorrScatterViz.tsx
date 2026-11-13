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
const N = 300;
function normals() {
  const r = makeRng(42);
  const out: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const u1 = r(), u2 = r();
    const rad = Math.sqrt(-2 * Math.log(1 - u1));
    out.push([rad * Math.cos(2 * Math.PI * u2), rad * Math.sin(2 * Math.PI * u2)]);
  }
  return out;
}

/** Scatter of (X, Y) with Y = ρX + √(1 − ρ²)Z, or Y = X² + noise: correlation, the best linear predictor, and its failure for curved dependence. */
export function CorrScatterViz() {
  const base = useMemo(normals, []);
  const [k, setK] = useState(60);
  const [curved, setCurved] = useState(false);
  const rho = k / 100;
  const pts = base.map(([x, z]) => [x, curved ? x * x - 1 + 0.3 * z : rho * x + Math.sqrt(Math.max(0, 1 - rho * rho)) * z]);
  const mx = pts.reduce((s, p) => s + p[0], 0) / N, my = pts.reduce((s, p) => s + p[1], 0) / N;
  let sxx = 0, syy = 0, sxy = 0;
  pts.forEach(([x, y]) => { sxx += (x - mx) * (x - mx); syy += (y - my) * (y - my); sxy += (x - mx) * (y - my); });
  const r = sxy / Math.sqrt(sxx * syy), slope = sxy / sxx;
  const W = 300, H = 240;
  const X = (x: number) => W / 2 + x * 40;
  const Y = (y: number) => H / 2 - y * 32;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <button type="button" className="seg" aria-pressed={!curved} onClick={() => setCurved(false)}>linear</button>
        <button type="button" className="seg" aria-pressed={curved} onClick={() => setCurved(true)}>Y = X² − 1 + noise</button>
        {!curved && (
          <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
            ρ = {rho.toFixed(2)}
            <input type="range" min={-100} max={100} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="population correlation" style={{ width: 120 }} />
          </label>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Scatter plot with best linear fit">
        <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="var(--border)" />
        <line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke="var(--border)" />
        {pts.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={2} fill="var(--accent)" opacity={0.55} />)}
        <line x1={X(-3.5)} y1={Y(my + slope * (-3.5 - mx))} x2={X(3.5)} y2={Y(my + slope * (3.5 - mx))} stroke="var(--danger)" strokeWidth={2} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        sample correlation {r.toFixed(3)}; best line slope {slope.toFixed(3)}; unexplained share of Var(Y) ≈ {(1 - r * r).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {curved
          ? "Y is almost a function of X, yet the correlation is near 0 and the best straight line is flat: correlation measures only linear dependence, and X and −X contribute opposite signs."
          : "With Y = ρX + √(1 − ρ²)Z for independent standard normals X, Z, the correlation is ρ. The red line is the best linear predictor of Y from X, with slope Cov(X, Y)/Var(X); it leaves a fraction 1 − ρ² of Var(Y) unexplained."}
      </figcaption>
    </figure>
  );
}
