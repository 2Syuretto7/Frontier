"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 500, JUMP = 50, GROUPS = [5, 10, 25];
const EPISODES = 20000;

/** True values of the long random walk: from s, jump 1 to 50 cells left or right; leaving pays -1 on the left, +1 on the right. */
export function trueValues() {
  let v = new Array(N).fill(0);
  for (let it = 0; it < 2000; it++) {
    v = v.map((_, s) => {
      let acc = 0;
      for (let d = 1; d <= JUMP; d++) for (const s2 of [s - d, s + d]) acc += (s2 < 0 ? -1 : s2 >= N ? 1 : v[s2]) / (2 * JUMP);
      return acc;
    });
  }
  return v;
}

/** Monte Carlo (sample averages of returns) and semi-gradient TD(0) (step 1/n^0.7 per group) with k groups; also visit frequencies. */
export function learnAggregated(k: number, seed = 2) {
  const r = rand(seed), sum = new Array(k).fill(0), cnt = new Array(k).fill(0), td = new Array(k).fill(0), ntd = new Array(k).fill(0);
  const visits = new Array(N).fill(0), g = (s: number) => Math.floor((s * k) / N);
  for (let e = 0; e < EPISODES; e++) {
    let s = N / 2, reward = 0;
    const visited: number[] = [];
    for (;;) {
      visited.push(s);
      visits[s]++;
      const d = 1 + Math.floor(r() * JUMP), s2 = r() < 0.5 ? s - d : s + d, out = s2 < 0 || s2 >= N;
      if (out) reward = s2 < 0 ? -1 : 1;
      const gi = g(s), a = 1 / (1 + ntd[gi]++) ** 0.7;
      td[gi] += a * ((out ? reward : td[g(s2)]) - td[gi]);
      if (out) break;
      s = s2;
    }
    for (const x of visited) { sum[g(x)] += reward; cnt[g(x)]++; }
  }
  const total = visits.reduce((a, x) => a + x, 0);
  return { mc: sum.map((x, i) => x / Math.max(1, cnt[i])), td, mu: visits.map((x) => x / total) };
}

export function AggregationViz() {
  const truth = useMemo(() => trueValues(), []);
  const [gi, setGi] = useState(1);
  const k = GROUPS[gi];
  const { mc, td, mu } = useMemo(() => learnAggregated(k), [k]);
  const W = 330, H = 170, X0 = 30, Y0 = 8, PW = W - 40, PH = H - Y0 - 30;
  const sx = (s: number) => X0 + (s / N) * PW, sy = (v: number) => Y0 + PH - ((v + 1) / 2) * PH;
  const steps = (w: number[]) => w.map((x, i) => `${i ? "L" : "M"}${sx((i * N) / k).toFixed(1)},${sy(x).toFixed(1)} L${sx(((i + 1) * N) / k).toFixed(1)},${sy(x).toFixed(1)}`).join(" ");
  const ve = (w: number[]) => Math.sqrt(truth.reduce((a, v, s) => a + mu[s] * (v - w[Math.floor((s * k) / N)]) ** 2, 0));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">groups</span>
        <div className="segmented" role="group" aria-label="Number of groups">
          {GROUPS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={gi === i} onClick={() => setGi(i)}>{x}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="True values and aggregated estimates along the walk">
        {[-1, 0, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={sy(v)} y2={sy(v)} stroke="var(--border)" strokeDasharray={v === -1 ? undefined : "2 4"} />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        <path d={truth.map((v, s) => `${s ? "L" : "M"}${sx(s + 0.5).toFixed(1)},${sy(v).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} />
        <path d={steps(mc)} fill="none" stroke="var(--danger)" strokeWidth={1.8} />
        <path d={steps(td)} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
        {[0, 250, 500].map((s) => <text key={s} x={sx(s)} y={Y0 + PH + 14} textAnchor={s === N ? "end" : s === 0 ? "start" : "middle"} className="viz-label">{s}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">state</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`visit-weighted root mean square error: gradient MC ${ve(mc).toFixed(3)}, semi-gradient TD ${ve(td).toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        A walk on 500 states starts in the middle and jumps between 1 and 50 states left or right at random; leaving on the left
        pays −1 and on the right +1. The grey curve is the true value. Both learners use state aggregation, one weight per group
        of neighbouring states, and learn from 20000 episodes: gradient Monte Carlo (red), which with step 1/n makes each
        weight the average return from its group, and semi-gradient TD(0) (blue). Each weight can only be a compromise across
        its group. Monte Carlo finds the compromise with the smallest visit-weighted error; TD&apos;s fixed point is further off,
        most of all with few groups, because bootstrapping from a coarse neighbouring group pulls values towards the middle.
      </figcaption>
    </figure>
  );
}
