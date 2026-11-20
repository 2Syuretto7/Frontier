"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const QUAL = [{ name: "good judge", sens: 0.98, spec: 0.85 }, { name: "fair judge", sens: 0.92, spec: 0.7 }, { name: "poor judge", sens: 0.8, spec: 0.5 }];
const NS = [50, 200, 800];
const BIG = 10000, TRUTH = 0.6, REPS = 200;

/**
 * Answers are correct with probability TRUTH. A judge marks a correct answer correct with probability sens and a wrong one
 * correct with probability 1 − spec. n answers get human labels; BIG more get only the judge's label. Returns three estimates
 * of accuracy with 95% intervals for the first replicate (judge only, humans only, prediction-powered) and each one's coverage
 * over REPS replicates.
 */
export function ppiSim(q: number, n: number, seed = 32) {
  const { sens, spec } = QUAL[q];
  const r = rand(seed);
  const draw = () => { const y = r() < TRUTH ? 1 : 0; const j = r() < (y ? sens : 1 - spec) ? 1 : 0; return [y, j]; };
  const first: { est: number; half: number }[] = [];
  const cover = [0, 0, 0];
  for (let rep = 0; rep < REPS; rep++) {
    let ju = 0;
    for (let i = 0; i < BIG; i++) ju += draw()[1];
    const mu = ju / BIG, vu = mu * (1 - mu);
    let sy = 0, syy = 0, sd = 0, sdd = 0;
    for (let i = 0; i < n; i++) { const [y, j] = draw(); sy += y; syy += y * y; sd += y - j; sdd += (y - j) ** 2; }
    const my = sy / n, vy = (syy - n * my * my) / (n - 1), md = sd / n, vd = (sdd - n * md * md) / (n - 1);
    const res = [
      { est: mu, half: 1.96 * Math.sqrt(vu / BIG) },
      { est: my, half: 1.96 * Math.sqrt(vy / n) },
      { est: mu + md, half: 1.96 * Math.sqrt(vu / BIG + vd / n) },
    ];
    res.forEach((x, i) => { if (Math.abs(x.est - TRUTH) <= x.half) cover[i]++; });
    if (rep === 0) first.push(...res);
  }
  return { first, cover: cover.map((c) => c / REPS) };
}

const NAMES = ["judge only", "humans only", "prediction-powered"];

export function JudgePpiViz() {
  const [q, setQ] = useState(1);
  const [n, setN] = useState(1);
  const { first, cover } = useMemo(() => ppiSim(q, NS[n]), [q, n]);
  const W = 330, H = 140, X0 = 120, PW = 200, LO = 0.4, HI = 0.8;
  const px = (x: number) => X0 + ((Math.min(HI, Math.max(LO, x)) - LO) / (HI - LO)) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Judge quality">
          {QUAL.map((x, i) => <button key={x.name} type="button" className="seg" aria-pressed={q === i} onClick={() => setQ(i)}>{x.name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Human labels">
          {NS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={n === i} onClick={() => setN(i)}>{v} labelled</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Three accuracy estimates with 95% intervals">
        <line x1={px(TRUTH)} x2={px(TRUTH)} y1={6} y2={H - 30} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {first.map((d, i) => {
          const y = 22 + i * 32;
          return (
            <g key={i}>
              <text x={X0 - 8} y={y + 4} textAnchor="end" className="viz-label">{NAMES[i]}</text>
              <line x1={px(d.est - d.half)} x2={px(d.est + d.half)} y1={y} y2={y} stroke="var(--accent)" strokeWidth={3} />
              <circle cx={px(d.est)} cy={y} r={4} style={{ fill: "var(--accent)" }} />
            </g>
          );
        })}
        <text x={X0} y={H - 16} className="viz-label">{LO}</text>
        <text x={X0 + PW} y={H - 16} textAnchor="end" className="viz-label">{HI}</text>
        <text x={px(TRUTH)} y={H - 4} textAnchor="middle" className="viz-label">true accuracy</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        coverage over {REPS} repeats: judge {(100 * cover[0]).toFixed(0)}%, humans {(100 * cover[1]).toFixed(0)}%, prediction-powered {(100 * cover[2]).toFixed(0)}%
      </div>
      <figcaption className="viz-caption">
        Estimating a model&apos;s accuracy from ten thousand judge labels and a few human ones. The judge alone gives a narrow
        interval in the wrong place, because its errors are not symmetric. Humans alone are unbiased but noisy. Adding the
        average human-minus-judge correction to the judge&apos;s estimate is unbiased, and narrower than humans alone when the
        judge agrees with them often.
      </figcaption>
    </figure>
  );
}
