"use client";

import { useState } from "react";

const H = 4, P = 0.3;

/** Exact total variance of the REINFORCE gradient over a 4-step task (reward a + c at every step, a ~ Bernoulli(0.3), one parameter per step) for a baseline b(t). */
export function gradVariance(c: number, base: (t: number) => number) {
  let total = 0;
  for (let t = 0; t < H; t++) {
    let m = 0, s2 = 0;
    for (let k = 0; k < 1 << H; k++) {
      const a = Array.from({ length: H }, (_, i) => (k >> i) & 1);
      const pr = a.reduce((x, ai) => x * (ai ? P : 1 - P), 1);
      const G = a.slice(t).reduce((x, y) => x + y, 0) + c * (H - t), g = (G - base(t)) * (a[t] - P);
      m += pr * g;
      s2 += pr * g * g;
    }
    total += s2 - m * m;
  }
  return total;
}

/** The constant baseline with the smallest total variance: sum_t E[G_t s_t^2] / sum_t E[s_t^2]. */
export function bestConstant(c: number) {
  let num = 0, den = 0;
  for (let t = 0; t < H; t++) {
    for (let k = 0; k < 1 << H; k++) {
      const a = Array.from({ length: H }, (_, i) => (k >> i) & 1);
      const pr = a.reduce((x, ai) => x * (ai ? P : 1 - P), 1), s2 = (a[t] - P) ** 2;
      num += pr * s2 * (a.slice(t).reduce((x, y) => x + y, 0) + c * (H - t));
      den += pr * s2;
    }
  }
  return num / den;
}

export function AdvantageVarianceViz() {
  const [ci, setCi] = useState(12);
  const c = (ci - 8) / 2;
  const bc = bestConstant(c);
  const vals = [gradVariance(c, () => 0), gradVariance(c, () => bc), gradVariance(c, (t) => (H - t) * (P + c))];
  const names = ["none", "best constant", "state value"], cols = ["var(--danger)", "var(--text-muted)", "var(--accent)"];
  const W = 330, H2 = 170, X0 = 40, Y0 = 10, PW = W - 50, PH = H2 - Y0 - 30, LO = -1, HI = 3;
  const sy = (v: number) => Y0 + PH - ((Math.min(HI, Math.max(LO, Math.log10(v))) - LO) / (HI - LO)) * PH;
  const bw = PW / 3;
  const fmt = (v: number) => (v < 10 ? v.toFixed(2) : v.toFixed(1));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="adv-c">reward offset c = {c >= 0 ? c.toFixed(1) : `−${(-c).toFixed(1)}`}</label>
        <input id="adv-c" type="range" min={0} max={16} step={1} value={ci} onChange={(e) => setCi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H2}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Variance of the gradient estimate for three baselines on a logarithmic scale">
        {[-1, 0, 1, 2, 3].map((e) => (
          <g key={e}>
            <line x1={X0} x2={X0 + PW} y1={sy(10 ** e)} y2={sy(10 ** e)} stroke="var(--border)" strokeDasharray={e === LO ? undefined : "2 4"} />
            <text x={X0 - 4} y={sy(10 ** e) + 4} textAnchor="end" className="viz-label">{["0.1", "1", "10", "100", "1000"][e + 1]}</text>
          </g>
        ))}
        {vals.map((v, i) => (
          <g key={i}>
            <rect x={X0 + i * bw + 14} y={sy(v)} width={bw - 28} height={Y0 + PH - sy(v)} fill={cols[i]} />
            <text x={X0 + i * bw + bw / 2} y={sy(v) - 4} textAnchor="middle" className="viz-label">{fmt(v)}</text>
            <text x={X0 + i * bw + bw / 2} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{names[i]}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`best constant baseline ${bc < 0 ? "−" : ""}${Math.abs(bc).toFixed(2)}; expected gradient 0.21 per step in every case`}
      </div>
      <figcaption className="viz-caption">
        A four-step task: at each step the policy takes action 1 with probability 0.3 and the reward is 1 for action 1 and 0
        otherwise, plus a constant c. Adding c changes no decision, and the expected gradient stays the same, but without a
        baseline the variance of the REINFORCE estimate (summed over the four parameters, computed exactly) grows from 1.47 at
        c = 0 to 124 at c = 4. The best single constant cannot follow returns that shrink as the episode runs out, while the
        state value <em>v(t)</em> subtracts exactly the part that c adds, so its variance stays at 0.40 for every c. At c = 0
        the best constant gives 0.36, slightly lower: the value is a good baseline, not the optimal one.
      </figcaption>
    </figure>
  );
}
