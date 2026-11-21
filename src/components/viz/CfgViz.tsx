"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

/** Components (mean, weight, class): class A is two bumps, one of them next to class B. */
const COMP: [number, number, number][] = [
  [-2, 0.25, 0],
  [0.5, 0.25, 0],
  [1.5, 0.5, 1],
];
const S0 = 0.3;

/** Score of the noisy data, unconditional (cls = -1) or for one class. */
export function mixScore(x: number, s: number, cls: number) {
  const v = S0 * S0 + s * s;
  const l = COMP.map(([m, w, k]) =>
    cls < 0 || k === cls ? Math.log(w) - (x - m) ** 2 / (2 * v) : -Infinity,
  );
  const mx = Math.max(...l),
    p = l.map((u) => Math.exp(u - mx)),
    z = p.reduce((a, b) => a + b, 0);
  return (COMP.reduce((a, [m], i) => a + (p[i] / z) * m, 0) - x) / v;
}

/** Class-A samples with guidance scale g applied for noise levels at most sMax (others use scale 1). */
export function cfgSamples(
  g: number,
  sMax: number,
  n: number,
  seed: number,
  N = 300,
) {
  const r = rand(seed);
  const nrm = () =>
    Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const sig = (i: number) => 8 * (0.005 / 8) ** (i / N);
  return Array.from({ length: n }, () => {
    let x = Math.sqrt(64 + S0 * S0) * nrm();
    for (let i = 0; i < N; i++) {
      const s = sig(i),
        sn = sig(i + 1),
        d = s * s - sn * sn,
        u = mixScore(x, s, -1),
        c = mixScore(x, s, 0);
      x += d * (u + (s <= sMax ? g : 1) * (c - u)) + Math.sqrt(d) * nrm();
    }
    return x;
  });
}

const GS = [1, 2, 4, 8];

export function CfgViz() {
  const [gi, setGi] = useState(2);
  const [low, setLow] = useState(false);
  const xs = useMemo(
    () => cfgSamples(GS[gi], low ? 0.6 : Infinity, 1500, 5),
    [gi, low],
  );
  const near = xs.filter((x) => x > -0.75 && x < 1).length / xs.length,
    leak = xs.filter((x) => x >= 1).length / xs.length;
  const W = 330,
    H = 180,
    X0 = 10,
    PW = 310,
    Y0 = 8,
    PH = 140,
    LO = -3.2,
    HI = 2.6,
    NB = 58,
    bw = (HI - LO) / NB;
  const sx = (x: number) => X0 + ((x - LO) / (HI - LO)) * PW;
  const counts = Array.from(
    { length: NB },
    (_, i) =>
      xs.filter((x) => x >= LO + i * bw && x < LO + (i + 1) * bw).length /
      (xs.length * bw),
  );
  const nd = (x: number, m: number) =>
    Math.exp(-((x - m) ** 2) / (2 * S0 * S0)) / (S0 * Math.sqrt(2 * Math.PI));
  const top = 1.6,
    sy = (d: number) => Y0 + PH - (Math.min(d, top) / top) * PH;
  const grid = Array.from(
    { length: 291 },
    (_, i) => LO + (i * (HI - LO)) / 290,
  );
  const curve = (f: (x: number) => number) =>
    grid
      .map(
        (x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <span className="viz-label">guidance scale</span>
        <div className="segmented" role="group" aria-label="Guidance scale">
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
        <div className="segmented" role="group" aria-label="Guidance interval">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              type="button"
              className="seg"
              aria-pressed={low === v}
              onClick={() => setLow(v)}
            >
              {v ? "only σ ≤ 0.6" : "all noise levels"}
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
        aria-label="Guided samples of class A"
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
          d={curve((x) => nd(x, 1.5))}
          fill="none"
          stroke="var(--danger)"
          strokeDasharray="4 3"
          strokeWidth={1.5}
        />
        <path
          d={curve((x) => 0.5 * nd(x, -2) + 0.5 * nd(x, 0.5))}
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
        {[-3, -2, -1, 0, 1, 2].map((t) => (
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
          share in the bump near B: <strong>{near.toFixed(2)}</strong> (class A:
          0.50)
        </span>
        <span>
          beyond x = 1: <strong>{leak.toFixed(3)}</strong> (class A: 0.024)
        </span>
      </div>
      <figcaption className="viz-caption">
        Class A (solid) has two bumps, at −2 and 0.5; class B (dashed) sits at
        1.5. Samples of class A use the exact conditional and unconditional
        scores combined with classifier-free guidance. As the scale grows, the
        samples flee from class B and the bump next to it empties: guidance
        drops a mode of the very class it targets. Applying it only at low noise
        keeps both bumps while still cutting the tail that overlaps B.
      </figcaption>
    </figure>
  );
}
