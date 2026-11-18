"use client";

import { useState } from "react";

const RIDGE = 989e12 / 3.35e12;
const EXP = Array.from({ length: 15 }, (_, i) => i); // 2^0 .. 2^14

/** Arithmetic intensity (FLOPs per byte, bf16) of an m × k by k × n product. */
export function mmIntensity(m: number, n: number, k: number) {
  return (2 * m * n * k) / (2 * (m * k + k * n + m * n));
}

export function IntensityMapViz() {
  const [ne, setNe] = useState(12);
  const n = 2 ** ne;
  const cs = 17, X0 = 34, Y0 = 4, W = X0 + EXP.length * cs + 4, H = Y0 + EXP.length * cs + 30;
  let above = 0;
  const cells = EXP.flatMap((me) =>
    EXP.map((ke) => {
      const I = mmIntensity(2 ** me, n, 2 ** ke);
      if (I >= RIDGE) above++;
      return { me, ke, I };
    }),
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="im-n">n: {n}</label>
        <input id="im-n" type="range" min={6} max={14} step={1} value={ne} onChange={(e) => setNe(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Matrix shapes coloured by arithmetic intensity">
        {cells.map(({ me, ke, I }) => {
          const t = Math.min(1, Math.log2(I + 1) / Math.log2(RIDGE + 1));
          return (
            <rect key={`${me}-${ke}`} x={X0 + ke * cs} y={Y0 + (14 - me) * cs} width={cs - 1} height={cs - 1}
              fill={I >= RIDGE ? "var(--accent)" : "var(--danger)"} opacity={I >= RIDGE ? 1 : 0.15 + 0.6 * t}>
              <title>{`m=${2 ** me}, k=${2 ** ke}: ${I.toFixed(1)} FLOP/byte`}</title>
            </rect>
          );
        })}
        {[0, 7, 14].map((e) => (
          <g key={e}>
            <text x={X0 - 3} y={Y0 + (14 - e) * cs + 12} textAnchor="end" className="viz-label" style={{ fontSize: 9 }}>{2 ** e}</text>
            <text x={X0 + e * cs + cs / 2} y={Y0 + 15 * cs + 10} textAnchor="middle" className="viz-label" style={{ fontSize: 9 }}>{2 ** e}</text>
          </g>
        ))}
        <text x={X0 + 7.5 * cs} y={H - 4} textAnchor="middle" className="viz-label">k (inner dimension)</text>
        <text x={8} y={Y0 + 7.5 * cs} textAnchor="middle" className="viz-label" transform={`rotate(-90 8 ${Y0 + 7.5 * cs})`}>m</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${above} of ${cells.length} shapes reach the H100 ridge of ${RIDGE.toFixed(0)} FLOP/byte`}
      </div>
      <figcaption className="viz-caption">
        Each cell is an m × k by k × n product in bfloat16, with m and k from 1 to 16 384. Blue cells have arithmetic
        intensity of at least 295 FLOPs per byte and can be compute-bound on an H100; red ones cannot, and are paler the
        lower the intensity. Intensity is set by the smallest dimension: a product is compute-bound only when all three
        of m, n and k are in the hundreds, so with n below 512 no shape qualifies.
      </figcaption>
    </figure>
  );
}
