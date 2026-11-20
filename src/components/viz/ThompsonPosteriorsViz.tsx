"use client";

import { useMemo, useState } from "react";

const PROBS = [0.6, 0.5, 0.3], STOPS = [0, 5, 20, 50, 100, 300, 1000, 3000], COLORS = ["var(--accent)", "var(--danger)", "var(--success)"];

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gamma(shape: number, r: () => number): number {
  if (shape < 1) return gamma(shape + 1, r) * Math.pow(1 - r(), 1 / shape);
  const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    const z = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()), v = (1 + c * z) ** 3;
    if (v > 0 && Math.log(1 - r()) < 0.5 * z * z + d - d * v + d * Math.log(v)) return d * v;
  }
}

function logGamma(x: number): number {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, s = 1.000000000190015;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  for (const c of g) s += c / ++y;
  return -tmp + Math.log((2.5066282746310005 * s) / x);
}

export const betaPdf = (x: number, a: number, b: number) =>
  Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) + logGamma(a + b) - logGamma(a) - logGamma(b));

/** One run of Beta-Bernoulli Thompson sampling; returns wins and losses per arm after each round in STOPS. */
export function thompsonRun(seed = 11) {
  const r = rand(seed), K = PROBS.length, w = new Array(K).fill(0), l = new Array(K).fill(0);
  const snaps: { t: number; w: number[]; l: number[] }[] = [{ t: 0, w: [...w], l: [...l] }];
  for (let t = 1; t <= STOPS[STOPS.length - 1]; t++) {
    let a = 0, best = -1;
    for (let i = 0; i < K; i++) {
      const x = gamma(1 + w[i], r), y = gamma(1 + l[i], r), s = x / (x + y);
      if (s > best) { best = s; a = i; }
    }
    if (r() < PROBS[a]) w[a]++; else l[a]++;
    if (STOPS.includes(t)) snaps.push({ t, w: [...w], l: [...l] });
  }
  return snaps;
}

export function ThompsonPosteriorsViz() {
  const snaps = useMemo(() => thompsonRun(), []);
  const [si, setSi] = useState(3);
  const s = snaps[si];
  const W = 330, H = 180, X0 = 12, Y0 = 8, PW = W - 24, PH = H - Y0 - 30, N = 200;
  const curves = PROBS.map((_, i) => {
    const a = 1 + s.w[i], b = 1 + s.l[i], ys: number[] = [];
    for (let k = 1; k < N; k++) ys.push(betaPdf(k / N, a, b));
    return ys;
  });
  const top = Math.max(...curves.flat());
  const sx = (x: number) => X0 + x * PW;
  const sy = (v: number) => Y0 + PH - (v / top) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="ts-t">after round t = {s.t}</label>
        <input id="ts-t" type="range" min={0} max={snaps.length - 1} step={1} value={si} onChange={(e) => setSi(Number(e.target.value))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Posterior distributions of the three arms' success probabilities">
        {PROBS.map((p, i) => <line key={`p${i}`} x1={sx(p)} x2={sx(p)} y1={Y0} y2={Y0 + PH} stroke={COLORS[i]} strokeDasharray="3 3" />)}
        {curves.map((ys, i) => (
          <path key={i} d={ys.map((v, k) => `${k ? "L" : "M"}${sx((k + 1) / N).toFixed(1)},${sy(v).toFixed(1)}`).join(" ")} fill="none" stroke={COLORS[i]} strokeWidth={1.8} />
        ))}
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        {[0, 0.25, 0.5, 0.75, 1].map((v) => <text key={v} x={sx(v)} y={Y0 + PH + 14} textAnchor={v === 1 ? "end" : v === 0 ? "start" : "middle"} className="viz-label">{v}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">success probability</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`pulls: ${PROBS.map((p, i) => `p=${p}: ${s.w[i] + s.l[i]}`).join(", ")}`}
      </div>
      <figcaption className="viz-caption">
        One run of Thompson sampling on three arms that pay 1 with probabilities 0.6 (blue), 0.5 (red) and 0.3 (green), marked by
        dashed lines. Each curve is the Beta posterior of an arm&apos;s success probability, starting from the uniform prior.
        Every round draws one value from each posterior and pulls the arm with the largest draw. The posterior of the best arm
        narrows around 0.6; the others stay wide, because once their curves lie mostly to its left their draws rarely win, so
        they are pulled less and less: after 3000 rounds the pulls are 2766, 204 and 30.
      </figcaption>
    </figure>
  );
}
