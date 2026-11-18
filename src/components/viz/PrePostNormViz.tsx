"use client";

import { useMemo, useState } from "react";

const D = 64, L = 48;
const SCALES = [0.25, 0.5, 1];

function gaussian(seed: number) {
  let a = seed >>> 0;
  const uni = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(1 - uni())) * Math.cos(2 * Math.PI * uni());
}

/** Random linear branches W ~ N(0, s²/d). Returns, per layer, the post-norm identity-path weight and the pre-norm relative write size. */
export function prePostRun(s: number) {
  const g = gaussian(7);
  const Ws = Array.from({ length: L }, () => Float64Array.from({ length: D * D }, () => (s * g()) / Math.sqrt(D)));
  const x0 = Float64Array.from({ length: D }, g);
  const norm = (v: Float64Array) => Math.sqrt(v.reduce((a, b) => a + b * b, 0));
  const apply = (W: Float64Array, v: Float64Array) => {
    const out = new Float64Array(D);
    for (let i = 0; i < D; i++) {
      let acc = 0;
      for (let j = 0; j < D; j++) acc += W[i * D + j] * v[j];
      out[i] = acc;
    }
    return out;
  };
  const post: number[] = [], pre: number[] = [];
  let xp = x0.map((v) => (v * Math.sqrt(D)) / norm(x0)), weight = 1;
  let xr = x0.slice();
  for (const W of Ws) {
    const y = apply(W, xp).map((v, i) => v + xp[i]);
    const ny = norm(y);
    weight *= Math.sqrt(D) / ny;
    xp = y.map((v) => (v * Math.sqrt(D)) / ny);
    post.push(weight);
    const nx = norm(xr);
    const w = apply(W, xr.map((v) => (v * Math.sqrt(D)) / nx));
    pre.push(norm(w) / nx);
    xr = xr.map((v, i) => v + w[i]);
  }
  return { post, pre };
}

export function PrePostNormViz() {
  const [si, setSi] = useState(1);
  const s = SCALES[si];
  const run = useMemo(() => prePostRun(s), [s]);
  const W = 340, H = 220, X0 = 40, Y0 = 12, PW = W - X0 - 10, PH = H - Y0 - 30;
  const lo = -8;
  const sx = (l: number) => X0 + (l / L) * PW;
  const sy = (v: number) => Y0 + (Math.max(Math.log10(v), lo) / lo) * PH;
  const path = (vs: number[]) => vs.map((v, i) => `${i ? "L" : "M"}${sx(i + 1).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  const est = Array.from({ length: L }, (_, i) => (1 + s * s) ** (-(i + 1) / 2));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">branch scale s</span>
        {SCALES.map((v, i) => (
          <button key={v} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Post-norm identity-path weight and pre-norm relative write size across 48 layers, on a log scale">
        {[0, -2, -4, -6, -8].map((e) => (
          <g key={e}>
            <line x1={X0} x2={W - 10} y1={sy(10 ** e)} y2={sy(10 ** e)} stroke="var(--border)" />
            <text x={X0 - 4} y={sy(10 ** e) + 4} textAnchor="end" className="viz-label">{e === 0 ? "1" : `1e${e}`}</text>
          </g>
        ))}
        {[0, 12, 24, 36, 48].map((l) => (
          <text key={l} x={sx(l)} y={H - 12} textAnchor="middle" className="viz-label">{l}</text>
        ))}
        <path d={path(est)} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
        <path d={path(run.post)} fill="none" stroke="var(--danger)" strokeWidth={2} />
        <path d={path(run.pre)} fill="none" stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`layer 48: post-norm identity weight ${run.post[L - 1].toExponential(1)}, pre-norm relative write ${run.pre[L - 1].toFixed(3)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Forty-eight blocks with random linear branches of scale s on 64-dimensional vectors. The red curve is how much of the
        input survives along the post-norm skip path: each normalisation after the addition shrinks it, close to the dashed
        estimate <span className="mono">(1 + s²)^(−ℓ/2)</span>, so the gradient&apos;s direct route to early layers fades
        geometrically. The blue curve is how large a pre-norm block&apos;s write is relative to the stream it joins: the skip
        path is untouched, but the stream keeps growing, so later blocks change it less and less.
      </figcaption>
    </figure>
  );
}
