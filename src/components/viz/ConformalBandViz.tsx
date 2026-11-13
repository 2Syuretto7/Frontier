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

const NT = 400;
const sd = (x: number) => 0.05 + 0.25 * x;

function draw(r: () => number, n: number) {
  return Array.from({ length: n }, () => {
    const x = 3 * r();
    const g = Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    return [x, Math.sin(x) + sd(x) * g];
  });
}

/** Split conformal intervals around a correct mean model when the noise grows with x: plain scores give marginal coverage only, scaled scores adapt. */
export function ConformalBandViz() {
  const [alpha, setAlpha] = useState(0.1);
  const [scaled, setScaled] = useState(false);
  const [seed, setSeed] = useState(1);
  const { fit, cal, test } = useMemo(() => {
    const r = makeRng(seed * 7 + 3);
    return { fit: draw(r, NT), cal: draw(r, NT), test: draw(r, NT) };
  }, [seed]);
  const scale = useMemo(() => {
    // least squares of |residual| on x from the first split
    const n = fit.length;
    const mx = fit.reduce((a, p) => a + p[0], 0) / n;
    const rs = fit.map(([x, y]) => Math.abs(y - Math.sin(x)));
    const mr = rs.reduce((a, b) => a + b, 0) / n;
    const b = fit.reduce((a, p, i) => a + (p[0] - mx) * (rs[i] - mr), 0) / fit.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
    return (x: number) => Math.max(mr + b * (x - mx), 0.02);
  }, [fit]);
  const u = (x: number) => (scaled ? scale(x) : 1);
  const scores = cal.map(([x, y]) => Math.abs(y - Math.sin(x)) / u(x)).sort((a, b) => a - b);
  const k = Math.ceil((cal.length + 1) * (1 - alpha));
  const q = k <= scores.length ? scores[k - 1] : Infinity;
  const inside = test.map(([x, y]) => Math.abs(y - Math.sin(x)) <= q * u(x));
  const cov = (pred: (x: number) => boolean) => {
    const idx = test.map((_, i) => i).filter((i) => pred(test[i][0]));
    return idx.filter((i) => inside[i]).length / Math.max(idx.length, 1);
  };
  const W = 330, H = 180;
  const X = (x: number) => 16 + (x / 3) * (W - 28);
  const Y = (y: number) => H / 2 - y * 34;
  const grid = Array.from({ length: 61 }, (_, i) => (3 * i) / 60);
  const band = [...grid.map((x) => `${X(x).toFixed(1)},${Y(Math.sin(x) + q * u(x)).toFixed(1)}`), ...grid.slice().reverse().map((x) => `${X(x).toFixed(1)},${Y(Math.sin(x) - q * u(x)).toFixed(1)}`)].join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 10 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          α = {alpha.toFixed(2)}
          <input type="range" min={0.05} max={0.3} step={0.05} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} aria-label="miscoverage level" style={{ width: 100 }} />
        </label>
        <button type="button" className="seg" aria-pressed={!scaled} onClick={() => setScaled(false)}>plain scores</button>
        <button type="button" className="seg" aria-pressed={scaled} onClick={() => setScaled(true)}>scaled scores</button>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new data</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Test points with a conformal prediction band">
        <polygon points={band} fill="var(--accent)" opacity={0.18} />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.5} points={grid.map((x) => `${X(x).toFixed(1)},${Y(Math.sin(x)).toFixed(1)}`).join(" ")} />
        {test.map(([x, y], i) => (
          <circle key={i} cx={X(x)} cy={Math.min(Math.max(Y(y), 2), H - 2)} r={1.8} fill={inside[i] ? "var(--text-muted)" : "var(--danger)"} opacity={0.8} />
        ))}
        <line x1={X(1.5)} x2={X(1.5)} y1={4} y2={H - 4} stroke="var(--border)" strokeDasharray="2 3" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        target {(1 - alpha).toFixed(2)}; coverage overall {cov(() => true).toFixed(2)}, x &lt; 1.5: {cov((x) => x < 1.5).toFixed(2)}, x ≥ 1.5: {cov((x) => x >= 1.5).toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The mean model sin x is correct, but the noise grows with x. Split conformal prediction takes the residuals of a
        separate calibration set, finds the ⌈(n + 1)(1 − α)⌉-th smallest, and uses it as the band&apos;s half-width; red
        points fall outside. With plain scores overall coverage meets the target, but the band is too wide on the left and
        too narrow on the right. Dividing each score by a fitted noise scale makes the band widen with x and evens out the
        coverage, while keeping the same overall guarantee.
      </figcaption>
    </figure>
  );
}
