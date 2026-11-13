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
const N = 400;
function normals() {
  const r = makeRng(11);
  const out: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const rad = Math.sqrt(-2 * Math.log(1 - r()));
    const th = 2 * Math.PI * r();
    out.push([rad * Math.cos(th), rad * Math.sin(th)]);
  }
  return out;
}

type Pred = "const" | "line" | "cond";

/** Three predictors of Y from X: the best constant, the best line and the conditional mean, with MSE split into irreducible error plus distance from E[Y | X]. */
export function BestPredictorViz() {
  const base = useMemo(normals, []);
  const [curved, setCurved] = useState(true);
  const [pred, setPred] = useState<Pred>("line");
  const g = (x: number) => (curved ? x * x - 1 : 0.8 * x);
  const noise = curved ? 0.5 : 0.6;
  const pts = base.map(([x, z]) => [x, g(x) + noise * z] as [number, number]);
  const mx = pts.reduce((s, p) => s + p[0], 0) / N, my = pts.reduce((s, p) => s + p[1], 0) / N;
  let sxx = 0, sxy = 0;
  pts.forEach(([x, y]) => { sxx += (x - mx) * (x - mx); sxy += (x - mx) * (y - my); });
  const slope = sxy / sxx, icpt = my - slope * mx;
  const f = (x: number) => (pred === "const" ? my : pred === "line" ? icpt + slope * x : g(x));
  let total = 0, irr = 0, gap = 0;
  pts.forEach(([x, y]) => {
    total += (y - f(x)) * (y - f(x));
    irr += (y - g(x)) * (y - g(x));
    gap += (g(x) - f(x)) * (g(x) - f(x));
  });
  const W = 300, H = 230;
  const X = (x: number) => W / 2 + x * 42;
  const Y = (y: number) => (curved ? H - 40 - y * 26 : H / 2 - y * 34);
  const xs: number[] = [];
  for (let i = 0; i <= 60; i++) xs.push(-3.2 + (6.4 * i) / 60);
  const line = (h: (x: number) => number) => xs.map((x) => `${X(x).toFixed(1)},${Y(h(x)).toFixed(1)}`).join(" ");
  const btn = (k: Pred, label: string) => (
    <button type="button" className="seg" aria-pressed={pred === k} onClick={() => setPred(k)}>{label}</button>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={!curved} onClick={() => setCurved(false)}>Y = 0.8X + noise</button>
        <button type="button" className="seg" aria-pressed={curved} onClick={() => setCurved(true)}>Y = X² − 1 + noise</button>
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        {btn("const", "best constant")}
        {btn("line", "best line")}
        {btn("cond", "E[Y | X]")}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Scatter of X and Y with the chosen predictor">
        <defs>
          <clipPath id="bpv-clip"><rect x={0} y={0} width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#bpv-clip)">
          {pts.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={1.7} fill="var(--text-muted)" opacity={0.5} />)}
          <polyline fill="none" stroke="var(--border)" strokeWidth={1.4} strokeDasharray="4 3" points={line(g)} />
          <polyline fill="none" stroke="var(--accent)" strokeWidth={2.2} points={line(f)} />
        </g>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        MSE {(total / N).toFixed(3)} = irreducible {(irr / N).toFixed(3)} + gap {(gap / N).toFixed(3)} + cross {(Math.abs(total - irr - gap) / N < 0.0005 ? 0 : (total - irr - gap) / N).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dashed curve is E[Y | X]. Any predictor&apos;s mean squared error is the irreducible part E[(Y − E[Y | X])²] plus
        its mean squared distance from E[Y | X]; the cross term is zero in theory and only sampling noise here. For the
        straight-line relationship the best line is already E[Y | X]. For the parabola, X and X² are uncorrelated, so the
        best line is flat and no better than the constant, while E[Y | X] removes almost all the error.
      </figcaption>
    </figure>
  );
}
