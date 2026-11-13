"use client";

import { useState } from "react";

type Ex = "bad" | "good";
const K = 6;
const entry = (ex: Ex, i: number, j: number) => (ex === "bad" ? (i === j ? 1 : j === i + 1 ? -1 : 0) : Math.pow(2, -i - j) * (((i + j) % 2 === 0) ? 1 : -1));
const fmt = (v: number) => (Math.abs(v) < 1e-9 ? "0" : Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(3));

/** Summing a doubly infinite array by rows or by columns: the answers can differ unless the array is absolutely summable. */
export function DoubleSeriesViz() {
  const [ex, setEx] = useState<Ex>("bad");
  const [order, setOrder] = useState<"rows" | "cols">("rows");
  const rowSum = (i: number) => { let s = 0; for (let j = 0; j < 60; j++) s += entry(ex, i, j); return s; };
  const colSum = (j: number) => { let s = 0; for (let i = 0; i < 60; i++) s += entry(ex, i, j); return s; };
  let totR = 0, totC = 0;
  for (let i = 0; i < 59; i++) { totR += rowSum(i); totC += colSum(i); }
  const C = 40, W = 30 + (K + 1) * C, H = 26 + (K + 1) * 28;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={ex === "bad"} onClick={() => setEx("bad")}>1 on diagonal, −1 beside it</button>
        <button type="button" className="seg" aria-pressed={ex === "good"} onClick={() => setEx("good")}>(−1)^(i+j) 2^−(i+j)</button>
      </div>
      <div className="viz-controls">
        <button type="button" className="seg" aria-pressed={order === "rows"} onClick={() => setOrder("rows")}>rows first</button>
        <button type="button" className="seg" aria-pressed={order === "cols"} onClick={() => setOrder("cols")}>columns first</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Corner of the array with row or column sums">
        {Array.from({ length: K }, (_, i) => Array.from({ length: K }, (_, j) => (
          <g key={`${i}-${j}`}>
            <rect x={20 + j * C} y={10 + i * 28} width={C - 4} height={24} fill={entry(ex, i, j) !== 0 ? "var(--accent-soft)" : "none"} stroke="var(--border)" />
            <text x={20 + j * C + (C - 4) / 2} y={10 + i * 28 + 16} textAnchor="middle" className="viz-label">{fmt(entry(ex, i, j))}</text>
          </g>
        )))}
        {order === "rows"
          ? Array.from({ length: K }, (_, i) => <text key={i} x={20 + K * C + 4} y={10 + i * 28 + 16} className="viz-label" style={{ fill: "var(--danger)" }}>{fmt(rowSum(i))}</text>)
          : Array.from({ length: K }, (_, j) => <text key={j} x={20 + j * C + (C - 4) / 2} y={10 + K * 28 + 16} textAnchor="middle" className="viz-label" style={{ fill: "var(--danger)" }}>{fmt(colSum(j))}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        sum of row sums {fmt(totR)}; sum of column sums {fmt(totC)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The grid shows the top-left corner of an infinite array, with each row&apos;s or column&apos;s full sum beside it. In the
        first array every row sums to 0 but the first column sums to 1, so the two orders give 0 and 1. The second array is
        absolutely summable (the absolute values add up to 4), and both orders give the same total, 4/9.
      </figcaption>
    </figure>
  );
}
