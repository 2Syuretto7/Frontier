"use client";

import { useState } from "react";

const f = Math.fround;

/** The small root of x² − 2bx + 1 in single precision: the textbook formula b − √(b² − 1) loses digits to cancellation as b grows, while c/(b + √(b² − 1)) stays accurate. */
export function CancelQuadViz() {
  const [lb, setLb] = useState(2.5);
  const exact = (b: number) => 1 / (b + Math.sqrt(b * b - 1));
  const naive = (b: number) => { const B = f(b); const d = f(Math.sqrt(f(f(B * B) - 1))); return f(B - d); };
  const stable = (b: number) => { const B = f(b); const d = f(Math.sqrt(f(f(B * B) - 1))); return f(1 / f(B + d)); };
  const rel = (v: number, b: number) => Math.max(Math.abs(v - exact(b)) / exact(b), 1e-9);
  const N = 300;
  const bs = Array.from({ length: N + 1 }, (_, i) => 10 ** (0.3 + (3.7 * i) / N));
  const W = 330, H = 170;
  const X = (b: number) => 34 + ((Math.log10(b) - 0.3) / 3.7) * (W - 46);
  const Y = (v: number) => 10 + ((0 - Math.log10(Math.min(v, 1))) / 9) * (H - 30);
  const b0 = 10 ** lb;
  const line = (g: (b: number) => number) => bs.map((b) => `${X(b).toFixed(1)},${Y(rel(g(b), b)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          b = {b0.toFixed(b0 < 10 ? 2 : 0)}
          <input type="range" min={0.3} max={4} step={0.01} value={lb} onChange={(e) => setLb(Number(e.target.value))} aria-label="b on a log scale" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Relative error of two formulas for the small root, against b, on log axes">
        {[0, -3, -6, -9].map((e) => (
          <g key={e}>
            <line x1={34} x2={W - 12} y1={Y(10 ** e)} y2={Y(10 ** e)} stroke="var(--border)" opacity={0.6} />
            <text x={30} y={Y(10 ** e) + 3} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        <line x1={34} x2={W - 12} y1={Y(2 ** -24)} y2={Y(2 ** -24)} stroke="var(--text-muted)" strokeDasharray="2 3" />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.4} points={line(naive)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.6} points={line(stable)} />
        <line x1={X(b0)} x2={X(b0)} y1={10} y2={H - 20} stroke="var(--text)" strokeDasharray="3 3" />
        {[10, 100, 1000, 10000].map((t) => (
          <text key={t} x={X(t)} y={H - 4} textAnchor="middle" className="viz-label">{t}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        exact {exact(b0).toPrecision(8)}; b − √(b² − 1) gives {naive(b0).toPrecision(8)}; 1/(b + √(b² − 1)) gives {stable(b0).toPrecision(8)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Both formulas are exact in real arithmetic. Computed in single precision (u ≈ 6 × 10⁻⁸, dotted line), the red
        curve subtracts two nearly equal numbers, b and √(b² − 1), each already rounded; their difference is about 1/(2b),
        so the rounding errors of size u·b are magnified by a factor of about 2b². By b ≈ 4000 no correct digits remain. The
        other formula only adds positive numbers and divides, so its error stays near u for every b.
      </figcaption>
    </figure>
  );
}
