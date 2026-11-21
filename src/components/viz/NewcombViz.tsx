"use client";

import { useState } from "react";

// Newcomb: opaque box holds 1,000,000 if one-boxing was predicted; transparent box holds 1,000
const ACCS = [0.5, 0.6, 0.9, 0.99];
const PRIORS = [0.1, 0.5, 0.9];
const BIG = 1_000_000,
  SMALL = 1_000;

/** Expected payoffs of one- and two-boxing under conditioning (EDT) and intervening (CDT). */
export function values(acc: number, prior: number) {
  return {
    edt: [acc * BIG, (1 - acc) * BIG + SMALL],
    cdt: [prior * BIG, prior * BIG + SMALL],
  };
}

export function NewcombViz() {
  const [a, setA] = useState(2);
  const [p, setP] = useState(1);
  const { edt, cdt } = values(ACCS[a], PRIORS[p]);
  const W = (v: number) => (v / BIG) * 180;
  const row = (label: string, vals: number[], y: number) => (
    <g>
      <text x={10} y={y - 8} className="viz-label">
        {label}
      </text>
      {vals.map((v, i) => {
        const best = v === Math.max(...vals);
        return (
          <g key={i}>
            <text x={10} y={y + 12 + i * 22} className="viz-label">
              {i ? "two boxes" : "one box"}
            </text>
            <rect
              x={90}
              y={y + i * 22}
              width={Math.max(W(v), 1)}
              height={16}
              fill={best ? "var(--accent)" : "var(--border-strong)"}
              fillOpacity={0.7}
            />
            <text x={94 + W(v)} y={y + 12 + i * 22} className="viz-label">
              {Math.round(v).toLocaleString("en-IN")}
            </text>
          </g>
        );
      })}
    </g>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">predictor accuracy</span>
        <div className="segmented" role="group" aria-label="Predictor accuracy">
          {ACCS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={a === j}
              onClick={() => setA(j)}
            >
              {v}
            </button>
          ))}
        </div>
        <span className="viz-label">P(box full)</span>
        <div
          className="segmented"
          role="group"
          aria-label="Belief that the box is already full"
        >
          {PRIORS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={p === j}
              onClick={() => setP(j)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 156"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Expected payoffs of taking one box or two in Newcomb's problem, by conditioning and by intervening"
      >
        {row("conditioning on the act (evidential)", edt, 22)}
        {row("intervening on the act (causal)", cdt, 108)}
      </svg>
      <figcaption className="viz-caption">
        Evidential reasoning treats the choice as evidence about the prediction,
        so with an accurate predictor one box looks far better. Causal reasoning
        holds the already-filled box fixed, whatever its contents are believed
        to be, and two boxes are always 1,000 better. The accuracy moves only
        the top pair; the belief moves only the bottom pair.
      </figcaption>
    </figure>
  );
}
