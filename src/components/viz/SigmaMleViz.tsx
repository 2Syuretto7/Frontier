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

const N = 24;
const SIGS = Array.from({ length: 60 }, (_, i) => 0.1 + i * 0.05);

/** A Gaussian linear model: the least-squares line is the maximum-likelihood line for every σ, and the likelihood in σ peaks at the root mean squared residual. */
export function SigmaMleViz() {
  const [k, setK] = useState(30);
  const [seed, setSeed] = useState(1);
  const data = useMemo(() => {
    const r = makeRng(seed * 104729);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const xs = Array.from({ length: N }, () => r() * 4);
    const ys = xs.map((x) => 0.5 + 0.8 * x + 0.6 * normal());
    const mx = xs.reduce((a, b) => a + b, 0) / N, my = ys.reduce((a, b) => a + b, 0) / N;
    let sxy = 0, sxx = 0;
    xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) * (x - mx); });
    const b = sxy / sxx, a = my - b * mx;
    const rss = xs.reduce((s, x, i) => s + (ys[i] - a - b * x) * (ys[i] - a - b * x), 0);
    return { xs, ys, a, b, rss };
  }, [seed]);
  const sigma = SIGS[k];
  const nll = (s: number) => 0.5 * N * Math.log(2 * Math.PI * s * s) + data.rss / (2 * s * s);
  const sHat = Math.sqrt(data.rss / N);
  const W = 330, H = 150;
  const X = (x: number) => 16 + (x / 4) * (W - 32);
  const Y = (y: number) => H - 12 - ((y + 1) / 6) * (H - 22);
  const line = (off: number) => `${X(0)},${Y(data.a + off)} ${X(4)},${Y(data.a + 4 * data.b + off)}`;
  const H2 = 110;
  const vals = SIGS.map(nll);
  const vmin = Math.min(...vals), vtop = vmin + 40;
  const CX = (s: number) => 16 + ((s - SIGS[0]) / (SIGS[SIGS.length - 1] - SIGS[0])) * (W - 32);
  const CY = (v: number) => H2 - 14 - ((vtop - Math.min(v, vtop)) / 40) * (H2 - 24);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          σ = {sigma.toFixed(2)}
          <input type="range" min={0} max={SIGS.length - 1} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="noise scale sigma" style={{ width: 140 }} />
        </label>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new data</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Data with the least-squares line and a band of plus or minus two sigma">
        <polygon points={`${X(0)},${Y(data.a + 2 * sigma)} ${X(4)},${Y(data.a + 4 * data.b + 2 * sigma)} ${X(4)},${Y(data.a + 4 * data.b - 2 * sigma)} ${X(0)},${Y(data.a - 2 * sigma)}`} fill="var(--accent)" opacity={0.15} />
        <polyline points={line(0)} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
        {data.xs.map((x, i) => <circle key={i} cx={X(x)} cy={Y(data.ys[i])} r={2.6} fill="var(--text)" />)}
      </svg>
      <svg viewBox={`0 0 ${W} ${H2}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Negative log-likelihood as a function of sigma">
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.6} points={SIGS.map((s, i) => `${CX(s).toFixed(1)},${CY(vals[i]).toFixed(1)}`).join(" ")} />
        <line x1={CX(sHat)} x2={CX(sHat)} y1={8} y2={H2 - 14} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <circle cx={CX(sigma)} cy={CY(nll(sigma))} r={4} fill="var(--accent)" />
        <text x={16} y={H2 - 2} className="viz-label">σ = 0.1</text>
        <text x={W - 16} y={H2 - 2} textAnchor="end" className="viz-label">σ = 3.05</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        NLL = {nll(sigma).toFixed(2)}; best σ̂ = √(RSS/n) = {sHat.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The points come from a line plus Gaussian noise of scale 0.6. The fitted line is the least-squares line, and it does
        not move as σ changes, because σ only rescales the squared-error term. The shaded band is ±2σ. Too small a σ makes
        the residuals look wildly improbable; too large spreads probability thinly. The curve below is the negative
        log-likelihood in σ, lowest at the root mean squared residual (dashed).
      </figcaption>
    </figure>
  );
}
