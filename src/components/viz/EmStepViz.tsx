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

const N = 300, MAXIT = 60;
const npdf = (x: number, m: number, s: number) => Math.exp(-0.5 * ((x - m) / s) * ((x - m) / s)) / (s * Math.sqrt(2 * Math.PI));
type P = { pi: number[]; mu: number[]; sd: number[] };

function step(x: number[], p: P): P {
  const K = p.pi.length;
  const R = x.map((v) => { const r = p.pi.map((w, k) => w * npdf(v, p.mu[k], p.sd[k])); const z = r.reduce((a, b) => a + b, 0) || 1e-300; return r.map((u) => u / z); });
  const Nk = Array.from({ length: K }, (_, k) => R.reduce((a, r) => a + r[k], 0) + 1e-12);
  const mu = Nk.map((n, k) => R.reduce((a, r, i) => a + r[k] * x[i], 0) / n);
  const sd = Nk.map((n, k) => Math.max(0.05, Math.sqrt(R.reduce((a, r, i) => a + r[k] * (x[i] - mu[k]) * (x[i] - mu[k]), 0) / n)));
  return { pi: Nk.map((n) => n / x.length), mu, sd };
}

const ll = (x: number[], p: P) => x.reduce((a, v) => a + Math.log(p.pi.reduce((s, w, k) => s + w * npdf(v, p.mu[k], p.sd[k]), 0) + 1e-300), 0);

/** Expectation-maximisation for a one-dimensional Gaussian mixture: each iteration recomputes responsibilities and refits the components, and the log-likelihood never decreases. */
export function EmStepViz() {
  const [it, setIt] = useState(0);
  const [K, setK] = useState(3);
  const [seed, setSeed] = useState(1);
  const x = useMemo(() => {
    const r = makeRng(77);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    return Array.from({ length: N }, () => { const u = r(); return u < 0.3 ? -3 + 0.6 * normal() : u < 0.7 ? 0.5 + 0.8 * normal() : 3.5 + 0.5 * normal(); });
  }, []);
  const path = useMemo(() => {
    const r = makeRng(seed * 911 + K);
    let p: P = { pi: Array(K).fill(1 / K), mu: Array.from({ length: K }, () => -4 + 8 * r()), sd: Array(K).fill(1.5) };
    const out: P[] = [p];
    for (let k = 0; k < MAXIT; k++) { p = step(x, p); out.push(p); }
    return out;
  }, [x, K, seed]);
  const p = path[it];
  const lls = path.map((q) => ll(x, q));
  const W = 330, H = 150, H2 = 80;
  const X = (v: number) => 12 + ((v + 6) / 12) * (W - 24);
  const bins = 40, bw = 12 / bins;
  const counts = Array(bins).fill(0);
  x.forEach((v) => { const b = Math.floor((v + 6) / bw); if (b >= 0 && b < bins) counts[b]++; });
  const ymax = 0.45;
  const Y = (v: number) => H - 14 - (Math.min(v, ymax) / ymax) * (H - 22);
  const GX = Array.from({ length: 241 }, (_, i) => -6 + (12 * i) / 240);
  const colors = ["var(--accent)", "var(--danger)", "var(--text-muted)"];
  const lmin = Math.min(...lls), lmax = Math.max(...lls);
  const LX = (k: number) => 24 + (k / MAXIT) * (W - 36);
  const LY = (v: number) => H2 - 12 - ((v - lmin) / (lmax - lmin || 1)) * (H2 - 22);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" onClick={() => setIt(Math.min(MAXIT, it + 1))} disabled={it >= MAXIT}>one EM step</button>
        <button type="button" className="seg" onClick={() => setIt(Math.min(MAXIT, it + 10))} disabled={it >= MAXIT}>ten steps</button>
        <button type="button" className="seg" onClick={() => { setSeed(seed + 1); setIt(0); }}>new start</button>
        {[2, 3].map((k) => <button key={k} type="button" className="seg" aria-pressed={K === k} onClick={() => { setK(k); setIt(0); }}>K = {k}</button>)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of the data and the current mixture components">
        {counts.map((c, b) => <rect key={b} x={X(-6 + b * bw)} y={Y(c / (N * bw))} width={X(bw) - X(0) - 0.5} height={Y(0) - Y(c / (N * bw))} fill="var(--border)" />)}
        {p.pi.map((w, k) => <polyline key={k} fill="none" stroke={colors[k]} strokeWidth={1.4} strokeDasharray="4 3" points={GX.map((g) => `${X(g).toFixed(1)},${Y(w * npdf(g, p.mu[k], p.sd[k])).toFixed(1)}`).join(" ")} />)}
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={GX.map((g) => `${X(g).toFixed(1)},${Y(p.pi.reduce((s, w, k) => s + w * npdf(g, p.mu[k], p.sd[k]), 0)).toFixed(1)}`).join(" ")} />
      </svg>
      <svg viewBox={`0 0 ${W} ${H2}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Log-likelihood against iteration">
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.4} points={lls.map((v, k) => `${LX(k).toFixed(1)},${LY(v).toFixed(1)}`).join(" ")} />
        <circle cx={LX(it)} cy={LY(lls[it])} r={4} fill="var(--accent)" />
        <text x={24} y={H2 - 1} className="viz-label">iteration 0</text>
        <text x={W - 12} y={H2 - 1} textAnchor="end" className="viz-label">{MAXIT}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        iteration {it}: log-likelihood {lls[it].toFixed(2)}; means {p.mu.map((m) => m.toFixed(2)).join(", ")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Three hundred points drawn from three Gaussians, shown as a histogram. Each EM step computes every point&apos;s
        responsibilities under the current components (E) and refits each component as a responsibility-weighted Gaussian
        (M). The dashed curves are the weighted components and the solid curve their sum. The log-likelihood below never
        goes down. Different starting means can end at different local maxima, especially with K = 3: try a few new starts.
      </figcaption>
    </figure>
  );
}
