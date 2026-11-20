"use client";

import { useMemo, useState } from "react";
import { NS, rand, rms, walkEpisode } from "./RandomWalkMcViz";

const LAMBDAS = [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1], STEPS = 10, ALPHA = 0.1, EPISODES = 10, RUNS = 200;

/** Weights of the 1- to STEPS-step returns in the lambda-return of an episode with STEPS steps left (the last is the full return). */
export const weights = (lam: number) => Array.from({ length: STEPS }, (_, i) => (i < STEPS - 1 ? (1 - lam) * lam ** i : lam ** (STEPS - 1)));

/** Average RMS error on the random walk after EPISODES episodes of online TD(lambda) with accumulating traces. */
export function errorByLambda() {
  return LAMBDAS.map((lam) => {
    let total = 0;
    for (let run = 0; run < RUNS; run++) {
      const r = rand(run * 97 + 3), v = new Array(NS).fill(0.5);
      for (let k = 0; k < EPISODES; k++) {
        const { states, reward } = walkEpisode(r), e = new Array(NS).fill(0);
        states.forEach((s, i) => {
          const last = i === states.length - 1, delta = (last ? reward : 0) + (last ? 0 : v[states[i + 1] - 1]) - v[s - 1];
          for (let j = 0; j < NS; j++) e[j] *= lam;
          e[s - 1] += 1;
          for (let j = 0; j < NS; j++) v[j] += ALPHA * delta * e[j];
        });
      }
      total += rms(v) / RUNS;
    }
    return total;
  });
}

export function LambdaReturnViz() {
  const [li, setLi] = useState(3);
  const lam = LAMBDAS[li], w = weights(lam);
  const err = useMemo(() => errorByLambda(), []);
  const W = 330, H = 130, X0 = 30, Y0 = 8, PW = W - 40, PH = H - Y0 - 30, bw = PW / STEPS;
  const sy = (x: number) => Y0 + PH - x * PH;
  const H2 = 130, PH2 = H2 - Y0 - 30, EMIN = Math.min(...err) * 0.9, EMAX = Math.max(...err) * 1.05;
  const sx2 = (l: number) => X0 + l * PW;
  const sy2 = (x: number) => Y0 + PH2 - ((x - EMIN) / (EMAX - EMIN)) * PH2;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="lam">λ = {lam}</label>
        <input id="lam" type="range" min={0} max={LAMBDAS.length - 1} step={1} value={li} onChange={(e) => setLi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Weights of the n-step returns in the lambda-return">
        {w.map((x, i) => <rect key={i} x={X0 + i * bw + 2} y={sy(x)} width={bw - 4} height={Y0 + PH - sy(x)} fill={i === STEPS - 1 ? "var(--danger)" : "var(--accent)"} />)}
        {w.map((_, i) => <text key={i} x={X0 + (i + 0.5) * bw} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{i + 1}</text>)}
        {[0, 0.5, 1].map((y) => <text key={y} x={X0 - 4} y={sy(y) + 4} textAnchor="end" className="viz-label">{y}</text>)}
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">weight of the n-step return (10 steps left)</text>
      </svg>
      <svg viewBox={`0 0 ${W} ${H2}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "8px auto 0" }} role="img" aria-label="Error after ten episodes against lambda">
        <path d={err.map((x, i) => `${i ? "L" : "M"}${sx2(LAMBDAS[i]).toFixed(1)},${sy2(x).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
        {err.map((x, i) => <circle key={i} cx={sx2(LAMBDAS[i])} cy={sy2(x)} r={i === li ? 5 : 3} fill={i === li ? "var(--danger)" : "var(--accent)"} />)}
        {[0, 0.5, 1].map((l) => <text key={l} x={sx2(l)} y={Y0 + PH2 + 14} textAnchor={l === 1 ? "end" : "middle"} className="viz-label">{l}</text>)}
        {[0.1, 0.15].filter((y) => y > EMIN && y < EMAX).map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={sy2(y)} y2={sy2(y)} stroke="var(--border)" strokeDasharray="2 4" />
            <text x={X0 - 4} y={sy2(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH2} y2={Y0 + PH2} stroke="var(--border)" />
        <text x={X0 + PW / 2} y={H2 - 3} textAnchor="middle" className="viz-label">λ (error after 10 episodes)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`λ = ${lam}: weight on the full return ${w[STEPS - 1].toFixed(3)}; error after ${EPISODES} episodes ${err[li].toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        Top: the λ-return gives the n-step return weight (1 − λ)λⁿ⁻¹ and puts all the remaining weight (red) on the full Monte Carlo
        return. λ = 0 is the one-step TD target and λ = 1 the Monte Carlo return. Bottom: root mean square error on the random
        walk after 10 episodes of online TD(λ) with α = 0.1, averaged over 200 runs. Intermediate values of λ do best, here 0.6: they
        pass each reward back along the episode faster than TD(0) but with less noise than Monte Carlo.
      </figcaption>
    </figure>
  );
}
