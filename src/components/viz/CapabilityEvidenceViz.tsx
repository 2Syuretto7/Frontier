"use client";

import { useState } from "react";

function pmf(n: number, p: number) {
  const out: number[] = [];
  let c = 1;
  for (let i = 0; i <= n; i++) {
    out.push(c * p ** i * (1 - p) ** (n - i));
    c = (c * (n - i)) / (i + 1);
  }
  return out;
}

/** P(X <= s) for X ~ Binomial(n, p). */
export function binomCdf(s: number, n: number, p: number) {
  return pmf(n, p)
    .slice(0, s + 1)
    .reduce((a, b) => a + b, 0);
}

/** Largest rate p not ruled out at level alpha by s successes in n tasks. */
export function upperBound(s: number, n: number, alpha = 0.05) {
  if (s >= n) return 1;
  let lo = 0,
    hi = 1;
  for (let it = 0; it < 50; it++) {
    const mid = (lo + hi) / 2;
    if (binomCdf(s, n, mid) > alpha) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function CapabilityEvidenceViz() {
  const [n, setN] = useState(20);
  const [s0, setS] = useState(1);
  const [pi, setPi] = useState(15);
  const s = Math.min(s0, n);
  const p0 = pi / 100;
  const probs = pmf(n, p0);
  const tail = binomCdf(s, n, p0);
  const ub = upperBound(s, n);
  const ruled = tail <= 0.05;
  const W = 330,
    H = 190,
    x0 = 34,
    y0 = 10,
    pw = 284,
    ph = 140;
  const shown = Math.min(n, 40);
  const ymax = Math.max(...probs.slice(0, shown + 1), 0.05);
  const bw = pw / (shown + 1);
  const sy = (v: number) => y0 + (1 - v / ymax) * ph;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          tasks: {n}{" "}
          <input
            type="range"
            min={5}
            max={80}
            value={n}
            onChange={(e) => setN(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          successes: {s}{" "}
          <input
            type="range"
            min={0}
            max={Math.min(10, n)}
            value={s}
            onChange={(e) => setS(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          threshold rate: {p0.toFixed(2)}{" "}
          <input
            type="range"
            min={5}
            max={40}
            value={pi}
            onChange={(e) => setPi(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Distribution of successes for a model exactly at the threshold, with the observed tail shaded"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {probs.slice(0, shown + 1).map((v, i) => (
          <rect
            key={i}
            x={x0 + i * bw + 1}
            y={sy(v)}
            width={Math.max(bw - 2, 1)}
            height={y0 + ph - sy(v)}
            fill={i <= s ? "var(--danger)" : "var(--accent)"}
            opacity={i <= s ? 0.9 : 0.5}
          />
        ))}
        {[0, Math.floor(shown / 2), shown].map((i) => (
          <text
            key={i}
            x={x0 + i * bw + bw / 2}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {i}
          </text>
        ))}
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          successes if the model were exactly at the threshold
        </text>
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Chance of {s} or fewer successes at the threshold: {tail.toFixed(3)}.
        95% upper bound on the true rate: {ub.toFixed(3)}.
      </p>
      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          margin: "4px 0 0",
          color: ruled ? "var(--success)" : "var(--danger)",
        }}
      >
        {ruled
          ? "The evaluation rules out the threshold at the 5% level."
          : "The evaluation cannot rule out that the model is at the threshold."}
      </p>
      <figcaption className="viz-caption">
        The bars show how many tasks a model whose true success rate equals the
        threshold would solve. The shaded tail is the observed count or fewer.
        Only when that tail is small does a low score count as evidence that the
        model is below the threshold; with few tasks, even zero successes leaves
        the threshold plausible.
      </figcaption>
    </figure>
  );
}
