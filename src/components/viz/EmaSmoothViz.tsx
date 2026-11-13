"use client";

import { useState } from "react";

const W = 520, H = 220, PAD = 30, N = 200;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
const r = rng(11);
const RAW = Array.from({ length: N }, (_, t) => 0.6 + 1.8 * Math.exp(-t / 40) + (r() - 0.5) * 0.8);
const px = (t: number) => PAD + (t / (N - 1)) * (W - PAD - 10);
const py = (v: number) => 10 + (1 - Math.max(0, Math.min(3, v)) / 3) * (H - 10 - PAD);
const line = (vs: number[]) => vs.map((v, t) => `${px(t).toFixed(1)},${py(v).toFixed(1)}`).join(" ");

/** A noisy loss curve and its exponential moving average, with and without bias correction. */
export function EmaSmoothViz() {
  const [beta, setBeta] = useState(0.9);
  const [correct, setCorrect] = useState(false);
  let m = 0;
  const sm = RAW.map((x, i) => {
    m = beta * m + (1 - beta) * x;
    return correct ? m / (1 - beta ** (i + 1)) : m;
  });
  const window = 1 / (1 - beta);
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Noisy training loss and its smoothed version">
        <line x1={PAD} y1={H - PAD} x2={W - 10} y2={H - PAD} stroke="var(--border)" />
        <line x1={PAD} y1={10} x2={PAD} y2={H - PAD} stroke="var(--border)" />
        {[0, 1, 2, 3].map((v) => <text key={v} x={PAD - 4} y={py(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <text x={(W + PAD) / 2} y={H - 8} textAnchor="middle" className="viz-label">step</text>
        <polyline points={line(RAW)} fill="none" stroke="var(--text-faint)" strokeWidth={1} />
        <polyline points={line(sm)} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
      </svg>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 220px" }}>
          <span className="mono">β = {beta.toFixed(3)}</span>
          <input type="range" min={0} max={0.99} step={0.01} value={beta} onChange={(e) => setBeta(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
        </label>
        <button type="button" className="seg" aria-pressed={correct} onClick={() => setCorrect(!correct)}>bias correction</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The smoothed curve averages roughly the last {window < 1.5 ? "1" : Math.round(window)} steps.{" "}
        {correct
          ? "Dividing by 1 − βᵗ removes the dip at the start: early values are true averages of the steps seen so far."
          : beta > 0.5
            ? "Starting the average at 0 drags the first values down, so the loss appears to start low and rise. That is an artefact, not training."
            : "With little smoothing, the noise hides the trend."}
      </figcaption>
    </figure>
  );
}
