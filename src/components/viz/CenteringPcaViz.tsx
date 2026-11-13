"use client";

import { useState } from "react";

// 40 points spread along a direction at −35°, around the mean (3, 1.5)
const PTS: [number, number][] = Array.from({ length: 40 }, (_, i) => {
  const t = Math.sin(i * 12.9898) * 1.6, n = Math.cos(i * 78.233) * 0.35;
  const c = Math.cos(-0.61), s = Math.sin(-0.61);
  return [3 + t * c - n * s, 1.5 + t * s + n * c];
});

function topDir(P: [number, number][], centre: [number, number]) {
  let a = 0, b = 0, d = 0;
  for (const [x, y] of P) { const u = x - centre[0], v = y - centre[1]; a += u * u; b += u * v; d += v * v; }
  const th = 0.5 * Math.atan2(2 * b, a - d);
  return [Math.cos(th), Math.sin(th)];
}

/** PCA must centre the data: without centring, the top singular vector points at the mean, not along the spread. */
export function CenteringPcaViz() {
  const [centred, setCentred] = useState(true);
  const mean: [number, number] = [PTS.reduce((s, p) => s + p[0], 0) / PTS.length, PTS.reduce((s, p) => s + p[1], 0) / PTS.length];
  const origin: [number, number] = centred ? mean : [0, 0];
  const dir = topDir(PTS, origin);
  const Sc = 40, Ox = 30, Oy = 170;
  const X = (x: number) => Ox + x * Sc, Y = (y: number) => Oy - y * Sc;
  const L = 4;
  const raw = (Math.atan2(dir[1], dir[0]) * 180) / Math.PI;
  const ang = raw > 90 ? raw - 180 : raw < -90 ? raw + 180 : raw;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={centred} onClick={() => setCentred(true)}>centred</button>
        <button type="button" className="seg" aria-pressed={!centred} onClick={() => setCentred(false)}>not centred</button>
      </div>
      <svg viewBox="0 0 280 200" style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Data points and the first principal direction">
        <line x1={Ox} x2={270} y1={Oy} y2={Oy} stroke="var(--border)" />
        <line x1={Ox} x2={Ox} y1={10} y2={190} stroke="var(--border)" />
        {PTS.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={3} fill="var(--text-muted)" />)}
        <line x1={X(origin[0] - L * dir[0])} y1={Y(origin[1] - L * dir[1])} x2={X(origin[0] + L * dir[0])} y2={Y(origin[1] + L * dir[1])} stroke="var(--accent)" strokeWidth={2.4} />
        <circle cx={X(mean[0])} cy={Y(mean[1])} r={5} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        first direction at {ang.toFixed(1)}° (the cloud is stretched along about −35°)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {centred
          ? "After subtracting the mean (red), the top right singular vector of the data matrix follows the cloud's long axis: the direction of greatest variance."
          : "Without centring, the top singular vector of X maximises the sum of squared projections measured from the origin, and the mean dominates: the line through the origin is pulled towards the cloud's centre instead of along its spread."}
      </figcaption>
    </figure>
  );
}
