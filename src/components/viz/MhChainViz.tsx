"use client";

import { useMemo, useState } from "react";

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
const SD = 0.6;
const target = (x: number) => Math.exp(-((x - 2) * (x - 2)) / (2 * SD * SD)) + Math.exp(-((x + 2) * (x + 2)) / (2 * SD * SD));
const Z = 2 * SD * Math.sqrt(2 * Math.PI);
const N = 20000, TRACE = 600, LO = -5, HI = 5, BINS = 40;

/** Random-walk Metropolis on a two-bump density: the step size trades acceptance against movement. */
export function MhChainViz() {
  const [k, setK] = useState(20);
  const step = Math.pow(10, -1.3 + (2.6 * k) / 40);
  const run = useMemo(() => {
    const r = makeRng(9);
    const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    let x = 2, acc = 0;
    const xs = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const y = x + step * normal();
      if (r() * target(x) < target(y)) { x = y; acc += 1; }
      xs[i] = x;
    }
    return { xs, acc: acc / N };
  }, [step]);
  const counts = new Array(BINS).fill(0);
  run.xs.forEach((v) => { const b = Math.floor(((v - LO) / (HI - LO)) * BINS); if (b >= 0 && b < BINS) counts[b] += 1; });
  const bw = (HI - LO) / BINS;
  const dens = counts.map((c) => c / (N * bw));
  const left = run.xs.reduce((s, v) => s + (v < 0 ? 1 : 0), 0) / N;
  const W = 320, H1 = 90, H2 = 110;
  const X = (v: number) => 10 + ((v - LO) / (HI - LO)) * (W - 20);
  const top = 0.6;
  const Y2 = (d: number) => H1 + H2 - 14 - (Math.min(d, top) / top) * (H2 - 24);
  const curve: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const v = LO + ((HI - LO) * i) / 100;
    curve.push(`${X(v).toFixed(1)},${Y2(target(v) / Z).toFixed(1)}`);
  }
  const trace: string[] = [];
  for (let i = 0; i < TRACE; i++) trace.push(`${(10 + (i / TRACE) * (W - 20)).toFixed(1)},${(H1 / 2 - (run.xs[i] / 5) * (H1 / 2 - 6)).toFixed(1)}`);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          proposal step = {step.toFixed(2)}
          <input type="range" min={0} max={40} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="proposal step size, log scale" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H1 + H2}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Trace of the chain and histogram of its samples against the target density">
        <line x1={10} x2={W - 10} y1={H1 / 2} y2={H1 / 2} stroke="var(--border)" />
        <text x={12} y={12} className="viz-label">first {TRACE} steps</text>
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1} points={trace.join(" ")} />
        <line x1={10} x2={W - 10} y1={Y2(0)} y2={Y2(0)} stroke="var(--border)" />
        {dens.map((d, b) => (
          <rect key={b} x={X(LO + b * bw) + 0.5} y={Y2(d)} width={X(LO + bw) - X(LO) - 1} height={Y2(0) - Y2(d)} fill="var(--accent)" opacity={0.4} />
        ))}
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={curve.join(" ")} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        acceptance rate {run.acc.toFixed(2)}; fraction of samples in the left bump {left.toFixed(2)} (target 0.50)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The chain proposes x + step × N(0, 1) and accepts with probability min(1, π(y)/π(x)), using only the ratio of the
        unnormalised density. Tiny steps are almost always accepted but crawl and stay in the starting bump; huge steps are
        almost always rejected, so the trace is flat for long stretches. In between the chain hops between the bumps and the
        histogram matches the red target.
      </figcaption>
    </figure>
  );
}
