"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const T = 600, N = 4;
const MEANS = [[0.5, 0.4, 0.45, 0.6], [0.5, 0.6, 0.45, 0.3]];
export const ETAS = [0.01, Math.sqrt((8 * Math.log(N)) / T), 1];

/** Hedge on four experts with 0/1 losses; the best expert changes at round 300. Returns weights per round, regret and the losses. */
export function hedgeRun(eta: number) {
  const r = rand(17);
  const L = Array.from({ length: T }, (_, t) => MEANS[t < T / 2 ? 0 : 1].map((m) => (r() < m ? 1 : 0)));
  const cum = new Array(N).fill(0), W: number[][] = [];
  let paid = 0;
  for (const row of L) {
    const lo = Math.min(...cum), w = cum.map((c) => Math.exp(-eta * (c - lo))), s = w.reduce((a, b) => a + b, 0);
    const p = w.map((v) => v / s);
    W.push(p);
    paid += p.reduce((a, v, i) => a + v * row[i], 0);
    row.forEach((l, i) => (cum[i] += l));
  }
  return { W, regret: paid - Math.min(...cum), best: cum.indexOf(Math.min(...cum)), cum };
}

const COLS = ["var(--text)", "var(--code-function)", "var(--text)", "var(--accent)"];

export function HedgeWeightsViz() {
  const [ei, setEi] = useState(1);
  const runs = useMemo(() => ETAS.map(hedgeRun), []);
  const e = runs[ei];
  const W = 330, H = 140, X0 = 26, PW = 290, Y0 = 8, PH = 114;
  const sx = (t: number) => X0 + (t / T) * PW, sy = (y: number) => Y0 + PH - y * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">learning rate η</span>
        <div className="segmented" role="group" aria-label="Learning rate">
          {ETAS.map((v, i) => <button key={i} type="button" className="seg" aria-pressed={ei === i} onClick={() => setEi(i)}>{i === 1 ? "tuned " + v.toFixed(3) : v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Hedge weights on four experts over 600 rounds">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={sx(T / 2)} x2={sx(T / 2)} y1={Y0} y2={Y0 + PH} stroke="var(--border)" strokeDasharray="2 3" />
        {[0, 0.5, 1].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <text x={X0 + PW} y={H - 1} textAnchor="end" className="viz-label">round t</text>
        {Array.from({ length: N }, (_, i) => (
          <path key={i} d={e.W.map((p, t) => `${t ? "L" : "M"}${sx(t + 1).toFixed(1)},${sy(p[i]).toFixed(1)}`).join(" ")} fill="none" stroke={COLS[i]} strokeWidth={i === 3 ? 2.2 : 1.5} strokeDasharray={i === 0 ? "4 3" : i === 2 ? "1 2" : undefined} />
        ))}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span>┅ expert 1</span>
        <span><span style={{ color: "var(--code-function)" }}>━</span> expert 2</span>
        <span>┈ expert 3</span>
        <span><span style={{ color: "var(--accent)" }}>━</span> expert 4</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        regret after {T} rounds for η = 0.01, tuned, 1: {runs.map((r) => r.regret.toFixed(1)).join(", ")}
      </div>
      <figcaption className="viz-caption">
        Hedge&apos;s weights on four experts whose 0/1 losses are random; expert 2 has the lowest mean loss for the first 300
        rounds and expert 4 afterwards, and expert 4 is best overall. With η = 0.01 the weights barely leave ¼ and the regret is 15.0. The tuned
        rate √(8 ln 4 / 600) first backs expert 3, which happens to lead early, then expert 2,
        and after the change moves to expert 4, with regret 10.5, well inside its guarantee of 20.4 for
        every sequence. η = 1 is almost follow the leader and does best here, 6.0, only because these losses are not chosen
        against it; the alternating sequence of the previous lesson would make its regret grow linearly.
      </figcaption>
    </figure>
  );
}
