"use client";

import { useState } from "react";

type Fn = "kink" | "wave" | "step";

const FNS: Record<Fn, { label: string; f: (x: number) => number; note: string }> = {
  kink: { label: "|x − 1/2|", f: (x) => Math.abs(x - 0.5), note: "the error is largest at the kink and shrinks like 1/√n" },
  wave: { label: "a continuous wave", f: (x) => 0.5 + 0.3 * Math.sin(9 * x) * (1 - x), note: "the polynomial lags behind the wiggles but catches up uniformly as n grows" },
  step: { label: "a jump at 1/2", f: (x) => (x < 0.5 ? 0.2 : 0.8), note: "f is not continuous, the sup error stays near 0.3 at the jump, and the theorem does not apply" },
};

const NS = [1, 2, 4, 8, 16, 32, 64, 128, 256];

function bern(f: (x: number) => number, n: number, x: number) {
  // binomial weights computed in log space for stability
  let s = 0;
  let logC = 0;
  for (let k = 0; k <= n; k++) {
    if (k > 0) logC += Math.log((n - k + 1) / k);
    const lw = logC + (k > 0 ? k * Math.log(x) : 0) + (n - k > 0 ? (n - k) * Math.log(1 - x) : 0);
    s += f(k / n) * Math.exp(lw);
  }
  return s;
}

/** Bernstein polynomials of a continuous function: averages of f at k/n with binomial weights, converging uniformly to f. */
export function BernsteinViz() {
  const [fn, setFn] = useState<Fn>("kink");
  const [j, setJ] = useState(4);
  const n = NS[j];
  const { f, note } = FNS[fn];
  const xs = Array.from({ length: 201 }, (_, i) => i / 200);
  const bs = xs.map((x) => (x === 0 ? f(0) : x === 1 ? f(1) : bern(f, n, x)));
  const err = Math.max(...xs.map((x, i) => Math.abs(bs[i] - f(x))));
  const W = 330, H = 160;
  const X = (x: number) => 16 + x * (W - 32);
  const Y = (y: number) => H - 14 - y * (H - 24);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(FNS) as Fn[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={fn === k} onClick={() => setFn(k)}>{FNS[k].label}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          n = {n}
          <input type="range" min={0} max={NS.length - 1} value={j} onChange={(e) => setJ(Number(e.target.value))} aria-label="degree n" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The function and its Bernstein polynomial of degree n">
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={2} points={xs.map((x) => `${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`).join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.6} strokeDasharray="5 3" points={xs.map((x, i) => `${X(x).toFixed(1)},${Y(bs[i]).toFixed(1)}`).join(" ")} />
        {Array.from({ length: Math.min(n, 64) + 1 }, (_, k) => k / Math.min(n, 64)).map((t, i) => (
          <circle key={i} cx={X(t)} cy={Y(f(t))} r={1.6} fill="var(--danger)" />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        sup |Bₙf − f| ≈ {err.toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The solid curve is f, the dashed curve its Bernstein polynomial Bₙf(x) = Σ f(k/n) C(n, k) xᵏ(1 − x)ⁿ⁻ᵏ, and the dots
        are the sample values f(k/n) it averages (at most 65 are drawn). The weights are the binomial probabilities of k
        successes in n trials, which concentrate near k/n = x. Here {note}.
      </figcaption>
    </figure>
  );
}
