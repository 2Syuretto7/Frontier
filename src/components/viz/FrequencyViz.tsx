"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const W = 480, H = 220, L = 36, R = 12, T = 12, B = 28;

/** A small seeded generator so the first run is the same on the server and in the browser. */
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

/** Toss a coin many times and track the running proportion of heads. It wanders early and settles near the probability. */
export function FrequencyViz() {
  const [p, setP] = useState(0.5);
  const [n, setN] = useState(0);
  const [seed, setSeed] = useState(7);
  const MAXN = 2000;

  const rnd = makeRng(seed);
  const path: number[] = [];
  let heads = 0;
  for (let i = 1; i <= n; i++) {
    if (rnd() < p) heads++;
    path.push(heads / i);
  }

  const X = (i: number) => L + (Math.log10(i) / Math.log10(MAXN)) * (W - L - R);
  const Y = (v: number) => T + (1 - v) * (H - T - B);
  const d = path.map((v, i) => `${i ? "L" : "M"}${X(i + 1).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const last = path[path.length - 1];

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Running proportion of heads after ${n} tosses`}>
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} className="viz-axis" />
        <line x1={L} y1={T} x2={L} y2={H - B} className="viz-axis" />
        {[0, 0.5, 1].map((v) => <text key={v} x={L - 6} y={Y(v) + 4} textAnchor="end" className="plot-tick">{v}</text>)}
        {[1, 10, 100, 1000].map((t) => <text key={t} x={X(t)} y={H - B + 16} textAnchor="middle" className="plot-tick">{t}</text>)}
        <line x1={L} y1={Y(p)} x2={W - R} y2={Y(p)} className="plot-mirror" />
        {n > 0 && <path d={d} className="plot-curve" />}
      </svg>
      <div className="viz-controls">
        {[10, 100, 2000].map((k) => (
          <button key={k} type="button" className="btn" onClick={() => setN(k)}>{k} tosses</button>
        ))}
        <button type="button" className="btn" onClick={() => { setSeed(seed + 1); setN(n || 2000); }}>New run</button>
      </div>
      <div className="viz-sliders">
        <label>
          <span>Chance of heads <span className="mono">p = {fmtNum(p)}</span></span>
          <input type="range" min={0.1} max={0.9} step={0.1} value={p} onChange={(e) => setP(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {n === 0
          ? <>Choose a number of tosses. The horizontal axis is stretched so that the first few tosses are visible.</>
          : <>After {n} tosses, {Math.round(last * n)} were heads: a proportion of <span className="mono">{last.toFixed(3)}</span>, against a
              probability of <span className="mono">{fmtNum(p)}</span>. Early on the line swings wildly; later it barely moves. Try a new run: the
              start is different every time, the end is not.</>}
      </figcaption>
    </figure>
  );
}
