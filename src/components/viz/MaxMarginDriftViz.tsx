"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

export const STOPS = [10, 100, 1000, 10000, 100000];

/** Separable 2-D data with labels ±1; the classifier is sign(w·x), with no bias term. */
function data() {
  const r = rand(23), pts: { x: number[]; y: number }[] = [];
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  for (let i = 0; i < 24; i++) {
    const y = i % 2 ? 1 : -1;
    const x = y > 0 ? [1.6 + 0.9 * nrm(), 0.4 + 0.5 * nrm()] : [-0.5 + 0.35 * nrm(), 1.4 + 0.8 * nrm()];
    pts.push({ x, y });
  }
  return pts.filter((p) => p.y * (p.y > 0 ? p.x[0] - 0.4 * p.x[1] : p.x[0] - 0.4 * p.x[1]) > 0.15);
}

const margin = (pts: { x: number[]; y: number }[], th: number) => Math.min(...pts.map((p) => p.y * (p.x[0] * Math.cos(th) + p.x[1] * Math.sin(th))));

/** Gradient descent with step 1 on the mean logistic loss from w = 0, recording w at the times in STOPS, and the max-margin angle. */
export function drift() {
  const pts = data(), n = pts.length;
  let best = 0;
  for (let k = 0; k < 36000; k++) { const th = (2 * Math.PI * k) / 36000; if (margin(pts, th) > margin(pts, best)) best = th; }
  const w = [0, 0], snaps: { t: number; w: number[]; angle: number; norm: number; margin: number }[] = [];
  for (let t = 1; t <= STOPS[STOPS.length - 1]; t++) {
    const g = [0, 0];
    for (const p of pts) { const z = p.y * (w[0] * p.x[0] + w[1] * p.x[1]), s = -p.y / (1 + Math.exp(z)) / n; g[0] += s * p.x[0]; g[1] += s * p.x[1]; }
    w[0] -= g[0]; w[1] -= g[1];
    if (STOPS.includes(t)) {
      const th = Math.atan2(w[1], w[0]), norm = Math.hypot(w[0], w[1]);
      const raw = ((((th - best) * 180) / Math.PI) % 360 + 540) % 360 - 180, d = Math.abs(raw);
      snaps.push({ t, w: [...w], angle: d, norm, margin: margin(pts, th) });
    }
  }
  return { pts, best, bestMargin: margin(pts, best), snaps };
}

export function MaxMarginDriftViz() {
  const [si, setSi] = useState(2);
  const d = useMemo(drift, []);
  const s = d.snaps[si];
  const S = 150, W = 330, H = 190, sc = S / 3.2, cx = W / 2, cy = 132;
  const px = (x: number[]) => [cx + x[0] * sc, cy - x[1] * sc];
  const boundary = (th: number) => { const u = [-Math.sin(th), Math.cos(th)]; const a = px([4 * u[0], 4 * u[1]]), b = px([-4 * u[0], -4 * u[1]]); return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }; };
  const th = Math.atan2(s.w[1], s.w[0]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">steps t</span>
        <div className="segmented" role="group" aria-label="Number of gradient steps">
          {STOPS.map((t, i) => <button key={t} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{t >= 1000 ? `10${["³", "⁴", "⁵"][Math.log10(t) - 3]}` : t}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Separable data, the maximum-margin separator and the gradient descent separator">
        <defs><clipPath id="mmd-clip"><rect x={0} y={0} width={W} height={H} /></clipPath></defs>
        <g clipPath="url(#mmd-clip)">
          <line x1={0} x2={W} y1={cy} y2={cy} stroke="var(--border)" />
          <line x1={cx} x2={cx} y1={0} y2={H} stroke="var(--border)" />
          <line {...boundary(d.best)} stroke="var(--text)" strokeWidth={1.2} strokeDasharray="5 3" />
          <line {...boundary(th)} stroke="var(--accent)" strokeWidth={2} />
          {d.pts.map((p, i) => { const [x, y] = px(p.x); return p.y > 0 ? <circle key={i} cx={x} cy={y} r={3.5} fill="var(--code-function)" /> : <rect key={i} x={x - 3.2} y={y - 3.2} width={6.4} height={6.4} fill="none" stroke="var(--text)" strokeWidth={1.3} />; })}
        </g>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--accent)" }}>━</span> gradient descent boundary</span>
        <span>┅ maximum-margin boundary</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        t = {s.t}: angle to the max-margin direction {s.angle.toFixed(2)}°; ‖w‖ = {s.norm.toFixed(2)}; normalised margin {s.margin.toFixed(3)} (best {d.bestMargin.toFixed(3)})
      </div>
      <figcaption className="viz-caption">
        Gradient descent on the logistic loss of 23 separable points, starting from zero, with no bias term and no
        regulariser. After 10 steps one point is still on the wrong side. By 100 steps all are classified correctly and the
        boundary is within 1.04° of the maximum-margin one; after 10⁵ steps it is within 0.67°, with normalised margin 0.251
        against the best possible 0.261. Meanwhile ‖w‖ keeps growing, from 9.55 to 24.39 between 10³ and 10⁵ steps, roughly
        like log t: the loss is never minimised, but the direction settles, slowly and not monotonically.
      </figcaption>
    </figure>
  );
}
