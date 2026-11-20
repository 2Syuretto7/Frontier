"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

export const N = 10000;
export const POWERS = [0.5, 1, 2];
const SUP = ["⁻¹ᐟ²", "⁻¹", "⁻²"];

/** One sample of independent events A_n with P(A_n) = n^(-p), n = 1..N. */
export function sample(p: number, seed: number) {
  const r = rand(seed * 7919 + Math.round(p * 100));
  const hits: number[] = [];
  const count: number[] = [], mean: number[] = [];
  let c = 0, s = 0;
  for (let n = 1; n <= N; n++) {
    const q = n ** -p;
    s += q;
    if (r() < q) { c++; hits.push(n); }
    count.push(c);
    mean.push(s);
  }
  return { hits, count, mean, last: hits[hits.length - 1] ?? 0 };
}

export function BorelCantelliViz() {
  const [pi, setPi] = useState(1);
  const [seed, setSeed] = useState(1);
  const p = POWERS[pi];
  const d = sample(p, seed);
  const W = 330, H = 170, X0 = 34, PW = 288, Y0 = 6, PH = 120, TY = 140;
  const top = Math.max(d.count[N - 1], d.mean[N - 1]) * 1.08;
  const sx = (n: number) => X0 + (Math.log10(n) / 4) * PW, sy = (y: number) => Y0 + PH - (y / top) * PH;
  const idx = Array.from({ length: 400 }, (_, i) => Math.min(N, Math.round(10 ** ((4 * i) / 399))));
  const path = (arr: number[]) => idx.map((n, i) => `${i ? "L" : "M"}${sx(n).toFixed(1)},${sy(arr[n - 1]).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Exponent p in P(A_n) = n^-p">
          {POWERS.map((q, i) => (
            <button key={q} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>
              P(Aₙ) = n{SUP[i]}
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setSeed((s) => (s % 9) + 1)}>New sample</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Running count of events that occur, against the running sum of their probabilities, on a log scale in n">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={sy(0)} stroke="var(--border)" />
        {[1, 10, 100, 1000, 10000].map((n) => <text key={n} x={sx(n)} y={H - 2} textAnchor={n === 10000 ? "end" : "middle"} className="viz-label">{n}</text>)}
        <text x={X0 - 4} y={Y0 + 9} textAnchor="end" className="viz-label">{Math.round(top)}</text>
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">0</text>
        <path d={path(d.mean)} fill="none" stroke="var(--code-function)" strokeWidth={1.5} strokeDasharray="4 3" />
        <path d={path(d.count)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {d.hits.map((n) => <line key={n} x1={sx(n)} x2={sx(n)} y1={TY} y2={TY + 10} stroke="var(--text)" strokeWidth={0.8} />)}
        <text x={X0 + 4} y={Y0 + 10} className="viz-label">solid: events so far; dashed: sum of P(Aₖ)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        up to n = 10000: sum of P(Aₙ) = {d.mean[N - 1].toFixed(2)}, events that occurred = {d.count[N - 1]}, last at n = {d.last}
      </div>
      <figcaption className="viz-caption">
        Independent events with P(Aₙ) = n⁻ᵖ, and one sample of which ones happen (ticks, on a log scale in n). For p = 2
        the probabilities have a finite sum and the events stop early: only finitely many happen. For p = 1 the sum grows
        like ln n and so does the count, without end. For p = 1/2 the sum grows like 2√n and events keep arriving
        throughout. The count roughly tracks the sum of the probabilities in every case.
      </figcaption>
    </figure>
  );
}
