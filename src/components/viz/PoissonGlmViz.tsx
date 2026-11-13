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

function poisson(lam: number, r: () => number) {
  const L = Math.exp(-lam);
  let k = 0, p = 1;
  do { k++; p *= r(); } while (p > L);
  return k - 1;
}

const N = 36;

/** Counts that grow with x: a Poisson GLM with log link against a least-squares line, with bands of ±2 predicted standard deviations. */
export function PoissonGlmViz() {
  const [glm, setGlm] = useState(true);
  const [seed, setSeed] = useState(1);
  const fit = useMemo(() => {
    const r = makeRng(seed * 7717);
    const xs = Array.from({ length: N }, (_, i) => (4 * i) / (N - 1));
    const ys = xs.map((x) => poisson(Math.exp(0.3 + 0.6 * x), r));
    let a = Math.log(ys.reduce((s, v) => s + v, 0) / N + 0.1), b = 0;
    for (let it = 0; it < 50; it++) {
      let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0;
      xs.forEach((x, i) => { const mu = Math.exp(a + b * x); g0 += ys[i] - mu; g1 += (ys[i] - mu) * x; h00 += mu; h01 += mu * x; h11 += mu * x * x; });
      const det = h00 * h11 - h01 * h01;
      a += (h11 * g0 - h01 * g1) / det;
      b += (h00 * g1 - h01 * g0) / det;
    }
    const mx = xs.reduce((s, v) => s + v, 0) / N, my = ys.reduce((s, v) => s + v, 0) / N;
    let sxy = 0, sxx = 0;
    xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) * (x - mx); });
    const lb = sxy / sxx, la = my - lb * mx;
    const rss = xs.reduce((s, x, i) => s + (ys[i] - la - lb * x) * (ys[i] - la - lb * x), 0);
    return { xs, ys, a, b, la, lb, sd: Math.sqrt(rss / (N - 2)) };
  }, [seed]);
  const W = 330, H = 200;
  const X = (x: number) => 20 + ((x + 1) / 6) * (W - 30);
  const Y = (y: number) => H - 16 - (Math.max(-6, Math.min(y, 40)) / 40) * (H - 26);
  const grid = Array.from({ length: 121 }, (_, i) => -1 + (6 * i) / 120);
  const mean = (x: number) => (glm ? Math.exp(fit.a + fit.b * x) : fit.la + fit.lb * x);
  const sd = (x: number) => (glm ? Math.sqrt(Math.exp(fit.a + fit.b * x)) : fit.sd);
  const band = [...grid.map((x) => `${X(x).toFixed(1)},${Y(mean(x) + 2 * sd(x)).toFixed(1)}`), ...grid.slice().reverse().map((x) => `${X(x).toFixed(1)},${Y(mean(x) - 2 * sd(x)).toFixed(1)}`)].join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={glm} onClick={() => setGlm(true)}>Poisson GLM</button>
        <button type="button" className="seg" aria-pressed={!glm} onClick={() => setGlm(false)}>least squares</button>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new data</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Count data with a fitted mean curve and a two standard deviation band">
        <polygon points={band} fill="var(--accent)" opacity={0.15} />
        <line x1={X(-1)} x2={X(5)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(0)} y1={6} y2={H - 16} stroke="var(--border)" strokeDasharray="2 3" />
        <line x1={X(4)} x2={X(4)} y1={6} y2={H - 16} stroke="var(--border)" strokeDasharray="2 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={grid.map((x) => `${X(x).toFixed(1)},${Y(mean(x)).toFixed(1)}`).join(" ")} />
        {fit.xs.map((x, i) => <circle key={i} cx={X(x)} cy={Y(fit.ys[i])} r={2.6} fill="var(--text)" />)}
        <text x={X(-1)} y={H - 3} className="viz-label">x = −1</text>
        <text x={X(5)} y={H - 3} textAnchor="end" className="viz-label">x = 5</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {glm ? `log μ = ${fit.a.toFixed(3)} + ${fit.b.toFixed(3)}x` : `μ = ${fit.la.toFixed(3)} + ${fit.lb.toFixed(3)}x`}; prediction at x = −1: {mean(-1).toFixed(2)}, at x = 5: {mean(5).toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dots are counts drawn from a Poisson distribution with mean e^(0.3 + 0.6x), observed between the dotted lines.
        The Poisson GLM models log μ as linear, so its mean stays positive and its band, ±2√μ, widens where counts are large,
        as Poisson variance equals the mean. The least-squares line assumes constant variance: its band is too wide on the
        left and too narrow on the right, and outside the data it can predict negative counts or miss the curvature.
      </figcaption>
    </figure>
  );
}
