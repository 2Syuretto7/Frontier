"use client";

import { useState } from "react";

const S = 30;

/** The odd numbers 1, 3, 5, … as L-shaped layers that build a square: 1 + 3 + … + (2n − 1) = n². */
export function GnomonViz() {
  const [n, setN] = useState(5);
  const size = n * S;
  const x0 = (620 - size) / 2, y0 = 20 + (300 - size);
  const cells = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const layer = Math.max(i, j); // cell (i, j) belongs to the L-shaped layer number layer + 1
      cells.push(<rect key={`${i}-${j}`} x={x0 + i * S} y={y0 + (n - 1 - j) * S} width={S} height={S} className={layer % 2 === 0 ? "viz-cell is-on" : "viz-cell"} />);
    }
  }
  const odds = Array.from({ length: n }, (_, k) => 2 * k + 1);

  return (
    <figure className="viz">
      <svg viewBox="0 0 620 330" role="img" aria-label={`A ${n} by ${n} square built from the first ${n} odd numbers`}>
        {cells}
        {odds.map((o, k) => (
          <text key={k} x={x0 + k * S + S / 2} y={y0 + (n - 1 - k) * S + S / 2 + 4} textAnchor="middle" className="plot-tick">{o}</text>
        ))}
      </svg>
      <div className="viz-controls">
        <span className="viz-stepper"><span className="viz-stepper-label">layers n</span>
          <button type="button" className="btn" onClick={() => setN(Math.max(1, n - 1))} disabled={n <= 1} aria-label="Remove a layer">−</button>
          <span className="mono viz-stepper-value">{n}</span>
          <button type="button" className="btn" onClick={() => setN(Math.min(10, n + 1))} disabled={n >= 10} aria-label="Add a layer">+</button>
        </span>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each new layer wraps an L of <span className="mono">2k − 1</span> cells round the square before, so{" "}
        <span className="mono">{odds.join(" + ")} = {n * n} = {n}²</span>. In sigma notation,{" "}
        <span className="mono">Σ<sub>k=1</sub><sup>{n}</sup> (2k − 1) = {n}²</span>.
      </figcaption>
    </figure>
  );
}
