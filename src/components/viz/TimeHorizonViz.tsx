"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const MODELS = [{ name: "older model", h: 4 }, { name: "newer model", h: 30 }, { name: "newest model", h: 120 }];
const TASKS = 170;
const LO = -4, HI = 10; // log2 minutes: about 4 seconds to 17 hours

/**
 * Tasks with human completion times t log-uniform over [2^LO, 2^HI] minutes, each attempted once by a model that succeeds with
 * probability σ(0.7·(log2 h − log2 t)). Fits success = σ(a + b·log2 t) by Newton's method and returns the tasks, the fit and the
 * fitted 50% and 80% horizons in minutes.
 */
export function horizonFit(h: number, seed = 43) {
  const r = rand(seed);
  const tasks = Array.from({ length: TASKS }, () => {
    const x = LO + (HI - LO) * r();
    const p = 1 / (1 + Math.exp(-0.7 * (Math.log2(h) - x)));
    return { x, y: r() < p ? 1 : 0 };
  });
  let a = 0, b = 0;
  for (let it = 0; it < 50; it++) {
    let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0;
    for (const { x, y } of tasks) {
      const p = 1 / (1 + Math.exp(-(a + b * x)));
      const w = p * (1 - p);
      g0 += y - p; g1 += (y - p) * x; h00 += w; h01 += w * x; h11 += w * x * x;
    }
    const det = h00 * h11 - h01 * h01;
    a += (h11 * g0 - h01 * g1) / det;
    b += (h00 * g1 - h01 * g0) / det;
  }
  const at = (p: number) => Math.pow(2, (Math.log(p / (1 - p)) - a) / b);
  return { tasks, a, b, h50: at(0.5), h80: at(0.8) };
}

const fmt = (m: number) => (m < 1 ? `${Math.round(m * 60)} s` : m < 120 ? `${m.toFixed(m < 10 ? 1 : 0)} min` : `${(m / 60).toFixed(1)} h`);

export function TimeHorizonViz() {
  const [m, setM] = useState(1);
  const { tasks, a, b, h50, h80 } = useMemo(() => horizonFit(MODELS[m].h), [m]);
  const W = 330, H = 188, X0 = 30, PW = 290, Y0 = 10, PH = 130;
  const px = (x: number) => X0 + ((x - LO) / (HI - LO)) * PW;
  const py = (y: number) => Y0 + PH - y * PH;
  const r = rand(7);
  const curve = Array.from({ length: 81 }, (_, i) => LO + ((HI - LO) * i) / 80).map((x, i) => `${i ? "L" : "M"}${px(x).toFixed(1)},${py(1 / (1 + Math.exp(-(a + b * x)))).toFixed(1)}`).join(" ");
  const ticks = [{ x: -2, l: "15 s" }, { x: 0, l: "1 min" }, { x: Math.log2(15), l: "15 min" }, { x: Math.log2(240), l: "4 h" }];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Model">
          {MODELS.map((x, i) => <button key={x.name} type="button" className="seg" aria-pressed={m === i} onClick={() => setM(i)}>{x.name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Task success against human completion time with a fitted logistic curve">
        {[0, 0.5, 1].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray={y === 0.5 ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        {tasks.map((t, i) => <circle key={i} cx={px(t.x)} cy={py(t.y) + (t.y ? 6 : -6) * r()} r={2} style={{ fill: "var(--text-muted)", opacity: 0.6 }} />)}
        <path d={curve} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {Math.log2(h50) <= HI && <line x1={px(Math.log2(h50))} x2={px(Math.log2(h50))} y1={py(0.5)} y2={py(0)} stroke="var(--accent)" strokeDasharray="3 2" />}
        {ticks.map((t) => <text key={t.l} x={px(t.x)} y={Y0 + PH + 20} textAnchor="middle" className="viz-label">{t.l}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">time a skilled human takes (log scale)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        fitted 50% horizon {fmt(h50)}; 80% horizon {fmt(h80)}
      </div>
      <figcaption className="viz-caption">
        Each dot is a task, placed by how long a skilled person takes to do it, at the top if the model succeeded and at the bottom
        if not. A logistic curve in the logarithm of human time is fitted to the outcomes, and the time horizon is where it crosses
        50%. The 80% horizon is much shorter, because the curve falls gradually: models fail some short tasks and succeed at some
        long ones.
      </figcaption>
    </figure>
  );
}
