"use client";

import { useState } from "react";

const RATES = [0.1, 0.3, 0.6]; // share of generated samples that are correct
const FPRS = [0.02, 0.1, 0.3]; // share of incorrect samples the verifier wrongly accepts
const TPR = 0.9; // share of correct samples the verifier accepts

/** Share of accepted samples that are correct, by Bayes' rule. */
export function precision(q: number, tpr: number, fpr: number) {
  return (q * tpr) / (q * tpr + (1 - q) * fpr);
}

export function VerifierPrecisionViz() {
  const [qi, setQi] = useState(1);
  const [fi, setFi] = useState(1);
  const q = RATES[qi],
    fpr = FPRS[fi];
  const nc = Math.round(100 * q);
  const keptC = Math.round(TPR * nc),
    keptW = Math.round(fpr * (100 - nc));
  const cells = Array.from({ length: 100 }, (_, i) => {
    const correct = i < nc;
    const kept = correct ? i < keptC : i - nc < keptW;
    return { correct, kept };
  });
  const S = 26,
    X0 = 35,
    Y0 = 4;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="viz-label">correct samples</span>
          <div
            className="segmented"
            role="group"
            aria-label="Share of correct samples"
          >
            {RATES.map((v, j) => (
              <button
                key={v}
                type="button"
                className="seg"
                aria-pressed={qi === j}
                onClick={() => setQi(j)}
              >{`${v * 100}%`}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="viz-label">false accepts</span>
          <div
            className="segmented"
            role="group"
            aria-label="Verifier false-accept rate"
          >
            {FPRS.map((v, j) => (
              <button
                key={v}
                type="button"
                className="seg"
                aria-pressed={fi === j}
                onClick={() => setFi(j)}
              >{`${v * 100}%`}</button>
            ))}
          </div>
        </div>
      </div>
      <svg
        viewBox={`0 0 330 ${Y0 + 10 * S + 4}`}
        style={{
          width: "100%",
          maxWidth: 400,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="One hundred generated samples and which the verifier keeps"
      >
        {cells.map((c, i) => {
          const cx = X0 + (i % 10) * S + S / 2,
            cy = Y0 + Math.floor(i / 10) * S + S / 2;
          return (
            <g key={i}>
              {c.kept && (
                <rect
                  x={cx - S / 2 + 1.5}
                  y={cy - S / 2 + 1.5}
                  width={S - 3}
                  height={S - 3}
                  rx={4}
                  fill="none"
                  stroke="var(--text)"
                  strokeWidth={1.6}
                />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={7.5}
                style={{ fill: c.correct ? "var(--accent)" : "var(--danger)" }}
                opacity={c.kept ? 1 : 0.3}
              />
            </g>
          );
        })}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        kept {keptC + keptW} of 100; {(100 * precision(q, TPR, fpr)).toFixed(0)}
        % of kept samples are correct
      </div>
      <figcaption className="viz-caption">
        A hundred generated solutions, correct in colour and incorrect in red.
        The verifier accepts 90% of correct ones and some share of incorrect
        ones; accepted samples are boxed. When the generator is rarely right,
        even a small false-accept rate lets a large share of wrong solutions
        into the kept set.
      </figcaption>
    </figure>
  );
}
