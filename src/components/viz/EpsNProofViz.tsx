"use client";

import { useState } from "react";

const a = (n: number) => 1 + (n % 2 === 0 ? 1 : -1) / n;
const b = (n: number) => 2 + 1 / n;
const NMAX = 80;

/** The product of two convergent sequences: the N that the ε-proof guarantees, against the first N that actually works. */
export function EpsNProofViz() {
  const [k, setK] = useState(20);
  const eps = 0.02 + (k / 40) * 0.98;
  const M = 2, L = 2;
  const Na = (e: number) => Math.floor(1 / e) + 1;
  const Nb = (e: number) => Math.floor(1 / e) + 1;
  const proofN = Math.max(Na(eps / (2 * (Math.abs(2) + 1))), Nb(eps / (2 * M)));
  let actual = 1;
  for (let n = 400; n >= 1; n--) if (Math.abs(a(n) * b(n) - L) >= eps) { actual = n + 1; break; }
  const W = 330, H = 190;
  const X = (n: number) => 30 + ((n - 1) / (NMAX - 1)) * (W - 40);
  const lo = 0.5, hi = 4.2;
  const Y = (v: number) => 10 + ((hi - Math.max(lo, Math.min(hi, v))) / (hi - lo)) * (H - 34);
  const pts = Array.from({ length: NMAX }, (_, i) => i + 1);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          ε = {eps.toFixed(3)}
          <input type="range" min={0} max={40} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="epsilon" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The product sequence with an epsilon band and two thresholds">
        <rect x={30} y={Y(L + eps)} width={W - 40} height={Y(L - eps) - Y(L + eps)} fill="var(--accent-soft)" />
        <line x1={30} x2={W - 10} y1={Y(L)} y2={Y(L)} stroke="var(--border)" />
        <text x={26} y={Y(L) + 4} textAnchor="end" className="viz-label">2</text>
        {actual <= NMAX && <line x1={X(actual)} x2={X(actual)} y1={10} y2={H - 24} stroke="var(--accent)" strokeDasharray="3 3" />}
        {proofN <= NMAX && <line x1={X(proofN)} x2={X(proofN)} y1={10} y2={H - 24} stroke="var(--danger)" strokeDasharray="5 3" />}
        {pts.map((n) => (
          <circle key={n} cx={X(n)} cy={Y(a(n) * b(n))} r={2.2} fill={Math.abs(a(n) * b(n) - L) < eps ? "var(--accent)" : "var(--text-muted)"} />
        ))}
        {[1, 20, 40, 60, 80].map((n) => <text key={n} x={X(n)} y={H - 8} textAnchor="middle" className="viz-label">{n}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        first N that works: {actual}; N from the proof: {proofN}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Here aₙ = 1 + (−1)ⁿ/n → 1 and bₙ = 2 + 1/n → 2, so aₙbₙ → 2. The proof splits |aₙbₙ − 2| ≤ |aₙ||bₙ − 2| + 2|aₙ − 1|,
        uses |aₙ| ≤ M = 2, and asks each piece to be below ε/2. The red line is the N it guarantees; the other dashed line is the
        first N after which every point stays in the band. The proof&apos;s N is larger, which is fine: a proof only needs
        some N that works.
      </figcaption>
    </figure>
  );
}
