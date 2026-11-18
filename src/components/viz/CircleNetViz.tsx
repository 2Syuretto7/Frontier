"use client";

import { useState } from "react";

/** An eps-net of the unit circle: equally spaced points, spaced so that the midpoint between neighbours is within eps. */
export function circleNet(eps: number) {
  const theta = 4 * Math.asin(Math.min(1, eps / 2));
  const count = Math.ceil((2 * Math.PI) / theta);
  const pts = Array.from({ length: count }, (_, k) => (2 * Math.PI * k) / count);
  return { pts, count, bound: (1 + 2 / eps) ** 2 };
}

export function CircleNetViz() {
  const [eps, setEps] = useState(0.4);
  const { pts, count, bound } = circleNet(eps);
  const S = 240, C = S / 2, R = 80;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="cn-eps">ε = {eps.toFixed(2)}</label>
        <input id="cn-eps" type="range" min={0.1} max={1.5} step={0.05} value={eps} onChange={(e) => setEps(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="An epsilon-net of the unit circle with covering discs">
        {pts.map((a, i) => (
          <circle key={`d${i}`} cx={C + R * Math.cos(a)} cy={C - R * Math.sin(a)} r={R * eps} fill="var(--accent-soft)" opacity={0.35} stroke="none" />
        ))}
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--text)" strokeWidth={1.5} />
        {pts.map((a, i) => (
          <circle key={`p${i}`} cx={C + R * Math.cos(a)} cy={C - R * Math.sin(a)} r={3} fill="var(--danger)" />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`net size ${count}; volumetric bound (1 + 2/ε)² = ${bound.toFixed(1)}`}
      </div>
      <figcaption className="viz-caption">
        Red points form an ε-net of the unit circle: every point of the circle lies within ε (the radius of the shaded discs)
        of some red point. On the circle about π/ε points suffice, while the volumetric bound (1 + 2/ε)^d, here with d = 2,
        is much larger, because it does not use the fact that the circle is one-dimensional. In high dimension that
        dimension count is the point: the logarithm of the net size grows like d log(1/ε), and log(net size) is what a union
        bound pays.
      </figcaption>
    </figure>
  );
}
