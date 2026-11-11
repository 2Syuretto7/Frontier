"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { scales, type View } from "./Plot";

const SEQS: { name: string; a: (n: number) => number; L: number | null; ymin: number; ymax: number }[] = [
  { name: "(−1)ⁿ / n", a: (n) => (-1) ** n / n, L: 0, ymin: -1.1, ymax: 0.6 },
  { name: "(n + 1) / n", a: (n) => (n + 1) / n, L: 1, ymin: 0.9, ymax: 2.1 },
  { name: "(1 + 1/n)ⁿ", a: (n) => (1 + 1 / n) ** n, L: Math.E, ymin: 1.9, ymax: 2.85 },
  { name: "(−1)ⁿ", a: (n) => (-1) ** n, L: null, ymin: -1.3, ymax: 1.3 },
];
const NMAX = 60;

/** The ε–N game for sequences: draw a band of half-width ε round the limit, and find the N after which every term stays inside. */
export function SequenceViz() {
  const [k, setK] = useState(0);
  const [e, setE] = useState(1);
  const S = SEQS[k];
  const eps = 10 ** -e;
  const V: View = { xmin: 0, xmax: NMAX + 1, ymin: S.ymin, ymax: S.ymax, w: 520, h: 240 };
  const { X, Y } = scales(V);
  let N: number | null = null;
  if (S.L !== null) { N = 1; for (let n = 1; n <= 100000; n++) if (Math.abs(S.a(n) - S.L) >= eps) N = n + 1; }
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }} role="group" aria-label="Sequence">
        {SEQS.map((s, i) => <button key={s.name} type="button" className={i === k ? "btn btn-primary" : "btn"} aria-pressed={i === k} onClick={() => setK(i)}><span className="mono">aₙ = {s.name}</span></button>)}
      </div>
      <svg viewBox={`-10 -8 ${V.w + 20} ${V.h + 30}`} className="plot" role="img" aria-label={`The first ${NMAX} terms of ${S.name}`}>
        {S.L !== null && <rect x={0} y={Y(S.L + eps)} width={V.w} height={Math.max(0.5, Y(S.L - eps) - Y(S.L + eps))} className="viz-region" style={{ strokeWidth: 0 }} />}
        {S.L !== null && <line x1={0} x2={V.w} y1={Y(S.L)} y2={Y(S.L)} className="plot-ghost" />}
        {V.ymin < 0 && V.ymax > 0 && <line x1={0} x2={V.w} y1={Y(0)} y2={Y(0)} className="viz-axis" />}
        {N !== null && N <= NMAX && <line x1={X(N)} x2={X(N)} y1={0} y2={V.h} className="plot-line" />}
        {Array.from({ length: NMAX }, (_, i) => i + 1).map((n) => {
          const out = S.L === null || Math.abs(S.a(n) - S.L) >= eps;
          return <circle key={n} cx={X(n)} cy={Y(S.a(n))} r={3} className={out ? "plot-hot" : "plot-point"} />;
        })}
        <text x={V.w} y={V.h + 18} textAnchor="end" className="plot-tick">n = 1 to {NMAX}</text>
      </svg>
      <div className="viz-sliders">
        <label>ε = <span className="mono">{fmtNum(Number(eps.toPrecision(2)))}</span><input type="range" min={0} max={3} step={0.25} value={e} onChange={(ev) => setE(Number(ev.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {S.L === null
          ? "This sequence has no limit: it jumps between −1 and 1, so no band narrower than 2 can ever trap its tail."
          : `Every term from n = ${N} on lies within ${fmtNum(Number(eps.toPrecision(2)))} of the limit ${S.L === Math.E ? "e" : fmtNum(S.L)} (blue); the red terms are outside the band.${N !== null && N > NMAX ? ` Here N is beyond the ${NMAX} terms shown.` : ""} Shrink ε and N grows, but some N always exists: that is what convergence means.`}
      </figcaption>
    </figure>
  );
}
