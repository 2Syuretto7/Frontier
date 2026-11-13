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

/** Standardised scores on two noisy evaluations with correlation ρ: the fitted line has slope ρ, so the top scorers on the first fall back towards the mean on the second. */
export function RegToMeanViz() {
  const [r10, setR10] = useState(5);
  const rho = r10 / 10;
  const pts = useMemo(() => {
    const r = makeRng(2027);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    return Array.from({ length: N }, () => { const a = normal(), e = normal(); return [a, e]; });
  }, []);
  const data = pts.map(([a, e]) => [a, rho * a + Math.sqrt(1 - rho * rho) * e]);
  const n = data.length;
  const mx = data.reduce((s, p) => s + p[0], 0) / n, my = data.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0, sxx = 0;
  data.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) * (x - mx); });
  const b1 = sxy / sxx, b0 = my - b1 * mx;
  const top = data.filter(([x]) => x > 1.5);
  const t1 = top.reduce((s, p) => s + p[0], 0) / Math.max(top.length, 1);
  const t2 = top.reduce((s, p) => s + p[1], 0) / Math.max(top.length, 1);
  const W = 330, H = 200, L = 3.2;
  const X = (x: number) => 16 + ((x + L) / (2 * L)) * (W - 32);
  const Y = (y: number) => H - 12 - ((y + L) / (2 * L)) * (H - 22);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          correlation ρ = {rho.toFixed(1)}
          <input type="range" min={0} max={10} value={r10} onChange={(e) => setR10(Number(e.target.value))} aria-label="correlation" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Scatter of two scores with the identity line and the regression line">
        <line x1={X(1.5)} x2={X(1.5)} y1={Y(L)} y2={Y(-L)} stroke="var(--border)" />
        {data.map(([x, y], i) => (
          <circle key={i} cx={X(x)} cy={Y(y)} r={1.8} fill={x > 1.5 ? "var(--danger)" : "var(--accent)"} opacity={x > 1.5 ? 0.85 : 0.35} />
        ))}
        <line x1={X(-L)} y1={Y(-L)} x2={X(L)} y2={Y(L)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <line x1={X(-L)} y1={Y(b0 - b1 * L)} x2={X(L)} y2={Y(b0 + b1 * L)} stroke="var(--text)" strokeWidth={1.6} />
        <text x={X(-L)} y={H - 1} className="viz-label">first score</text>
        <text x={X(-L) + 2} y={Y(L) + 10} className="viz-label">second</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        fitted slope {b1.toFixed(3)}; top group: first {t1.toFixed(2)}, second {t2.toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each dot is one system scored twice, on standardised scales, with correlation ρ between the scores. The dashed
        line is &quot;second equals first&quot;; the solid line is the least squares fit, with slope close to ρ. The
        systems that scored above 1.5 the first time (danger colour) average only about ρ times as much the second time.
        Nothing about them changed: part of their first score was luck.
      </figcaption>
    </figure>
  );
}
