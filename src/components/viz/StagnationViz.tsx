"use client";

import { useEffect, useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 2000;
const FMTS = [{ name: "BF16 (8 bits)", m: 7 }, { name: "FP16 (11 bits)", m: 10 }];

function neighbours(x: number, m: number): [number, number] {
  if (x === 0) return [0, 0];
  const e = Math.floor(Math.log2(x));
  const q = 2 ** (e - m);
  const lo = Math.floor(x / q) * q;
  return [lo, lo + q];
}

/** Summing many small increments in low precision: round-to-nearest stalls once the increment is below half the spacing, while stochastic rounding stays correct on average. */
export function StagnationViz() {
  const [ready, setReady] = useState(false);
  const [k, setK] = useState(0);
  const [ls, setLs] = useState(-2.5);
  const [seed, setSeed] = useState(1);
  useEffect(() => setReady(true), []);
  const step = 10 ** ls;
  const m = FMTS[k].m;
  const runs = useMemo(() => {
    if (!ready) return null;
    const rn: number[] = [0];
    let s = 0;
    for (let i = 0; i < N; i++) {
      const x = s + step;
      const [lo, hi] = neighbours(x, m);
      s = hi === lo ? x : x - lo < hi - x ? lo : x - lo > hi - x ? hi : (lo / (hi - lo)) % 2 === 0 ? lo : hi;
      rn.push(s);
    }
    const srs: number[][] = [];
    for (let r = 0; r < 3; r++) {
      const rng = makeRng(seed * 97 + r);
      const p: number[] = [0];
      let t = 0;
      for (let i = 0; i < N; i++) {
        const x = t + step;
        const [lo, hi] = neighbours(x, m);
        t = hi === lo || x === lo ? x : rng() < (x - lo) / (hi - lo) ? hi : lo;
        p.push(t);
      }
      srs.push(p);
    }
    return { rn, srs };
  }, [ready, step, m, seed]);
  const total = N * step;
  const W = 330, H = 180;
  const X = (i: number) => 34 + (i / N) * (W - 46);
  const Y = (v: number) => H - 18 - (v / (total * 1.25)) * (H - 30);
  const line = (vs: number[]) => vs.filter((_, i) => i % 5 === 0).map((v, j) => `${X(j * 5).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {FMTS.map((f, i) => (
          <button key={f.name} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{f.name}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          step {step.toExponential(1)}
          <input type="range" min={-4} max={-1} step={0.05} value={ls} onChange={(e) => setLs(Number(e.target.value))} aria-label="increment on a log scale" style={{ width: 100 }} />
        </label>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new random runs</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Running sums with round-to-nearest and stochastic rounding against the exact sum">
        <line x1={X(0)} x2={X(N)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} y1={Y(0)} x2={X(N)} y2={Y(total)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        {runs ? runs.srs.map((p, r) => <polyline key={r} fill="none" stroke="var(--accent)" strokeWidth={1.1} opacity={0.8} points={line(p)} />) : null}
        {runs ? <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} points={line(runs.rn)} /> : null}
        <text x={X(N)} y={H - 4} textAnchor="end" className="viz-label">{N} additions</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        exact {total.toPrecision(4)}; nearest {runs ? runs.rn[N].toPrecision(4) : "…"}; stochastic {runs ? runs.srs.map((p) => p[N].toPrecision(4)).join(", ") : "…"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dashed line is the exact running sum of {N} equal increments. With round-to-nearest (red) every addition is
        rounded the same way, so the sum can run ahead of the exact one; once the spacing between representable numbers
        exceeds twice the increment, every addition rounds back to the same value and the sum stalls for ever. Stochastic rounding (three random runs) rounds up with probability equal
        to the fraction of the gap covered, so each addition is right on average and the runs track the exact sum, with
        random wobble.
      </figcaption>
    </figure>
  );
}
