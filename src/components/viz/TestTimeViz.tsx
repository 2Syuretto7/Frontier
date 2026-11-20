"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const NS = [1, 2, 4, 8, 16, 32, 64];
const MIXES = [
  { label: "easy problems", p: [0.3, 0.9], a: [0.0, 0.3] },
  { label: "hard problems", p: [0.0, 0.4], a: [0.0, 0.4] },
];
const PROBLEMS = 600;

/**
 * Each problem has a chance p that a sample is correct and a chance a that it gives one particular tempting wrong answer;
 * otherwise the sample gives a wrong answer of its own. For n samples, coverage is the share of problems with at least one
 * correct sample (what a perfect verifier would achieve); majority vote picks the most common answer, ties split evenly.
 */
export function scaling(mix: number, seed = 6) {
  const r = rand(seed);
  const { p: [p0, p1], a: [a0, a1] } = MIXES[mix];
  const cov = new Array(NS.length).fill(0), maj = new Array(NS.length).fill(0);
  for (let k = 0; k < PROBLEMS; k++) {
    const p = p0 + (p1 - p0) * r(), a = a0 + (a1 - a0) * r() * (1 - p);
    let c = 0, t = 0, j = 0;
    for (let i = 1; i <= NS[NS.length - 1]; i++) {
      const u = r();
      if (u < p) c++; else if (u < p + a) t++;
      if (i === NS[j]) {
        if (c > 0) cov[j]++;
        const top = Math.max(c, t, 1);
        if (c === top) {
          let ties = 1;
          if (t === top) ties++;
          if (top === 1) ties += i - c - t; // every unique wrong answer also has one vote
          maj[j] += 1 / ties;
        }
        j++;
      }
    }
  }
  return NS.map((n, j) => ({ n, coverage: cov[j] / PROBLEMS, majority: maj[j] / PROBLEMS }));
}

export function TestTimeViz() {
  const [mi, setMi] = useState(1);
  const pts = useMemo(() => scaling(mi), [mi]);
  const W = 340, H = 180, X0 = 40, PW = 280, Y0 = 10, PH = 130;
  const px = (n: number) => X0 + (Math.log2(n) / 6) * PW;
  const py = (v: number) => Y0 + PH - v * PH;
  const path = (k: "coverage" | "majority") => pts.map((p, i) => `${i ? "L" : "M"}${px(p.n).toFixed(1)},${py(p[k]).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Problem mix">
          {MIXES.map((m, i) => <button key={m.label} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{m.label}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Accuracy against number of samples">
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 5} y={py(v) + 3} textAnchor="end" className="viz-label">{v * 100}%</text>
          </g>
        ))}
        {NS.map((n) => <text key={n} x={px(n)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{n}</text>)}
        <path d={path("coverage")} fill="none" stroke="var(--text)" strokeWidth={1.5} strokeDasharray="5 3" />
        <path d={path("majority")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {pts.map((p) => <circle key={p.n} cx={px(p.n)} cy={py(p.majority)} r={2.5} style={{ fill: "var(--accent)" }} />)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">samples; dashed: perfect verifier; solid: majority vote</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        one sample {(pts[0].majority * 100).toFixed(0)}%; 64 samples: majority {(last.majority * 100).toFixed(0)}%, perfect verifier {(last.coverage * 100).toFixed(0)}%
      </div>
      <figcaption className="viz-caption">
        Spending more compute at test time by sampling more answers. With a perfect verifier, accuracy keeps climbing as long
        as some sample is right. Majority vote helps when the correct answer is the most common one, then levels off; on
        problems where a tempting wrong answer is more common than the right one, more votes only make it surer of the wrong
        answer. The gap between the curves is what a better verifier or reward model would be worth.
      </figcaption>
    </figure>
  );
}
