"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

export function chol(s1: number, s2: number, rho: number) {
  return [[s1, 0], [rho * s2, s2 * Math.sqrt(1 - rho * rho)]];
}

/** Reparameterising a correlated Gaussian: fixed standard normal noise pushed through x = μ + L ε. */
export function CholeskySampleViz() {
  const [s1, setS1] = useState(15);
  const [s2, setS2] = useState(10);
  const [r10, setR10] = useState(6);
  const [eps, setEps] = useState<number[][]>([]);
  useEffect(() => {
    const g = makeNormal(makeRng(13));
    setEps(Array.from({ length: 300 }, () => [g(), g()]));
  }, []);
  const a = s1 / 10, b = s2 / 10, rho = r10 / 10;
  const L = chol(a, b, rho);
  const W = 330, H = 220, cx = W / 2, cy = H / 2, sc = 22;
  const map = (e: number[]) => [L[0][0] * e[0], L[1][0] * e[0] + L[1][1] * e[1]];
  const circle = Array.from({ length: 73 }, (_, i) => { const t = (i / 72) * 2 * Math.PI; return map([2 * Math.cos(t), 2 * Math.sin(t)]); });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 4, alignItems: "center" }}>
          σ₁ {a.toFixed(1)}
          <input type="range" min={3} max={25} value={s1} onChange={(e) => setS1(Number(e.target.value))} aria-label="sigma one" style={{ width: 70 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 4, alignItems: "center" }}>
          σ₂ {b.toFixed(1)}
          <input type="range" min={3} max={25} value={s2} onChange={(e) => setS2(Number(e.target.value))} aria-label="sigma two" style={{ width: 70 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 4, alignItems: "center" }}>
          ρ {rho.toFixed(1)}
          <input type="range" min={-9} max={9} value={r10} onChange={(e) => setR10(Number(e.target.value))} aria-label="correlation" style={{ width: 70 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Samples of a correlated two-dimensional Gaussian made by transforming fixed standard normal noise">
        <line x1={0} y1={cy} x2={W} y2={cy} stroke="var(--border)" />
        <line x1={cx} y1={0} x2={cx} y2={H} stroke="var(--border)" />
        {eps.map((e, i) => { const p = map(e); return <circle key={i} cx={cx + p[0] * sc} cy={cy - p[1] * sc} r={2} fill="var(--accent)" opacity={0.7} />; })}
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.5} points={circle.map((p) => `${cx + p[0] * sc},${cy - p[1] * sc}`).join(" ")} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        L = [[{L[0][0].toFixed(2)}, 0], [{L[1][0].toFixed(2)}, {L[1][1].toFixed(2)}]]; Σ = [[{(a * a).toFixed(2)}, {(rho * a * b).toFixed(2)}], [{(rho * a * b).toFixed(2)}, {(b * b).toFixed(2)}]]
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The same 300 standard normal pairs ε are reused for every setting; only the map x = L ε changes, with L the Cholesky
        factor of Σ. The red curve is the image of the circle of radius 2. Because each sample is a smooth function of σ₁,
        σ₂ and ρ with the noise held fixed, moving a slider moves every point continuously, which is what lets gradients pass
        through sampling.
      </figcaption>
    </figure>
  );
}
