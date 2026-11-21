"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

/** Two-frame "videos": an object at -1 or +1 (spread 0.3) that moves by N(0, 0.15^2) between frames. */
const MUS = [-1, 1],
  A = 0.09,
  B = 0.0225;
type Mode = "joint" | "independent" | "shared";

/** Score of the noisy joint law at noise level s (VE), for the pair (x1, x2). */
export function jointScore(
  x1: number,
  x2: number,
  s: number,
): [number, number] {
  const s11 = A + s * s,
    s12 = A,
    s22 = A + B + s * s,
    det = s11 * s22 - s12 * s12;
  const comps = MUS.map((m) => {
    const d1 = x1 - m,
      d2 = x2 - m;
    const g1 = (s22 * d1 - s12 * d2) / det,
      g2 = (-s12 * d1 + s11 * d2) / det;
    return { l: -0.5 * (d1 * g1 + d2 * g2), g1, g2 };
  });
  const mx = Math.max(...comps.map((c) => c.l)),
    w = comps.map((c) => Math.exp(c.l - mx)),
    z = w[0] + w[1];
  return [
    -(w[0] * comps[0].g1 + w[1] * comps[1].g1) / z,
    -(w[0] * comps[0].g2 + w[1] * comps[1].g2) / z,
  ];
}

/** Score of one frame's noisy marginal (variance v0 for its clean spread). */
export function frameScore(x: number, s: number, v0: number) {
  const v = v0 + s * s,
    l = MUS.map((m) => -((x - m) ** 2) / (2 * v)),
    mx = Math.max(...l);
  const w = l.map((u) => Math.exp(u - mx)),
    z = w[0] + w[1];
  return (w[0] * (MUS[0] - x) + w[1] * (MUS[1] - x)) / (v * z);
}

/** Deterministic probability-flow sampling (Euler, 80 levels from 20 down to 0.002 with rho = 7). */
export function sampleVideos(mode: Mode, n: number, seed: number) {
  const r = rand(seed);
  const nrm = () =>
    Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const N = 80,
    lv = Array.from(
      { length: N },
      (_, i) =>
        (20 ** (1 / 7) + (i / (N - 1)) * (0.002 ** (1 / 7) - 20 ** (1 / 7))) **
        7,
    );
  lv.push(0);
  return Array.from({ length: n }, () => {
    const z1 = nrm(),
      z2 = mode === "shared" ? z1 : nrm();
    let x1 = 20 * z1,
      x2 = 20 * z2;
    for (let i = 0; i < N; i++) {
      const s = lv[i],
        ds = lv[i + 1] - s;
      const [g1, g2] =
        mode === "joint"
          ? jointScore(x1, x2, s)
          : [frameScore(x1, s, A), frameScore(x2, s, A + B)];
      x1 += -s * g1 * ds;
      x2 += -s * g2 * ds;
    }
    return [x1, x2] as [number, number];
  });
}

const MODES: [Mode, string][] = [
  ["joint", "joint model"],
  ["independent", "per frame, fresh noise"],
  ["shared", "per frame, same noise"],
];

export function VideoFramesViz() {
  const [mode, setMode] = useState<Mode>("joint");
  const pts = useMemo(() => sampleVideos(mode, 1200, 4), [mode]);
  const jump = pts.filter(([a, b]) => a * b < 0).length / pts.length;
  const move = pts.reduce((s, [a, b]) => s + Math.abs(b - a), 0) / pts.length;
  const W = 260,
    H = 260,
    M = 30,
    P = W - 2 * M,
    R = 2.2;
  const sc = (v: number) => M + ((v + R) / (2 * R)) * P,
    sy = (v: number) => H - M - ((v + R) / (2 * R)) * P;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <div className="segmented" role="group" aria-label="Sampler">
          {MODES.map(([k, lab]) => (
            <button
              key={k}
              type="button"
              className="seg"
              aria-pressed={mode === k}
              onClick={() => setMode(k)}
            >
              {lab}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 340,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Frame one against frame two for sampled videos"
      >
        <rect
          x={M}
          y={M}
          width={P}
          height={P}
          fill="none"
          stroke="var(--border)"
        />
        <line
          x1={sc(-R)}
          y1={sy(-R)}
          x2={sc(R)}
          y2={sy(R)}
          stroke="var(--grid-line)"
        />
        <line
          x1={sc(0)}
          y1={M}
          x2={sc(0)}
          y2={M + P}
          stroke="var(--grid-line)"
        />
        <line
          x1={M}
          y1={sy(0)}
          x2={M + P}
          y2={sy(0)}
          stroke="var(--grid-line)"
        />
        {pts.map(([a, b], i) => (
          <circle
            key={i}
            cx={sc(a)}
            cy={sy(b)}
            r={1.4}
            fill={a * b < 0 ? "var(--danger)" : "var(--accent)"}
            fillOpacity={0.5}
          />
        ))}
        {[-2, -1, 0, 1, 2].map((t) => (
          <text
            key={`x${t}`}
            x={sc(t)}
            y={H - M + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {t}
          </text>
        ))}
        {[-2, -1, 0, 1, 2].map((t) => (
          <text
            key={`y${t}`}
            x={M - 6}
            y={sy(t) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {t}
          </text>
        ))}
        <text x={W / 2} y={H - 4} textAnchor="middle" className="viz-label">
          frame 1
        </text>
        <text
          x={10}
          y={H / 2}
          textAnchor="middle"
          className="viz-label"
          transform={`rotate(-90 10 ${H / 2})`}
        >
          frame 2
        </text>
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
          object jumps sides: <strong>{(100 * jump).toFixed(1)}%</strong> (data:
          0.1%)
        </span>
        <span>
          mean movement: <strong>{move.toFixed(3)}</strong> (data: 0.120)
        </span>
      </div>
      <figcaption className="viz-caption">
        Each dot is a two-frame video: an object near −1 or +1 that moves
        slightly between frames. The joint model denoises both frames together
        and keeps the object on its side. Denoising each frame on its own with
        fresh noise gives every frame the right distribution, but the object
        jumps sides in half the videos (red). Reusing one noise for both frames
        makes the frames almost identical: a frozen video.
      </figcaption>
    </figure>
  );
}
