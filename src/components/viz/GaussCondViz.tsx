"use client";

import { useState } from "react";

const phi = (x: number, m: number, s: number) => Math.exp((-(x - m) * (x - m)) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));

/** Standard bivariate normal with correlation ρ: observing X₂ = a gives X₁ | X₂ = a ~ N(ρa, 1 − ρ²). */
export function GaussCondViz() {
  const [rk, setRk] = useState(80);
  const [ak, setAk] = useState(15);
  const rho = rk / 100, a = ak / 10;
  const cm = rho * a, cs = Math.sqrt(1 - rho * rho);
  const W = 320, H = 260, k = 34;
  const X = (x: number) => 30 + (x + 3.5) * k, Y = (y: number) => H / 2 - y * k;
  // ellipses of the joint at Mahalanobis 1 and 2: axes along (1,1) and (1,-1) with variances 1±ρ
  const ell = (c: number) => Array.from({ length: 73 }, (_, i) => (2 * Math.PI * i) / 72).map((t) => {
    const u = c * Math.sqrt(1 + rho) * Math.cos(t), v = c * Math.sqrt(1 - rho) * Math.sin(t);
    return `${X((u - v) / Math.SQRT2).toFixed(1)},${Y((u + v) / Math.SQRT2).toFixed(1)}`;
  }).join(" ");
  // curves drawn along the x1 axis (horizontal) at the bottom
  const base = H - 8;
  const marg = Array.from({ length: 141 }, (_, i) => -3.5 + i * 0.05).map((x) => `${X(x).toFixed(1)},${(base - phi(x, 0, 1) * 50).toFixed(1)}`).join(" ");
  const cond = Array.from({ length: 141 }, (_, i) => -3.5 + i * 0.05).map((x) => `${X(x).toFixed(1)},${(base - Math.min(1.5, phi(x, cm, cs)) * 50).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          ρ = {rho.toFixed(2)}
          <input type="range" min={-95} max={95} value={rk} onChange={(e) => setRk(Number(e.target.value))} aria-label="correlation" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          observed X₂ = {a.toFixed(1)}
          <input type="range" min={-25} max={25} value={ak} onChange={(e) => setAk(Number(e.target.value))} aria-label="observed value of the second coordinate" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Bivariate normal contours, an observed slice, and the conditional density">
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.5} points={ell(1)} />
        <polyline fill="none" stroke="var(--accent)" strokeDasharray="4 3" points={ell(2)} />
        <line x1={X(-3.5)} x2={X(3.5)} y1={Y(a)} y2={Y(a)} stroke="var(--danger)" strokeWidth={1.5} />
        <line x1={X(-3.5)} x2={X(3.5)} y1={Y(-3.5 * rho)} y2={Y(3.5 * rho)} stroke="var(--text-muted)" strokeDasharray="2 3" />
        <circle cx={X(cm)} cy={Y(a)} r={4} fill="var(--danger)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.5} points={marg} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={cond} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        X₁ | X₂ = {a.toFixed(1)} ~ N({cm.toFixed(2)}, {(cs * cs).toFixed(2)})
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Blue: contours of a standard bivariate normal with correlation ρ (X₁ across, X₂ up). Red line: the slice X₂ = a. The
        density along the slice, renormalised, is the conditional density of X₁ (red curve at the bottom, beside the grey
        marginal). Its mean ρa moves along the dotted regression line as a changes; its variance 1 − ρ² does not depend on a
        at all.
      </figcaption>
    </figure>
  );
}
