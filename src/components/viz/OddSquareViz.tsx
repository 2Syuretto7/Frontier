"use client";

import { useState } from "react";

const SIDE = 220, X0 = 40, Y0 = 20;
const STRIP = { fill: "color-mix(in srgb, var(--text-muted) 22%, transparent)" };
const CORNER = { fill: "color-mix(in srgb, var(--danger) 50%, transparent)", stroke: "var(--danger)" };

/** An n by n square cut up to show the parity of n²: four equal blocks if n is even, 4k² + 4k + 1 if n is odd. */
export function OddSquareViz() {
  const [n, setN] = useState(7);
  const s = SIDE / n;
  const k = Math.floor(n / 2);
  const odd = n % 2 === 1;
  const cells = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let cls = "viz-cell is-on", style: React.CSSProperties | undefined;
      if (odd) {
        const inI = i < 2 * k, inJ = j < 2 * k;
        if (!inI && !inJ) { cls = "viz-cell"; style = CORNER; }
        else if (!inI || !inJ) { cls = "viz-cell"; style = STRIP; }
      } else if ((i < k) !== (j < k)) { cls = "viz-cell"; style = STRIP; }
      cells.push(<rect key={`${i}-${j}`} x={X0 + j * s} y={Y0 + i * s} width={s} height={s} className={cls} style={style} />);
    }
  }

  return (
    <figure className="viz">
      <svg viewBox="0 0 620 260" role="img" aria-label={`A ${n} by ${n} square split to show whether ${n * n} is even or odd`}>
        {cells}
        <text x={X0 + SIDE + 40} y={Y0 + 30} className="viz-label">n = {n} = {odd ? `2·${k} + 1` : `2·${k}`}</text>
        {odd ? (
          <>
            <text x={X0 + SIDE + 40} y={Y0 + 70} className="viz-label">big block: (2k)² = 4k² = {4 * k * k}</text>
            <text x={X0 + SIDE + 40} y={Y0 + 98} className="viz-label">two strips: 2 · 2k = 4k = {4 * k}</text>
            <text x={X0 + SIDE + 40} y={Y0 + 126} className="viz-label" style={{ fill: "var(--danger)" }}>one corner cell: 1</text>
            <text x={X0 + SIDE + 40} y={Y0 + 166} className="viz-label is-on">n² = 2(2k² + 2k) + 1 = {n * n}, odd</text>
          </>
        ) : (
          <>
            <text x={X0 + SIDE + 40} y={Y0 + 70} className="viz-label">four blocks of k² = {k * k}</text>
            <text x={X0 + SIDE + 40} y={Y0 + 110} className="viz-label is-on">n² = 4k² = 2(2k²) = {n * n}, even</text>
          </>
        )}
      </svg>
      <div className="viz-controls">
        <span className="viz-stepper"><span className="viz-stepper-label">n</span>
          <button type="button" className="btn" onClick={() => setN(Math.max(2, n - 1))} disabled={n <= 2} aria-label="Decrease n">−</button>
          <span className="mono viz-stepper-value">{n}</span>
          <button type="button" className="btn" onClick={() => setN(Math.min(13, n + 1))} disabled={n >= 13} aria-label="Increase n">+</button>
        </span>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {odd
          ? <>Starting from an <strong>odd</strong> n gives you something to build with: the square splits into an even part and one leftover cell, so n² is odd. That is the contrapositive of &ldquo;if n² is even, then n is even&rdquo;, and proving it proves the original.</>
          : <>For even n the square splits into four equal blocks, so n² is even. Try odd values of n: the single red cell is what makes n² odd.</>}
      </figcaption>
    </figure>
  );
}
