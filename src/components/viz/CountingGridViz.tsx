"use client";

import { useState } from "react";

const L = "PQRSTU";

/** The product rule as a grid of choices made in sequence, and the sum rule as two disjoint lists placed end to end. */
export function CountingGridViz() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(4);
  const [mode, setMode] = useState<"and" | "or">("and");
  const C = 34, W = 520, H = 230;
  const cells: { x: number; y: number; label: string; on: boolean }[] = [];
  if (mode === "and") {
    const x0 = (W - b * C) / 2 + 10, y0 = (H - a * C) / 2 + 10;
    for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) cells.push({ x: x0 + j * C, y: y0 + i * C, label: `${L[i]}${j + 1}`, on: true });
  } else {
    const x0 = (W - (a + b) * C) / 2;
    for (let i = 0; i < a; i++) cells.push({ x: x0 + i * C, y: H / 2 - C / 2, label: L[i], on: true });
    for (let j = 0; j < b; j++) cells.push({ x: x0 + (a + j) * C, y: H / 2 - C / 2, label: String(j + 1), on: false });
  }
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Rule">
        <button type="button" className="seg" aria-pressed={mode === "and"} onClick={() => setMode("and")}>A letter and a digit</button>
        <button type="button" className="seg" aria-pressed={mode === "or"} onClick={() => setMode("or")}>A letter or a digit</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={mode === "and" ? `A grid of ${a * b} pairs` : `A row of ${a + b} single choices`}>
        {mode === "and" && Array.from({ length: a }, (_, i) => (
          <text key={`r${i}`} x={cells[i * b].x - 12} y={cells[i * b].y + C / 2 + 4} textAnchor="middle" className="viz-label">{L[i]}</text>
        ))}
        {mode === "and" && Array.from({ length: b }, (_, j) => (
          <text key={`c${j}`} x={cells[j].x + C / 2} y={cells[j].y - 8} textAnchor="middle" className="viz-label">{j + 1}</text>
        ))}
        {cells.map((c, k) => (
          <g key={k}>
            <rect x={c.x + 2} y={c.y + 2} width={C - 4} height={C - 4} rx={4} className={c.on ? "viz-cell is-on" : "viz-cell"} />
            <text x={c.x + C / 2} y={c.y + C / 2 + 4} textAnchor="middle" className="plot-tick">{c.label}</text>
          </g>
        ))}
      </svg>
      <div className="viz-sliders">
        <label><span>Letters <span className="mono">a = {a}</span></span><input type="range" min={1} max={6} value={a} onChange={(e) => setA(Number(e.target.value))} /></label>
        <label><span>Digits <span className="mono">b = {b}</span></span><input type="range" min={1} max={8} value={b} onChange={(e) => setB(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {mode === "and"
          ? <>Choosing a letter <em>and then</em> a digit: each of the {a} letters pairs with each of the {b} digits, a grid of <span className="mono">{a} × {b} = {a * b}</span> labels.</>
          : <>Choosing a letter <em>or</em> a digit: the two lists share nothing, so they lie end to end, <span className="mono">{a} + {b} = {a + b}</span> choices.</>}
      </figcaption>
    </figure>
  );
}
