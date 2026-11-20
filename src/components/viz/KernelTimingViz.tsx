"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const RUNS = 40, BYTES = 1.2e9;

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
}

/**
 * Simulated timings, in milliseconds, of 40 back-to-back runs of a memory-bound kernel that moves 1.2 GB. The first run includes
 * compilation (12 ms), the second runs at reduced clocks (1.5 times slower), every run has 2% log-normal noise, about one in twelve is
 * delayed by 30% by other activity, and from run 25 the GPU throttles by 4%. With a hot cache, inputs left in L2 by the previous run
 * make every run 25% faster.
 */
export function kernelRuns(hot: boolean, seed = 4) {
  const r = rand(seed);
  return Array.from({ length: RUNS }, (_, i) => {
    let t = (hot ? 0.75 : 1.0) * Math.exp(0.02 * gauss(r));
    if (r() < 1 / 12) t *= 1.3;
    if (i >= 25) t *= 1.04;
    if (i === 0) t += 12;
    if (i === 1) t *= 1.5;
    return t;
  });
}

const STATS = ["mean of all", "median after warm-up", "minimum"];

export function KernelTimingViz() {
  const [s, setS] = useState(1);
  const [h, setH] = useState(0);
  const runs = useMemo(() => kernelRuns(h === 1), [h]);
  const kept = s === 1 ? runs.slice(2) : runs;
  const sorted = [...kept].sort((a, b) => a - b);
  const val = s === 0 ? kept.reduce((a, b) => a + b, 0) / kept.length : s === 1 ? (sorted[(sorted.length - 1) >> 1] + sorted[sorted.length >> 1]) / 2 : sorted[0];
  const W = 330, H = 160, X0 = 34, PW = 286, Y0 = 8, PH = 120, YMAX = 2;
  const px = (i: number) => X0 + ((i + 0.5) / RUNS) * PW;
  const py = (t: number) => Y0 + PH - (Math.min(t, YMAX) / YMAX) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Summary statistic">
          {STATS.map((n, i) => <button key={n} type="button" className="seg" aria-pressed={s === i} onClick={() => setS(i)}>{n}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Cache state between runs">
          {["L2 flushed", "L2 hot"].map((n, i) => <button key={n} type="button" className="seg" aria-pressed={h === i} onClick={() => setH(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Time of each of 40 runs of a kernel, with the reported summary">
        {[0, 0.5, 1, 1.5, 2].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeDasharray={v ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {runs.map((t, i) => {
          const used = s !== 1 || i >= 2;
          return <rect key={i} x={px(i) - 2.5} y={py(t)} width={5} height={py(0) - py(t)} style={{ fill: used ? "var(--text-muted)" : "var(--text-faint)" }} opacity={used ? 0.8 : 0.4} />;
        })}
        {runs[0] > YMAX && <text x={px(0) + 5} y={py(YMAX) + 9} className="viz-label">{runs[0].toFixed(0)} ms</text>}
        <line x1={X0} x2={X0 + PW} y1={py(val)} y2={py(val)} stroke="var(--accent)" strokeWidth={2} />
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">run number; time in ms; line: reported value</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        reported {val.toFixed(3)} ms, so {(BYTES / (val * 1e-3) / 1e9).toFixed(0)} GB/s
      </div>
      <figcaption className="viz-caption">
        Simulated timings of a kernel that moves 1.2 GB, run 40 times in a row. The first run includes compilation and the second starts
        at low clocks; noise, interruptions and thermal throttling follow. The mean is dragged up by the first run, the minimum reports
        a lucky case, and a hot cache makes the kernel look faster than it will be inside a real program. A median after warm-up, with
        the cache flushed, is the honest number.
      </figcaption>
    </figure>
  );
}
