"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const SD = 0.006, BASE = 2.3, MAXN = 20;

function draws() {
  const r = rand(79);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return { a: Array.from({ length: MAXN }, normal), b: Array.from({ length: MAXN }, normal) };
}
const { a, b } = draws();

/** Mean, sample standard deviation and Welch t for the first n seeds of each arm. */
export function compare(n: number, effect: number) {
  const x = a.slice(0, n).map((z) => BASE + SD * z);
  const y = b.slice(0, n).map((z) => BASE - effect + SD * z);
  const mean = (v: number[]) => v.reduce((s, t) => s + t, 0) / v.length;
  const sd = (v: number[]) => (v.length < 2 ? NaN : Math.sqrt(v.reduce((s, t) => s + (t - mean(v)) ** 2, 0) / (v.length - 1)));
  const mx = mean(x), my = mean(y);
  const t = n < 2 ? NaN : (mx - my) / Math.sqrt(sd(x) ** 2 / n + sd(y) ** 2 / n);
  return { x, y, mx, my, t };
}

export function SeedNoiseViz() {
  const [n, setN] = useState(1);
  const [effect, setEffect] = useState(0.002);
  const { x, y, mx, my, t } = compare(n, effect);
  const W = 330, H = 145, X0 = 70, PW = 250, Y1 = 35, Y2 = 85;
  const lo = BASE - 0.025, hi = BASE + 0.02;
  const px = (v: number) => X0 + ((v - lo) / (hi - lo)) * PW;
  const verdict = n < 2 ? "one seed each: no way to tell signal from noise" : Math.abs(t) > 2 ? "difference clears |t| > 2" : "difference is within the noise";
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Seeds per arm">
          {[1, 2, 5, 10, 20].map((v) => (
            <button key={v} className="seg" aria-pressed={n === v} onClick={() => setN(v)}>{v} seed{v > 1 ? "s" : ""}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="True improvement">
          {[0, 0.002, 0.005].map((v) => (
            <button key={v} className="seg" aria-pressed={effect === v} onClick={() => setEffect(v)}>gain {v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Final losses of baseline and variant runs over several seeds">
        {[2.28, 2.29, 2.3, 2.31].map((v) => (
          <g key={v}>
            <line x1={px(v)} x2={px(v)} y1={15} y2={H - 30} stroke="var(--border)" strokeWidth={0.5} />
            <text x={px(v)} y={H - 18} textAnchor="middle" className="viz-label">{v.toFixed(2)}</text>
          </g>
        ))}
        <text x={X0 - 8} y={Y1 + 4} textAnchor="end" className="viz-label">baseline</text>
        <text x={X0 - 8} y={Y2 + 4} textAnchor="end" className="viz-label">variant</text>
        {x.map((v, i) => <circle key={`a${i}`} cx={px(v)} cy={Y1} r={4} fill="var(--text-muted)" opacity={0.7} />)}
        {y.map((v, i) => <circle key={`b${i}`} cx={px(v)} cy={Y2} r={4} fill="var(--code-function)" opacity={0.7} />)}
        <line x1={px(mx)} x2={px(mx)} y1={Y1 - 12} y2={Y1 + 12} stroke="var(--text)" strokeWidth={2} />
        <line x1={px(my)} x2={px(my)} y1={Y2 - 12} y2={Y2 + 12} stroke="var(--accent)" strokeWidth={2} />
        <text x={X0} y={H - 2} className="viz-label">final loss (lower is better); bars: means</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {n} seed{n > 1 ? "s" : ""} per arm: variant − baseline = {(my - mx).toFixed(4)}
        {n > 1 ? `, Welch t = ${t.toFixed(2)}` : ""}; {verdict}
      </div>
      <figcaption className="viz-caption">
        Final losses of a baseline and a variant that differ only in the random seed, which sets initialisation and data
        order, with a seed-to-seed standard deviation of 0.006. With one run each, a variant with no true effect can look
        better or worse by as much as a real gain. Only with ten or more seeds per arm does a gain of 0.005 stand out from the
        noise; a gain of 0.002 needs more seeds than shown here.
      </figcaption>
    </figure>
  );
}
