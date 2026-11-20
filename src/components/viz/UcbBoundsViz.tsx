"use client";

import { useMemo, useState } from "react";

const PROBS = [0.7, 0.6, 0.5, 0.35, 0.2], STOPS = [5, 10, 25, 50, 100, 250, 500, 1000, 2000, 4000], YMAX = 1.6;

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

/** One run of UCB1 on Bernoulli arms; returns counts, averages and indices after each round in STOPS. */
export function ucbSnapshots(seed = 3) {
  const K = PROBS.length, r = rand(seed), counts = new Array(K).fill(0), sums = new Array(K).fill(0);
  const snaps: { t: number; counts: number[]; means: number[]; index: number[] }[] = [];
  const index = (i: number, t: number) => sums[i] / counts[i] + Math.sqrt((2 * Math.log(t)) / counts[i]);
  for (let t = 1; t <= STOPS[STOPS.length - 1]; t++) {
    let a = t - 1;
    if (t > K) { a = 0; for (let i = 1; i < K; i++) if (index(i, t) > index(a, t)) a = i; }
    counts[a]++;
    sums[a] += r() < PROBS[a] ? 1 : 0;
    if (STOPS.includes(t)) snaps.push({ t, counts: [...counts], means: sums.map((s, i) => s / counts[i]), index: PROBS.map((_, i) => index(i, t + 1)) });
  }
  return snaps;
}

export function UcbBoundsViz() {
  const snaps = useMemo(() => ucbSnapshots(), []);
  const [si, setSi] = useState(3);
  const s = snaps[si];
  let next = 0;
  s.index.forEach((v, i) => { if (v > s.index[next]) next = i; });
  const W = 330, H = 190, X0 = 30, Y0 = 8, PW = W - 40, PH = H - Y0 - 36, K = PROBS.length;
  const cx = (i: number) => X0 + ((i + 0.5) / K) * PW;
  const sy = (v: number) => Y0 + PH - (Math.min(v, YMAX) / YMAX) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="ucb-t">after round t = {s.t}</label>
        <input id="ucb-t" type="range" min={0} max={snaps.length - 1} step={1} value={si} onChange={(e) => setSi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Average reward and upper confidence bound of each arm">
        {[0, 0.5, 1, 1.5].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={sy(v)} y2={sy(v)} stroke="var(--border)" strokeDasharray={v ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {PROBS.map((p, i) => (
          <g key={i}>
            <rect x={cx(i) - 9} y={sy(s.index[i])} width={18} height={Math.max(0, sy(s.means[i]) - sy(s.index[i]))} fill="var(--accent-soft)" stroke={i === next ? "var(--danger)" : "var(--accent)"} strokeWidth={i === next ? 2 : 1} />
            <line x1={cx(i) - 14} x2={cx(i) + 14} y1={sy(p)} y2={sy(p)} stroke="var(--text)" strokeWidth={2} />
            <circle cx={cx(i)} cy={sy(s.means[i])} r={3.5} fill="var(--accent)" />
            <text x={cx(i)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{`arm ${i + 1}`}</text>
            <text x={cx(i)} y={Y0 + PH + 27} textAnchor="middle" className="viz-label">{`n=${s.counts[i]}`}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`next pull: arm ${next + 1}; best arm has ${((100 * s.counts[0]) / s.t).toFixed(0)}% of pulls so far`}
      </div>
      <figcaption className="viz-caption">
        One run of UCB1 on five arms that pay 1 with probabilities 0.7, 0.6, 0.5, 0.35 and 0.2 (black ticks). Each dot is an
        arm&apos;s average reward and the box above it reaches its upper confidence bound; the arm with the highest bound,
        outlined in red, is pulled next (bounds above 1.6 are cut off). Early on the boxes are tall and every arm gets tried.
        The tops then stay almost level, because whichever arm has the highest bound is pulled and its bound drops. A poor arm
        reaches that common level only while its box is tall, that is, while it has few pulls: after 4000 rounds the best arm
        has 74% of the pulls and the worst only 58.
      </figcaption>
    </figure>
  );
}
