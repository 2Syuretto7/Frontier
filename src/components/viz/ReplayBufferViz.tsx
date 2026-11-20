"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const STEPS = 3000, PERIOD = 600, LR = 0.05, BATCH = 8, CAPS = [1, 50, 300, 2000];

/** SGD on y = 1 + 2x from a slowly oscillating stream of x, training on minibatches drawn from the last `cap` samples. */
export function replayRun(cap: number, seed = 4) {
  const r = rand(seed), buf: [number, number][] = [], err: number[] = [];
  const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  let a = 0, b = 0;
  for (let t = 0; t < STEPS; t++) {
    const x = Math.sin((2 * Math.PI * t) / PERIOD) + 0.05 * g(), y = 1 + 2 * x + 0.3 * g();
    buf.push([x, y]);
    if (buf.length > cap) buf.shift();
    let ga = 0, gb = 0;
    for (let i = 0; i < BATCH; i++) {
      const [bx, by] = buf[Math.floor(r() * buf.length)], e = a + b * bx - by;
      ga += e / BATCH;
      gb += (e * bx) / BATCH;
    }
    a -= LR * ga;
    b -= LR * gb;
    err.push(Math.hypot(a - 1, b - 2));
  }
  return err;
}

export function ReplayBufferViz() {
  const [ci, setCi] = useState(0);
  const err = useMemo(() => replayRun(CAPS[ci]), [ci]);
  const W = 330, H = 160, X0 = 34, Y0 = 8, PW = W - 44, PH = H - Y0 - 30, YMAX = 1.5;
  const sx = (t: number) => X0 + (t / STEPS) * PW, sy = (e: number) => Y0 + PH - (Math.min(e, YMAX) / YMAX) * PH;
  const late = err.slice(1000);
  const mean = late.reduce((s, x) => s + x, 0) / late.length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">buffer size</span>
        <div className="segmented" role="group" aria-label="Replay buffer size">
          {CAPS.map((c, i) => <button key={c} type="button" className="seg" aria-pressed={ci === i} onClick={() => setCi(i)}>{c === 1 ? "none" : c}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Parameter error over training steps">
        {[0, 0.5, 1, 1.5].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={sy(y)} y2={sy(y)} stroke="var(--border)" strokeDasharray={y ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        <path d={err.filter((_, t) => t % 5 === 0).map((e, i) => `${i ? "L" : "M"}${sx(i * 5).toFixed(1)},${sy(e).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={1.4} />
        {[0, 1000, 2000, 3000].map((t) => <text key={t} x={sx(t)} y={Y0 + PH + 14} textAnchor={t === STEPS ? "end" : "middle"} className="viz-label">{t}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">step</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`average parameter error after step 1000: ${mean.toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        Stochastic gradient descent fitting y = 1 + 2x from a stream in which x drifts slowly back and forth between −1 and 1, as
        the states of an agent do along a trajectory. Each step trains on 8 samples drawn from the most recent ones. Without a
        buffer every sample comes from the same small region of x, the fit chases the current region, and the parameters swing
        with the period of the stream. A larger buffer mixes old and new samples, so each minibatch looks more like the whole
        distribution: the average error after step 1000 falls from 0.50 without a buffer to 0.03 with 300 samples.
      </figcaption>
    </figure>
  );
}
