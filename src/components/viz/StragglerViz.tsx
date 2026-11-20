"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 32, SLOW = 21, SPEED = 0.8;
const MODES = ["healthy", "one slow GPU", "rebalanced"];

/** Per-rank step times in ms: equal shares at speed 1 with 1% jitter, one rank at 80% speed, or shares proportional to speed. */
export function rankTimes(mode: number) {
  const rng = rand(9);
  const speeds = Array.from({ length: N }, (_, i) => (mode > 0 && i === SLOW ? SPEED : 1));
  const total = speeds.reduce((a, b) => a + b, 0);
  return speeds.map((s) => {
    const share = mode === 2 ? (N * s) / total : 1;
    return (100 * share) / s * (1 + 0.01 * (rng() - 0.5));
  });
}

export function StragglerViz() {
  const [mode, setMode] = useState(1);
  const t = rankTimes(mode);
  const sorted = [...t].sort((a, b) => a - b);
  const med = (sorted[N / 2 - 1] + sorted[N / 2]) / 2;
  const mad = (() => { const d = t.map((x) => Math.abs(x - med)).sort((a, b) => a - b); return (d[N / 2 - 1] + d[N / 2]) / 2; })();
  const z = t.map((x) => (x - med) / (1.4826 * mad));
  const mx = Math.max(...t);
  const W = 330, X0 = 30, BW = 8, H = 110, Y0 = 8, TOP = 130, LO = 90;
  const y = (v: number) => Y0 + H - ((v - LO) / (TOP - LO)) * H;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Scenario">
          {MODES.map((m, j) => <button key={m} type="button" className="seg" aria-pressed={mode === j} onClick={() => setMode(j)}>{m}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + H + 18}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Step time of each of 32 ranks">
        {t.map((v, i) => (
          <rect key={i} x={X0 + i * BW} y={y(v)} width={BW - 2} height={Y0 + H - y(v)} style={{ fill: z[i] > 3.5 ? "var(--accent)" : "var(--text-muted)" }} opacity={0.8} />
        ))}
        <line x1={X0} x2={X0 + N * BW} y1={y(mx)} y2={y(mx)} stroke="var(--text)" strokeDasharray="4 3" />
        <text x={X0 + N * BW + 2} y={y(mx) + 4} className="viz-label">step</text>
        {[90, 110, 130].map((v) => <text key={v} x={X0 - 4} y={y(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <text x={X0 + (N * BW) / 2} y={Y0 + H + 14} textAnchor="middle" className="viz-label">rank</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        step {mx.toFixed(1)} ms, median rank {med.toFixed(1)} ms; {z.filter((v) => v > 3.5).length} rank(s) flagged
      </div>
      <figcaption className="viz-caption">
        Thirty-two data-parallel ranks, each timing its share of a step, in milliseconds. The step ends when the slowest rank does, the
        dashed line. One GPU running at 80% speed stretches every step by a quarter and stands out clearly against the median.
        Giving each rank work in proportion to its speed brings the step back to within a fraction of a percent of healthy.
      </figcaption>
    </figure>
  );
}
