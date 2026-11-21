"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const T = 1000,
  MUS = [-1, 1.5],
  WS = [0.5, 0.5],
  S0 = 0.1;

/** Cumulative signal fractions abar_t, t = 1..T, for the linear or cosine schedule. */
export function schedule(kind: "linear" | "cosine") {
  const ab: number[] = [];
  if (kind === "linear") {
    let a = 1;
    for (let t = 0; t < T; t++) {
      a *= 1 - (1e-4 + ((0.02 - 1e-4) * t) / (T - 1));
      ab.push(a);
    }
  } else {
    const f = (t: number) =>
      Math.cos(((t / T + 0.008) / 1.008) * (Math.PI / 2)) ** 2;
    for (let t = 1; t <= T; t++) ab.push(Math.max(f(t) / f(0), 1e-5));
  }
  return ab;
}

/** Exact E[x_0 | x_t] for the two-bump data mixture. */
export function denoise(x: number, a: number) {
  const vs = a * S0 * S0 + 1 - a;
  const l = MUS.map(
    (m, k) => Math.log(WS[k]) - (x - Math.sqrt(a) * m) ** 2 / (2 * vs),
  );
  const mx = Math.max(...l),
    w = l.map((v) => Math.exp(v - mx)),
    z = w[0] + w[1];
  return MUS.reduce(
    (s, m, k) =>
      s +
      (w[k] / z) *
        (m + ((Math.sqrt(a) * S0 * S0) / vs) * (x - Math.sqrt(a) * m)),
    0,
  );
}

/** Forward noising and reverse ancestral sampling paths, recorded every 10 steps (index 0 is t = 0). */
export function paths(
  kind: "linear" | "cosine",
  dir: "forward" | "reverse",
  n: number,
  seed: number,
) {
  const ab = schedule(kind),
    r = rand(seed);
  const nrm = () =>
    Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    const rec = new Array(T / 10 + 1).fill(0);
    if (dir === "forward") {
      let x = MUS[r() < WS[0] ? 0 : 1] + S0 * nrm();
      rec[0] = x;
      for (let t = 1; t <= T; t++) {
        const b = 1 - ab[t - 1] / (t > 1 ? ab[t - 2] : 1);
        x = Math.sqrt(1 - b) * x + Math.sqrt(b) * nrm();
        if (t % 10 === 0) rec[t / 10] = x;
      }
    } else {
      let x = nrm();
      rec[T / 10] = x;
      for (let t = T; t >= 1; t--) {
        const a = ab[t - 1],
          ap = t > 1 ? ab[t - 2] : 1,
          b = 1 - a / ap;
        const x0 = denoise(x, a);
        const mean =
          ((Math.sqrt(ap) * b) / (1 - a)) * x0 +
          ((Math.sqrt(1 - b) * (1 - ap)) / (1 - a)) * x;
        x = mean + (t > 1 ? Math.sqrt(((1 - ap) / (1 - a)) * b) * nrm() : 0);
        if ((t - 1) % 10 === 0) rec[(t - 1) / 10] = x;
      }
    }
    out.push(rec);
  }
  return out;
}

