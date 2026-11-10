"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const W = 480, H = 210, L = 36, R = 12, T = 14, B = 28;
const FACES = [1, 2, 3, 4, 5, 6];

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

/** A dice game: set the prize for each face, see the expected value, then play it many times and watch the average settle there. */
export function ExpectedValueViz() {
  const [prize, setPrize] = useState([0, 0, 0, 0, 0, 12]);
  const [cost, setCost] = useState(2);
  const [n, setN] = useState(0);
  const [seed, setSeed] = useState(3);

  const ev = prize.reduce((s, v) => s + v, 0) / 6 - cost;
  const rnd = makeRng(seed);
  const avg: number[] = [];
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += prize[Math.floor(rnd() * 6)] - cost;
    avg.push(total / i);
  }
  const span = Math.max(4, ...prize.map((v) => Math.abs(v - cost)));
  const X = (i: number) => L + (Math.log10(i) / Math.log10(1000)) * (W - L - R);
  const Y = (v: number) => T + ((span - v) / (2 * span)) * (H - T - B);
  const d = avg.map((v, i) => `${i ? "L" : "M"}${X(i + 1).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");

  return (
    <figure className="viz">
      <div className="viz-sliders">
        {FACES.map((f, i) => (
          <label key={f}>
            <span>Roll {f} wins <span className="mono">₹{prize[i]}</span></span>
            <input type="range" min={0} max={12} step={1} value={prize[i]} onChange={(e) => setPrize(prize.map((v, j) => (j === i ? Number(e.target.value) : v)))} />
          </label>
        ))}
        <label>
          <span>Cost to play <span className="mono">₹{cost}</span></span>
          <input type="range" min={0} max={6} step={1} value={cost} onChange={(e) => setCost(Number(e.target.value))} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Average winnings per game after ${n} games`} style={{ marginTop: 12 }}>
        <line x1={L} y1={Y(0)} x2={W - R} y2={Y(0)} className="viz-axis" />
        <line x1={L} y1={T} x2={L} y2={H - B} className="viz-axis" />
        {[-span, 0, span].map((v) => <text key={v} x={L - 6} y={Y(v) + 4} textAnchor="end" className="plot-tick">{fmtNum(Math.round(v))}</text>)}
        {[1, 10, 100, 1000].map((t) => <text key={t} x={X(t)} y={H - B + 16} textAnchor="middle" className="plot-tick">{t}</text>)}
        <line x1={L} y1={Y(ev)} x2={W - R} y2={Y(ev)} className="plot-mirror" />
        {n > 0 && <path d={d} className="plot-curve" />}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setN(1000)}>Play 1,000 games</button>
        <button type="button" className="btn" onClick={() => { setSeed(seed + 1); setN(1000); }}>New run</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Expected value per game: <span className="mono">({prize.join(" + ")}) / 6 − {cost} = {fmtNum(Math.round(ev * 100) / 100)}</span> rupees
        (dotted line). {ev > 0 ? "In the long run you gain." : ev < 0 ? "In the long run you lose." : "In the long run you break even: a fair game."}
        {n > 0 && <> After {n} games the average is <span className="mono">{avg[n - 1].toFixed(2)}</span>. No single game ever pays the expected value; the average of many does.</>}
      </figcaption>
    </figure>
  );
}
