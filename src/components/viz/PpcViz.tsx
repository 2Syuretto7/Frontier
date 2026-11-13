"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 100, REPS = 1000;
type Stat = "mean" | "zeros" | "dispersion";
const STATS: Record<Stat, (c: number[]) => number> = {
  mean: (c) => c.reduce((a, b) => a + b, 0) / c.length,
  zeros: (c) => c.filter((v) => v === 0).length / c.length,
  dispersion: (c) => { const m = c.reduce((a, b) => a + b, 0) / c.length; return c.reduce((a, v) => a + (v - m) * (v - m), 0) / c.length / Math.max(m, 1e-9); },
};

/** A posterior predictive check of a Poisson model: a statistic of the observed counts against the same statistic on data sets replicated from the posterior predictive. */
export function PpcViz() {
  const [over, setOver] = useState(true);
  const [stat, setStat] = useState<Stat>("dispersion");
  const { data, reps } = useMemo(() => {
    const r = makeRng(over ? 101 : 202);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const pois = (lam: number) => { const L = Math.exp(-lam); let k = 0, p = r(); while (p > L) { k++; p *= r(); } return k; };
    const gamma = (shape: number) => {
      const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
      for (;;) {
        const x = normal(), v = Math.pow(1 + c * x, 3);
        if (v > 0 && Math.log(Math.max(r(), 1e-300)) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v;
      }
    };
    const data = Array.from({ length: N }, () => (over ? pois(-2 * Math.log(Math.max(r(), 1e-12))) : pois(2)));
    const sum = data.reduce((a, b) => a + b, 0);
    const reps = Array.from({ length: REPS }, () => {
      const lam = gamma(1 + sum) / (0.01 + N);
      return Array.from({ length: N }, () => pois(lam));
    });
    return { data, reps };
  }, [over]);
  const f = STATS[stat];
  const tObs = f(data);
  const tRep = reps.map(f);
  const lo = Math.min(...tRep, tObs), hi = Math.max(...tRep, tObs);
  const span = Math.max(hi - lo, 1e-6);
  const nb = 30, bw = span / nb;
  const counts = Array(nb).fill(0);
  tRep.forEach((v) => { counts[Math.min(nb - 1, Math.floor((v - lo) / bw))]++; });
  const cmax = Math.max(...counts, 1);
  const pval = tRep.filter((v) => v >= tObs).length / REPS;
  const W = 330, H = 140;
  const X = (v: number) => 14 + ((v - lo) / span) * (W - 28);
  const Y = (c: number) => H - 16 - (c / cmax) * (H - 28);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={!over} onClick={() => setOver(false)}>Poisson data</button>
        <button type="button" className="seg" aria-pressed={over} onClick={() => setOver(true)}>overdispersed data</button>
        {(Object.keys(STATS) as Stat[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={stat === k} onClick={() => setStat(k)}>{k}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Replicated statistics with the observed value">
        {counts.map((c, i) => (
          <rect key={i} x={X(lo + i * bw)} y={Y(c)} width={Math.max(X(lo + (i + 1) * bw) - X(lo + i * bw) - 0.5, 0.5)} height={Y(0) - Y(c)} fill="var(--accent)" opacity={0.45} />
        ))}
        <line x1={14} x2={W - 14} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(tObs)} x2={X(tObs)} y1={8} y2={Y(0)} stroke="var(--danger)" strokeWidth={1.8} />
        <text x={14} y={H - 2} className="viz-label">{lo.toFixed(2)}</text>
        <text x={W - 14} y={H - 2} textAnchor="end" className="viz-label">{hi.toFixed(2)}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        observed {stat} {tObs.toFixed(3)}; posterior predictive p = {pval.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A Poisson model with a vague gamma prior is fitted to {N} counts. Each bar collects the chosen statistic computed
        on {REPS} data sets simulated from the posterior predictive; the danger line is the observed value. The mean is
        always reproduced, since the model was fitted to it. With overdispersed data, the dispersion (variance over mean)
        and the fraction of zeros fall far outside the replicated range: the check exposes the misfit.
      </figcaption>
    </figure>
  );
}
