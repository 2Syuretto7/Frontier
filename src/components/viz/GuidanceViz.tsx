"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const MUS = [-1, 1],
  S0 = 0.6,
  SMAX = 6,
  SMIN = 0.005;

/** Unconditional score and gradient of log p_sigma(y = 1 | x) for two equally likely classes N(+-1, 0.6^2) under VE noise. */
export function scores(x: number, s: number) {
  const v = S0 * S0 + s * s;
  const l = MUS.map((m) => -((x - m) ** 2) / (2 * v)),
    mx = Math.max(...l);
  const w = l.map((u) => Math.exp(u - mx)),
    z = w[0] + w[1],
    p = w.map((u) => u / z);
  const mean = p[0] * MUS[0] + p[1] * MUS[1];
  return { score: (mean - x) / v, grad: (MUS[1] - mean) / v, p1: p[1] };
}

/** Samples of class 1 with guidance weight g: reverse VE diffusion with score + g * classifier gradient. */
export function guidedSamples(g: number, n: number, seed: number, N = 300) {
  const r = rand(seed);
  const nrm = () =>
    Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const sig = (i: number) => SMAX * (SMIN / SMAX) ** (i / N);
  return Array.from({ length: n }, () => {
    let x = Math.sqrt(SMAX * SMAX + S0 * S0) * nrm();
    for (let i = 0; i < N; i++) {
      const s = sig(i),
        sn = sig(i + 1),
        d = s * s - sn * sn,
        sc = scores(x, s);
      x += d * (sc.score + g * sc.grad) + Math.sqrt(d) * nrm();
    }
    return x;
  });
}

export function summarise(xs: number[]) {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
  const conf = xs.reduce((a, x) => a + scores(x, 0).p1, 0) / xs.length;
  return { m, sd, conf };
}

const GS = [0, 1, 2, 4, 8];

export function GuidanceViz() {
  const [gi, setGi] = useState(1);
  const xs = useMemo(() => guidedSamples(GS[gi], 2000, 3), [gi]);
  const { m, sd, conf } = summarise(xs);
  const W = 330,
    H = 180,
    X0 = 10,
    PW = 310,
    Y0 = 8,
    PH = 140,
    LO = -3,
    HI = 3.5,
    NB = 52,
    bw = (HI - LO) / NB;
  const sx = (x: number) => X0 + ((x - LO) / (HI - LO)) * PW;
  const dens = xs.length * bw;
  const counts = Array.from(
    { length: NB },
    (_, i) =>
      xs.filter((x) => x >= LO + i * bw && x < LO + (i + 1) * bw).length / dens,
  );
  const g = (x: number, mu: number) =>
    Math.exp(-((x - mu) ** 2) / (2 * S0 * S0)) / (S0 * Math.sqrt(2 * Math.PI));
  const top = 1,
    sy = (d: number) => Y0 + PH - (Math.min(d, top) / top) * PH;
  const grid = Array.from(
    { length: 261 },
    (_, i) => LO + (i * (HI - LO)) / 260,
  );
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <span className="viz-label">guidance weight</span>
        <div className="segmented" role="group" aria-label="Guidance weight">
          {GS.map((v, i) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={gi === i}
              onClick={() => setGi(i)}
            >
              {v}
            </button>
          ))}
        </div>
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
        aria-label="Guided samples against the class densities"
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
                `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(0.5 * g(x, -1) + 0.5 * g(x, 1)).toFixed(1)}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
          strokeWidth={1.5}
        />
        <path
          d={grid
            .map(
              (x, i) =>
                `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(g(x, 1)).toFixed(1)}`,
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
        {[-2, -1, 0, 1, 2, 3].map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={H - 18}
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
          mean <strong>{m.toFixed(2)}</strong>
        </span>
        <span>
          spread <strong>{sd.toFixed(2)}</strong> (class: 0.60)
        </span>
        <span>
          average classifier confidence <strong>{conf.toFixed(3)}</strong>
        </span>
      </div>
      <figcaption className="viz-caption">
        Two equally likely classes, N(−1, 0.6²) and N(1, 0.6²) (dashed: their
        mixture; solid: class 1). The sampler adds the weighted gradient of the
        noisy classifier&apos;s log-probability for class 1 to the unconditional
        score. Weight 0 gives the mixture, weight 1 the class exactly; larger
        weights push samples away from the boundary, raising the
        classifier&apos;s confidence and shrinking their spread.
      </figcaption>
    </figure>
  );
}
