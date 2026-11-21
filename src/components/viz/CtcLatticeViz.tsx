"use client";

import { useState } from "react";

/** Forward counts of CTC paths: alpha[t][s] over the blank-extended target (all probabilities 1). */
export function ctcCounts(T: number, target: number[]) {
  const ext = [0];
  target.forEach((c) => ext.push(c, 0));
  const S = ext.length;
  const can = (s: number) => s >= 2 && ext[s] !== 0 && ext[s] !== ext[s - 2];
  const a = Array.from({ length: T }, () => new Array(S).fill(0));
  a[0][0] = 1;
  if (S > 1) a[0][1] = 1;
  for (let t = 1; t < T; t++)
    for (let s = 0; s < S; s++)
      a[t][s] =
        a[t - 1][s] +
        (s >= 1 ? a[t - 1][s - 1] : 0) +
        (can(s) ? a[t - 1][s - 2] : 0);
  const b = Array.from({ length: T }, () => new Array(S).fill(0));
  b[T - 1][S - 1] = 1;
  if (S > 1) b[T - 1][S - 2] = 1;
  for (let t = T - 2; t >= 0; t--)
    for (let s = 0; s < S; s++)
      b[t][s] =
        b[t + 1][s] +
        (s + 1 < S ? b[t + 1][s + 1] : 0) +
        (s + 2 < S && can(s + 2) ? b[t + 1][s + 2] : 0);
  const total = a[T - 1][S - 1] + (S > 1 ? a[T - 1][S - 2] : 0);
  return { ext, a, b, total };
}

const WORDS: [string, number[]][] = [
  ["CAT", [1, 2, 3]],
  ["SEE", [4, 5, 5]],
];
const CH = " CATSE";

export function CtcLatticeViz() {
  const [T, setT] = useState(6);
  const [wi, setWi] = useState(0);
  const target = WORDS[wi][1];
  const { ext, a, b, total } = ctcCounts(T, target);
  const S = ext.length,
    c = 26,
    x0 = 36,
    y0 = 18,
    W = x0 + 10 * c + 6,
    H = y0 + S * c + 20;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <div className="segmented" role="group" aria-label="Target">
          {WORDS.map(([w], i) => (
            <button
              key={w}
              type="button"
              className="seg"
              aria-pressed={wi === i}
              onClick={() => setWi(i)}
            >
              {w}
            </button>
          ))}
        </div>
        <label className="viz-label">
          frames T = {T}{" "}
          <input
            type="range"
            min={3}
            max={10}
            value={T}
            onChange={(e) => setT(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 440,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="CTC alignment lattice"
      >
        {ext.map((l, s) => (
          <text
            key={s}
            x={x0 - 8}
            y={y0 + s * c + c / 2 + 4}
            textAnchor="end"
            className="viz-label"
          >
            {l === 0 ? "–" : CH[l]}
          </text>
        ))}
        {Array.from({ length: T }, (_, t) => (
          <text
            key={t}
            x={x0 + t * c + c / 2}
            y={H - 4}
            textAnchor="middle"
            className="viz-label"
          >
            {t + 1}
          </text>
        ))}
        {Array.from({ length: T }, (_, t) =>
          ext.map((_, s) => {
            const n = total ? (a[t][s] * b[t][s]) / total : 0;
            return (
              <rect
                key={`${t}-${s}`}
                x={x0 + t * c + 2}
                y={y0 + s * c + 2}
                width={c - 4}
                height={c - 4}
                fill={n > 0 ? "var(--accent)" : "var(--surface)"}
                fillOpacity={n > 0 ? 0.15 + 0.75 * n : 1}
                stroke="var(--border)"
              />
            );
          }),
        )}
      </svg>
      <div style={{ textAlign: "center", fontSize: 13 }}>
        {total > 0 ? (
          <>
            alignments that collapse to {WORDS[wi][0]}: <strong>{total}</strong>
          </>
        ) : (
          <>too few frames: no alignment exists</>
        )}
      </div>
      <figcaption className="viz-caption">
        CTC inserts a blank (–) before, between and after the letters. An
        alignment starts in one of the first two rows, ends in one of the last
        two, and each frame moves down by zero or one rows, or by two when
        skipping a blank between different letters. Shading shows the fraction
        of alignments passing through each cell. SEE needs a blank between its
        two Es, so it needs four frames where CAT needs three.
      </figcaption>
    </figure>
  );
}
