"use client";

import { useMemo, useState } from "react";

const MEANS = [0.6, 0.4, 0], T = 2000, RUNS = 60, MS = [5, 20, 50, 100, 200, 400], STEP = 20;

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

/** Average cumulative regret, sampled every STEP rounds, of explore-then-commit with m pulls per arm (m = 1 is greedy). */
export function etcRegret(m: number) {
  const K = MEANS.length, best = Math.max(...MEANS), out = new Array(T / STEP + 1).fill(0);
  for (let run = 0; run < RUNS; run++) {
    const r = rand(1000 * m + run);
    const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    const counts = new Array(K).fill(0), sums = new Array(K).fill(0);
    let reg = 0;
    for (let t = 0; t < T; t++) {
      let a: number;
      if (t < m * K) a = t % K;
      else a = sums.reduce((bi, s, i) => (s / counts[i] > sums[bi] / counts[bi] ? i : bi), 0);
      counts[a]++;
      sums[a] += MEANS[a] + g();
      reg += best - MEANS[a];
      if ((t + 1) % STEP === 0) out[(t + 1) / STEP] += reg / RUNS;
    }
  }
  return out as number[];
}

/** Expected cumulative regret of choosing an arm uniformly at random. */
export const uniformRegret = (t: number) => (t * MEANS.reduce((s, m) => s + Math.max(...MEANS) - m, 0)) / MEANS.length;

export function BanditRegretViz() {
  const [mi, setMi] = useState(2);
  const m = MS[mi];
  const greedy = useMemo(() => etcRegret(1), []);
  const etc = useMemo(() => etcRegret(m), [m]);
  const W = 330, H = 190, X0 = 34, Y0 = 8, PW = W - 44, PH = H - Y0 - 32, YMAX = 350;
  const sx = (t: number) => X0 + (t / T) * PW;
  const sy = (v: number) => Y0 + PH - (Math.min(v, YMAX) / YMAX) * PH;
  const path = (ys: number[]) => ys.map((v, i) => `${i ? "L" : "M"}${sx(i * STEP).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  const uni: string[] = [];
  for (let i = 0; i <= 100; i++) { const t = (i / 100) * T; uni.push(`${i ? "L" : "M"}${sx(t).toFixed(1)},${sy(uniformRegret(t)).toFixed(1)}`); }
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="bandit-m">explore pulls per arm m = {m}</label>
        <input id="bandit-m" type="range" min={0} max={MS.length - 1} step={1} value={mi} onChange={(e) => setMi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Cumulative regret against rounds for uniform play, greedy play and explore-then-commit">
        <path d={uni.join(" ")} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.5} />
        <path d={path(greedy)} fill="none" stroke="var(--danger)" strokeWidth={1.8} />
        <path d={path(etc)} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        {[0, 500, 1000, 1500, 2000].map((v) => <text key={v} x={sx(v)} y={Y0 + PH + 14} textAnchor={v === T ? "end" : "middle"} className="viz-label">{v}</text>)}
        {[0, 100, 200, 300].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">round t</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`regret after ${T} rounds: explore-then-commit ${etc[etc.length - 1].toFixed(0)}, greedy ${greedy[greedy.length - 1].toFixed(0)}, uniform ${uniformRegret(T).toFixed(0)}`}
      </div>
      <figcaption className="viz-caption">
        Three arms with mean rewards 0.6, 0.4 and 0 and unit-variance Gaussian noise, averaged over 60 runs. Uniform play
        (dashed) loses 0.27 per round for ever. Greedy play (red), which tries each arm once and then always pulls the best
        average so far, often locks onto the second arm, so its regret also grows linearly. Explore-then-commit (blue)
        pays for m pulls of each arm and then flattens. Here m = 50 does best, with regret about 67: fewer pulls leave a slope from wrong commitments, and more
        waste rounds on arms already known to be poor.
      </figcaption>
    </figure>
  );
}
