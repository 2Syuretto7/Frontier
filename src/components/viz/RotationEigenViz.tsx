"use client";

import { useState } from "react";

/** A rotation of the plane has no real eigenvector, but over the complex numbers it has two. */
export function RotationEigenViz() {
  const [theta, setTheta] = useState(60);
  const [phi, setPhi] = useState(20);
  const t = (theta * Math.PI) / 180, p = (phi * Math.PI) / 180;
  const v = [Math.cos(p), Math.sin(p)];
  const Rv = [Math.cos(t) * v[0] - Math.sin(t) * v[1], Math.sin(t) * v[0] + Math.cos(t) * v[1]];
  const W = 300, H = 220, cx = 110, cy = 110, s = 80;
  const X = (x: number) => cx + s * x, Y = (y: number) => cy - s * y;
  const real = theta === 0 || theta === 180 || theta === 360;
  const clean = (x: number) => (Math.abs(x) < 1e-9 ? 0 : x);
  const lr = clean(Math.cos(t)), li = clean(Math.sin(t));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          rotation θ = {theta}°
          <input type="range" min={0} max={360} step={5} value={theta} onChange={(e) => setTheta(Number(e.target.value))} aria-label="rotation angle" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          direction of v = {phi}°
          <input type="range" min={0} max={180} step={5} value={phi} onChange={(e) => setPhi(Number(e.target.value))} aria-label="direction of v" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="A vector and its rotated image">
        <circle cx={cx} cy={cy} r={s} fill="none" stroke="var(--border)" />
        <line x1={cx - s - 10} x2={cx + s + 10} y1={cy} y2={cy} stroke="var(--border)" />
        <line x1={cx} x2={cx} y1={cy - s - 10} y2={cy + s + 10} stroke="var(--border)" />
        <line x1={X(-1.3 * v[0])} y1={Y(-1.3 * v[1])} x2={X(1.3 * v[0])} y2={Y(1.3 * v[1])} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <line x1={cx} y1={cy} x2={X(v[0])} y2={Y(v[1])} stroke="var(--text)" strokeWidth={2.2} />
        <line x1={cx} y1={cy} x2={X(Rv[0])} y2={Y(Rv[1])} stroke="var(--accent)" strokeWidth={2.2} />
        <text x={X(v[0] * 1.12)} y={Y(v[1] * 1.12)} textAnchor="middle" className="viz-label">v</text>
        <text x={X(Rv[0] * 1.15)} y={Y(Rv[1] * 1.15)} textAnchor="middle" className="viz-label" style={{ fill: "var(--accent)" }}>Rv</text>
        <text x={215} y={40} className="viz-label">eigenvalues</text>
        <text x={215} y={58} className="viz-label">{lr.toFixed(2)} {li >= 0 ? "+" : "−"} {Math.abs(li).toFixed(2)}i</text>
        <text x={215} y={74} className="viz-label">{lr.toFixed(2)} {li >= 0 ? "−" : "+"} {Math.abs(li).toFixed(2)}i</text>
        <text x={215} y={100} className="viz-label">eigenvectors</text>
        <text x={215} y={118} className="viz-label">(1, −i), (1, i)</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        {real
          ? "At 0° or 180° the rotation is ±I, so every v is an eigenvector, with a real eigenvalue ±1."
          : "Rv always makes angle θ with v, so it never lies on the dashed line through v: no real eigenvector exists, whichever v you choose."}{" "}
        Over the complex numbers the characteristic polynomial λ² − 2cos θ·λ + 1 always has roots, cos θ ± i sin θ, with
        eigenvectors (1, ∓i). Working over ℂ is what guarantees every operator has an eigenvalue.
      </figcaption>
    </figure>
  );
}
