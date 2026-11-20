"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const T = 200;
export const SEQS = ["alternating", "random"] as const;

/** Losses of two experts: either the adversarial alternating sequence or independent coin flips with means 0.4 and 0.6. */
function losses(kind: string) {
  const r = rand(5);
  return Array.from({ length: T }, (_, t) =>
    kind === "alternating" ? (t === 0 ? [0.5, 0] : t % 2 ? [0, 1] : [1, 0]) : [r() < 0.4 ? 1 : 0, r() < 0.6 ? 1 : 0]);
}

/** Regret after each round of follow the leader, and of follow the perturbed leader (noise of scale √T, averaged over 20 runs). */
export function regrets(kind: string) {
  const L = losses(kind);
  const run = (noise: () => number) => {
    const cum = [0, 0], alg: number[] = [];
    let a = 0;
    for (const row of L) {
      const p = [cum[0] + noise(), cum[1] + noise()];
      a += row[p[0] <= p[1] ? 0 : 1];
      cum[0] += row[0]; cum[1] += row[1];
      alg.push(a - Math.min(cum[0], cum[1]));
    }
    return alg;
  };
  const ftl = run(() => 0);
  const fpl = new Array(T).fill(0);
  for (let s = 0; s < 20; s++) {
    const r = rand(40 + s);
    run(() => r() * Math.sqrt(T)).forEach((v, t) => (fpl[t] += v / 20));
  }
  return { ftl, fpl };
}

export function FtlRegretViz() {
  const [si, setSi] = useState(0);
  const g = useMemo(() => regrets(SEQS[si]), [si]);
  const W = 330, H = 160, X0 = 26, PW = 290, Y0 = 8, PH = 136, YH = 110;
  const sx = (t: number) => X0 + (t / T) * PW, sy = (y: number) => Y0 + PH - (Math.max(-5, Math.min(YH, y)) / YH) * PH;
  const line = (ys: number[]) => ys.map((y, t) => `${t ? "L" : "M"}${sx(t + 1).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");
  const guide = (h: (t: number) => number) => line(Array.from({ length: T }, (_, t) => h(t + 1)));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">loss sequence</span>
        <div className="segmented" role="group" aria-label="Loss sequence">
          {SEQS.map((s, i) => <button key={s} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{s}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Regret of follow the leader and of follow the perturbed leader over 200 rounds">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        {[0, 50, 100].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <text x={X0 + PW} y={H - 2} textAnchor="end" className="viz-label">round t</text>
        <path d={guide((t) => t / 2)} fill="none" stroke="var(--text)" strokeWidth={1} strokeDasharray="4 3" />
        <path d={guide((t) => Math.sqrt(t))} fill="none" stroke="var(--text)" strokeWidth={1} strokeDasharray="1 3" />
        <path d={line(g.ftl)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path d={line(g.fpl)} fill="none" stroke="var(--code-function)" strokeWidth={2} />
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--accent)" }}>━</span> follow the leader</span>
        <span><span style={{ color: "var(--code-function)" }}>━</span> perturbed leader (mean of 20)</span>
        <span>┅ t/2</span>
        <span>┈ √t</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        regret after {T} rounds: follow the leader {g.ftl[T - 1].toFixed(1)}, perturbed leader {g.fpl[T - 1].toFixed(1)}
      </div>
      <figcaption className="viz-caption">
        Two experts, 200 rounds. On the alternating sequence the leader switches every round just before it loses, so follow
        the leader pays 1 a round while each expert pays about a half: its regret is exactly 100, growing like t/2. Adding
        random noise of size √T to the running totals makes the choice hard to exploit, and the average regret is 9.1, below
        √t. When the losses are random coin flips the leader settles on the better expert and its regret is only 1.0.
      </figcaption>
    </figure>
  );
}
