"use client";

import { useMemo, useState } from "react";

type P = [number, number];
/** Velocity field v(x, y) = (sin y + 0.3 x, -sin x + 0.3 y cos x); its divergence is 0.3 + 0.3 cos x. */
const vel = (p: P): P => [Math.sin(p[1]) + 0.3 * p[0], -Math.sin(p[0]) + 0.3 * p[1] * Math.cos(p[0])];
const div = (p: P) => 0.3 + 0.3 * Math.cos(p[0]);
const C0: P = [0.8, 0.3], R0 = 0.15, N = 120, H = 0.005;

function rk4(p: P): P {
  const k1 = vel(p), k2 = vel([p[0] + (H / 2) * k1[0], p[1] + (H / 2) * k1[1]]);
  const k3 = vel([p[0] + (H / 2) * k2[0], p[1] + (H / 2) * k2[1]]), k4 = vel([p[0] + H * k3[0], p[1] + H * k3[1]]);
  return [p[0] + (H / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), p[1] + (H / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
}

const area = (ps: P[]) => Math.abs(ps.reduce((a, p, i) => { const q = ps[(i + 1) % ps.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;

/** Flow a small disc to time t; compare its area ratio with exp of the divergence integrated along the centre's path. */
export function evolve(t: number) {
  let ring: P[] = Array.from({ length: N }, (_, i) => [C0[0] + R0 * Math.cos((2 * Math.PI * i) / N), C0[1] + R0 * Math.sin((2 * Math.PI * i) / N)]);
  let c: P = [...C0], intDiv = 0;
  const a0 = area(ring), steps = Math.round(t / H), path: P[] = [c];
  for (let s = 0; s < steps; s++) {
    const d1 = div(c); const c2 = rk4(c); intDiv += (H / 2) * (d1 + div(c2)); c = c2;
    ring = ring.map(rk4);
    if (s % 10 === 0) path.push(c);
  }
  path.push(c);
  return { ring, path, ratio: area(ring) / a0, pred: Math.exp(intDiv) };
}

const TS = [0, 1, 2, 3, 4];

export function LiouvilleViz() {
  const [ti, setTi] = useState(2);
  const { ring, path, ratio, pred } = useMemo(() => evolve(TS[ti]), [ti]);
  const W = 280, s = W / 7, c = W / 2;
  const X = (p: P) => c + s * p[0], Y = (p: P) => c - s * p[1];
  const arrows: P[] = [];
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) arrows.push([i, j]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">time</span>
        <div className="segmented" role="group" aria-label="Time">
          {TS.map((t, i) => <button key={t} type="button" className="seg" aria-pressed={ti === i} onClick={() => setTi(i)}>{t}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="A small region carried by a velocity field">
        <rect x={0} y={0} width={W} height={W} fill="var(--bg-subtle)" />
        {arrows.map((p, i) => { const v = vel(p), m = Math.hypot(v[0], v[1]) || 1, L = 12; return <line key={i} x1={X(p)} y1={Y(p)} x2={X(p) + (L * v[0]) / m} y2={Y(p) - (L * v[1]) / m} stroke="var(--border-strong)" strokeWidth={1} />; })}
        {arrows.map((p, i) => <circle key={`d${i}`} cx={X(p)} cy={Y(p)} r={1.5} fill="var(--border-strong)" />)}
        <path d={path.map((p, i) => `${i ? "L" : "M"}${X(p).toFixed(1)},${Y(p).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeDasharray="3 3" />
        <path d={ring.map((p, i) => `${i ? "L" : "M"}${X(p).toFixed(1)},${Y(p).toFixed(1)}`).join(" ") + "Z"} fill="var(--accent)" fillOpacity={0.35} stroke="var(--accent)" strokeWidth={1.5} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`area ratio ${ratio.toFixed(3)}; exp of integrated divergence ${pred.toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        A small disc of points is carried along a velocity field (arrows give its direction). The disc stretches and turns,
        and its area changes at a rate set by the divergence of the field, here 0.3 + 0.3 cos x. Integrating the divergence
        along the path of the disc&apos;s centre predicts the area ratio: after 4 time units the disc has grown 7.21-fold
        against a prediction of 7.16, and the two agree to within 1% at every time shown. Density falls by the same factor, which is the instantaneous change of variables.
      </figcaption>
    </figure>
  );
}
