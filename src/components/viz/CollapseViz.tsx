"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const NS = [10, 50, 200];
const GENS = 100;
const CHAINS = 5;

/** Variance of the fitted Gaussian over generations; "replace" refits on fresh samples only, "accumulate" on all data so far. */
export function collapseRun(n: number, accumulate: boolean, seed: number) {
  const rng = rand(seed);
  const normal = () =>
    Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  let mu = 0,
    v = 1;
  let cnt = 0,
    s = 0,
    ss = 0;
  const out = [v];
  for (let g = 0; g < GENS; g++) {
    if (!accumulate) {
      cnt = 0;
      s = 0;
      ss = 0;
    }
    for (let i = 0; i < n; i++) {
      const x = mu + Math.sqrt(v) * normal();
      cnt++;
      s += x;
      ss += x * x;
    }
    mu = s / cnt;
    v = Math.max(ss / cnt - mu * mu, 1e-12);
    out.push(v);
  }
  return out;
}

export function CollapseViz() {
  const [ni, setNi] = useState(0);
  const [acc, setAcc] = useState(false);
  const n = NS[ni];
  const runs = Array.from({ length: CHAINS }, (_, c) =>
    collapseRun(n, acc, 900 + 17 * c + ni),
  );
  const finals = runs.map((r) => r[GENS]).sort((a, b) => a - b);
  const W = 330,
    X0 = 38,
    Y0 = 8,
    PW = 282,
    PH = 130,
    LO = -12,
    HI = 1;
  const x = (g: number) => X0 + (g / GENS) * PW;
  const y = (v: number) =>
    Y0 + ((HI - Math.min(HI, Math.max(LO, Math.log10(v)))) / (HI - LO)) * PH;
  const fmt = (v: number) => (v < 0.01 ? v.toExponential(1) : v.toFixed(2));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div
          className="segmented"
          role="group"
          aria-label="Samples per generation"
        >
          {NS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={ni === j}
              onClick={() => setNi(j)}
            >{`n = ${v}`}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Data policy">
          {[false, true].map((a) => (
            <button
              key={String(a)}
              type="button"
              className="seg"
              aria-pressed={acc === a}
              onClick={() => setAcc(a)}
            >
              {a ? "accumulate" : "replace"}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + PH + 18}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Fitted variance over generations"
      >
        {[-12, -8, -4, 0].map((e) => (
          <g key={e}>
            <line
              x1={X0}
              x2={X0 + PW}
              y1={y(10 ** e)}
              y2={y(10 ** e)}
              stroke="var(--border)"
            />
            <text
              x={X0 - 5}
              y={y(10 ** e) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {e === 0 ? "1" : `1e${e}`}
            </text>
          </g>
        ))}
        {runs.map((r, c) => (
          <polyline
            key={c}
            points={r.map((v, g) => `${x(g)},${y(v)}`).join(" ")}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.4}
            opacity={0.75}
          />
        ))}
        <text
          x={X0 + PW}
          y={Y0 + PH + 13}
          textAnchor="end"
          className="viz-label"
        >
          generation
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        variance after {GENS} generations: median {fmt(finals[2])}, range{" "}
        {fmt(finals[0])} to {fmt(finals[CHAINS - 1])}
      </div>
      <figcaption className="viz-caption">
        Five chains that start from a standard normal and, each generation, fit
        a Gaussian to n samples drawn from the previous fit. Replacing the data
        with each generation&apos;s samples lets the variance drift towards
        zero, faster for small n; accumulating all generations&apos; data keeps
        it from collapsing. The vertical axis is logarithmic.
      </figcaption>
    </figure>
  );
}
