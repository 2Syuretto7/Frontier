"use client";

import { useState } from "react";

// characters of S3 on its conjugacy classes: identity (1 element), transpositions (3), 3-cycles (2)
const SIZES = [1, 3, 2];
const IRR = [
  { name: "trivial", chi: [1, 1, 1] },
  { name: "sign", chi: [1, -1, 1] },
  { name: "standard", chi: [2, 0, -1] },
];
const REPS = [
  { name: "permutation", chi: [3, 1, 0] },
  { name: "sign × perm", chi: [3, -1, 0] },
  { name: "std tensor std", chi: [4, 0, 1] },
  { name: "regular", chi: [6, 0, 0] },
  { name: "matrices", chi: [9, 1, 0] },
];

const ip = (a: number[], b: number[]) =>
  a.reduce((s, v, i) => s + SIZES[i] * v * b[i], 0) / 6;

/** Multiplicity of each irreducible of S3 in the representation with character chi, and <chi, chi>. */
export function decompose(chi: number[]) {
  return { mult: IRR.map((r) => ip(chi, r.chi)), norm: ip(chi, chi) };
}

export function CharacterTableViz() {
  const [k, setK] = useState(0);
  const rep = REPS[k];
  const { mult, norm } = decompose(rep.chi);
  const rows = [...IRR, { name: rep.name, chi: rep.chi }];
  const cx = [120, 175, 230];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Representation">
          {REPS.map((r, j) => (
            <button
              key={r.name}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 170"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="The character table of the symmetric group on three letters, a chosen character, and its decomposition"
      >
        {["e", "(12)", "(123)"].map((c, i) => (
          <text
            key={c}
            x={cx[i]}
            y={18}
            textAnchor="middle"
            className="viz-label"
          >
            {c} ×{SIZES[i]}
          </text>
        ))}
        <text x={300} y={18} textAnchor="middle" className="viz-label">
          times
        </text>
        {rows.map((r, j) => {
          const y = 44 + j * 26 + (j === 3 ? 12 : 0);
          const last = j === 3;
          return (
            <g key={r.name}>
              <text x={10} y={y} className="viz-label">
                {r.name}
              </text>
              {r.chi.map((v, i) => (
                <text
                  key={i}
                  x={cx[i]}
                  y={y}
                  textAnchor="middle"
                  className="viz-label"
                  fill={last ? "var(--accent)" : undefined}
                >
                  {v}
                </text>
              ))}
              {!last && (
                <>
                  <rect
                    x={270}
                    y={y - 11}
                    width={Math.max(0, mult[j]) * 12}
                    height={12}
                    fill="var(--accent)"
                    fillOpacity={0.7}
                  />
                  <text x={262} y={y} textAnchor="end" className="viz-label">
                    {mult[j]}
                  </text>
                </>
              )}
            </g>
          );
        })}
        <line x1={10} y1={112} x2={330} y2={112} stroke="var(--border)" />
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        dimension {rep.chi[0]} = {mult[0]}·1 + {mult[1]}·1 + {mult[2]}·2; ⟨χ, χ⟩
        = {norm} = {mult.map((m) => `${m}²`).join(" + ")}
      </div>
      <figcaption className="viz-caption">
        Rows above the line: the characters of the three irreducible
        representations of S₃, on the identity, the three transpositions and the
        two 3-cycles. Below: the character of the chosen representation. Its
        inner product with each irreducible character, weighted by class size,
        gives how many times that irreducible appears; the dimensions add up,
        and ⟨χ, χ⟩ is the sum of the squared multiplicities.
      </figcaption>
    </figure>
  );
}
