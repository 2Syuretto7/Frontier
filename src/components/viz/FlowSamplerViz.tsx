"use client";

import { useEffect, useState } from "react";

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

const MU = [-2, 2], SD = 0.3, TMAX = 80, TMIN = 0.002, NS = 3000, NPATH = 12;

function denoise(x: number, t: number) {
  const v = SD * SD + t * t;
  const lw = MU.map((m) => -0.5 * (x - m) ** 2 / v);
  const mx = Math.max(...lw);
  const w = lw.map((l) => Math.exp(l - mx));
  const tot = w[0] + w[1];
  return MU.reduce((s, m, k) => s + (w[k] / tot) * (m + (SD * SD / v) * (x - m)), 0);
}
const vel = (x: number, t: number) => (t > 0 ? (x - denoise(x, t)) / t : 0);

function grid(steps: number) {
  const a = TMAX ** (1 / 7), b = TMIN ** (1 / 7);
  return [...Array.from({ length: steps }, (_, i) => (a + (i / (steps - 1)) * (b - a)) ** 7), 0];
}

function sample(heun: boolean, nfe: number) {
  const steps = heun ? Math.max(2, Math.floor((nfe + 1) / 2)) : nfe;
  const ts = grid(steps);
  const r = makeRng(5);
  const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
  const finals: number[] = [];
  const paths: number[][] = [];
  let used = 0;
  for (let p = 0; p < NS; p++) {
    let x = normal() * Math.sqrt(SD * SD + TMAX * TMAX);
    const path = [x];
    used = 0;
    for (let i = 0; i + 1 < ts.length; i++) {
      const t = ts[i], tn = ts[i + 1], d = vel(x, t);
      const xe = x + (tn - t) * d; used++;
      if (heun && tn > 0) { x = x + 0.5 * (tn - t) * (d + vel(xe, tn)); used++; } else x = xe;
      path.push(x);
    }
    finals.push(x);
    if (p < NPATH) paths.push(path);
  }
  return { ts, finals, paths, used };
}

/** Sampling a two-bump distribution by integrating the probability flow ODE from t = 80 to 0 with Euler or Heun steps on a Karras time grid. */
export function FlowSamplerViz() {
  const [heun, setHeun] = useState(false);
  const [nfe, setNfe] = useState(10);
  const [res, setRes] = useState<ReturnType<typeof sample> | null>(null);
  useEffect(() => setRes(sample(heun, nfe)), [heun, nfe]);
  const W = 330, H = 250;
  const lt = (t: number) => Math.log10(Math.max(t, TMIN));
  const TX = (t: number) => 34 + ((lt(TMAX) - lt(t)) / (lt(TMAX) - lt(TMIN))) * (W - 50);
  const XY = (x: number) => 70 - (Math.max(-6, Math.min(6, x)) / 6) * 60;
  const lo = -4, hi = 4, nb = 40, bw = (hi - lo) / nb;
  const counts = Array(nb).fill(0);
  let rms = 0;
  if (res) for (const x of res.finals) { const b = Math.floor((x - lo) / bw); if (b >= 0 && b < nb) counts[b]++; rms += (Math.abs(x) - 2) ** 2; }
  rms = res ? Math.sqrt(rms / NS) : 0;
  const HX = (x: number) => 34 + ((x - lo) / (hi - lo)) * (W - 50);
  const HY = (d: number) => H - 14 - (Math.min(d, 0.8) / 0.8) * 90;
  const dens = (x: number) => MU.reduce((s, m) => s + 0.5 * Math.exp(-((x - m) ** 2) / (2 * SD * SD)) / (SD * Math.sqrt(2 * Math.PI)), 0);
  const xs = Array.from({ length: 161 }, (_, i) => lo + ((hi - lo) * i) / 160);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={!heun} onClick={() => setHeun(false)}>Euler</button>
        <button type="button" className="seg" aria-pressed={heun} onClick={() => setHeun(true)}>Heun</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          evaluations ≈ {nfe}
          <input type="range" min={3} max={40} value={nfe} onChange={(e) => setNfe(Number(e.target.value))} aria-label="function evaluations" style={{ width: 120 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Sample paths from noise to data, and a histogram of the final samples against the data density">
        <line x1={TX(TMAX)} x2={TX(TMIN)} y1={XY(0)} y2={XY(0)} stroke="var(--border)" strokeWidth={0.5} />
        {[-2, 2].map((m) => <line key={m} x1={TX(TMAX)} x2={TX(TMIN)} y1={XY(m)} y2={XY(m)} stroke="var(--border)" strokeDasharray="3 3" />)}
        {res?.paths.map((p, i) => (
          <polyline key={i} fill="none" stroke="var(--accent)" strokeWidth={1} opacity={0.7} points={p.map((x, j) => `${TX(res.ts[j]).toFixed(1)},${XY(x).toFixed(1)}`).join(" ")} />
        ))}
        <text x={TX(TMAX)} y={142} className="viz-label">t = 80</text>
        <text x={TX(TMIN)} y={142} textAnchor="end" className="viz-label">t → 0</text>
        {counts.map((c, i) => (
          <rect key={i} x={HX(lo + i * bw)} y={HY(c / (NS * bw))} width={HX(lo + (i + 1) * bw) - HX(lo + i * bw) - 0.5} height={HY(0) - HY(c / (NS * bw))} fill="var(--accent)" opacity={0.35} />
        ))}
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.4} points={xs.map((x) => `${HX(x).toFixed(1)},${HY(dens(x)).toFixed(1)}`).join(" ")} />
        <line x1={HX(lo)} x2={HX(hi)} y1={HY(0)} y2={HY(0)} stroke="var(--border)" />
        <text x={HX(-2)} y={H - 2} textAnchor="middle" className="viz-label">−2</text>
        <text x={HX(2)} y={H - 2} textAnchor="middle" className="viz-label">2</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {res ? `${res.used} evaluations; spread around the bumps ${rms.toFixed(3)} (data: 0.300)` : "sampling…"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each path starts as wide noise at t = 80 and follows dx/dt = (x − D(x, t))/t, where D(x, t) is the best guess of
        the clean point given the noisy one; here D is exact, standing in for a trained network. The steps follow the
        Karras schedule, dense near t = 0 where the paths bend. With few evaluations the samples come out too spread, the
        bumps blurred. Heun spends two evaluations per step: with a tiny budget its few huge steps overshoot and it does
        worse than Euler, but from about 30 evaluations its second order pays and it gets closer to the true spread of 0.3
        than Euler does with the same budget.
      </figcaption>
    </figure>
  );
}
