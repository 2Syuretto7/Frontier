"use client";

import { useMemo, useState } from "react";

const K = 300;
function returnCurves() {
  const lf = [0];
  for (let i = 1; i <= 2 * K; i++) lf.push(lf[i - 1] + Math.log(i));
  const one: number[] = [], two: number[] = [], three: number[] = [];
  let c1 = 0, c2 = 0, c3 = 0;
  for (let k = 1; k <= K; k++) {
    const a = Math.exp(lf[2 * k] - 2 * lf[k] - 2 * k * Math.log(2));
    let s = 0;
    for (let i = 0; i <= k; i++) {
      for (let j = 0; i + j <= k; j++) {
        s += Math.exp(2 * (lf[k] - lf[i] - lf[j] - lf[k - i - j]) - 2 * k * Math.log(3));
      }
    }
    c1 += a; c2 += a * a; c3 += a * s;
    one.push(c1); two.push(c2); three.push(c3);
  }
  return [one, two, three];
}

/** Expected number of returns to the start of the simple random walk in 1, 2 and 3 dimensions, as the number of steps grows. */
export function PolyaReturnViz() {
  const curves = useMemo(returnCurves, []);
  const [m, setM] = useState(150);
  const W = 320, H = 180, L = 30;
  const top = 20;
  const X = (k: number) => L + (k / K) * (W - L - 8);
  const Y = (v: number) => H - 18 - (Math.min(v, top) / top) * (H - 28);
  const HUES = ["var(--accent)", "var(--danger)", "var(--text)"];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          steps = {2 * m}
          <input type="range" min={1} max={K} value={m} onChange={(e) => setM(Number(e.target.value))} aria-label="number of steps" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Expected returns against steps for dimensions one to three">
        {[0, 5, 10, 15, 20].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - 8} y1={Y(v)} y2={Y(v)} stroke="var(--border)" />
            <text x={L - 4} y={Y(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {curves.map((c, d) => (
          <polyline key={d} fill="none" stroke={HUES[d]} strokeWidth={2} points={c.map((v, i) => `${X(i + 1).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")} />
        ))}
        <line x1={X(m)} x2={X(m)} y1={Y(0)} y2={Y(top)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <text x={W - 8} y={H - 4} textAnchor="end" className="viz-label">{2 * K} steps</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        expected returns by step {2 * m}: 1D {curves[0][m - 1].toFixed(2)}, 2D {curves[1][m - 1].toFixed(2)}, 3D {curves[2][m - 1].toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The expected number of visits back to the origin is the sum of the return probabilities P(S₂ₖ = 0). In one dimension
        they decay like 1/√k and the sum grows like √n; in two like 1/k and the sum grows like log n, slowly but without
        bound; in three like k^(−3/2) and the sum levels off near 0.516. Infinitely many expected returns means the walk
        returns for sure; a finite total means it may escape for ever.
      </figcaption>
    </figure>
  );
}
