"use client";

import { useState } from "react";

type Mode = "event" | "conditional";

/** Two dice as a 6 × 6 sample space: an event is a set of cells, and conditioning shrinks the space to the cells of the given event. */
export function DiceGridViz({ mode }: { mode: Mode }) {
  const [s, setS] = useState(7);
  const [given, setGiven] = useState(4);
  const C = 40;
  const cells = [];
  let inA = 0, inB = 0, inAB = 0;
  for (let r = 1; r <= 6; r++) for (let c = 1; c <= 6; c++) {
    const a = r + c === s, b = r >= given;
    if (a) inA++;
    if (b) inB++;
    if (a && b) inAB++;
    const live = mode === "event" || b;
    cells.push(
      <g key={`${r}-${c}`}>
        <rect x={30 + (c - 1) * C + 2} y={24 + (r - 1) * C + 2} width={C - 4} height={C - 4} rx={4} className={a && live ? "viz-cell is-on" : "viz-cell"} style={live ? undefined : { opacity: 0.25 }} />
        <text x={30 + (c - 1) * C + C / 2} y={24 + (r - 1) * C + C / 2 + 4} textAnchor="middle" className="plot-tick" style={live ? undefined : { opacity: 0.35 }}>{r + c}</text>
      </g>,
    );
  }
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${30 + 6 * C + 10} ${24 + 6 * C + 10}`} style={{ maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="The 36 outcomes of two dice">
        {[1, 2, 3, 4, 5, 6].map((v) => (
          <g key={v}>
            <text x={30 + (v - 1) * C + C / 2} y={16} textAnchor="middle" className="viz-label">{v}</text>
            <text x={16} y={24 + (v - 1) * C + C / 2 + 4} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ))}
        {cells}
      </svg>
      <div className="viz-sliders">
        <label><span>Event A: the total is <span className="mono">{s}</span></span><input type="range" min={2} max={12} value={s} onChange={(e) => setS(Number(e.target.value))} /></label>
        {mode === "conditional" && <label><span>Given B: first die ≥ <span className="mono">{given}</span></span><input type="range" min={1} max={6} value={given} onChange={(e) => setGiven(Number(e.target.value))} /></label>}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Rows are the first die, columns the second; each cell shows the total and has probability 1/36.{" "}
        {mode === "event"
          ? <>A has <span className="mono">{inA}</span> cells, so P(A) = {inA}/36{inA ? ` ≈ ${(inA / 36).toFixed(3)}` : ""}. Totals near 7 have the most cells, which is why 7 is the commonest total.</>
          : <>Knowing B leaves {inB} cells. Of these, {inAB} are in A, so <span className="mono">P(A | B) = {inAB}/{inB}{inB ? ` ≈ ${(inAB / inB).toFixed(3)}` : ""}</span>, against P(A) = {inA}/36 ≈ {(inA / 36).toFixed(3)} without the information.{inAB * 36 === inA * inB ? " Here they are equal: A and B are independent." : ""}</>}
      </figcaption>
    </figure>
  );
}
