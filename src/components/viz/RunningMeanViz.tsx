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
type Dist = "coin" | "exp" | "cauchy";
const N = 3000, PATHS = 6;
const DRAW: Record<Dist, (r: () => number) => number> = {
  coin: (r) => (r() < 0.5 ? 1 : 0),
  exp: (r) => -Math.log(1 - r()),
  cauchy: (r) => Math.tan(Math.PI * (r() - 0.5)),
};
const MU: Record<Dist, number> = { coin: 0.5, exp: 1, cauchy: 0 };
const IDX: number[] = [];
for (let i = 1; i <= N; i += i < 30 ? 1 : 10) IDX.push(i);
if (IDX[IDX.length - 1] !== N) IDX.push(N);
const HUES = ["var(--accent)", "var(--danger)", "var(--text)", "var(--text-muted)", "var(--accent)", "var(--danger)"];

/** Running sample means of several independent sequences on a log scale: they funnel into the mean, except for the Cauchy distribution, which has none. */
export function RunningMeanViz() {
  const [dist, setDist] = useState<Dist>("coin");
  const [seed, setSeed] = useState(1);
  const paths = useMemo(() => {
    const out: number[][] = [];
    for (let p = 0; p < PATHS; p++) {
      const r = makeRng(seed * 101 + p * 7919 + (dist === "coin" ? 0 : dist === "exp" ? 1 : 2));
      let s = 0;
      const m: number[] = [];
      for (let i = 1; i <= N; i++) { s += DRAW[dist](r); m.push(s / i); }
      out.push(m);
    }
    return out;
  }, [dist, seed]);
  const mu = MU[dist], span = dist === "coin" ? 0.5 : 1.5;
  const W = 320, H = 200, L = 34;
  const X = (i: number) => L + (Math.log10(i) / Math.log10(N)) * (W - L - 8);
  const Y = (v: number) => H / 2 - 14 - ((Math.max(mu - span, Math.min(mu + span, v)) - mu) / span) * (H / 2 - 24);
  const eps = span / 10;
  const ticks = [1, 10, 100, 1000];
  const pick = (d: Dist, label: string) => (
    <button type="button" className="seg" aria-pressed={dist === d} onClick={() => setDist(d)}>{label}</button>
  );
  const finals = paths.map((m) => m[N - 1]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {pick("coin", "fair coin")}
        {pick("exp", "exponential")}
        {pick("cauchy", "Cauchy")}
        <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>new paths</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Running means of six sequences against n on a log scale">
        <rect x={L} y={Y(mu + eps)} width={W - L - 8} height={Y(mu - eps) - Y(mu + eps)} fill="var(--accent-soft)" />
        <line x1={L} x2={W - 8} y1={Y(mu)} y2={Y(mu)} stroke="var(--border)" />
        <text x={L - 4} y={Y(mu) + 4} textAnchor="end" className="viz-label">{mu}</text>
        <text x={L - 4} y={Y(mu + span) + 4} textAnchor="end" className="viz-label">{mu + span}</text>
        <text x={L - 4} y={Y(mu - span) + 4} textAnchor="end" className="viz-label">{mu - span}</text>
        {ticks.map((t) => <text key={t} x={X(t)} y={H - 4} textAnchor="middle" className="viz-label">n={t}</text>)}
        {paths.map((m, p) => (
          <polyline key={p} fill="none" stroke={HUES[p]} strokeWidth={1.2} opacity={0.8}
            points={IDX.map((i) => `${X(i).toFixed(1)},${Y(m[i - 1]).toFixed(1)}`).join(" ")} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        means at n = {N}: {finals.map((v) => (Math.abs(v) < 0.0005 ? 0 : v).toFixed(3)).join(", ")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {dist === "cauchy"
          ? "The Cauchy distribution has no mean. Its running averages never settle: a single huge draw can throw a path far away at any n, and the average of n Cauchy draws has the same Cauchy distribution as one draw."
          : `Each line is the running average of one sequence of draws. The shaded band is the mean ± ${eps.toFixed(2)}. Chebyshev's inequality bounds the chance a path is outside the band at n by σ²/(nε²), and every path eventually enters it and stays.`}
      </figcaption>
    </figure>
  );
}
