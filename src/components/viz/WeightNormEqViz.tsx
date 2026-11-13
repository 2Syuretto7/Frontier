"use client";

import { useMemo, useState } from "react";

const D = 20, STEPS = 3000, LR = 0.1, C = 1;

function gauss(seed: number) {
  let a = seed >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
}

const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));

/** Norm of a scale-invariant weight vector under SGD with weight decay, from three starting sizes. */
export function WeightNormEqViz() {
  const [wdExp, setWdExp] = useState(-2);
  const wd = 10 ** wdExp;
  const runs = useMemo(() => {
    const r = gauss(4);
    return [0.1, 1, 10].map((n0) => {
      let w = Array.from({ length: D }, () => n0 / Math.sqrt(D));
      const out: number[] = [];
      for (let t = 0; t <= STEPS; t++) {
        const nw = norm(w);
        if (t % 10 === 0) out.push(nw);
        let g = Array.from({ length: D }, () => r());
        const dot = g.reduce((s, v, i) => s + v * w[i], 0) / (nw * nw);
        g = g.map((v, i) => v - dot * w[i]);
        const ng = norm(g);
        w = w.map((v, i) => v - LR * ((C / nw) * (g[i] / ng) + wd * v));
      }
      return out;
    });
  }, [wd]);
  const eq = (LR * C * C / (2 * wd)) ** 0.25;
  const W = 320, H = 170;
  const px = (i: number) => 34 + (i / (STEPS / 10)) * (W - 44);
  const py = (n: number) => 10 + ((1.5 - Math.max(-1.5, Math.min(1.5, Math.log10(n)))) / 3) * (H - 34);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          weight decay λ = {wd.toExponential(1)}
          <input type="range" min={-2.5} max={-1} step={0.1} value={wdExp} onChange={(e) => setWdExp(Number(e.target.value))} aria-label="weight decay, log scale" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Weight norm against step, log scale">
        {[1, 0, -1].map((e) => (
          <g key={e}>
            <line x1={34} x2={W - 10} y1={py(10 ** e)} y2={py(10 ** e)} stroke="var(--border)" />
            <text x={30} y={py(10 ** e) + 4} textAnchor="end" className="viz-label">{10 ** e}</text>
          </g>
        ))}
        {[0, 1000, 2000, 3000].map((t) => <text key={t} x={px(t / 10)} y={H - 8} textAnchor="middle" className="viz-label">{t}</text>)}
        <line x1={34} x2={W - 10} y1={py(eq)} y2={py(eq)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        {runs.map((r, k) => (
          <polyline key={k} fill="none" stroke="var(--accent)" strokeWidth={2} points={r.map((n, i) => `${px(i).toFixed(1)},${py(n).toFixed(1)}`).join(" ")} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        equilibrium ‖w‖ = (ηc²/2λ)^¼ = {eq.toFixed(2)}, angular step √(2ηλ) = {Math.sqrt(2 * LR * wd).toFixed(3)} rad
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The weight feeds a normalisation layer, so its gradient is orthogonal to it and has size c/‖w‖. Gradient steps push
        the norm up, decay pulls it down, and from any start the norm settles where the two balance (dashed). There each
        step turns w by about √(2ηλ) radians, whatever c is: weight decay is really setting the effective learning rate.
      </figcaption>
    </figure>
  );
}
