"use client";

import { useState } from "react";

const N = 2000;

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const F = new Float32Array(1);
const U = new Uint32Array(F.buffer);

/** Round to bfloat16, nearest with ties to even, via the float32 bit pattern. */
export function bf16(x: number) {
  F[0] = x;
  const b = U[0];
  U[0] = (((b + 0x7fff + ((b >>> 16) & 1)) >>> 16) << 16) >>> 0;
  return F[0];
}

function f32(x: number) {
  F[0] = x;
  return F[0];
}

/** Running sums of N bf16 terms with an fp32 and a bf16 accumulator, against the exact sum. */
export function runs(mode: number) {
  const r = rand(5);
  const exact = [0], acc32 = [0], acc16 = [0];
  let e = 0, a = 0, h = 0;
  for (let i = 0; i < N; i++) {
    const x = bf16(mode === 0 ? r() : 0.01);
    e += x; a = f32(a + x); h = bf16(h + x);
    exact.push(e); acc32.push(a); acc16.push(h);
  }
  return { exact, acc32, acc16 };
}

export function AccumulatorPrecisionViz() {
  const [mode, setMode] = useState(0);
  const { exact, acc32, acc16 } = runs(mode);
  const W = 330, H = 190, X0 = 40, Y0 = 10, PW = W - X0 - 10, PH = H - Y0 - 32;
  const top = exact[N] * 1.05;
  const sx = (i: number) => X0 + (i / N) * PW;
  const sy = (v: number) => Y0 + PH - (v / top) * PH;
  const path = (ys: number[]) => ys.filter((_, i) => i % 10 === 0 || i === N).map((v, k) => `${k ? "L" : "M"}${sx(Math.min(k * 10, N)).toFixed(1)},${sy(v).toFixed(1)}`).join("");
  const fmt = (v: number) => (v >= 100 ? v.toFixed(0) : v.toFixed(2));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Terms">
          <button type="button" className="seg" aria-pressed={mode === 0} onClick={() => setMode(0)}>terms uniform on (0, 1)</button>
          <button type="button" className="seg" aria-pressed={mode === 1} onClick={() => setMode(1)}>every term 0.01</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Running sums with float32 and bfloat16 accumulators">
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={X0} x2={W - 10} y1={sy(t * exact[N])} y2={sy(t * exact[N])} stroke="var(--border)" />
            <text x={X0 - 4} y={sy(t * exact[N]) + 4} textAnchor="end" className="viz-label">{fmt(t * exact[N])}</text>
          </g>
        ))}
        {[0, 1000, 2000].map((i) => (
          <text key={i} x={sx(i)} y={H - 16} textAnchor="middle" className="viz-label">{i}</text>
        ))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">terms added</text>
        <path d={path(exact)} fill="none" stroke="var(--text-muted)" strokeWidth={4} opacity={0.4} />
        <path d={path(acc32)} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
        <path d={path(acc16)} fill="none" stroke="var(--danger)" strokeWidth={1.5} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`exact ${fmt(exact[N])}, fp32 accumulator ${fmt(acc32[N])}, bf16 accumulator ${fmt(acc16[N])}`}
      </div>
      <figcaption className="viz-caption">
        Two thousand bfloat16 terms summed with a float32 accumulator (accent) and a bfloat16 one (red); the wide grey line
        is the exact sum. Bfloat16 keeps only 8 significant bits, so once the running sum is large, each new term is
        less than half the gap between neighbouring values and rounds away: the uniform sum stalls at 256. With terms of
        0.01 it first runs ahead, because each term rounds up to a whole gap, then stalls at 4. This is why tensor cores
        take bf16 inputs but accumulate in fp32.
      </figcaption>
    </figure>
  );
}
