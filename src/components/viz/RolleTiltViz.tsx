"use client";

import { useState } from "react";

const A = -2, B = 2.2;
const f = (x: number) => 0.3 * x * x * x - x + 0.5 * Math.sin(2 * x);
const df = (x: number) => 0.9 * x * x - 1 + Math.cos(2 * x);

/** Subtracting the chord tilts the graph until its endpoints are level: Rolle's theorem for the tilted function is the mean value theorem for f. */
export function RolleTiltViz() {
  const [k, setK] = useState(0);
  const t = k / 20;
  const m = (f(B) - f(A)) / (B - A);
  const g = (x: number) => f(x) - t * m * (x - A);
  const xs = Array.from({ length: 401 }, (_, i) => A + ((B - A) * i) / 400);
  const xis: number[] = [];
  for (let i = 0; i < 400; i++) {
    let u = xs[i], v = xs[i + 1];
    const h = (x: number) => df(x) - m;
    if (h(u) * h(v) < 0) {
      for (let j = 0; j < 50; j++) { const w = (u + v) / 2; if (h(u) * h(w) > 0) u = w; else v = w; }
      xis.push((u + v) / 2);
    }
  }
  const W = 330, H = 180, ylo = -2.6, yhi = 2.6;
  const X = (x: number) => 14 + ((x - A) / (B - A)) * (W - 28);
  const Y = (y: number) => 10 + ((yhi - y) / (yhi - ylo)) * (H - 20);
  const slopeNow = m * (1 - t);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          tilt {t.toFixed(2)}
          <input type="range" min={0} max={20} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="amount of the chord subtracted" style={{ width: 160 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Graph being tilted by subtracting the chord, with the mean value points marked">
        <line x1={14} x2={W - 14} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(A)} x2={X(B)} y1={Y(g(A))} y2={Y(g(B))} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={xs.map((x) => `${X(x).toFixed(1)},${Y(g(x)).toFixed(1)}`).join(" ")} />
        {xis.map((xi, i) => {
          const y = g(xi), d = 0.5;
          return (
            <g key={i}>
              <line x1={X(xi - d)} x2={X(xi + d)} y1={Y(y - slopeNow * d)} y2={Y(y + slopeNow * d)} stroke="var(--accent)" strokeWidth={2} />
              <circle cx={X(xi)} cy={Y(y)} r={3.5} fill="var(--accent)" />
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        chord slope {slopeNow.toFixed(3)}; ξ = {xis.map((x) => x.toFixed(3)).join(", ")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dashed line is the chord between the endpoints and the short solid segments are tangents at the points ξ where
        f′(ξ) equals the chord slope. Tilting subtracts a multiple of the chord: the points ξ never move, and at full tilt the
        endpoints are level and the tangents are horizontal. That is Rolle&apos;s theorem, and undoing the tilt turns it into the
        mean value theorem.
      </figcaption>
    </figure>
  );
}
