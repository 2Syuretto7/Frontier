"use client";

import { useState } from "react";

const FNS = [
  { label: "x²/2", f: (x: number) => (x * x) / 2 },
  { label: "eˣ", f: Math.exp },
  { label: "|x|", f: Math.abs },
  { label: "x⁴ − 2x²", f: (x: number) => x ** 4 - 2 * x * x },
];

const XS = Array.from({ length: 401 }, (_, i) => -2 + i / 100);

/** The convex conjugate as the intercept of the highest line of slope y lying below the graph of f. */
export function ConjugateViz() {
  const [k, setK] = useState(0);
  const [y, setY] = useState(1);
  const { f, label } = FNS[k];
  const fv = XS.map(f);
  const conj = (s: number) => {
    let best = -Infinity, arg = 0;
    XS.forEach((x, i) => { const v = s * x - fv[i]; if (v > best) { best = v; arg = x; } });
    return { val: best, arg };
  };
  const { val, arg } = conj(y);
  const ys = Array.from({ length: 121 }, (_, i) => -3 + i / 20);
  const cs = ys.map((s) => conj(s).val);
  const W = 330, H = 190, half = 165;
  const ylo = -2, yhi = 4;
  const X1 = (x: number) => 10 + ((x + 2) / 4) * (half - 20);
  const Y = (v: number) => H - 14 - ((Math.min(Math.max(v, ylo), yhi) - ylo) / (yhi - ylo)) * (H - 24);
  const X2 = (s: number) => half + 10 + ((s + 3) / 6) * (half - 20);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {FNS.map((g, i) => (
          <button key={g.label} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{g.label}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          slope y = {y.toFixed(1)}
          <input type="range" min={-3} max={3} step={0.1} value={y} onChange={(e) => setY(Number(e.target.value))} aria-label="slope" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="A function with its supporting line, and its conjugate">
        <defs>
          <clipPath id="cj-left"><rect x={0} y={0} width={half} height={H} /></clipPath>
        </defs>
        <line x1={half} x2={half} y1={6} y2={H - 6} stroke="var(--border)" />
        <g clipPath="url(#cj-left)">
          <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={XS.map((x, i) => `${X1(x).toFixed(1)},${Y(fv[i]).toFixed(1)}`).join(" ")} />
          {Number.isFinite(val) && <line x1={X1(-2)} y1={Y(-2 * y - val)} x2={X1(2)} y2={Y(2 * y - val)} stroke="var(--danger)" strokeWidth={1.4} />}
          <circle cx={X1(arg)} cy={Y(f(arg))} r={3} fill="var(--danger)" />
        </g>
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={ys.map((s, i) => `${X2(s).toFixed(1)},${Y(cs[i]).toFixed(1)}`).join(" ")} />
        <circle cx={X2(y)} cy={Y(val)} r={3} fill="var(--danger)" />
        <text x={10} y={14} className="viz-label">f(x), and the line yx − f*(y)</text>
        <text x={half + 10} y={14} className="viz-label">f*(y)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {label}: f*({y.toFixed(1)}) = {val > 1e6 ? "very large" : (val + 0).toFixed(3)}, attained at x = {(arg + 0).toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        On the left, the red line has slope y and is pushed up until it touches the graph from below; its intercept is
        −f*(y), so f*(y) = sup over x of (yx − f(x)). On the right is f* as y varies (computed on x in [−2, 2]). For x²/2 the
        conjugate is y²/2 again, and the touching point is x = y. For |x| it is 0 for |y| ≤ 1. Where the true conjugate is +∞ (|x| with
        |y| &gt; 1, or eˣ with y &lt; 0) the bounded grid shows steeply growing finite values instead. For x⁴ − 2x² the lines only touch the outer parts of the graph, and the
        conjugate cannot see the dip in the middle.
      </figcaption>
    </figure>
  );
}
