"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const MUS = [-1, 1.5],
  S0 = 0.1,
  SMIN = 0.01,
  SMAX = 4;

/** Score of the two-bump data after adding N(0, s^2) noise. */
export function vscore(x: number, s: number) {
  const v = S0 * S0 + s * s;
  const l = MUS.map((m) => -((x - m) ** 2) / (2 * v)),
    mx = Math.max(...l);
  const w = l.map((u) => Math.exp(u - mx)),
    z = w[0] + w[1];
  return MUS.reduce((a, m, k) => a + (w[k] / z) * (-(x - m) / v), 0);
}

/** Variance-exploding predictor-corrector sampler with N predictor steps; corrector step r * sigma^2. */
export function pcRun(
  N: number,
  corrector: boolean,
  n: number,
  seed: number,
  r = 0.3,
) {
  const g = rand(seed);
  const nrm = () =>
    Math.sqrt(-2 * Math.log(1 - g())) * Math.cos(2 * Math.PI * g());
  const sig = (t: number) => SMIN * (SMAX / SMIN) ** t;
  const xs: number[] = [];
  for (let j = 0; j < n; j++) {
    let x = Math.sqrt(SMAX * SMAX + S0 * S0) * nrm();
    for (let i = 0; i < N; i++) {
      const s = sig(1 - i / N),
        sn = sig(1 - (i + 1) / N),
        d = s * s - sn * sn,
        last = i === N - 1;
      x += d * vscore(x, s) + (last ? 0 : Math.sqrt(d) * nrm());
      if (corrector && !last) {
        const e = r * sn * sn;
        x += e * vscore(x, sn) + Math.sqrt(2 * e) * nrm();
      }
    }
    xs.push(x);
  }
  const lo = xs.filter((x) => x < 0.25),
    hi = xs.filter((x) => x >= 0.25);
  const sd = (a: number[]) => {
    const m = a.reduce((s, x) => s + x, 0) / a.length;
    return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length);
  };
  return { xs, frac: hi.length / n, spread: (sd(lo) + sd(hi)) / 2 };
}

const NS = [5, 10, 20, 100];

export function PcSamplerViz() {
  const [ni, setNi] = useState(0);
  const [corr, setCorr] = useState(false);
  const [seed, setSeed] = useState(1);
  const { xs, frac, spread } = useMemo(
    () => pcRun(NS[ni], corr, 3000, seed),
    [ni, corr, seed],
  );
  const W = 330,
    H = 190,
    X0 = 10,
    PW = 310,
    Y0 = 8,
    PH = 150,
    LO = -2,
    HI = 2.5,
    NB = 60,
    bw = (HI - LO) / NB;
  const sx = (x: number) => X0 + ((x - LO) / (HI - LO)) * PW;
  const counts = Array.from(
    { length: NB },
    (_, i) =>
      xs.filter((x) => x >= LO + i * bw && x < LO + (i + 1) * bw).length /
      (xs.length * bw),
  );
  const dens = (x: number) =>
    MUS.reduce(
      (a, m) =>
        a +
        (0.5 * Math.exp(-((x - m) ** 2) / (2 * S0 * S0))) /
          (S0 * Math.sqrt(2 * Math.PI)),
      0,
    );
  const top = 2.2,
    sy = (d: number) => Y0 + PH - (Math.min(d, top) / top) * PH;
  const grid = Array.from(
    { length: 451 },
    (_, i) => LO + (i * (HI - LO)) / 450,
  );
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <span className="viz-label">predictor steps</span>
        <div className="segmented" role="group" aria-label="Predictor steps">
          {NS.map((v, i) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={ni === i}
              onClick={() => setNi(i)}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Corrector">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              type="button"
              className="seg"
              aria-pressed={corr === v}
              onClick={() => setCorr(v)}
            >
              {v ? "with corrector" : "predictor only"}
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
        aria-label="Histogram of samples against the data density"
      >
        {counts.map((c, i) => (
          <rect
            key={i}
            x={sx(LO + i * bw) + 0.3}
            y={sy(c)}
            width={PW / NB - 0.6}
            height={Y0 + PH - sy(c)}
            fill="var(--accent)"
            fillOpacity={0.55}
          />
        ))}
        <path
          d={grid
            .map(
              (x, i) =>
                `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(dens(x)).toFixed(1)}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--text)"
          strokeWidth={1.5}
        />
        <line
          x1={X0}
          x2={X0 + PW}
          y1={Y0 + PH}
          y2={Y0 + PH}
          stroke="var(--border-strong)"
        />
        {[-2, -1, 0, 1, 2].map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={H - 14}
            textAnchor="middle"
            className="viz-label"
          >
            {t}
          </text>
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 16px",
          justifyContent: "center",
          fontSize: 13,
        }}
      >
        <span>
          spread within a bump: <strong>{spread.toFixed(3)}</strong> (data:
          0.100)
        </span>
        <span>
          share in the right bump: <strong>{frac.toFixed(2)}</strong> (data:
          0.50)
        </span>
      </div>
      <figcaption className="viz-caption">
        3000 samples from the variance-exploding SDE, reversed with the exact
        score of data made of two narrow bumps (black curve). With few predictor
        steps each step removes a large slice of noise and the samples land too
        spread out. One Langevin corrector step after each predictor step pulls
        them part of the way back towards the right noisy distribution, at the
        cost of one more score evaluation per step.
      </figcaption>
    </figure>
  );
}
