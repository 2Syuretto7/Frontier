"use client";

import { useState } from "react";

const P0 = [0.5, 0.3, 0.2];
const V = [{ x: 30, y: 180 }, { x: 300, y: 180 }, { x: 165, y: 14 }];

export function tiltOf(lam: number) {
  const w = P0.map((p, x) => p * Math.exp(lam * x));
  const s = w.reduce((a, b) => a + b, 0);
  return w.map((v) => v / s);
}

export function project(mu: number) {
  let lo = -60, hi = 60;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const p = tiltOf(mid);
    if (p[1] + 2 * p[2] < mu) lo = mid; else hi = mid;
  }
  return tiltOf((lo + hi) / 2);
}

export function kl(p: number[], q: number[]) {
  return p.reduce((a, v, i) => a + (v > 0 ? v * Math.log(v / q[i]) : 0), 0);
}

const pt = (p: number[]) => ({ x: p[0] * V[0].x + p[1] * V[1].x + p[2] * V[2].x, y: p[0] * V[0].y + p[1] * V[1].y + p[2] * V[2].y });

/** The exponential family through p0 meets every set of distributions with a fixed mean at its information projection. */
export function IProjectionViz() {
  const [m100, setM100] = useState(120);
  const mu = m100 / 100;
  const ps = project(mu);
  const tLo = Math.max(0, mu - 1), tHi = mu / 2;
  const end = (t: number) => pt([1 - mu + t, mu - 2 * t, t]);
  const a = end(tLo), b = end(tHi);
  const curve = Array.from({ length: 121 }, (_, i) => pt(tiltOf(-12 + i * 0.2)));
  const tq = (tLo + tHi) / 2 + (tHi - tLo) * 0.35;
  const q = [1 - mu + tq, mu - 2 * tq, tq];
  const s0 = pt(P0), s1 = pt(ps), sq = pt(q);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          required mean {mu.toFixed(2)}
          <input type="range" min={10} max={190} value={m100} onChange={(e) => setM100(Number(e.target.value))} aria-label="required mean" style={{ width: 140 }} />
        </label>
      </div>
      <svg viewBox="0 0 330 200" style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The probability simplex on three outcomes with a constraint line, the exponential family curve and the projection point">
        <polygon points={V.map((v) => `${v.x},${v.y}`).join(" ")} fill="none" stroke="var(--border)" />
        {["x = 0", "x = 1", "x = 2"].map((s, i) => (
          <text key={s} x={V[i].x} y={V[i].y + (i === 2 ? -4 : 14)} textAnchor="middle" className="viz-label">{s}</text>
        ))}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve.map((c) => `${c.x},${c.y}`).join(" ")} />
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--text-muted)" strokeWidth={2} />
        <line x1={sq.x} y1={sq.y} x2={s1.x} y2={s1.y} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <line x1={sq.x} y1={sq.y} x2={s0.x} y2={s0.y} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <circle cx={s0.x} cy={s0.y} r={4} fill="var(--text)" />
        <text x={s0.x - 6} y={s0.y + 4} textAnchor="end" className="viz-label">p₀</text>
        <circle cx={s1.x} cy={s1.y} r={5} fill="var(--danger)" />
        <text x={s1.x + 7} y={s1.y - 5} className="viz-label">p*</text>
        <circle cx={sq.x} cy={sq.y} r={3.5} fill="var(--text-muted)" />
        <text x={sq.x + 6} y={sq.y + 12} className="viz-label">q</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        D(q‖p₀) = {kl(q, P0).toFixed(3)} = D(q‖p*) {kl(q, ps).toFixed(3)} + D(p*‖p₀) {kl(ps, P0).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each point of the triangle is a distribution on 0, 1, 2. The grey segment holds every distribution with the required
        mean; the coloured curve is the exponential family p₀(x)e^(λx)/Z through p₀. They cross at one point, p*, the
        distribution on the segment closest to p₀ in divergence. For any other q on the segment the divergences add like a
        right-angled triangle.
      </figcaption>
    </figure>
  );
}
