"use client";

import { useState } from "react";

const N = 50, GAMMA = 0.99, SIGMA = 0.2, ERRS = [0.25, 0.5, 1, 2];

/** Expected squared bias and variance of the GAE estimate at the first state of a 50-step chain: reward noise SIGMA per step,
 *  value errors independent with standard deviation s at every later state and none at the first. */
export function gaeError(lam: number, s: number) {
  let bias = 0, vari = 0;
  for (let m = 1; m < N; m++) bias += (GAMMA ** m * lam ** (m - 1) * (1 - lam)) ** 2;
  for (let l = 0; l < N; l++) vari += (GAMMA * lam) ** (2 * l);
  return { bias: s * s * bias, vari: SIGMA * SIGMA * vari };
}

export function bestLambda(s: number) {
  let best = 0, err = Infinity;
  for (let i = 0; i <= 100; i++) {
    const { bias, vari } = gaeError(i / 100, s);
    if (bias + vari < err) { err = bias + vari; best = i / 100; }
  }
  return best;
}

export function GaeTradeoffViz() {
  const [si, setSi] = useState(2);
  const [li, setLi] = useState(10);
  const s = ERRS[si], lam = li / 20;
  const W = 330, H = 170, X0 = 34, Y0 = 8, PW = W - 44, PH = H - Y0 - 30, YMAX = 2;
  const sx = (l: number) => X0 + l * PW, sy = (v: number) => Y0 + PH - (Math.min(v, YMAX) / YMAX) * PH;
  const grid = Array.from({ length: 101 }, (_, i) => i / 100).map((l) => ({ l, ...gaeError(l, s) }));
  const line = (f: (g: { bias: number; vari: number }) => number) => grid.map((g, i) => `${i ? "L" : "M"}${sx(g.l).toFixed(1)},${sy(f(g)).toFixed(1)}`).join(" ");
  const cur = gaeError(lam, s);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">value error</span>
        <div className="segmented" role="group" aria-label="Standard deviation of the value errors">
          {ERRS.map((e, i) => <button key={e} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{e}</button>)}
        </div>
        <label className="viz-label" htmlFor="gae-l">λ = {lam.toFixed(2)}</label>
        <input id="gae-l" type="range" min={0} max={20} step={1} value={li} onChange={(e) => setLi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Squared bias, variance and their sum against lambda">
        {[0, 1, 2].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={sy(v)} y2={sy(v)} stroke="var(--border)" strokeDasharray={v ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        <path d={line((g) => g.bias)} fill="none" stroke="var(--danger)" strokeWidth={1.4} />
        <path d={line((g) => g.vari)} fill="none" stroke="var(--success)" strokeWidth={1.4} />
        <path d={line((g) => g.bias + g.vari)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <line x1={sx(lam)} x2={sx(lam)} y1={Y0} y2={Y0 + PH} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {[0, 0.5, 1].map((l) => <text key={l} x={sx(l)} y={Y0 + PH + 14} textAnchor={l === 1 ? "end" : l === 0 ? "start" : "middle"} className="viz-label">{l}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">λ</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`squared bias ${cur.bias.toFixed(3)} + variance ${cur.vari.toFixed(3)} = ${(cur.bias + cur.vari).toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        The error of the GAE estimate of an advantage at the start of a 50-step chain with γ = 0.99. Each reward carries noise
        with standard deviation 0.2, and the value estimates at later states are off by independent errors with the chosen
        standard deviation. Red is the expected squared bias, green the variance, blue their sum. Small λ trusts the value
        estimates and inherits their errors; λ = 1 ignores them and collects the noise of every reward. With value errors
        of 1 the sum is smallest at λ = 0.83, where it is 0.21, against 1.02 at λ = 0 and 1.27 at λ = 1. A better critic
        moves the best λ down (0.46 for errors of 0.25) and a worse one moves it up (0.91 for errors of 2).
      </figcaption>
    </figure>
  );
}
