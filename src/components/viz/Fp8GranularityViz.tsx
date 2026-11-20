"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const R = 8, C = 32;
export const GRANS = [
  { name: "per tensor", block: R * C },
  { name: "per row", block: C },
  { name: "blocks of 8", block: 8 },
];

/** Round to the nearest E4M3 value (3 mantissa bits, smallest normal 2^-6, subnormal step 2^-9), saturating at 448. */
export function e4m3(x: number) {
  if (x === 0) return 0;
  const a = Math.min(Math.abs(x), 448);
  const e = Math.max(Math.floor(Math.log2(a)), -6);
  const step = 2 ** (e - 3);
  let n = a / step, r = Math.round(n);
  if (Math.abs(n - Math.trunc(n) - 0.5) < 1e-12) r = Math.trunc(n) % 2 === 0 ? Math.trunc(n) : Math.trunc(n) + 1;
  return Math.sign(x) * Math.min(r * step, 448);
}

/** Activations of 8 tokens by 32 channels: each token has its own magnitude, and channel 5 carries an outlier of about 40 times. */
export function activations(seed = 7) {
  const r = rand(seed);
  return Array.from({ length: R }, (_, i) => {
    const mag = 10 ** (-4 + (4 * i) / (R - 1));
    return Array.from({ length: C }, (_, j) => (j === 5 ? 40 : 1) * mag * Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()));
  });
}

/** Quantise with one scale (amax / 448) per group of `block` consecutive elements in row-major order; return relative errors and their means. */
export function quantErrors(block: number) {
  const x = activations().flat();
  const err = x.map(() => 0);
  let zeros = 0;
  for (let b = 0; b < x.length; b += block) {
    const g = x.slice(b, b + block);
    const s = Math.max(...g.map(Math.abs)) / 448 || 1;
    g.forEach((v, i) => {
      const y = e4m3(v / s) * s;
      if (y === 0 && v !== 0) zeros++;
      err[b + i] = Math.abs(y - v) / Math.abs(v);
    });
  }
  const mean = (a: number[]) => a.reduce((u, v) => u + v, 0) / a.length;
  const perRow = Array.from({ length: R }, (_, i) => mean(err.slice(i * C, i * C + C)));
  return { err, zeros, perRow, total: mean(err) };
}

export function Fp8GranularityViz() {
  const [k, setK] = useState(0);
  const q = useMemo(() => quantErrors(GRANS[k].block), [k]);
  const CELL = 9, X0 = 4, Y0 = 4, W = X0 * 2 + C * CELL + 52, H = Y0 * 2 + R * CELL * 2;
  const shade = (e: number) => (e >= 1 ? 1 : e <= 1e-3 ? 0.05 : 0.05 + 0.95 * (Math.log10(e) + 3) / 3);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Scaling granularity">
          {GRANS.map((g, i) => <button key={g.name} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{g.name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Relative error of each activation after FP8 quantisation">
        {q.err.map((e, i) => {
          const r = Math.floor(i / C), c = i % C;
          return <rect key={i} x={X0 + c * CELL} y={Y0 + r * CELL * 2} width={CELL - 1} height={CELL * 2 - 1} style={{ fill: "var(--accent)", stroke: "var(--border)" }} strokeWidth={0.3} fillOpacity={shade(e)} />;
        })}
        {q.perRow.map((e, r) => (
          <text key={r} x={X0 + C * CELL + 4} y={Y0 + r * CELL * 2 + CELL + 3} className="viz-label">{e >= 0.995 ? "lost" : `${(100 * e).toFixed(1)}%`}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        mean relative error {(100 * q.total).toFixed(2)}%; {q.zeros} of {R * C} values flushed to zero
      </div>
      <figcaption className="viz-caption">
        Activations for eight tokens (rows) of growing magnitude, spanning four orders of magnitude, with an outlier channel, quantised to E4M3 with one scale per group.
        Darker cells have larger relative error, and the right column gives each row&apos;s mean relative error. A single scale for the tensor
        is set by the largest value, so small tokens fall into the subnormal range or to zero; a scale per row, or per block of eight,
        follows each group&apos;s own range.
      </figcaption>
    </figure>
  );
}