export function DdpmChainViz() {
  const [kind, setKind] = useState<"linear" | "cosine">("linear");
  const [dir, setDir] = useState<"forward" | "reverse">("reverse");
  const [seed, setSeed] = useState(1);
  const ps = useMemo(() => paths(kind, dir, 120, seed), [kind, dir, seed]);
  const ab = useMemo(() => schedule(kind), [kind]);
  const W = 340,
    H = 230,
    X0 = 28,
    PW = 250,
    Y0 = 10,
    PH = 150,
    YM = 3.2;
  const sx = (k: number) =>
    X0 + (dir === "forward" ? k / (T / 10) : 1 - k / (T / 10)) * PW;
  const sy = (y: number) =>
    Y0 + PH / 2 - (Math.max(-YM, Math.min(YM, y)) / YM) * (PH / 2);
  const end = ps.map((p) => p[dir === "forward" ? T / 10 : 0]);
  const bins = Array.from({ length: 32 }, (_, i) => -YM + (i * 2 * YM) / 32);
  const counts = bins.map(
    (b) => end.filter((v) => v >= b && v < b + (2 * YM) / 32).length,
  );
  const cm = Math.max(...counts, 1);
  const SY = Y0 + PH + 22,
    SH = 38;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <div className="segmented" role="group" aria-label="Direction">
          {(["forward", "reverse"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={dir === v}
              onClick={() => setDir(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Schedule">
          {(["linear", "cosine"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={kind === v}
              onClick={() => setKind(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>
          resample
        </button>
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
        aria-label="Diffusion paths over time"
      >
        <rect
          x={X0}
          y={Y0}
          width={PW}
          height={PH}
          fill="none"
          stroke="var(--border)"
        />
        {[-2, 0, 2].map((t) => (
          <g key={t}>
            <line
              x1={X0}
              x2={X0 + PW}
              y1={sy(t)}
              y2={sy(t)}
              stroke="var(--grid-line)"
            />
            <text
              x={X0 - 4}
              y={sy(t) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {t}
            </text>
          </g>
        ))}
        {ps.map((p, i) => (
          <path
            key={i}
            d={p
              .map(
                (y, k) =>
                  `${k ? "L" : "M"}${sx(k).toFixed(1)},${sy(y).toFixed(1)}`,
              )
              .join(" ")}
            fill="none"
            stroke="var(--accent)"
            strokeOpacity={0.22}
            strokeWidth={0.8}
          />
        ))}
        {counts.map((c, i) => (
          <rect
            key={i}
            x={X0 + PW + 2}
            y={sy(bins[i] + (2 * YM) / 32)}
            width={(c / cm) * 44}
            height={(PH / 32) * 0.9}
            fill={dir === "forward" ? "var(--accent)" : "var(--success)"}
            fillOpacity={0.7}
          />
        ))}
        <text
          x={X0 + PW + 24}
          y={Y0 + PH + 12}
          textAnchor="middle"
          className="viz-label"
        >
          {dir === "forward" ? "x at t = T" : "x at t = 0"}
        </text>
        <path
          d={ab
            .filter((_, k) => k % 10 === 9)
            .map(
              (a, k) =>
                `${k ? "L" : "M"}${sx(k + 1).toFixed(1)},${(SY + SH - a * SH).toFixed(1)}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={1.5}
        />
        <line
          x1={X0}
          x2={X0 + PW}
          y1={SY + SH}
          y2={SY + SH}
          stroke="var(--border-strong)"
        />
        <text x={X0 - 4} y={SY + 4} textAnchor="end" className="viz-label">
          1
        </text>
        <text x={X0 - 4} y={SY + SH + 4} textAnchor="end" className="viz-label">
          0
        </text>
        <text x={X0 + PW + 4} y={SY + 14} className="viz-label">
          ᾱ
        </text>
        <text x={X0} y={H - 1} className="viz-label">
          {dir === "forward" ? "t = 0" : "t = T"}
        </text>
        <text x={X0 + PW} y={H - 1} textAnchor="end" className="viz-label">
          {dir === "forward" ? "t = T" : "t = 0"}
        </text>
      </svg>
      <figcaption className="viz-caption">
        Data sit in two narrow bumps at −1 and 1.5. Forward: each path is noised
        step by step for T = 1000 steps until it looks like a draw from N(0, 1).
        Reverse: paths start from N(0, 1) at t = T and run the ancestral sampler
        with the exact denoiser of this data, so time runs from T on the left to
        0 on the right; the histogram on the right shows where they land. The
        grey curve below is ᾱ, the signal fraction remaining. The cosine
        schedule keeps more signal early on and destroys it more evenly.
      </figcaption>
    </figure>
  );
}
