"use client";

import { useState } from "react";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

/** A timing is the true cost plus small jitter plus occasional large interruptions; sample it many times. */
function sample(base: number, n: number, seed: number) {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const jitter = base * 0.03 * (r() + r() + r() - 1.5);
    const hiccup = r() < 0.15 ? base * (0.3 + 1.2 * r()) : 0;
    return base + jitter + hiccup;
  });
}

const med = (v: number[]) => { const s = [...v].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;

/** Two versions whose true costs differ by 5 per cent, timed repeatedly with realistic noise. */
export function BenchNoiseViz() {
  const [n, setN] = useState(5);
  const [seed, setSeed] = useState(1);
  const A = sample(10, n, seed * 2 + 1), B = sample(9.5, n, seed * 2 + 2);
  const W = 560, H = 120, lo = 9, hi = 23;
  const X = (t: number) => ((Math.min(t, hi) - lo) / (hi - lo)) * W;
  // How often does a single run of each rank them the wrong way round?
  const a1 = sample(10, 2000, 99), b1 = sample(9.5, 2000, 98);
  const wrong = a1.filter((t, i) => t < b1[i]).length / 20;
  const stats = [["mean", mean], ["median", med], ["min", (v: number[]) => Math.min(...v)]] as const;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label={`${n} timings each of version A and version B`}>
        {[10, 12, 14, 16, 18, 20, 22].map((t) => <g key={t}><line x1={X(t)} x2={X(t)} y1={0} y2={H} className="plot-grid" /><text x={X(t)} y={H + 16} textAnchor="middle" className="plot-tick">{t} ms</text></g>)}
        {A.map((t, i) => <circle key={`a${i}`} cx={X(t)} cy={30 + ((i * 7) % 20) - 10} r={4} className="plot-point" />)}
        {B.map((t, i) => <circle key={`b${i}`} cx={X(t)} cy={85 + ((i * 7) % 20) - 10} r={4} className="viz-node is-paired" />)}
        <text x={4} y={14} className="plot-tick">A (true cost 10 ms)</text>
        <text x={4} y={68} className="plot-tick">B (true cost 9.5 ms)</text>
      </svg>
      <div className="viz-sliders">
        <label><span>Runs of each <span className="mono">{n}</span></span><input type="range" min={1} max={50} value={n} onChange={(e) => setN(Number(e.target.value))} /></label>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>Run the benchmark again</button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead><tr><th>statistic</th><th>A</th><th>B</th><th>B faster?</th></tr></thead>
          <tbody>{stats.map(([name, f]) => <tr key={name}><td>{name}</td><td className="mono">{f(A).toFixed(2)}</td><td className="mono">{f(B).toFixed(2)}</td><td>{f(B) < f(A) ? "yes" : "no"}</td></tr>)}</tbody>
        </table>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        B really is 5 per cent faster. Timing each once ranks them the wrong way round in about <span className="mono">{wrong.toFixed(0)}%</span> of
        trials. Interruptions only ever add time, so the mean is dragged up by a few slow runs; the median and the minimum are steadier. Re-run with
        one run, then with twenty.
      </figcaption>
    </figure>
  );
}
