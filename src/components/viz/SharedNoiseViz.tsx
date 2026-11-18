"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const THETAS = [0.5, 1, 2];
const X0 = 2, SIG = 0.8, T = 2, N = 100, DELTA = 0.25, SHOW = 12, M = 2000;

/** Euler-Maruyama paths of dX = -θX dt + σ dB driven by a fixed array of normal draws. */
export function path(theta: number, z: number[]) {
  const h = T / N, out = [X0];
  let x = X0;
  for (let k = 0; k < N; k++) { x += -theta * x * h + SIG * Math.sqrt(h) * z[k]; out.push(x); }
  return out;
}

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };

/** Per-path finite-difference slopes of X_T in θ, with shared noise and with fresh noise for the nudged path. */
export function slopes(theta: number, seed: number) {
  const z = makeNormal(makeRng(seed)), draw = () => Array.from({ length: N }, z);
  const shared: number[] = [], fresh: number[] = [];
  for (let i = 0; i < M; i++) {
    const a = draw(), b = draw(), xa = path(theta, a)[N];
    shared.push((path(theta + DELTA, a)[N] - xa) / DELTA);
    fresh.push((path(theta + DELTA, b)[N] - xa) / DELTA);
  }
  return { shared: { m: mean(shared), s: sd(shared) }, fresh: { m: mean(fresh), s: sd(fresh) } };
}

export function SharedNoiseViz() {
  const [theta, setTheta] = useState(1);
  const [seed, setSeed] = useState(2);
  const [data, setData] = useState<{ paths: [number[], number[]][]; st: ReturnType<typeof slopes> } | null>(null);
  useEffect(() => {
    const z = makeNormal(makeRng(1000 + seed));
    const paths: [number[], number[]][] = Array.from({ length: SHOW }, () => {
      const noise = Array.from({ length: N }, z);
      return [path(theta, noise), path(theta + DELTA, noise)];
    });
    setData({ paths, st: slopes(theta, seed) });
  }, [theta, seed]);
  const W = 330, H = 160, XL = 24, PW = W - 32, LO = -1.5, HI = 2.5;
  const sx = (k: number) => XL + (k / N) * PW, sy = (v: number) => 8 + (1 - (Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * (H - 16);
  const exact = (X0 * ((1 - (theta + DELTA) * (T / N)) ** N - (1 - theta * (T / N)) ** N)) / DELTA;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {THETAS.map((t) => (
          <button key={t} type="button" className="seg" aria-pressed={t === theta} onClick={() => setTheta(t)}>θ = {t}</button>
        ))}
        <button type="button" className="seg" onClick={() => setSeed((s) => s + 1)}>new noise</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Diffusion paths at two nearby parameter values driven by the same noise">
        <line x1={XL} y1={sy(0)} x2={XL + PW} y2={sy(0)} stroke="var(--border)" />
        {data?.paths.map(([a, b], i) => (
          <g key={i}>
            <polyline fill="none" stroke="var(--accent)" strokeWidth={1} opacity={0.8} points={a.map((v, k) => `${sx(k)},${sy(v)}`).join(" ")} />
            <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="3 2" points={b.map((v, k) => `${sx(k)},${sy(v)}`).join(" ")} />
          </g>
        ))}
        <text x={XL - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={XL - 4} y={sy(2) + 4} textAnchor="end" className="viz-label">2</text>
        <text x={XL + PW} y={H - 1} textAnchor="end" className="viz-label">t = {T}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {data
          ? `slope (E[X_T] at θ + 0.25 minus at θ) / 0.25: exact ${exact.toFixed(3)}; shared noise ${data.st.shared.m.toFixed(3)} (sd ${data.st.shared.s.toFixed(2)}), fresh noise ${data.st.fresh.m.toFixed(3)} (sd ${data.st.fresh.s.toFixed(2)})`
          : "simulating"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Colour: paths of dX = −θX dt + 0.8 dB from X = 2. Dashed: the same noise with θ raised by 0.25. Because each path is a
        smooth function of θ once the noise is fixed, the nudged path sits just below its partner, and per-path slopes vary
        little. Comparing with a path driven by fresh noise gives the same average slope but a far larger spread. The
        pathwise estimator is the δ → 0 limit of the shared-noise slope.
      </figcaption>
    </figure>
  );
}
