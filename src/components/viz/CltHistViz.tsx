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
type Dist = "unif" | "exp" | "coin";
const DRAW: Record<Dist, (r: () => number) => number> = {
  unif: (r) => r(),
  exp: (r) => -Math.log(1 - r()),
  coin: (r) => (r() < 0.1 ? 1 : 0),
};
const MOM: Record<Dist, [number, number]> = { unif: [0.5, Math.sqrt(1 / 12)], exp: [1, 1], coin: [0.1, 0.3] };
const REPS = 4000, BINS = 40, LO = -4, HI = 4;

/** Histogram of standardised sums of n draws against the standard normal density. */
export function CltHistViz() {
  const [dist, setDist] = useState<Dist>("exp");
  const [n, setN] = useState(1);
  const hist = useMemo(() => {
    const r = makeRng(17 + n * 13 + (dist === "unif" ? 0 : dist === "exp" ? 1 : 2));
    const [mu, sd] = MOM[dist];
    const counts = new Array(BINS).fill(0);
    let below = 0;
    for (let k = 0; k < REPS; k++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += DRAW[dist](r);
      const z = (s - n * mu) / (sd * Math.sqrt(n));
      if (z <= 0) below += 1;
      const b = Math.floor(((z - LO) / (HI - LO)) * BINS);
      if (b >= 0 && b < BINS) counts[b] += 1;
    }
    return { counts, below: below / REPS };
  }, [dist, n]);
  const width = (HI - LO) / BINS;
  const dens = hist.counts.map((c) => c / (REPS * width));
  const top = Math.max(0.6, ...dens);
  const W = 320, H = 180;
  const X = (z: number) => 10 + ((z - LO) / (HI - LO)) * (W - 20);
  const Y = (d: number) => H - 18 - (d / top) * (H - 28);
  const curve: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const z = LO + ((HI - LO) * i) / 120;
    curve.push(`${X(z).toFixed(1)},${Y(Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)).toFixed(1)}`);
  }
  const pick = (d: Dist, label: string) => (
    <button type="button" className="seg" aria-pressed={dist === d} onClick={() => setDist(d)}>{label}</button>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {pick("unif", "uniform")}
        {pick("exp", "exponential")}
        {pick("coin", "coin, p = 0.1")}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          n = {n}
          <input type="range" min={1} max={100} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="number of draws summed" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of standardised sums with the normal density">
        <line x1={10} x2={W - 10} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        {dens.map((d, b) => (
          <rect key={b} x={X(LO + b * width) + 0.5} y={Y(Math.min(d, top))} width={X(LO + width) - X(LO) - 1} height={Y(0) - Y(Math.min(d, top))} fill="var(--accent)" opacity={0.45} />
        ))}
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={curve.join(" ")} />
        {[-3, -2, -1, 0, 1, 2, 3].map((z) => <text key={z} x={X(z)} y={H - 4} textAnchor="middle" className="viz-label">{z}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        fraction of standardised sums ≤ 0: {hist.below.toFixed(3)} (normal: 0.500)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each bar counts {REPS} standardised sums (S − nμ)/(σ√n) of n draws; the curve is the standard normal density. Skewed
        draws give a skewed histogram for small n, and the skew fades like 1/√n. The rare-event coin stays lumpy longest,
        because its sums take few values until n is large.
      </figcaption>
    </figure>
  );
}
