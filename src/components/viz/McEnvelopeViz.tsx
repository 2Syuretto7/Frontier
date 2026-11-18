"use client";

import { useEffect, useState } from "react";
import { makeRng } from "./ml";

const RUNS = 30, N = 2000, TRUTH = Math.E - 1, SD = Math.sqrt((Math.E ** 2 - 1) / 2 - TRUTH ** 2);
const SD_ANTI = 0.0626;

export function paths(seed: number, anti: boolean) {
  const r = makeRng(seed);
  return Array.from({ length: RUNS }, () => {
    let s = 0;
    const out: number[] = [];
    for (let i = 1; i <= N; i++) {
      const u = r();
      s += anti ? (Math.exp(u) + Math.exp(1 - u)) / 2 : Math.exp(u);
      out.push(s / i);
    }
    return out;
  });
}

/** Thirty independent Monte Carlo estimates of the integral of e^x on [0, 1], with the 1/√n envelope. */
export function McEnvelopeViz() {
  const [anti, setAnti] = useState(false);
  const [seed, setSeed] = useState(1);
  const [ps, setPs] = useState<number[][]>([]);
  useEffect(() => setPs(paths(seed, anti)), [seed, anti]);
  const W = 330, H = 190, X0 = 40, PW = W - 50, PH = 160, R = 0.25;
  const lx = (i: number) => X0 + (Math.log(i) / Math.log(N)) * PW;
  const sy = (v: number) => 10 + ((R - (v - TRUTH)) / (2 * R)) * PH;
  const sd = anti ? SD_ANTI : SD;
  const ticks = [1, 10, 100, 1000];
  const idx = Array.from({ length: 120 }, (_, k) => Math.max(1, Math.round(Math.exp((k / 119) * Math.log(N)))));
  const final = ps.map((p) => p[N - 1]);
  const spread = final.length ? Math.sqrt(final.reduce((a, v) => a + (v - TRUTH) ** 2, 0) / final.length) : 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={!anti} onClick={() => setAnti(false)}>plain</button>
        <button type="button" className="seg" aria-pressed={anti} onClick={() => setAnti(true)}>antithetic</button>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new runs</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 16}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Running Monte Carlo estimates against the number of samples on a log scale, inside a shrinking envelope">
        <polygon fill="var(--accent)" opacity={0.12}
          points={[...idx.map((i) => `${lx(i)},${sy(TRUTH + Math.min(R, 1.96 * sd / Math.sqrt(i)))}`), ...idx.slice().reverse().map((i) => `${lx(i)},${sy(TRUTH - Math.min(R, 1.96 * sd / Math.sqrt(i)))}`)].join(" ")} />
        <line x1={X0} y1={sy(TRUTH)} x2={X0 + PW} y2={sy(TRUTH)} stroke="var(--danger)" />
        {ps.map((p, j) => (
          <polyline key={j} fill="none" stroke="var(--text-muted)" strokeWidth={0.8} opacity={0.6}
            points={idx.map((i) => `${lx(i)},${Math.max(10, Math.min(10 + PH, sy(p[i - 1])))}`).join(" ")} />
        ))}
        {ticks.map((t) => <text key={t} x={lx(t)} y={H + 12} textAnchor="middle" className="viz-label">{t}</text>)}
        <text x={X0 - 4} y={sy(TRUTH) + 4} textAnchor="end" className="viz-label">e − 1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {ps.length ? `after ${N} samples: RMS error ${spread.toFixed(4)}; theory ${(sd / Math.sqrt(N)).toFixed(4)}` : "sampling"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each grey line is one run of the sample mean of e^U, U uniform, as the samples accumulate. The shaded band is the
        truth ± 1.96 σ/√n: every tenfold increase in n narrows it only by √10 ≈ 3.2. Antithetic pairs U and 1 − U have the
        same mean but, because e^x is monotone, negatively correlated values, so their average has much smaller σ.
      </figcaption>
    </figure>
  );
}
