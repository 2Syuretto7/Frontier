"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

/** Per-token probability of the right answer token at log10 compute x. */
export function tokenP(x: number) {
  return 1 - 0.5 * Math.pow(10, -0.25 * (x - 18));
}

type Metric = "exact" | "token";

/** Measured score for each compute level: a binomial sample of `n` items with the metric's true rate. */
export function measure(xs: number[], metric: Metric, len: number, n: number, seed = 5) {
  const r = rand(seed);
  return xs.map((x) => {
    const rate = metric === "exact" ? Math.pow(tokenP(x), len) : tokenP(x);
    let k = 0;
    for (let i = 0; i < n; i++) if (r() < rate) k++;
    return { rate, measured: k / n };
  });
}

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", ".": "·" };
const sup = (x: number) => "10" + String(x).split("").map((c) => SUP[c] ?? c).join("");

export function EmergenceViz() {
  const [metric, setMetric] = useState<Metric>("exact");
  const [len, setLen] = useState(20);
  const [n, setN] = useState(100);
  const xs = useMemo(() => Array.from({ length: 13 }, (_, i) => 18 + i * 0.5), []);
  const pts = useMemo(() => measure(xs, metric, len, n), [xs, metric, len, n]);
  const W = 330, H = 210, X0 = 34, PW = 286, Y0 = 8, PH = 160;
  const px = (x: number) => X0 + ((x - 18) / 6) * PW;
  const py = (v: number) => Y0 + PH - v * PH;
  const fine = Array.from({ length: 121 }, (_, i) => 18 + i * 0.05);
  const curve = fine.map((x) => `${px(x).toFixed(1)},${py(metric === "exact" ? Math.pow(tokenP(x), len) : tokenP(x)).toFixed(1)}`).join(" ");
  const firstNonZero = pts.findIndex((p) => p.measured > 0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Metric">
          {(["exact", "token"] as Metric[]).map((m) => (
            <button key={m} className="seg" aria-pressed={metric === m} onClick={() => setMetric(m)}>{m === "exact" ? "exact match" : "per-token accuracy"}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Answer length">
          {[5, 20].map((l) => (
            <button key={l} className="seg" aria-pressed={len === l} onClick={() => setLen(l)}>{l} tokens</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Benchmark size">
          {[100, 10000].map((m) => (
            <button key={m} className="seg" aria-pressed={n === m} onClick={() => setN(m)}>{m.toLocaleString("en-IN")} items</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Benchmark score against training compute">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {[18, 20, 22, 24].map((x) => (
          <text key={x} x={px(x)} y={Y0 + PH + 14} textAnchor={x === 24 ? "end" : x === 18 ? "start" : "middle"} className="viz-label">{sup(x)}</text>
        ))}
        <polyline points={curve} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
        {pts.map((p, i) => (
          <circle key={i} cx={px(xs[i])} cy={py(p.measured)} r={3.2} style={{ fill: p.measured === 0 ? "var(--danger)" : "var(--accent)" }} />
        ))}
        <text x={X0} y={H - 4} className="viz-label">training FLOPs; dashed: true rate; red: measured zero</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {firstNonZero <= 0 ? "every model scores above zero" : `measured zero up to ${sup(xs[firstNonZero - 1])} FLOPs, then ${pts[firstNonZero].measured.toFixed(2)}`}
      </div>
      <figcaption className="viz-caption">
        The model&apos;s per-token probability of the right answer rises smoothly with compute. Exact match on a long answer
        multiplies those probabilities, so it stays near zero and then climbs steeply; on a small benchmark the early rates are
        too small to register at all, and the ability seems to appear from nothing. Per-token accuracy on the same models, or a
        larger benchmark, shows the smooth trend underneath.
      </figcaption>
    </figure>
  );
}
