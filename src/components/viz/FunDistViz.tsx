"use client";

import { useState } from "react";

type Kind = "spike" | "pow";

/** Distance from a function to 0 measured by the sup metric, the L¹ metric and the L² metric: the three can disagree completely about convergence. */
export function FunDistViz() {
  const [kind, setKind] = useState<Kind>("spike");
  const [k, setK] = useState(4);
  const w = 0.5 / k;
  const n = k * 2;
  const f = kind === "spike" ? (x: number) => Math.max(0, 1 - Math.abs(x - 0.5) / w) : (x: number) => Math.pow(x, n);
  const dsup = 1;
  const d1 = kind === "spike" ? w : 1 / (n + 1);
  const d2 = kind === "spike" ? Math.sqrt((2 * w) / 3) : Math.sqrt(1 / (2 * n + 1));
  const W = 330, H = 140;
  const X = (x: number) => 16 + x * (W - 32);
  const Y = (y: number) => H - 14 - y * (H - 26);
  const xs = Array.from({ length: 801 }, (_, i) => i / 800);
  const pts = xs.map((x) => `${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`);
  const bar = (label: string, v: number, row: number) => (
    <g key={label}>
      <text x={4} y={H + 14 + row * 18} className="viz-label">{label}</text>
      <rect x={64} y={H + 4 + row * 18} width={v * (W - 120)} height={12} fill="var(--accent)" opacity={0.6} />
      <text x={70 + v * (W - 120)} y={H + 14 + row * 18} className="viz-label">{v.toFixed(4)}</text>
    </g>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={kind === "spike"} onClick={() => setKind("spike")}>narrowing spike</button>
        <button type="button" className="seg" aria-pressed={kind === "pow"} onClick={() => setKind("pow")}>xⁿ</button>
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {kind === "spike" ? `half-width ${w.toFixed(3)}` : `n = ${n}`}
          <input type="range" min={1} max={50} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="sequence index" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 60}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="A function on [0, 1] and its distance to zero in three metrics">
        <polygon points={[`${X(0)},${Y(0)}`, ...pts, `${X(1)},${Y(0)}`].join(" ")} fill="var(--accent)" opacity={0.15} />
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={pts.join(" ")} />
        {bar("d∞", dsup, 0)}
        {bar("d₁", d1, 1)}
        {bar("d₂", d2, 2)}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        d∞ is the largest gap between the function and 0, d₁ the shaded area, and d₂ the square root of the area under its
        square. As the index grows, d₁ and d₂ tend to 0 while d∞ stays at 1: the sequence converges to 0 in the integral
        metrics and not in the sup metric. On a space of functions, which metric you choose decides which sequences converge.
      </figcaption>
    </figure>
  );
}
