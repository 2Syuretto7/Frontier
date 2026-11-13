"use client";

import { useState } from "react";

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const RATS: number[] = [];
for (let q = 1; RATS.length < 400; q++) for (let p = 1; p <= q; p++) if (gcd(p, q) === 1) RATS.push(p / q);

/** Cover the first N rationals in (0, 1] by intervals of lengths ε/2, ε/4, …: total length below ε, yet every listed rational is covered. */
export function RationalCoverViz() {
  const [n, setN] = useState(20);
  const [e, setE] = useState(10);
  const eps = e / 20;
  const W = 330, H = 120;
  const X = (v: number) => 14 + v * (W - 28);
  let total = 0;
  const bars = RATS.slice(0, n).map((r, k) => {
    const len = eps / Math.pow(2, k + 1);
    total += len;
    return { r, len, k };
  });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          rationals {n}
          <input type="range" min={1} max={400} value={n} onChange={(ev) => setN(Number(ev.target.value))} aria-label="number of rationals covered" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          ε {eps.toFixed(2)}
          <input type="range" min={1} max={20} value={e} onChange={(ev) => setE(Number(ev.target.value))} aria-label="total length budget" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Short intervals around listed rationals in the unit interval">
        <line x1={X(0)} x2={X(1)} y1={H - 26} y2={H - 26} stroke="var(--border)" />
        {bars.map(({ r, len, k }) => (
          <g key={k}>
            <rect x={X(r - len / 2)} y={H - 34 - Math.min(60, 60 * len / eps * 2)} width={Math.max(0.6, X(len) - X(0))} height={Math.min(60, 60 * len / eps * 2) + 8} fill="var(--accent)" opacity={0.35} />
            <circle cx={X(r)} cy={H - 26} r={1.6} fill="var(--danger)" />
          </g>
        ))}
        <text x={X(0)} y={H - 10} textAnchor="middle" className="viz-label">0</text>
        <text x={X(1)} y={H - 10} textAnchor="middle" className="viz-label">1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        total length of the covering intervals {total.toFixed(6)} &lt; ε = {eps.toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The rationals in (0, 1] can be listed: 1, 1/2, 1/3, 2/3, 1/4, 3/4, … Give the k-th one an interval of length ε/2ᵏ
        (taller bars are longer intervals). However many you list, the total length stays below ε, yet every rational is
        eventually covered. So the rationals, though dense, take up no length at all; the interval [0, 1], of length 1, cannot
        be listed.
      </figcaption>
    </figure>
  );
}
