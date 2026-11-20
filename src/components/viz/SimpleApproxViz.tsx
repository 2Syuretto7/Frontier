"use client";

import { useMemo, useState } from "react";

const f = (x: number) => 1.5 + Math.sin(7 * x) * 0.9 + 1.2 * x * x;
const GRID = Array.from({ length: 801 }, (_, i) => i / 800);
export const NS = [1, 2, 3, 4, 6];

/** The standard simple approximation φₙ = min(n, 2⁻ⁿ⌊2ⁿ f⌋), and its largest gap below f on the grid. */
export const phi = (y: number, n: number) => Math.min(n, Math.floor(2 ** n * y) / 2 ** n);
export function gap(n: number) {
  return Math.max(...GRID.map((x) => f(x) - phi(f(x), n)));
}

export function SimpleApproxViz() {
  const [ni, setNi] = useState(1);
  const n = NS[ni];
  const gaps = useMemo(() => NS.map(gap), []);
  const W = 330, H = 170, X0 = 26, PW = 296, Y0 = 6, PH = 150, YH = 3.4;
  const sx = (x: number) => X0 + x * PW, sy = (y: number) => Y0 + PH - (y / YH) * PH;
  const levels = Array.from({ length: Math.floor(Math.min(n, YH) * 2 ** n) + 1 }, (_, k) => k / 2 ** n);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">n</span>
        <div className="segmented" role="group" aria-label="Approximation level">
          {NS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ni === i} onClick={() => setNi(i)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A function and its simple approximation from below">
        {n <= 4 && levels.map((v) => <line key={v} x1={X0} x2={X0 + PW} y1={sy(v)} y2={sy(v)} stroke="var(--border)" strokeWidth={0.6} />)}
        <line x1={X0} x2={X0 + PW} y1={sy(n)} y2={sy(n)} stroke="var(--code-function)" strokeDasharray="4 3" />
        {[0, 1, 2, 3].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <path d={GRID.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text)" strokeWidth={1.2} strokeDasharray="4 3" />
        <path d={GRID.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(phi(f(x), n)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span>┅ f</span>
        <span><span style={{ color: "var(--accent)" }}>━</span> φₙ</span>
        <span><span style={{ color: "var(--code-function)" }}>┅</span> cap at height n</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        largest gap f − φₙ for n = {NS.join(", ")}: {gaps.map((v) => v.toFixed(3)).join(", ")}
      </div>
      <figcaption className="viz-caption">
        The simple function φₙ rounds f down to the grid of multiples of 2⁻ⁿ and caps it at n. While f still exceeds the
        cap somewhere the gap is large: 2.291 at n = 1, 1.291 at n = 2 and 0.291 at n = 3, since f reaches 3.29. Once the cap
        is above f the gap is below 2⁻ⁿ: 0.062 at n = 4 and 0.016 at n = 6. Each φₙ takes finitely many values on
        measurable sets, and the sequence increases to f.
      </figcaption>
    </figure>
  );
}
