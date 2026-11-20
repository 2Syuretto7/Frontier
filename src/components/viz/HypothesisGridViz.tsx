"use client";

import { useState } from "react";

const PRIORS = [0.05, 0.2, 0.5];
const POWERS = [0.2, 0.8];
const ALPHA = 0.05, N = 200;

/** Expected counts when N hypotheses, a fraction prior of them true, are each tested once with the given power and level ALPHA. */
export function outcomes(prior: number, power: number) {
  const t = N * prior, f = N - t;
  const tp = t * power, fp = f * ALPHA;
  return { tp, fn: t - tp, fp, tn: f - fp, ppv: tp / (tp + fp) };
}

const COLS = ["var(--accent)", "var(--danger)", "var(--border-strong)", "var(--border)"];
const NAMES = ["true, detected", "false, 'detected'", "true, missed", "false, rejected"];

export function HypothesisGridViz() {
  const [pi, setPi] = useState(1);
  const [pw, setPw] = useState(0);
  const o = outcomes(PRIORS[pi], POWERS[pw]);
  const counts = [o.tp, o.fp, o.fn, o.tn].map((x) => Math.round(x));
  counts[3] = N - counts[0] - counts[1] - counts[2];
  const cells: number[] = [];
  counts.forEach((c, k) => { for (let i = 0; i < c; i++) cells.push(k); });
  const COLN = 20, CELL = 15, X0 = 15;
  const W = 330, H = (N / COLN) * CELL + 50;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Share of hypotheses that are true">
          {PRIORS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>{v * 100}% true</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Power">
          {POWERS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={pw === i} onClick={() => setPw(i)}>power {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Two hundred tested hypotheses by outcome">
        {cells.map((k, i) => <rect key={i} x={X0 + (i % COLN) * CELL + 1} y={4 + Math.floor(i / COLN) * CELL + 1} width={CELL - 2} height={CELL - 2} style={{ fill: COLS[k] }} />)}
        {NAMES.map((name, k) => (
          <g key={name}>
            <rect x={X0 + (k % 2) * 155} y={H - 36 + Math.floor(k / 2) * 16} width={9} height={9} style={{ fill: COLS[k] }} />
            <text x={X0 + (k % 2) * 155 + 13} y={H - 28 + Math.floor(k / 2) * 16} className="viz-label">{name} {counts[k]}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        share of significant results that are true: {(100 * o.ppv).toFixed(0)}%
      </div>
      <figcaption className="viz-caption">
        Two hundred hypotheses, each tested once at the 5% level. When few of the ideas tested are true and experiments are small,
        a large share of the significant results are false alarms. Testing more plausible hypotheses, and testing them with enough
        power, is what makes a significant result worth believing.
      </figcaption>
    </figure>
  );
}
