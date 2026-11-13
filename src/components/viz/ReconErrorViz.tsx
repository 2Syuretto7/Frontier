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

const N = 40;

/** Projecting centred 2D data onto a line through the origin: the variance along the line plus the mean squared residual is constant, so maximising one minimises the other. */
export function ReconErrorViz() {
  const [deg, setDeg] = useState(100);
  const pts = useMemo(() => {
    const r = makeRng(6060);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    const raw = Array.from({ length: N }, () => { const a = 1.6 * normal(), b = 0.55 * normal(); const c = Math.cos(0.5), s = Math.sin(0.5); return [c * a - s * b, s * a + c * b]; });
    const mx = raw.reduce((s, p) => s + p[0], 0) / N, my = raw.reduce((s, p) => s + p[1], 0) / N;
    return raw.map((p) => [p[0] - mx, p[1] - my]);
  }, []);
  const th = (deg * Math.PI) / 180;
  const w = [Math.cos(th), Math.sin(th)];
  const proj = pts.map((p) => p[0] * w[0] + p[1] * w[1]);
  const varAlong = proj.reduce((s, v) => s + v * v, 0) / N;
  const total = pts.reduce((s, p) => s + p[0] * p[0] + p[1] * p[1], 0) / N;
  const resid = total - varAlong;
  const sxx = pts.reduce((s, p) => s + p[0] * p[0], 0) / N, syy = pts.reduce((s, p) => s + p[1] * p[1], 0) / N, sxy = pts.reduce((s, p) => s + p[0] * p[1], 0) / N;
  const best = (0.5 * Math.atan2(2 * sxy, sxx - syy) * 180) / Math.PI;
  const W = 300, H = 260;
  const X = (v: number) => W / 2 + v * 38, Y = (v: number) => H / 2 - v * 38;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          direction angle = {deg}°
          <input type="range" min={0} max={179} value={deg} onChange={(e) => setDeg(Number(e.target.value))} aria-label="angle of the projection direction" style={{ width: 160 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Points, their projections onto a line and the residuals">
        <line x1={X(-5 * w[0])} y1={Y(-5 * w[1])} x2={X(5 * w[0])} y2={Y(5 * w[1])} stroke="var(--accent)" strokeWidth={1.6} />
        {pts.map((p, i) => (
          <g key={i}>
            <line x1={X(p[0])} y1={Y(p[1])} x2={X(proj[i] * w[0])} y2={Y(proj[i] * w[1])} stroke="var(--danger)" strokeWidth={0.8} opacity={0.7} />
            <circle cx={X(p[0])} cy={Y(p[1])} r={2.6} fill="var(--text)" />
            <circle cx={X(proj[i] * w[0])} cy={Y(proj[i] * w[1])} r={1.8} fill="var(--accent)" />
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        variance along line {varAlong.toFixed(3)} + mean squared residual {resid.toFixed(3)} = total {total.toFixed(3)}; best angle ≈ {(((best % 180) + 180) % 180).toFixed(0)}°
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Forty centred points and a line through the origin at the chosen angle. Each point is projected onto the line, and
        the residual segments join each point to its projection. By Pythagoras, every point&apos;s squared length splits
        into its squared projection plus its squared residual, so the two averages always add to the same total. Turning
        the line to capture the most variance is the same as making the residuals smallest: that direction is the first
        principal component.
      </figcaption>
    </figure>
  );
}
