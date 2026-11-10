"use client";

import { useMemo, useState } from "react";
import { fmtNum } from "./format";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fixed, reproducible sample: the sum of three dice rolled 300 times. */
function sample(): number[] {
  const rnd = makeRng(20240611);
  return Array.from({ length: 300 }, () => 3 + Math.floor(rnd() * 6) + Math.floor(rnd() * 6) + Math.floor(rnd() * 6));
}

const W = 480, H = 240, L = 34, R = 10, T = 12, B = 30;
const LO = 2.5, HI = 18.5;

/** The same data drawn with different bin widths. Too narrow and it is noise; too wide and the shape vanishes. */
export function HistogramViz() {
  const data = useMemo(sample, []);
  const [width, setWidth] = useState(1);
  const [density, setDensity] = useState(false);

  const nb = Math.ceil((HI - LO) / width);
  const counts = Array.from({ length: nb }, () => 0);
  for (const v of data) counts[Math.min(nb - 1, Math.floor((v - LO) / width))]++;
  const heights = counts.map((c) => (density ? c / (data.length * width) : c));
  const top = Math.max(...heights) * 1.1;
  const X = (v: number) => L + ((v - LO) / (HI - LO)) * (W - L - R);
  const Y = (v: number) => H - B - (v / top) * (H - T - B);
  const mode = counts.indexOf(Math.max(...counts));

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Histogram of 300 sums of three dice, bin width ${width}`}>
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} className="viz-axis" />
        <line x1={L} y1={T} x2={L} y2={H - B} className="viz-axis" />
        {heights.map((h, i) => (
          <rect key={i} x={X(LO + i * width) + 0.5} y={Y(h)} width={Math.max(0, X(LO + (i + 1) * width) - X(LO + i * width) - 1)} height={H - B - Y(h)} className="viz-cell is-on" />
        ))}
        {[3, 6, 9, 12, 15, 18].map((t) => <text key={t} x={X(t)} y={H - B + 16} textAnchor="middle" className="plot-tick">{t}</text>)}
        {[0, 0.5, 1].map((f) => (
          <text key={f} x={L - 5} y={Y(top * f / 1.1) + 4} textAnchor="end" className="plot-tick">{density ? (top * f / 1.1).toFixed(2) : Math.round(top * f / 1.1)}</text>
        ))}
      </svg>
      <div className="viz-controls">
        {[1, 2, 4, 8].map((w) => (
          <button key={w} type="button" className={width === w ? "btn btn-primary" : "btn"} aria-pressed={width === w} onClick={() => setWidth(w)}>Width {w}</button>
        ))}
        <span className="viz-sep" />
        <button type="button" className={density ? "btn btn-primary" : "btn"} aria-pressed={density} onClick={() => setDensity(!density)}>Area = proportion</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        300 rolls of three dice, added up. With bins of width {width}, the tallest bar covers{" "}
        <span className="mono">{fmtNum(LO + mode * width + 0.5)}{width > 1 ? `–${fmtNum(Math.min(18, LO + (mode + 1) * width - 0.5))}` : ""}</span>.{" "}
        {density
          ? <>Each bar&rsquo;s height is now its proportion divided by its width, so the bar <em>areas</em> add to 1 whatever the width.</>
          : width === 1
            ? <>Every possible sum has its own bar: a hump in the middle, thin tails at both ends.</>
            : width === 8
              ? <>Two bars hide the hump entirely. Too wide a bin throws the shape away.</>
              : <>Wider bins smooth the bumps, but also blur the shape.</>}
      </figcaption>
    </figure>
  );
}
