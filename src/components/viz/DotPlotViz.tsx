"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const W = 480, H = 170, L = 20, R = 20;
const MIN = 0, MAX = 20;
const X = (v: number) => L + ((v - MIN) / (MAX - MIN)) * (W - L - R);
const r2 = (n: number) => Math.round(n * 100) / 100;

const START = [4, 6, 7, 7, 8, 9, 10];

/** A small data set on a number line. Move the last value and watch the mean chase it while the median barely moves. */
export function DotPlotViz() {
  const [last, setLast] = useState(10);
  const data = [...START.slice(0, -1), last];
  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);
  const mean = data.reduce((s, v) => s + v, 0) / n;
  const median = sorted[(n - 1) / 2];
  const sd = Math.sqrt(data.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
  const range = sorted[n - 1] - sorted[0];

  // Stack equal values so every dot shows.
  const seen = new Map<number, number>();
  const dots = data.map((v, i) => {
    const k = seen.get(v) ?? 0;
    seen.set(v, k + 1);
    return { v, k, hot: i === n - 1 };
  });
  const base = 110;

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Seven values with mean ${r2(mean)} and median ${median}`}>
        <rect x={X(mean - sd)} y={30} width={X(mean + sd) - X(mean - sd)} height={base - 22} className="viz-region" style={{ opacity: 0.5 }} />
        <line x1={L} y1={base + 8} x2={W - R} y2={base + 8} className="viz-axis" />
        {Array.from({ length: (MAX - MIN) / 2 + 1 }, (_, i) => MIN + 2 * i).map((t) => (
          <g key={t}>
            <line x1={X(t)} y1={base + 8} x2={X(t)} y2={base + 13} className="viz-axis" />
            <text x={X(t)} y={base + 27} textAnchor="middle" className="plot-tick">{t}</text>
          </g>
        ))}
        {dots.map((d, i) => <circle key={i} cx={X(d.v)} cy={base - d.k * 15} r={6} className={d.hot ? "plot-hot" : "plot-point"} />)}
        <line x1={X(mean)} y1={22} x2={X(mean)} y2={base + 8} className="plot-line" strokeWidth={2} />
        <text x={X(mean)} y={16} textAnchor="middle" className="viz-label is-on">mean</text>
        <path d={`M${X(median)} ${base + 40} l-6 9 h12 Z`} style={{ fill: "var(--text-muted)" }} />
        <text x={X(median)} y={base + 62} textAnchor="middle" className="viz-label">median</text>
      </svg>
      <div className="viz-sliders">
        <label>
          <span>The red value <span className="mono">{fmtNum(last)}</span></span>
          <input type="range" min={0} max={20} step={1} value={last} onChange={(e) => setLast(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Data <span className="mono">{data.join(", ")}</span>. Mean <span className="mono">{fmtNum(r2(mean))}</span>, the balance
        point; median <span className="mono">{fmtNum(median)}</span>, the middle value. Range{" "}
        <span className="mono">{fmtNum(range)}</span>, standard deviation <span className="mono">{fmtNum(r2(sd))}</span>{" "}
        (the shaded band is one standard deviation either side of the mean). Drag the red value to 20: the mean and the
        spread jump, the median does not move.
      </figcaption>
    </figure>
  );
}
