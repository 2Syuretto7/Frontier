"use client";

import { useMemo, useState } from "react";

const MEANS = [0.6, 0.4, 0], T = 3000, RUNS = 60, EPS = [0, 0.01, 0.05, 0.1, 0.2, 0.5], STEP = 25, C = 1, DELTA = 0.2;

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

/** Average cumulative regret every STEP rounds of epsilon-greedy; eps < 0 means the decaying schedule min(1, CK/(DELTA^2 t)). */
export function epsRegret(eps: number) {
  const K = MEANS.length, best = Math.max(...MEANS), out = new Array(T / STEP + 1).fill(0);
  let bestShare = 0;
  for (let run = 0; run < RUNS; run++) {
    const r = rand(7919 * run + Math.round(1000 * eps) + 5000);
    const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    const counts = new Array(K).fill(0), sums = new Array(K).fill(0);
    let reg = 0;
    for (let t = 0; t < T; t++) {
      const e = eps < 0 ? Math.min(1, (C * K) / (DELTA * DELTA * (t + 1))) : eps;
      let a: number;
      if (t < K) a = t;
      else if (r() < e) a = Math.floor(r() * K);
      else a = sums.reduce((bi, s, i) => (s / counts[i] > sums[bi] / counts[bi] ? i : bi), 0);
      counts[a]++;
      sums[a] += MEANS[a] + g();
      reg += best - MEANS[a];
      if ((t + 1) % STEP === 0) out[(t + 1) / STEP] += reg / RUNS;
    }
    bestShare += counts[0] / T / RUNS;
  }
  return { curve: out as number[], bestShare };
}

export function EpsilonGreedyViz() {
  const [ei, setEi] = useState(3);
  const eps = EPS[ei];
  const fixed = useMemo(() => epsRegret(eps), [eps]);
  const decay = useMemo(() => epsRegret(-1), []);
  const W = 330, H = 190, X0 = 34, Y0 = 8, PW = W - 44, PH = H - Y0 - 32, YMAX = 450;
  const sx = (t: number) => X0 + (t / T) * PW;
  const sy = (v: number) => Y0 + PH - (Math.min(v, YMAX) / YMAX) * PH;
  const path = (ys: number[]) => ys.map((v, i) => `${i ? "L" : "M"}${sx(i * STEP).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="eps-greedy">constant ε = {eps}</label>
        <input id="eps-greedy" type="range" min={0} max={EPS.length - 1} step={1} value={ei} onChange={(e) => setEi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Cumulative regret of epsilon-greedy with constant and decaying exploration">
        <path d={path(decay.curve)} fill="none" stroke="var(--success)" strokeWidth={1.8} />
        <path d={path(fixed.curve)} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        {[0, 1000, 2000, 3000].map((v) => <text key={v} x={sx(v)} y={Y0 + PH + 14} textAnchor={v === T ? "end" : "middle"} className="viz-label">{v}</text>)}
        {[0, 100, 200, 300, 400].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">round t</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`after ${T} rounds: ε = ${eps} regret ${fixed.curve[fixed.curve.length - 1].toFixed(0)}, best arm ${(100 * fixed.bestShare).toFixed(0)}% of pulls; decaying ε regret ${decay.curve[decay.curve.length - 1].toFixed(0)}`}
      </div>
      <figcaption className="viz-caption">
        ε-greedy on three arms with means 0.6, 0.4 and 0 and unit-variance noise, averaged over 60 runs. With constant ε
        (blue) the curve ends as a straight line of slope about 0.27ε, the price of exploring at random for ever; with ε = 0
        it is greedy play, which gets stuck on a worse arm so often that it pulls the best arm only about half the time. The
        green curve uses ε_t = min(1, 3/(0.2²t)): it explores heavily at first, then less and less, and ends with the lowest
        regret, about 100, still flattening.
      </figcaption>
    </figure>
  );
}
