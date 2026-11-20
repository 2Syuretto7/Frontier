"use client";

import { useMemo, useState } from "react";

const N = 12, TRAIN = [0, 2, 5, 7, 10], UNSEEN = Array.from({ length: N }, (_, i) => i).filter((i) => !TRAIN.includes(i));

type Learner = (labels: number[]) => (x: number) => number;
const LEARNERS: [string, Learner][] = [
  ["nearest neighbour", (lab) => (x) => { let b = 0; TRAIN.forEach((t, k) => { if (Math.abs(t - x) < Math.abs(TRAIN[b] - x)) b = k; }); return lab[b]; }],
  ["majority", (lab) => () => (2 * lab.reduce((a, v) => a + v, 0) > lab.length ? 1 : 0)],
  ["always 1", () => () => 1],
];

/** Distribution of the off-training-set error (k unseen mistakes out of 7) over a uniform prior on targets. */
export function distribution(learner: number, family: "all" | "thresholds") {
  const targets: number[][] = family === "all"
    ? Array.from({ length: 2 ** N }, (_, m) => Array.from({ length: N }, (_, i) => (m >> i) & 1))
    : Array.from({ length: N + 1 }, (_, t) => Array.from({ length: N }, (_, i) => (i >= t ? 1 : 0)));
  const hist = new Array(UNSEEN.length + 1).fill(0);
  for (const f of targets) {
    const h = LEARNERS[learner][1](TRAIN.map((i) => f[i]));
    hist[UNSEEN.filter((i) => h(i) !== f[i]).length] += 1 / targets.length;
  }
  return { hist, mean: hist.reduce((a, p, k) => a + (p * k) / UNSEEN.length, 0) };
}

export function NoFreeLunchViz() {
  const [li, setLi] = useState(0);
  const [fam, setFam] = useState<"all" | "thresholds">("all");
  const d = useMemo(() => distribution(li, fam), [li, fam]);
  const W = 320, H = 160, X0 = 20, PW = 290, Y0 = 8, PH = 116, K = UNSEEN.length + 1;
  const top = Math.max(0.5, ...d.hist);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Learner">
          {LEARNERS.map(([name], i) => <button key={name} type="button" className="seg" aria-pressed={li === i} onClick={() => setLi(i)}>{name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Targets">
          <button type="button" className="seg" aria-pressed={fam === "all"} onClick={() => setFam("all")}>all 4096 targets</button>
          <button type="button" className="seg" aria-pressed={fam === "thresholds"} onClick={() => setFam("thresholds")}>thresholds only</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Distribution of off-training-set mistakes">
        {d.hist.map((p, k) => {
          const h = (p / top) * PH, x = X0 + (k * PW) / K;
          return <g key={k}><rect x={x + 3} y={Y0 + PH - h} width={PW / K - 6} height={h} fill="var(--accent)" fillOpacity={0.7} /><text x={x + PW / K / 2} y={H - 16} textAnchor="middle" className="viz-label">{k}</text></g>;
        })}
        <text x={X0 + PW / 2} y={H - 2} textAnchor="middle" className="viz-label">mistakes on the 7 unseen points</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        mean off-training-set error {d.mean.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Twelve points, of which the learner sees the labels of five. Averaged over all 4096 possible targets, every learner
        makes exactly the same distribution of mistakes on the seven unseen points, with mean 0.5: the labels it saw carry no
        information about the rest. Restrict the targets to thresholds and the learners separate: nearest neighbour drops to
        0.077 and majority vote to 0.231, while always predicting 1 sits at 0.462.
      </figcaption>
    </figure>
  );
}
