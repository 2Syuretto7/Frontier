"use client";

import { useMemo, useState } from "react";

const M = 100, TRIALS = 3000;

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

/** Empty-bin counts over TRIALS throws of n balls into M bins, the exact mean, and the 95% McDiarmid half-width. */
export function simulate(n: number) {
  const r = rand(17 + n);
  const counts: number[] = [];
  for (let k = 0; k < TRIALS; k++) {
    const hit = new Uint8Array(M);
    for (let i = 0; i < n; i++) hit[Math.floor(r() * M)] = 1;
    let e = 0;
    for (let j = 0; j < M; j++) e += hit[j] ? 0 : 1;
    counts.push(e);
  }
  const mean = M * (1 - 1 / M) ** n;
  const half = Math.sqrt((n * Math.log(2 / 0.05)) / 2);
  const sorted = counts.slice().sort((a, b) => a - b);
  const lo = sorted[Math.floor(0.025 * TRIALS)], hi = sorted[Math.ceil(0.975 * TRIALS) - 1];
  const outside = counts.filter((c) => Math.abs(c - mean) >= half).length;
  return { counts, mean, half, lo, hi, outside };
}

export function EmptyBinsViz() {
  const [n, setN] = useState(100);
  const { counts, mean, half, lo, hi, outside } = useMemo(() => simulate(n), [n]);
  const W = 330, H = 170, X0 = 10, Y0 = 8, PW = W - 20, PH = H - Y0 - 30;
  const hist = new Array(M + 1).fill(0);
  counts.forEach((c) => hist[c]++);
  const top = Math.max(...hist);
  const sx = (v: number) => X0 + (Math.max(0, Math.min(M, v)) / M) * PW;
  const bw = PW / (M + 1);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="eb-n">balls n = {n} into 100 bins</label>
        <input id="eb-n" type="range" min={20} max={400} step={10} value={n} onChange={(e) => setN(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of the number of empty bins">
        <rect x={sx(mean - half)} y={Y0} width={sx(mean + half) - sx(mean - half)} height={PH} fill="var(--accent-soft)" opacity={0.5} />
        {hist.map((h, v) => h > 0 && (
          <rect key={v} x={X0 + v * bw} y={Y0 + PH - (h / top) * PH} width={Math.max(bw - 0.5, 0.5)} height={(h / top) * PH} fill="var(--accent)" />
        ))}
        <line x1={sx(mean)} x2={sx(mean)} y1={Y0} y2={Y0 + PH} stroke="var(--danger)" strokeWidth={1.5} />
        {[0, 25, 50, 75, 100].map((v) => (
          <text key={v} x={sx(v)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{v}</text>
        ))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">number of empty bins</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`mean ${mean.toFixed(1)}; McDiarmid 95% band ±${half.toFixed(1)}; middle 95% of trials ${lo} to ${hi}; ${outside} of ${TRIALS} outside the band`}
      </div>
      <figcaption className="viz-caption">
        Three thousand experiments, each throwing n balls into 100 bins and counting the bins left empty. Moving one ball
        changes the count by at most 1, so McDiarmid&apos;s inequality puts the count within ±√(n log 40 / 2) of its mean
        (red) with probability at least 95% (shaded band), without any knowledge of how the balls interact. The band
        always holds, but it is several times wider than the actual spread, and far wider once nearly every bin is full:
        bounded differences ignore the variance, just as Hoeffding does.
      </figcaption>
    </figure>
  );
}
