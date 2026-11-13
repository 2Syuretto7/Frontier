"use client";

import { useState } from "react";

const SIZES = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];

const fmt = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}e9` : v >= 1e6 ? `${(v / 1e6).toFixed(2)}e6` : String(v));

/** Multiplication counts for the two pairwise orders of A·B·C, and for one big loop over all four indices. */
export function ContractionOrderViz() {
  const [k, setK] = useState([8, 8, 8, 0]);
  const p = k.map((i) => SIZES[i]);
  const left = p[0] * p[1] * p[2] + p[0] * p[2] * p[3];
  const right = p[1] * p[2] * p[3] + p[0] * p[1] * p[3];
  const naive = p[0] * p[1] * p[2] * p[3];
  const rows: [string, number, string][] = [
    ["(AB)C", left, "var(--accent)"],
    ["A(BC)", right, "var(--text)"],
    ["one loop", naive, "var(--danger)"],
  ];
  const top = Math.log10(Math.max(left, right, naive)) + 0.3;
  const W = 320;
  const bar = (v: number) => Math.max(2, (Math.log10(Math.max(v, 1)) / top) * (W - 120));
  const names = ["i", "j", "k", "l"];
  const set = (n: number, v: number) => setK(k.map((x, i) => (i === n ? v : x)));
  const best = left < right ? "(AB)C" : right < left ? "A(BC)" : "either order";
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        {names.map((nm, n) => (
          <label key={nm} className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
            {nm} = {p[n]}
            <input type="range" min={0} max={SIZES.length - 1} value={k[n]} onChange={(e) => set(n, Number(e.target.value))} aria-label={`size of index ${nm}`} style={{ width: 80 }} />
          </label>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "4px 0", textAlign: "center" }}>
        einsum(&quot;ij,jk,kl-&gt;il&quot;, A, B, C)
      </div>
      <svg viewBox={`0 0 ${W} 96`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Multiplication counts of three ways to evaluate a matrix chain, on a log scale">
        {rows.map(([name, v, col], r) => (
          <g key={name}>
            <text x={62} y={22 + r * 28} textAnchor="end" className="viz-label">{name}</text>
            <rect x={68} y={10 + r * 28} width={bar(v)} height={16} fill={col} opacity={0.75} />
            <text x={72 + bar(v)} y={22 + r * 28} className="viz-label">{fmt(v)}</text>
          </g>
        ))}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Bars are on a log scale. Contracting A and B first costs ijk + ikl multiplications, contracting B and C first costs
        jkl + ijl, and one loop over all four indices costs ijkl. Here {best} is cheaper. Set l = 1, so C is a vector: then
        A(BC) is two matrix–vector products and (AB)C pays for a whole matrix product first.
      </figcaption>
    </figure>
  );
}
