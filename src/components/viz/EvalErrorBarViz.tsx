"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const NS = [50, 200, 800];
const KS = [1, 4, 16];
const SHOW = 30, REPS = 400;

/**
 * Each item has a chance of being answered correctly p = σ(0.5 + 2z), z ~ N(0, 1). An evaluation draws n items and K sampled
 * answers per item, scores each item by its fraction correct, and reports the mean with a 95% interval from the standard
 * deviation of the item scores. Returns the first SHOW intervals, the mean half-width and the coverage over REPS evaluations.
 */
export function evalIntervals(n: number, k: number, seed = 21) {
  const r = rand(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const p = () => 1 / (1 + Math.exp(-(0.5 + 2 * gauss())));
  let truth = 0;
  for (let i = 0; i < 100000; i++) truth += p();
  truth /= 100000;
  const out: { mean: number; half: number }[] = [];
  let cover = 0, width = 0;
  for (let rep = 0; rep < REPS; rep++) {
    let s = 0, ss = 0;
    for (let i = 0; i < n; i++) {
      const pi = p();
      let c = 0;
      for (let j = 0; j < k; j++) if (r() < pi) c++;
      const x = c / k;
      s += x; ss += x * x;
    }
    const mean = s / n, sd = Math.sqrt(Math.max(0, (ss - n * mean * mean) / (n - 1)));
    const half = (1.96 * sd) / Math.sqrt(n);
    if (Math.abs(mean - truth) <= half) cover++;
    width += half;
    if (rep < SHOW) out.push({ mean, half });
  }
  return { truth, out, half: width / REPS, coverage: cover / REPS };
}

export function EvalErrorBarViz() {
  const [n, setN] = useState(1);
  const [k, setK] = useState(0);
  const { truth, out, half, coverage } = useMemo(() => evalIntervals(NS[n], KS[k]), [n, k]);
  const W = 330, H = 200, X0 = 14, PW = 302, Y0 = 8, PH = 166, LO = truth - 0.2, HI = truth + 0.2;
  const px = (x: number) => X0 + ((Math.min(HI, Math.max(LO, x)) - LO) / (HI - LO)) * PW;
  const row = PH / SHOW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Items">
          {NS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={n === i} onClick={() => setN(i)}>{v} items</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Samples per item">
          {KS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{v} per item</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Thirty repeated evaluations with 95% intervals">
        <line x1={px(truth)} x2={px(truth)} y1={Y0} y2={Y0 + PH} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {out.map((d, i) => {
          const miss = Math.abs(d.mean - truth) > d.half;
          const y = Y0 + (i + 0.5) * row;
          const col = miss ? "var(--danger)" : "var(--accent)";
          return (
            <g key={i}>
              <line x1={px(d.mean - d.half)} x2={px(d.mean + d.half)} y1={y} y2={y} stroke={col} strokeWidth={1.5} />
              <circle cx={px(d.mean)} cy={y} r={2} style={{ fill: col }} />
            </g>
          );
        })}
        <text x={X0} y={Y0 + PH + 13} className="viz-label">−20 points</text>
        <text x={X0 + PW} y={Y0 + PH + 13} textAnchor="end" className="viz-label">+20 points</text>
        <text x={px(truth)} y={H - 4} textAnchor="middle" className="viz-label">true accuracy</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        mean half-width {(100 * half).toFixed(1)} points; {(100 * coverage).toFixed(0)}% of {REPS} intervals cover the truth
      </div>
      <figcaption className="viz-caption">
        Thirty independent evaluations of the same model, each on freshly drawn items, with a 95% interval from the spread of the
        item scores. About one in twenty misses the true accuracy, shown in a different colour. More items narrow the interval
        roughly as one over the square root of the count. Sampling more answers per item helps much less, because most of the
        spread comes from items differing in difficulty, not from the randomness of a single answer.
      </figcaption>
    </figure>
  );
}
