"use client";

import { useEffect, useState } from "react";
import { makeRng } from "./ml";

const T = 10, LMAX = 3.5;
export const rate = (t: number) => 2 + 1.5 * Math.sin((2 * Math.PI * t) / 5);

/** Candidate points of a rate-LMAX Poisson process, each with a uniform height in [0, LMAX]; kept if below the rate curve. */
export function thin(seed: number) {
  const rng = makeRng(seed), pts: { t: number; u: number; keep: boolean }[] = [];
  let t = 0;
  for (;;) {
    t += -Math.log(Math.max(rng(), 1e-12)) / LMAX;
    if (t > T) return pts;
    const u = LMAX * rng();
    pts.push({ t, u, keep: u < rate(t) });
  }
}

export function ThinningViz() {
  const [seed, setSeed] = useState(3);
  const [pts, setPts] = useState<ReturnType<typeof thin> | null>(null);
  useEffect(() => setPts(thin(seed)), [seed]);
  const W = 330, H = 150, X0 = 24, PW = W - 32, PH = 110, RUG = 128;
  const sx = (t: number) => X0 + (t / T) * PW, sy = (u: number) => 10 + (1 - u / LMAX) * PH;
  const curve = Array.from({ length: 101 }, (_, i) => (T * i) / 100).map((t) => `${sx(t)},${sy(rate(t))}`).join(" ");
  const kept = pts ? pts.filter((p) => p.keep).length : 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="seg" onClick={() => setSeed((s) => s + 1)}>new draw</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Thinning a homogeneous Poisson process to one with a varying rate">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} y1={sy(LMAX)} x2={X0 + PW} y2={sy(LMAX)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.5} points={curve} />
        {pts?.map((p, i) => (
          <circle key={i} cx={sx(p.t)} cy={sy(p.u)} r={2.6} fill={p.keep ? "var(--accent)" : "none"} stroke={p.keep ? "none" : "var(--text-muted)"} />
        ))}
        {pts?.filter((p) => p.keep).map((p, i) => (
          <line key={i} x1={sx(p.t)} y1={RUG} x2={sx(p.t)} y2={RUG + 14} stroke="var(--accent)" strokeWidth={1.5} />
        ))}
        <text x={X0 - 4} y={sy(LMAX) + 4} textAnchor="end" className="viz-label">3.5</text>
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">0</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {pts ? `${pts.length} candidates at rate 3.5, ${kept} kept; expected kept count 20` : "drawing"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Candidates arrive as a Poisson process of constant rate 3.5 on [0, 10], each given a uniform height. Keeping those that
        fall under the curve λ(t) = 2 + 1.5 sin(2πt/5) leaves a Poisson process with rate λ(t), shown as the ticks along the
        bottom. It is rejection sampling in the plane: the kept points are uniform under the curve, so the count in any
        interval is Poisson with mean equal to the area under λ there.
      </figcaption>
    </figure>
  );
}
