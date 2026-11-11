"use client";

import { useState } from "react";

type Fam = { name: string; iv: (n: number) => [number, number, boolean, boolean]; lim: string };
// [left, right, closed on left, closed on right]
const FAMS: Fam[] = [
  { name: "Aₙ = [−1/n, 1/n]", iv: (n) => [-1 / n, 1 / n, true, true], lim: "Every Aₙ contains 0, and any other number x is left out once 1/n < |x|. So the intersection of all of them is exactly {0}." },
  { name: "Aₙ = (0, 1/n)", iv: (n) => [0, 1 / n, false, false], lim: "Any x > 0 is left out once 1/n ≤ x, and 0 is in none of them. So the intersection of all of them is empty, though each Aₙ is not." },
  { name: "Aₙ = [1/n, 2]", iv: (n) => [1 / n, 2, true, true], lim: "Every x with 0 < x ≤ 2 is in Aₙ once 1/n ≤ x, but 0 is in none. So the union of all of them is (0, 2], though each Aₙ is closed." },
  { name: "Aₙ = [n − 1, n]", iv: (n) => [n - 1, n, true, true], lim: "Neighbours overlap at a single point and the union keeps growing: the union of all of them is [0, ∞)." },
];
const X0 = 40, W = 540;

/** An indexed family of intervals, with its union and intersection for n = 1 to N. */
export function FamilyViz() {
  const [f, setF] = useState(0);
  const [N, setN] = useState(5);
  const F = FAMS[f];
  const ivs = Array.from({ length: N }, (_, i) => F.iv(i + 1));
  const lo = Math.min(-1.1, ...ivs.map((v) => v[0])), hi = Math.max(2.1, ...ivs.map((v) => v[1]));
  const X = (x: number) => X0 + ((x - lo) / (hi - lo)) * W;
  const uL = Math.min(...ivs.map((v) => v[0])), uR = Math.max(...ivs.map((v) => v[1]));
  const iL = Math.max(...ivs.map((v) => v[0])), iR = Math.min(...ivs.map((v) => v[1]));
  const lastL = ivs.find((v) => v[0] === iL)!, lastR = ivs.find((v) => v[1] === iR)!;
  const nonempty = iL < iR || (iL === iR && lastL[2] && lastR[3]);
  const rowH = 18, top = 20;
  const yU = top + N * rowH + 22, yI = yU + 30;
  const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(2)).replace("-", "−");
  const end = (x: number, y: number, closed: boolean, cls: string) => (
    <circle cx={X(x)} cy={y} r={4} className={cls} style={closed ? undefined : { fill: "var(--surface)", stroke: cls === "plot-hot" ? "var(--danger)" : "var(--accent)", strokeWidth: 1.5 }} />
  );
  const bar = (l: number, r: number, cl: boolean, cr: boolean, y: number, cls: string, endCls: string) => (
    <g>
      <line x1={X(l)} y1={y} x2={X(r)} y2={y} className={cls} />
      {end(l, y, cl, endCls)}
      {end(r, y, cr, endCls)}
    </g>
  );

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {FAMS.map((x, i) => (
          <button key={x.name} type="button" className={i === f ? "btn btn-primary" : "btn"} aria-pressed={i === f} onClick={() => setF(i)}><span className="mono">{x.name}</span></button>
        ))}
      </div>
      <svg viewBox={`0 0 620 ${yI + 40}`} role="img" aria-label={`The intervals ${F.name} for n from 1 to ${N}, with their union and intersection`}>
        {[...Array(Math.floor(hi) - Math.ceil(lo) + 1)].map((_, i) => {
          const t = Math.ceil(lo) + i;
          return <g key={t}><line x1={X(t)} y1={top - 8} x2={X(t)} y2={yI + 8} className="plot-grid" /><text x={X(t)} y={yI + 26} textAnchor="middle" className="plot-tick">{t}</text></g>;
        })}
        {ivs.map((v, i) => (
          <g key={i}>
            <text x={X0 - 8} y={top + i * rowH + 4} textAnchor="end" className="plot-tick">A{i + 1}</text>
            {bar(v[0], v[1], v[2], v[3], top + i * rowH, "plot-curve", "plot-point")}
          </g>
        ))}
        <text x={X0 - 8} y={yU + 4} textAnchor="end" className="viz-label">∪</text>
        {bar(uL, uR, ivs.find((v) => v[0] === uL)![2], ivs.find((v) => v[1] === uR)![3], yU, "plot-curve-2", "plot-point")}
        <text x={X0 - 8} y={yI + 4} textAnchor="end" className="viz-label">∩</text>
        {nonempty ? bar(iL, iR, lastL[2], lastR[3], yI, "plot-curve", "plot-hot") : <text x={X(0) + 6} y={yI + 4} className="viz-label" style={{ fill: "var(--danger)" }}>empty</text>}
      </svg>
      <div className="viz-controls">
        <span className="viz-stepper"><span className="viz-stepper-label">N</span>
          <button type="button" className="btn" onClick={() => setN(Math.max(1, N - 1))} disabled={N <= 1} aria-label="Fewer sets">−</button>
          <span className="mono viz-stepper-value">{N}</span>
          <button type="button" className="btn" onClick={() => setN(Math.min(10, N + 1))} disabled={N >= 10} aria-label="More sets">+</button>
        </span>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        For n = 1 to {N}: the union runs from {fmt(uL)} to {fmt(uR)}, and the intersection is{" "}
        {nonempty ? (iL === iR ? <>the single point {fmt(iL)}</> : <>from {fmt(iL)} to {fmt(iR)}</>) : <>empty</>}. Over all n = 1, 2, 3, &hellip;: {F.lim}
      </figcaption>
    </figure>
  );
}
