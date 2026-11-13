"use client";

import { useState } from "react";

/** A basis of the plane and its dual basis: each dual functional is 1 on its own basis vector and 0 on the other. */
export function DualBasisViz() {
  const [a1, setA1] = useState(0);
  const [a2, setA2] = useState(45);
  const r = (d: number) => (d * Math.PI) / 180;
  const v1 = [Math.cos(r(a1)), Math.sin(r(a1))], v2 = [1.3 * Math.cos(r(a2)), 1.3 * Math.sin(r(a2))];
  const det = v1[0] * v2[1] - v2[0] * v1[1];
  const ok = Math.abs(det) > 0.05;
  const phi1 = ok ? [v2[1] / det, -v2[0] / det] : [0, 0];
  const phi2 = ok ? [-v1[1] / det, v1[0] / det] : [0, 0];
  const W = 300, H = 240, cx = 150, cy = 120, s = 55;
  const X = (x: number) => cx + s * x, Y = (y: number) => cy - s * y;
  const level = (phi: number[], c: number, key: string, color: string) => {
    const n2 = phi[0] ** 2 + phi[1] ** 2;
    if (n2 < 1e-9) return null;
    const p0 = [(c * phi[0]) / n2, (c * phi[1]) / n2], d = [-phi[1], phi[0]];
    const L = 6 / Math.sqrt(n2);
    return <line key={key} x1={X(p0[0] - L * d[0])} y1={Y(p0[1] - L * d[1])} x2={X(p0[0] + L * d[0])} y2={Y(p0[1] + L * d[1])} stroke={color} strokeOpacity={c === 0 ? 0.9 : 0.5} strokeDasharray={c === 0 ? undefined : "4 3"} />;
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          v₁ at {a1}°
          <input type="range" min={-60} max={60} step={5} value={a1} onChange={(e) => setA1(Number(e.target.value))} aria-label="direction of v1" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          v₂ at {a2}°
          <input type="range" min={30} max={150} step={5} value={a2} onChange={(e) => setA2(Number(e.target.value))} aria-label="direction of v2" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Basis vectors and level lines of the dual functionals">
        <defs>
          <clipPath id="dualclip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#dualclip)">
          {ok && [0, 1].map((c) => level(phi1, c, `a${c}`, "var(--accent)"))}
          {ok && [0, 1].map((c) => level(phi2, c, `b${c}`, "var(--danger)"))}
        </g>
        <line x1={cx} y1={cy} x2={X(v1[0])} y2={Y(v1[1])} stroke="var(--accent)" strokeWidth={2.5} />
        <line x1={cx} y1={cy} x2={X(v2[0])} y2={Y(v2[1])} stroke="var(--danger)" strokeWidth={2.5} />
        <text x={X(v1[0] * 1.2)} y={Y(v1[1] * 1.2)} textAnchor="middle" className="viz-label">v₁</text>
        <text x={X(v2[0] * 1.15)} y={Y(v2[1] * 1.15)} textAnchor="middle" className="viz-label">v₂</text>
        <circle cx={cx} cy={cy} r={2.5} fill="var(--text)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {ok ? `φ₁ = (${phi1[0].toFixed(2)}, ${phi1[1].toFixed(2)}), φ₂ = (${phi2[0].toFixed(2)}, ${phi2[1].toFixed(2)})` : "v₁ and v₂ are nearly parallel: not a basis"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Blue lines are where φ₁ = 0 (solid) and φ₁ = 1 (dashed); red likewise for φ₂. φ₁ vanishes along v₂ and equals 1 at
        the tip of v₁, so φ₁(v) is exactly v&rsquo;s first coordinate in this basis. The dual functionals are the rows of the
        inverse of the matrix [v₁ v₂]. Only for an orthonormal basis do they point the same way as the basis vectors.
      </figcaption>
    </figure>
  );
}
