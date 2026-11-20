"use client";

import { useMemo, useState } from "react";

export const NS = 5, TRUE_V = [1, 2, 3, 4, 5].map((k) => k / 6);
const STOPS = [1, 2, 5, 10, 20, 50, 100, 200, 500], LABELS = ["A", "B", "C", "D", "E"];

export function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One episode of the 5-state random walk from the centre: the states visited (1..5) and the final reward (1 at the right end). */
export function walkEpisode(r: () => number) {
  const states: number[] = [];
  let s = 3;
  while (s >= 1 && s <= NS) { states.push(s); s += r() < 0.5 ? -1 : 1; }
  return { states, reward: s > NS ? 1 : 0 };
}

export const rms = (v: number[]) => Math.sqrt(v.reduce((a, x, i) => a + (x - TRUE_V[i]) ** 2, 0) / NS);

/** First-visit Monte Carlo estimates (gamma 1) after each number of episodes in STOPS; alpha 0 means sample averages. */
export function mcEstimates(alpha: number, seed = 5) {
  const r = rand(seed), v = new Array(NS).fill(0.5), n = new Array(NS).fill(0), out: { k: number; v: number[] }[] = [];
  for (let k = 1; k <= STOPS[STOPS.length - 1]; k++) {
    const { states, reward } = walkEpisode(r);
    for (const s of new Set(states)) {
      n[s - 1]++;
      v[s - 1] += (reward - v[s - 1]) * (alpha || 1 / n[s - 1]);
    }
    if (STOPS.includes(k)) out.push({ k, v: [...v] });
  }
  return out;
}

export function RandomWalkMcViz() {
  const [constant, setConstant] = useState(false);
  const [si, setSi] = useState(3);
  const data = useMemo(() => mcEstimates(constant ? 0.05 : 0), [constant]);
  const d = data[si];
  const W = 320, H = 170, X0 = 34, Y0 = 8, PW = W - 50, PH = H - Y0 - 30;
  const sx = (i: number) => X0 + ((i + 0.5) / NS) * PW;
  const sy = (x: number) => Y0 + PH - Math.max(0, Math.min(1, x)) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Step size">
          <button type="button" className="seg" aria-pressed={!constant} onClick={() => setConstant(false)}>sample average</button>
          <button type="button" className="seg" aria-pressed={constant} onClick={() => setConstant(true)}>constant α = 0.05</button>
        </div>
        <label className="viz-label" htmlFor="mc-n">episodes = {d.k}</label>
        <input id="mc-n" type="range" min={0} max={data.length - 1} step={1} value={si} onChange={(e) => setSi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Monte Carlo value estimates against true values">
        {[0, 0.5, 1].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={sy(y)} y2={sy(y)} stroke="var(--border)" strokeDasharray={y ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        <path d={TRUE_V.map((y, i) => `${i ? "L" : "M"}${sx(i)},${sy(y)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
        <path d={d.v.map((y, i) => `${i ? "L" : "M"}${sx(i)},${sy(y)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
        {d.v.map((y, i) => <circle key={i} cx={sx(i)} cy={sy(y)} r={4} fill="var(--accent)" />)}
        {LABELS.map((l, i) => <text key={l} x={sx(i)} y={Y0 + PH + 16} textAnchor="middle" className="viz-label">{l}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`root mean square error ${rms(d.v).toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        A random walk on states A to E starts at C and steps left or right with equal probability until it leaves; leaving on
        the right pays 1, on the left 0. The true values (dashed) are 1/6 to 5/6. First-visit Monte Carlo estimates each value as
        the average of the returns seen from that state, starting from 0.5. With sample averages the error keeps shrinking,
        roughly like one over the square root of the number of visits; with a constant step size the estimates keep
        fluctuating at a level set by α, the price of being able to track values that change. After 500 episodes the error is
        0.015 with sample averages and 0.072 with α = 0.05.
      </figcaption>
    </figure>
  );
}
