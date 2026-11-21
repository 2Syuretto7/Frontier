"use client";

import { useMemo, useState } from "react";
import { schedule } from "./DdpmChainViz";
import { rand } from "./RandomWalkMcViz";

const MUS = [-1, 1.5],
  S0 = 0.4;

/** Exact E[x_0 | x_t] for two equal bumps N(-1, 0.4^2) and N(1.5, 0.4^2). */
export function denoiseWide(x: number, a: number) {
  const vs = a * S0 * S0 + 1 - a;
  const l = MUS.map((m) => -((x - Math.sqrt(a) * m) ** 2) / (2 * vs));
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

/** DDIM sampling with S evenly spaced steps of the linear schedule; paths (index 0 is the start) and the
 * Wasserstein-1 distance of the end points from a reference sample of the data. */
export function ddimRun(S: number, eta: number, n: number, seed: number) {
  const ab = schedule("linear"),
    g = rand(seed);
  const nrm = () =>
    Math.sqrt(-2 * Math.log(1 - g())) * Math.cos(2 * Math.PI * g());
  const ts = Array.from({ length: S + 1 }, (_, i) =>
    Math.round(1000 - (i * 1000) / S),
  );
  const paths: number[][] = [];
  for (let j = 0; j < n; j++) {
    let x = nrm();
    const p = [x];
    for (let i = 0; i < S; i++) {
      const a = ab[ts[i] - 1],
        ap = ts[i + 1] > 0 ? ab[ts[i + 1] - 1] : 1;
      const x0 = denoiseWide(x, a),
        eps = (x - Math.sqrt(a) * x0) / Math.sqrt(1 - a);
      const sg = eta * Math.sqrt(((1 - ap) / (1 - a)) * (1 - a / ap));
      x =
        Math.sqrt(ap) * x0 +
        Math.sqrt(Math.max(0, 1 - ap - sg * sg)) * eps +
        sg * nrm();
      p.push(x);
    }
    paths.push(p);
  }
  const xs = paths.map((p) => p[S]).sort((u, v) => u - v);
  const h = rand(seed + 1000);
  const ref = Array.from(
    { length: n },
    () =>
      MUS[h() < 0.5 ? 0 : 1] +
      S0 * Math.sqrt(-2 * Math.log(1 - h())) * Math.cos(2 * Math.PI * h()),
  ).sort((u, v) => u - v);
  const w1 = xs.reduce((s, x, i) => s + Math.abs(x - ref[i]), 0) / n;
  return { paths, ts, w1 };
}

const SS = [5, 10, 20];

export function DdimViz() {
  const [si, setSi] = useState(1);
  const [eta, setEta] = useState(0);
  const [seed, setSeed] = useState(1);
  const S = SS[si];
  const run = useMemo(() => ddimRun(S, eta, 4000, seed), [S, eta, seed]);
  const W = 340,
    H = 200,
    X0 = 28,
    PW = 250,
    Y0 = 10,
    PH = 160,
    YM = 3.2;
  const sx = (t: number) => X0 + (1 - t / 1000) * PW;
  const sy = (y: number) =>
    Y0 + PH / 2 - (Math.max(-YM, Math.min(YM, y)) / YM) * (PH / 2);
  const NB = 40,
    bw = (2 * YM) / NB;
  const counts = Array.from(
    { length: NB },
    (_, i) =>
      run.paths.filter((p) => p[S] >= -YM + i * bw && p[S] < -YM + (i + 1) * bw)
        .length,
  );
  const cm = Math.max(...counts, 1);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <span className="viz-label">steps</span>
        <div className="segmented" role="group" aria-label="Number of steps">
          {SS.map((v, i) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={si === i}
              onClick={() => setSi(i)}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Eta">
          {[0, 1].map((v) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={eta === v}
              onClick={() => setEta(v)}
            >
              {v === 0 ? "η = 0 (DDIM)" : "η = 1 (DDPM)"}
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
        aria-label="Sampling paths and where they land"
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
        {run.paths.slice(0, 120).map((p, i) => (
          <path
            key={i}
            d={p
              .map(
                (y, k) =>
                  `${k ? "L" : "M"}${sx(run.ts[k]).toFixed(1)},${sy(y).toFixed(1)}`,
              )
              .join(" ")}
            fill="none"
            stroke="var(--accent)"
            strokeOpacity={0.25}
            strokeWidth={0.8}
          />
        ))}
        {counts.map((c, i) => (
          <rect
            key={i}
            x={X0 + PW + 2}
            y={sy(-YM + (i + 1) * bw)}
            width={(c / cm) * 44}
            height={(PH / NB) * 0.9}
            fill="var(--success)"
            fillOpacity={0.7}
          />
        ))}
        <text x={X0} y={H - 6} className="viz-label">
          t = T
        </text>
        <text x={X0 + PW} y={H - 6} textAnchor="end" className="viz-label">
          t = 0
        </text>
      </svg>
      <div style={{ textAlign: "center", fontSize: 13 }}>
        distance from the data (Wasserstein-1):{" "}
        <strong>{run.w1.toFixed(3)}</strong>
      </div>
      <figcaption className="viz-caption">
        Data in two bumps at −1 and 1.5, sampled with the exact noise predictor
        of the thousand-step linear schedule but only a few of its steps, evenly
        spaced. With η = 0 every path is a deterministic curve from its starting
        noise; with η = 1 the same steps also inject fresh noise. The
        deterministic sampler lands closer to the data at every step count. The
        number compares the sorted samples with a sorted reference sample, so
        about 0.03 of it is sampling noise.
      </figcaption>
    </figure>
  );
}
