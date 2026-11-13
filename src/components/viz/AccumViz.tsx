"use client";

import { useState } from "react";

type Fn = "jump" | "wave";

const FNS: Record<Fn, { label: string; f: (x: number) => number }> = {
  jump: { label: "a jump at 1", f: (x) => (x < 1 ? 0.4 : 1.2) },
  wave: { label: "1 + 0.6 sin 3x", f: (x) => 1 + 0.6 * Math.sin(3 * x) },
};

/** F(x) = ∫₀ˣ f accumulates area; its slope at x is f(x) wherever f is continuous, and it has a corner where f jumps. */
export function AccumViz() {
  const [fn, setFn] = useState<Fn>("jump");
  const [k, setK] = useState(14);
  const { f } = FNS[fn];
  const n = 400, B = 2;
  const xs = Array.from({ length: n + 1 }, (_, i) => (B * i) / n);
  const F: number[] = [0];
  for (let i = 1; i <= n; i++) F.push(F[i - 1] + ((f(xs[i - 1]) + f(xs[i])) / 2) * (B / n));
  const x0 = k / 20;
  const i0 = Math.round((x0 / B) * n);
  const W = 330, H1 = 90, H2 = 110;
  const X = (x: number) => 20 + (x / B) * (W - 36);
  const Y1 = (y: number) => H1 - 10 - (y / 1.7) * (H1 - 16);
  const Fmax = Math.max(...F);
  const Y2 = (y: number) => H1 + H2 - 10 - (y / Fmax) * (H2 - 20);
  const h = 0.05;
  const left = x0 > 0 ? (F[i0] - F[Math.max(0, i0 - 10)]) / ((i0 - Math.max(0, i0 - 10)) * (B / n)) : NaN;
  const right = x0 < B ? (F[Math.min(n, i0 + 10)] - F[i0]) / ((Math.min(n, i0 + 10) - i0) * (B / n)) : NaN;
  const area = xs.slice(0, i0 + 1).map((x) => `${X(x).toFixed(1)},${Y1(f(x)).toFixed(1)}`);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(FNS) as Fn[]).map((key) => (
          <button key={key} type="button" className="seg" aria-pressed={fn === key} onClick={() => setFn(key)}>{FNS[key].label}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          x = {x0.toFixed(2)}
          <input type="range" min={0} max={40} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="upper limit x" style={{ width: 160 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H1 + H2}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The function with the area up to x shaded, and below it the accumulated area as a function of x">
        <polygon points={[`${X(0)},${Y1(0)}`, ...area, `${X(x0)},${Y1(0)}`].join(" ")} fill="var(--accent)" opacity={0.25} />
        <line x1={X(0)} x2={X(B)} y1={Y1(0)} y2={Y1(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={xs.map((x) => `${X(x).toFixed(1)},${Y1(f(x)).toFixed(1)}`).join(" ")} />
        <text x={W - 16} y={14} textAnchor="end" className="viz-label">f</text>
        <line x1={X(0)} x2={X(B)} y1={Y2(0)} y2={Y2(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={xs.map((x, i) => `${X(x).toFixed(1)},${Y2(F[i]).toFixed(1)}`).join(" ")} />
        {!Number.isNaN(left) && <line x1={X(x0 - 0.3)} x2={X(x0)} y1={Y2(F[i0] - 0.3 * left)} y2={Y2(F[i0])} stroke="var(--danger)" strokeWidth={1.6} />}
        {!Number.isNaN(right) && <line x1={X(x0)} x2={X(x0 + 0.3)} y1={Y2(F[i0])} y2={Y2(F[i0] + 0.3 * right)} stroke="var(--danger)" strokeWidth={1.6} />}
        <circle cx={X(x0)} cy={Y2(F[i0])} r={3.5} fill="var(--danger)" />
        <text x={W - 16} y={H1 + 14} textAnchor="end" className="viz-label">F</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        F(x) = {F[i0].toFixed(3)}; slope from the left {Number.isNaN(left) ? "n/a" : left.toFixed(3)}, from the right {Number.isNaN(right) ? "n/a" : right.toFixed(3)}; f(x) = {f(x0).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded area up to x is F(x), plotted in the lower panel. The short segments show F&apos;s slope just to the left and
        right of x, measured over a width of {h}. Where f is continuous both equal f(x); at the jump they are the two
        one-sided values of f, and F has a corner there, though it remains continuous.
      </figcaption>
    </figure>
  );
}
