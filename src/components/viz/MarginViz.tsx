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

const CS = [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 100];
const N = 30, STEPS = 6000;

/** A soft-margin linear SVM on two overlapping clouds: as C grows, the margin narrows and fewer points are support vectors. */
export function MarginViz() {
  const [j, setJ] = useState(4);
  const C = CS[j];
  const pts = useMemo(() => {
    const r = makeRng(9001);
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    return Array.from({ length: N }, (_, i) => {
      const y = i % 2 === 0 ? 1 : -1;
      return { x: [y * 1.1 + 0.9 * normal(), y * 0.7 + 0.9 * normal()], y };
    });
  }, []);
  const fit = useMemo(() => {
    let w = [0, 0], b = 0;
    const wa = [0, 0];
    let ba = 0;
    for (let t = 1; t <= STEPS; t++) {
      const gw = [w[0], w[1]];
      let gb = 0;
      pts.forEach(({ x, y }) => {
        if (y * (w[0] * x[0] + w[1] * x[1] + b) < 1) { gw[0] -= C * y * x[0]; gw[1] -= C * y * x[1]; gb -= C * y; }
      });
      const lr = 0.5 / ((1 + C * N * 0.2) * Math.sqrt(t));
      w = [w[0] - lr * gw[0], w[1] - lr * gw[1]];
      b -= lr * gb;
      if (t > STEPS / 2) { wa[0] += w[0]; wa[1] += w[1]; ba += b; }
    }
    const k = STEPS / 2;
    return { w: [wa[0] / k, wa[1] / k], b: ba / k };
  }, [C, pts]);
  const { w, b } = fit;
  const nw = Math.hypot(w[0], w[1]) || 1e-9;
  const f = (x: number[]) => w[0] * x[0] + w[1] * x[1] + b;
  const sv = pts.map((p) => p.y * f(p.x) <= 1.02);
  const errs = pts.filter((p) => p.y * f(p.x) <= 0).length;
  const W = 300, H = 260, R = 3.6;
  const X = (v: number) => W / 2 + (v / R) * (W / 2 - 10);
  const Y = (v: number) => H / 2 - (v / R) * (W / 2 - 10);
  const lineAt = (c: number) => {
    // points where w.x + b = c, clipped to the box by sampling x or y
    if (Math.abs(w[1]) > Math.abs(w[0])) {
      const yv = (xv: number) => (c - b - w[0] * xv) / w[1];
      return `${X(-R)},${Y(yv(-R))} ${X(R)},${Y(yv(R))}`;
    }
    const xv = (yy: number) => (c - b - w[1] * yy) / w[0];
    return `${X(xv(-R))},${Y(-R)} ${X(xv(R))},${Y(R)}`;
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          C = {C}
          <input type="range" min={0} max={CS.length - 1} value={j} onChange={(e) => setJ(Number(e.target.value))} aria-label="penalty C" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Two classes, the SVM boundary, its margins and support vectors">
        <defs>
          <clipPath id="mv-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#mv-clip)">
          <polyline points={lineAt(1)} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
          <polyline points={lineAt(-1)} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
          <polyline points={lineAt(0)} fill="none" stroke="var(--text)" strokeWidth={1.8} />
        </g>
        {pts.map((p, i) => (
          <g key={i}>
            {sv[i] && <circle cx={X(p.x[0])} cy={Y(p.x[1])} r={6.5} fill="none" stroke="var(--text)" strokeWidth={1} />}
            <circle cx={X(p.x[0])} cy={Y(p.x[1])} r={3.5} fill={p.y > 0 ? "var(--accent)" : "var(--danger)"} />
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        margin 1/‖w‖ = {(1 / nw).toFixed(3)}; support vectors {sv.filter(Boolean).length}; training errors {errs}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Thirty points from two overlapping clouds and a linear SVM fitted by averaged subgradient descent. The solid line is
        the decision boundary f(x) = 0 and the dashed lines are f(x) = ±1, a distance 1/‖w‖ either side. Ringed points are
        support vectors: on or inside the margin, or misclassified. Small C makes violations cheap, so the margin is wide
        and many points support it; large C punishes every violation, the margin shrinks and the boundary is set by a few
        points near the overlap.
      </figcaption>
    </figure>
  );
}
