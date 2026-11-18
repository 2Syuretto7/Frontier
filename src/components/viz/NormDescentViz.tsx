"use client";

import { useMemo, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const D = 100, T = 200;
const PROFILES: Record<string, number[]> = {
  "one stiff": Array.from({ length: D }, (_, i) => (i === 0 ? 100 : 1)),
  spread: Array.from({ length: D }, (_, i) => 1 + i),
  uniform: Array.from({ length: D }, () => 1),
};

/** Loss of steepest descent on ½Σhᵢxᵢ² under ℓ₂, ℓ∞ and ℓ₁, each with step (dual norm of g) / L for that norm's smoothness constant. */
export function normRuns(h: number[]) {
  const normal = makeNormal(makeRng(3));
  const x0 = Array.from({ length: D }, () => normal());
  const sumH = h.reduce((a, b) => a + b, 0), maxH = Math.max(...h);
  const loss = (x: number[]) => 0.5 * x.reduce((s, v, i) => s + h[i] * v * v, 0);
  const run = (p: "l2" | "linf" | "l1") => {
    let x = x0.slice();
    const out = [loss(x)];
    for (let t = 0; t < T; t++) {
      const g = x.map((v, i) => h[i] * v);
      if (p === "l2") x = x.map((v, i) => v - g[i] / maxH);
      else if (p === "linf") {
        const g1 = g.reduce((s, v) => s + Math.abs(v), 0);
        x = x.map((v, i) => v - (g1 / sumH) * Math.sign(g[i]));
      } else {
        let k = 0;
        g.forEach((v, i) => { if (Math.abs(v) > Math.abs(g[k])) k = i; });
        x = x.slice();
        x[k] -= g[k] / maxH;
      }
      out.push(loss(x));
    }
    return out;
  };
  return { l2: run("l2"), linf: run("linf"), l1: run("l1") };
}

export function NormDescentViz() {
  const [prof, setProf] = useState("one stiff");
  const r = useMemo(() => normRuns(PROFILES[prof]), [prof]);
  const W = 300, H = 160, X0 = 34, PW = W - 42, PH = 136;
  const top = Math.ceil(Math.log10(r.l2[0])), bot = top - 8;
  const sx = (t: number) => X0 + (t / T) * PW;
  const sy = (f: number) => 8 + ((top - Math.max(bot, Math.log10(Math.max(f, 1e-300)))) / (top - bot)) * PH;
  const line = (a: number[]) => a.map((f, t) => `${sx(t)},${sy(f)}`).join(" ");
  const fmt = (v: number) => (v < 1e-3 ? v.toExponential(1) : v.toFixed(3));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">curvatures hᵢ</span>
        {Object.keys(PROFILES).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={prof === k} onClick={() => setProf(k)}>{k}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Loss curves of steepest descent under three norms on a 100-dimensional quadratic">
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(r.l2)} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={line(r.linf)} />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="4 3" points={line(r.l1)} />
        {[0, 50, 100, 150, 200].map((t) => (
          <text key={t} x={sx(t)} y={H + 12} textAnchor="middle" className="viz-label">{t}</text>
        ))}
        {[top, top - 4, bot].map((e) => (
          <text key={e} x={X0 - 4} y={sy(10 ** e) + 4} textAnchor="end" className="viz-label">{`1e${e}`}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`loss after 20 steps: ℓ₂ ${fmt(r.l2[20])}, ℓ∞ ${fmt(r.linf[20])}, ℓ₁ ${fmt(r.l1[20])}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Steepest descent on a 100-dimensional quadratic from the same random start, under the ℓ₂ norm (gradient descent,
        blue), the ℓ∞ norm (sign descent, red) and the ℓ₁ norm (greedy coordinate descent, grey), each with the step its
        own smoothness constant allows. With one stiff direction, ℓ∞ smoothness (Σhᵢ = 199) is barely worse than ℓ₂ (max
        hᵢ = 100) while its dual norm ‖g‖₁ is much larger, and sign descent wins by a wide margin. With uniform
        curvature, ℓ₂ finishes in one step.
      </figcaption>
    </figure>
  );
}
