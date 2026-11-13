"use client";

import { useState } from "react";

const DISTS: Record<string, number[]> = {
  die: [0, 1, 1, 1, 1, 1, 1].map((v) => v / 6),
  "Binomial(8, 0.3)": Array.from({ length: 9 }, (_, k) => {
    let c = 1;
    for (let i = 0; i < k; i++) c = (c * (8 - i)) / (i + 1);
    return c * Math.pow(0.3, k) * Math.pow(0.7, 8 - k);
  }),
  "Geometric(0.35)": Array.from({ length: 11 }, (_, k) => (k === 0 ? 0 : Math.pow(0.65, k - 1) * 0.35)),
};

/** E[X] as an area, cut into horizontal strips (k × P(X = k)) or vertical columns (P(X ≥ k)). */
export function TailSumViz() {
  const [name, setName] = useState("Binomial(8, 0.3)");
  const [cut, setCut] = useState<"rows" | "cols">("rows");
  const p = DISTS[name];
  const K = p.length - 1;
  const W = 320, H = 170;
  const X = (x: number) => 30 + (x / K) * (W - 44);
  const Y = (y: number) => H - 20 - y * (H - 34);
  // strips stacked bottom-up from the largest value, so column j has height P(X >= j)
  const strips: { k: number; y0: number; y1: number }[] = [];
  let acc = 0;
  for (let k = K; k >= 1; k--) {
    strips.push({ k, y0: acc, y1: acc + p[k] });
    acc += p[k];
  }
  const tail = (j: number) => p.slice(j).reduce((s, v) => s + v, 0);
  const mean = p.reduce((s, v, k) => s + k * v, 0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {Object.keys(DISTS).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={name === k} onClick={() => setName(k)}>{k}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={cut === "rows"} onClick={() => setCut("rows")}>Σ k·P(X = k)</button>
        <button type="button" className="seg" aria-pressed={cut === "cols"} onClick={() => setCut("cols")}>Σ P(X ≥ k)</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="The mean as an area cut two ways">
        <line x1={30} x2={W - 10} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={30} x2={30} y1={Y(0)} y2={Y(1)} stroke="var(--border)" />
        <text x={26} y={Y(1) + 4} textAnchor="end" className="viz-label">1</text>
        {Array.from({ length: K }, (_, i) => i + 1).map((j) => <text key={j} x={X(j - 0.5)} y={H - 6} textAnchor="middle" className="viz-label">{j}</text>)}
        {cut === "rows"
          ? strips.map((s, i) => (
              <rect key={s.k} x={X(0)} y={Y(s.y1)} width={X(s.k) - X(0)} height={Math.max(0, Y(s.y0) - Y(s.y1))} fill={i % 2 ? "var(--accent)" : "var(--accent-soft)"} stroke="var(--accent)" strokeWidth={0.6} />
            ))
          : Array.from({ length: K }, (_, i) => i + 1).map((j) => (
              <rect key={j} x={X(j - 1)} y={Y(tail(j))} width={X(1) - X(0)} height={Y(0) - Y(tail(j))} fill={j % 2 ? "var(--danger)" : "var(--accent-soft)"} opacity={0.75} stroke="var(--danger)" strokeWidth={0.6} />
            ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        area = E[X] = {mean.toFixed(4)}{name.startsWith("Geo") ? " (values above 10 not drawn)" : ""}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Stack a strip of width k and height P(X = k) for each value k, longest at the bottom. Cut into rows, the area is
        Σ k·P(X = k), the definition of the mean. Cut into unit columns, column k has height P(X ≥ k), so the same area is
        Σ P(X ≥ k): the tail-sum formula for variables with values 0, 1, 2, ….
      </figcaption>
    </figure>
  );
}
