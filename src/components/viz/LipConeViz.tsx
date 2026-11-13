"use client";

import { useState } from "react";

type Fn = "sin" | "abs" | "sqrt";

const FNS: Record<Fn, { label: string; f: (x: number) => number; lo: number; hi: number; L: string }> = {
  sin: { label: "sin 2x", f: (x) => Math.sin(2 * x), lo: -1.5, hi: 1.5, L: "2" },
  abs: { label: "|x|", f: (x) => Math.abs(x), lo: -1.5, hi: 1.5, L: "1" },
  sqrt: { label: "√x on [0, 1.5]", f: (x) => Math.sqrt(x), lo: 0, hi: 1.5, L: "none" },
};

/** A double cone of slopes ±K at a point c: f is K-Lipschitz exactly when its graph stays inside the cone wherever the cone is placed. */
export function LipConeViz() {
  const [fn, setFn] = useState<Fn>("sin");
  const [ci, setCi] = useState(10);
  const [k, setK] = useState(15);
  const { f, lo, hi, L } = FNS[fn];
  const K = k / 10;
  const c = lo + ((hi - lo) * ci) / 30;
  const W = 330, H = 180, ylo = -1.6, yhi = 1.6;
  const X = (x: number) => 12 + ((x - lo) / (hi - lo)) * (W - 24);
  const Y = (y: number) => 10 + ((yhi - y) / (yhi - ylo)) * (H - 20);
  const xs = Array.from({ length: 301 }, (_, i) => lo + ((hi - lo) * i) / 300);
  const fc = f(c);
  const outside = xs.filter((x) => Math.abs(f(x) - fc) > K * Math.abs(x - c) + 1e-12);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(FNS) as Fn[]).map((key) => (
          <button key={key} type="button" className="seg" aria-pressed={fn === key} onClick={() => setFn(key)}>{FNS[key].label}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          c = {c.toFixed(2)}
          <input type="range" min={0} max={30} value={ci} onChange={(e) => setCi(Number(e.target.value))} aria-label="cone apex" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          K = {K.toFixed(1)}
          <input type="range" min={1} max={40} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="cone slope" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Graph of the function with a cone of slopes plus and minus K at the chosen point">
        <polygon
          points={[
            `${X(lo)},${Y(fc + K * (c - lo))}`, `${X(c)},${Y(fc)}`, `${X(hi)},${Y(fc + K * (hi - c))}`,
            `${X(hi)},${Y(fc - K * (hi - c))}`, `${X(c)},${Y(fc)}`, `${X(lo)},${Y(fc - K * (c - lo))}`,
          ].join(" ")}
          fill="var(--accent)" opacity={0.12}
        />
        <line x1={12} x2={W - 12} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={xs.map((x) => `${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`).join(" ")} />
        {outside.map((x, i) => <circle key={i} cx={X(x)} cy={Y(f(x))} r={1.8} fill="var(--danger)" />)}
        <circle cx={X(c)} cy={Y(fc)} r={4} fill="var(--accent)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {outside.length === 0 ? "graph inside the cone at this c" : `${outside.length} sampled points outside the cone`}; best Lipschitz constant: {L}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded region is |y − f(c)| ≤ K|x − c|. f is K-Lipschitz when the graph stays in the shaded region for every
        choice of c; points that leave it are marked. sin 2x needs K ≥ 2 and |x| needs K ≥ 1. For √x, put c at 0: the graph
        escapes every cone, however steep, because its slope near 0 is unbounded, even though √x is uniformly continuous.
      </figcaption>
    </figure>
  );
}
