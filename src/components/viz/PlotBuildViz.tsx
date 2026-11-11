"use client";

import { useMemo, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const W = 440, H = 240, PAD = { l: 52, r: 12, t: 24, b: 40 };
const STAGES = ["Raw pixels", "Scales", "Axes and ticks", "Labels", "Log scale"];

/** Building a line chart from scratch: data to pixels with scales, then axes, labels and a log scale. */
export function PlotBuildViz() {
  const [stage, setStage] = useState(0);
  const data = useMemo(() => {
    const g = makeNormal(makeRng(12));
    return Array.from({ length: 101 }, (_, i) => ({ step: i * 10, loss: 0.4 + 4 / (1 + (i * 10) / 40) + 0.04 * g() }));
  }, []);
  const log = stage >= 4;
  const scaled = stage >= 1;
  const ymin = log ? 0.3 : 0, ymax = log ? 5 : 4.5;
  const tY = (v: number) => (log ? Math.log10(v) : v);
  const X = (s: number) => (scaled ? PAD.l + ((s - 0) / 1000) * (W - PAD.l - PAD.r) : s * 0.4);
  const Y = (v: number) => (scaled ? PAD.t + (1 - (tY(v) - tY(ymin)) / (tY(ymax) - tY(ymin))) * (H - PAD.t - PAD.b) : v * 40);
  const path = data.map((d, i) => `${i ? "L" : "M"}${X(d.step).toFixed(1)} ${Y(d.loss).toFixed(1)}`).join(" ");
  const yticks = log ? [0.3, 0.5, 1, 2, 5] : [0, 1, 2, 3, 4];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Stage">
          {STAGES.map((s, i) => <button key={s} type="button" className="seg" aria-pressed={stage === i} onClick={() => setStage(i)}>{i + 1}. {s}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label="A training loss curve being built step by step" style={{ marginTop: 12 }}>
        <rect x={0} y={0} width={W} height={H} fill="none" stroke="var(--border)" />
        {stage >= 2 && <>
          <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} className="viz-axis" />
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} className="viz-axis" />
          {[0, 250, 500, 750, 1000].map((s) => <g key={s}><line x1={X(s)} x2={X(s)} y1={H - PAD.b} y2={H - PAD.b + 4} className="viz-axis" /><text x={X(s)} y={H - PAD.b + 16} textAnchor="middle" className="plot-tick">{s}</text></g>)}
          {yticks.map((v) => <g key={v}><line x1={PAD.l} x2={W - PAD.r} y1={Y(v)} y2={Y(v)} className="plot-grid" /><text x={PAD.l - 6} y={Y(v) + 4} textAnchor="end" className="plot-tick">{v}</text></g>)}
        </>}
        <path d={path} className="plot-curve" />
        {stage >= 3 && <>
          <text x={(PAD.l + W - PAD.r) / 2} y={H - 6} textAnchor="middle" className="plot-tick">training step</text>
          <text x={-(PAD.t + H - PAD.b) / 2} y={14} transform="rotate(-90)" textAnchor="middle" className="plot-tick">loss{log ? " (log scale)" : ""}</text>
          <text x={PAD.l} y={14} className="plot-tick" style={{ fontWeight: 600 }}>Training loss, run 7</text>
        </>}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        {[
          "Plotting the numbers directly as pixel coordinates: step 1000 lands far off the right edge, loss is upside down because screen y grows downwards, and the shape is squashed into a corner.",
          "A scale is a function from data to pixels: x = left + (step / 1000) × width, and y is flipped so larger losses sit higher. Now the curve fills the frame.",
          "Axes and ticks let a reader recover numbers from positions. Ticks go at round values chosen to cover the data.",
          "Labels say what each axis measures and in what units; a title says which run this is. Without them the chart cannot be checked.",
          "On a log scale, equal distances are equal ratios. The slow late improvement, invisible before, is now readable, which is why loss curves are usually plotted this way.",
        ][stage]}
      </figcaption>
    </figure>
  );
}
