"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 4096;
const OFFSETS = [0, 100, 1000, 10000];
const f = Math.fround;

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
}

/**
 * The variance of one row of 4096 float32 activations, offset + N(0, 1), computed three ways with every operation rounded to
 * float32: one pass with the sum and the sum of squares, two passes (mean first, then squared deviations), and Welford's update.
 * Returns the three results and the exact variance of the stored values, computed in float64.
 */
export function rowVariances(offset: number, seed = 3) {
  const r = rand(seed);
  const x = Array.from({ length: N }, () => f(offset + gauss(r)));
  let s = 0, q = 0;
  for (const v of x) { s = f(s + v); q = f(q + f(v * v)); }
  const m1 = f(s / N);
  const naive = f(f(q / N) - f(m1 * m1));
  let d = 0;
  for (const v of x) { const e = f(v - m1); d = f(d + f(e * e)); }
  const twoPass = f(d / N);
  let mean = 0, m2 = 0;
  x.forEach((v, i) => { const dl = f(v - mean); mean = f(mean + f(dl / (i + 1))); m2 = f(m2 + f(dl * f(v - mean))); });
  const welford = f(m2 / N);
  const mu = x.reduce((a, b) => a + b, 0) / N;
  const exact = x.reduce((a, b) => a + (b - mu) * (b - mu), 0) / N;
  return { naive, twoPass, welford, exact };
}

export function VarianceCancellationViz() {
  const [k, setK] = useState(2);
  const v = useMemo(() => rowVariances(OFFSETS[k]), [k]);
  const rows = [
    { name: "sum of squares", val: v.naive },
    { name: "two passes", val: v.twoPass },
    { name: "Welford", val: v.welford },
  ];
  const W = 330, H = 128, X0 = 96, PW = 200, LO = -2, HI = 3;
  const px = (t: number) => X0 + ((Math.max(LO, Math.min(HI, t)) - LO) / (HI - LO)) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Mean of the activations">
          {OFFSETS.map((o, i) => <button key={o} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>mean {o}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Variance of a row computed three ways in float32">
        {[-2, -1, 0, 1, 2, 3].map((t) => (
          <g key={t}>
            <line x1={px(t)} x2={px(t)} y1={6} y2={100} stroke="var(--border)" strokeDasharray={t ? "2 3" : undefined} />
            <text x={px(t)} y={112} textAnchor="middle" className="viz-label">{t}</text>
          </g>
        ))}
        <line x1={px(v.exact)} x2={px(v.exact)} y1={4} y2={102} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 2" />
        {rows.map((row, i) => {
          const a = px(Math.min(0, row.val)), b = px(Math.max(0, row.val));
          const off = row.val < LO || row.val > HI;
          return (
            <g key={row.name}>
              <text x={X0 - 6} y={26 + i * 30} textAnchor="end" className="viz-label">{row.name}</text>
              <rect x={a} y={13} width={Math.max(b - a, 1)} height={18} transform={`translate(0 ${i * 30})`} style={{ fill: "var(--text-muted)" }} opacity={0.75} />
              {off && <text x={row.val > HI ? X0 + PW - 2 : X0 + 2} y={26 + i * 30} textAnchor={row.val > HI ? "end" : "start"} className="viz-label" style={{ fill: "var(--bg)" }}>off scale</text>}
            </g>
          );
        })}
        <text x={X0 + PW / 2} y={H - 2} textAnchor="middle" className="viz-label">computed variance; dashed: exact</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        exact {v.exact.toFixed(4)}; sum of squares {v.naive.toPrecision(4)}, two passes {v.twoPass.toFixed(4)}, Welford {v.welford.toFixed(4)}
      </div>
      <figcaption className="viz-caption">
        One row of 4096 activations with unit spread around a chosen mean, its variance computed in float32 three ways. The sum of
        squares and the square of the mean are both large and nearly equal, so their difference loses almost every significant digit as
        the mean grows, and can even come out negative. Subtracting the mean before squaring, in two passes or with Welford&apos;s update,
        keeps the answer accurate.
      </figcaption>
    </figure>
  );
}
