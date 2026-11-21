"use client";

import { useState } from "react";

// a five-atom planar "molecule" (centred); the copy is rotated by the chosen angle and optionally mirrored
const MOL: [number, number][] = [
  [-1.4, -0.5],
  [-0.2, -0.9],
  [0.9, -0.2],
  [0.6, 1.0],
  [0.1, 0.6],
];
const ANGLES = [0, 60, 120, 180, 240, 300];

const rot = (p: [number, number], t: number): [number, number] => [
  Math.cos(t) * p[0] - Math.sin(t) * p[1],
  Math.sin(t) * p[0] + Math.cos(t) * p[1],
];

/** RMSD to MOL, the best rotation angle and its RMSD, and the largest difference of pairwise distances. */
export function align(Y: [number, number][]) {
  const n = Y.length;
  const rmsd = (Z: [number, number][]) =>
    Math.sqrt(
      Z.reduce(
        (s, z, i) => s + (z[0] - MOL[i][0]) ** 2 + (z[1] - MOL[i][1]) ** 2,
        0,
      ) / n,
    );
  // the best rotation of Y onto MOL: angle of sum of (y conj times x) in complex form
  let c = 0,
    s = 0;
  Y.forEach((y, i) => {
    c += y[0] * MOL[i][0] + y[1] * MOL[i][1];
    s += y[0] * MOL[i][1] - y[1] * MOL[i][0];
  });
  const best = Math.atan2(s, c);
  const d = (Z: [number, number][], i: number, j: number) =>
    Math.hypot(Z[i][0] - Z[j][0], Z[i][1] - Z[j][1]);
  let gap = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      gap = Math.max(gap, Math.abs(d(Y, i, j) - d(MOL, i, j)));
  return {
    now: rmsd(Y),
    best,
    bestRmsd: rmsd(Y.map((y) => rot(y, best))),
    gap,
  };
}

export function ChiralAlignViz() {
  const [k, setK] = useState(2);
  const [mirror, setMirror] = useState(false);
  const [snap, setSnap] = useState(false);
  const Y0 = MOL.map((p) =>
    rot(mirror ? [-p[0], p[1]] : p, (ANGLES[k] * Math.PI) / 180),
  );
  const { now, best, bestRmsd, gap } = align(Y0);
  const Y = snap ? Y0.map((y) => rot(y, best)) : Y0;
  const ox = 100,
    oy = 92,
    s = 48;
  const P = (p: [number, number]) => [ox + p[0] * s, oy - p[1] * s];
  const bonds: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 1],
  ];
  const draw = (Z: [number, number][], col: string, dash?: string) => (
    <g>
      {bonds.map(([a, b], i) => (
        <line
          key={i}
          x1={P(Z[a])[0]}
          y1={P(Z[a])[1]}
          x2={P(Z[b])[0]}
          y2={P(Z[b])[1]}
          stroke={col}
          strokeWidth={1.6}
          strokeDasharray={dash}
        />
      ))}
      {Z.map((z, i) => (
        <g key={i}>
          <circle
            cx={P(z)[0]}
            cy={P(z)[1]}
            r={8}
            fill="var(--surface)"
            stroke={col}
            strokeWidth={1.5}
          />
          <text
            x={P(z)[0]}
            y={P(z)[1] + 4}
            textAnchor="middle"
            className="viz-label"
          >
            {i + 1}
          </text>
        </g>
      ))}
    </g>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="Rotation of the copy"
        >
          {ANGLES.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => {
                setK(j);
                setSnap(false);
              }}
            >
              {v}°
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn"
          aria-pressed={mirror}
          onClick={() => {
            setMirror(!mirror);
            setSnap(false);
          }}
        >
          {mirror ? "mirror image: on" : "mirror image: off"}
        </button>
        <button type="button" className="btn" onClick={() => setSnap(!snap)}>
          {snap ? "undo alignment" : "align by best rotation"}
        </button>
      </div>
      <svg
        viewBox="0 0 340 180"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A five-atom molecule and a rotated or mirrored copy, with the root mean square deviation before and after the best rotation"
      >
        {draw(MOL, "var(--text-muted)", "4 3")}
        {draw(Y, mirror ? "var(--danger)" : "var(--accent)")}
        <text x={200} y={50} className="viz-label">
          RMSD now {(snap ? bestRmsd : now).toFixed(3)}
        </text>
        <text x={200} y={70} className="viz-label">
          best rotation {bestRmsd.toFixed(3)}
        </text>
        <text x={200} y={90} className="viz-label">
          distance change {gap.toFixed(3)}
        </text>
      </svg>
      <figcaption className="viz-caption">
        Dashed: the reference molecule, with atoms numbered. Solid: a copy
        turned by the chosen angle. The best rotation, found from the matched
        atoms, brings an unmirrored copy back exactly. The mirror image has the
        same pairwise distances, yet no rotation lines it up: distances alone
        cannot tell a molecule from its mirror image.
      </figcaption>
    </figure>
  );
}
