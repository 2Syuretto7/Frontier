"use client";

import { useState } from "react";

const PRESETS: { name: string; L: number[] }[] = [
  { name: "1, 2, 3, 3", L: [1, 2, 3, 3] },
  { name: "2, 2, 2, 2", L: [2, 2, 2, 2] },
  { name: "1, 2, 3, 4", L: [1, 2, 3, 4] },
  { name: "1, 1, 2, 3", L: [1, 1, 2, 3] },
];

/** Codeword lengths as intervals of [0, 1): a prefix code exists exactly when the intervals of width 2^(−ℓ) fit, that is when Σ 2^(−ℓ) ≤ 1. */
export function KraftViz() {
  const [L, setL] = useState([1, 2, 3, 3]);
  const order = L.map((l, i) => ({ l, i })).sort((a, b) => a.l - b.l || a.i - b.i);
  let start = 0;
  const placed = order.map(({ l, i }) => {
    const w = 2 ** -l, s = start; start += w;
    const code = s + w <= 1 + 1e-12 ? Math.round(s * 2 ** l).toString(2).padStart(l, "0") : "—";
    return { i, l, s, w, code };
  });
  const sum = L.reduce((a, l) => a + 2 ** -l, 0);
  const ok = sum <= 1 + 1e-12;
  const W = 330, H = 150;
  const X = (x: number) => 15 + (Math.min(x, 1.6) / 1.6) * (W - 30);
  const set = (k: number, v: number) => setL(L.map((x, j) => (j === k ? v : x)));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {PRESETS.map((p) => (
          <button key={p.name} type="button" className="seg" aria-pressed={p.L.every((v, i) => v === L[i])} onClick={() => setL(p.L)}>{p.name}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        {L.map((l, k) => (
          <label key={k} className="mono" style={{ fontSize: 13, display: "flex", gap: 4, alignItems: "center" }}>
            ℓ{k + 1} = {l}
            <input type="range" min={1} max={5} value={l} onChange={(e) => set(k, Number(e.target.value))} aria-label={`length of codeword ${k + 1}`} style={{ width: 55 }} />
          </label>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Codeword intervals packed into the unit interval">
        <rect x={X(0)} y={40} width={X(1) - X(0)} height={40} fill="none" stroke="var(--text)" />
        <text x={X(0)} y={34} className="viz-label">0</text>
        <text x={X(1)} y={34} textAnchor="middle" className="viz-label">1</text>
        {placed.map((p) => (
          <g key={p.i}>
            <rect x={X(p.s) + 1} y={44} width={Math.max(1, X(p.s + p.w) - X(p.s) - 2)} height={32} fill={p.s + p.w <= 1 + 1e-12 ? "var(--accent)" : "var(--danger)"} opacity={0.6} />
            <text x={(X(p.s) + X(p.s + p.w)) / 2} y={64} textAnchor="middle" className="viz-label">{p.code}</text>
            <text x={(X(p.s) + X(p.s + p.w)) / 2} y={96} textAnchor="middle" className="viz-label">x{p.i + 1}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        Σ 2^(−ℓ) = {sum.toFixed(4)} {ok ? "≤ 1: a prefix code exists" : "> 1: no uniquely decodable code exists"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A codeword of length ℓ claims the interval of binary fractions that start with it, of width 2^(−ℓ). Two codewords
        are prefixes of each other exactly when their intervals overlap. Sorting the lengths and laying the intervals end
        to end gives a prefix code whenever they fit inside [0, 1), and the code is the start of each interval written in
        ℓ binary digits. If the widths add up to more than 1, the red intervals spill over and no prefix code exists.
      </figcaption>
    </figure>
  );
}
