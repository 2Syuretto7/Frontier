"use client";

import { useMemo, useState } from "react";

const D = 20, TMAX = 1000, FRAC = 0.2;
const H = Array.from({ length: D }, (_, i) => 10 ** (-3 + (3 * i) / (D - 1)));
const LENGTHS = [250, 500, 1000];

function run(sigma2: number, lrs: number[]) {
  let m = H.map(() => 1);
  return lrs.map((eta) => {
    m = m.map((v, i) => (1 - eta * H[i]) ** 2 * v + eta * eta * sigma2);
    return 0.5 * m.reduce((s, v, i) => s + H[i] * v, 0);
  });
}

/** Expected loss on a noisy quadratic: a constant-rate run, linear-decay branches of it ending at each length, and cosine runs of each length. */
export function wsdRuns(sigma2: number) {
  const stable = run(sigma2, Array.from({ length: TMAX }, () => 1));
  const branches = LENGTHS.map((T) => {
    const K = Math.round(FRAC * T);
    return run(sigma2, Array.from({ length: T }, (_, t) => (t < T - K ? 1 : (T - t) / K)));
  });
  const cosines = LENGTHS.map((T) => run(sigma2, Array.from({ length: T }, (_, t) => 0.5 * (1 + Math.cos((Math.PI * t) / T))))[T - 1]);
  return { stable, branches, cosines };
}

export function WsdBranchViz() {
  const [sigma2, setSigma2] = useState(0.001);
  const r = useMemo(() => wsdRuns(sigma2), [sigma2]);
  const W = 300, HT = 160, X0 = 34, PW = W - 42, PH = 136;
  const sx = (t: number) => X0 + (t / TMAX) * PW;
  const sy = (f: number) => 8 + ((0 - Math.max(-4, Math.min(0, Math.log10(f)))) / 4) * PH;
  const line = (a: number[], from = 0) => a.map((f, t) => [t, f] as const).filter(([t]) => t >= from && t % 4 === 3).map(([t, f]) => `${sx(t + 1)},${sy(f)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">gradient noise σ²</span>
        {[0.0003, 0.001, 0.003].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={sigma2 === v} onClick={() => setSigma2(v)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${HT + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="A constant-rate run with decay branches and cosine endpoints">
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.5} points={line(r.stable)} />
        {r.branches.map((b, k) => (
          <g key={k}>
            <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(b, Math.round(LENGTHS[k] * (1 - FRAC)) - 4)} />
            <circle cx={sx(LENGTHS[k])} cy={sy(b[LENGTHS[k] - 1])} r={3.5} fill="var(--accent)" />
            <circle cx={sx(LENGTHS[k])} cy={sy(r.cosines[k])} r={3.5} fill="none" stroke="var(--danger)" strokeWidth={2} />
          </g>
        ))}
        {[0, 250, 500, 750, 1000].map((t) => (
          <text key={t} x={sx(t)} y={HT + 12} textAnchor="middle" className="viz-label">{t}</text>
        ))}
        {[1, 0.01, 0.0001].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {LENGTHS.map((T, k) => `${T}: WSD ${r.branches[k][T - 1].toFixed(4)} / cosine ${r.cosines[k].toFixed(4)}`).join("; ")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Expected loss of noisy SGD on a quadratic with curvatures from 0.001 to 1. Grey: one run at the constant rate 1.
        Blue: branches that leave it at 80% of a target length and decay linearly to zero, giving finished models at 250,
        500 and 1000 steps from 1150 steps of work. Red rings: separate cosine runs of each length, 1750 steps in all. The
        decay removes the noise floor within a few hundred steps. With little noise the branches match or beat cosine;
        with more noise, cosine&apos;s longer annealing wins, first at the longer lengths and then at all of them.
      </figcaption>
    </figure>
  );
}
