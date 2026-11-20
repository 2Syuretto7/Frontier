"use client";

import { useMemo, useState } from "react";

const ALPHAS = [0.6, 1.0, 1.4];
const SUBPOPS = 5000, TRAIN = 2000, CLASSES = 10;

/**
 * Feldman's long-tail setting. Inputs come from SUBPOPS subpopulations with frequencies proportional to i^(−α), each with its
 * own label. Training draws TRAIN examples. A learner that memorises labels any subpopulation it has seen once; one that cannot
 * memorise needs at least 3 examples, and otherwise guesses among CLASSES labels. Returns, exactly, the share of test inputs
 * whose subpopulation appeared 0, 1, 2 or at least 3 times in training, and both learners' test accuracy.
 */
export function longTail(alpha: number) {
  const w = Array.from({ length: SUBPOPS }, (_, i) => Math.pow(i + 1, -alpha));
  const z = w.reduce((a, b) => a + b, 0);
  const share = [0, 0, 0, 0];
  for (const wi of w) {
    const q = wi / z;
    const p0 = Math.exp(TRAIN * Math.log(1 - q));
    const p1 = TRAIN * q * Math.exp((TRAIN - 1) * Math.log(1 - q));
    const p2 = ((TRAIN * (TRAIN - 1)) / 2) * q * q * Math.exp((TRAIN - 2) * Math.log(1 - q));
    share[0] += q * p0; share[1] += q * p1; share[2] += q * p2; share[3] += q * (1 - p0 - p1 - p2);
  }
  const g = 1 / CLASSES;
  return {
    share,
    memorise: share[0] * g + share[1] + share[2] + share[3],
    noMemorise: (share[0] + share[1] + share[2]) * g + share[3],
  };
}

const NAMES = ["unseen", "seen once", "seen twice", "seen 3+ times"];

export function LongTailViz() {
  const [a, setA] = useState(0);
  const [mem, setMem] = useState(1);
  const res = useMemo(() => longTail(ALPHAS[a]), [a]);
  const W = 330, H = 150, X0 = 92, PW = 200;
  const correct = (k: number) => (mem ? (k === 0 ? 1 / CLASSES : 1) : k === 3 ? 1 : 1 / CLASSES);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="How heavy the tail is">
          {["heavy tail", "medium tail", "light tail"].map((name, i) => <button key={name} type="button" className="seg" aria-pressed={a === i} onClick={() => setA(i)}>{name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Learner">
          {["cannot memorise", "memorises"].map((name, i) => <button key={name} type="button" className="seg" aria-pressed={mem === i} onClick={() => setMem(i)}>{name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Share of test inputs by how often their subpopulation was seen in training">
        {res.share.map((s, k) => {
          const y = 12 + k * 30, w = s * PW;
          return (
            <g key={k}>
              <text x={X0 - 6} y={y + 12} textAnchor="end" className="viz-label">{NAMES[k]}</text>
              <rect x={X0} y={y} width={w} height={16} style={{ fill: "var(--border)" }} />
              <rect x={X0} y={y} width={w * correct(k)} height={16} style={{ fill: "var(--accent)" }} />
              <text x={X0 + w + 4} y={y + 12} className="viz-label">{(100 * s).toFixed(1)}%</text>
            </g>
          );
        })}
        <text x={W / 2} y={H - 4} textAnchor="middle" className="viz-label">share of test inputs; coloured: answered correctly</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        test accuracy: memorising {(100 * res.memorise).toFixed(1)}%, not memorising {(100 * res.noMemorise).toFixed(1)}%
      </div>
      <figcaption className="viz-caption">
        Natural data has a long tail of rare kinds of input. With two thousand training examples drawn from five thousand
        subpopulations, a sizeable share of test inputs belongs to subpopulations seen exactly once in training. Only a learner
        that memorises those single examples gets them right, so on long-tailed data memorisation is part of generalising well,
        not its opposite.
      </figcaption>
    </figure>
  );
}
