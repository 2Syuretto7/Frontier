"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const ALPHAS = [0.5, 0.7, 0.9];
const KS = [2, 4, 6];
const ROUNDS = 10;
const COST = 0.1; // a draft step costs a tenth of a target step

export function expectedTokens(alpha: number, k: number) {
  return (1 - alpha ** (k + 1)) / (1 - alpha);
}

/** For each round, how many of the k drafts were accepted (the target then adds one token). */
export function rounds(alpha: number, k: number) {
  const rng = rand(5 + Math.round(alpha * 10) * 7 + k);
  return Array.from({ length: ROUNDS }, () => {
    let n = 0;
    while (n < k && rng() < alpha) n++;
    return n;
  });
}

export function SpecDecodeViz() {
  const [ai, setAi] = useState(1);
  const [ki, setKi] = useState(1);
  const alpha = ALPHAS[ai],
    k = KS[ki];
  const acc = rounds(alpha, k);
  const sim = acc.reduce((s, n) => s + n + 1, 0) / ROUNDS;
  const C = 22,
    X0 = 70,
    Y0 = 4,
    RH = 22;
  const W = 330;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="viz-label">acceptance</span>
          <div className="segmented" role="group" aria-label="Acceptance rate">
            {ALPHAS.map((v, j) => (
              <button
                key={v}
                type="button"
                className="seg"
                aria-pressed={ai === j}
                onClick={() => setAi(j)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="viz-label">drafts</span>
          <div
            className="segmented"
            role="group"
            aria-label="Draft tokens per round"
          >
            {KS.map((v, j) => (
              <button
                key={v}
                type="button"
                className="seg"
                aria-pressed={ki === j}
                onClick={() => setKi(j)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + ROUNDS * RH + 4}`}
        style={{
          width: "100%",
          maxWidth: 420,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Draft tokens accepted and rejected in each verification round"
      >
        {acc.map((n, r) => (
          <g key={r}>
            <text
              x={X0 - 8}
              y={Y0 + r * RH + RH / 2 + 4}
              textAnchor="end"
              className="viz-label"
            >{`round ${r + 1}`}</text>
            {Array.from({ length: k }, (_, i) => {
              const state = i < n ? "acc" : i === n ? "rej" : "skip";
              return (
                <rect
                  key={i}
                  x={X0 + i * C + 1.5}
                  y={Y0 + r * RH + 2}
                  width={C - 3}
                  height={RH - 4}
                  rx={3}
                  style={{
                    fill:
                      state === "acc"
                        ? "var(--accent)"
                        : state === "rej"
                          ? "var(--danger)"
                          : "var(--bg-subtle)",
                  }}
                  stroke="var(--border)"
                />
              );
            })}
            <rect
              x={X0 + k * C + 6}
              y={Y0 + r * RH + 2}
              width={C - 3}
              height={RH - 4}
              rx={3}
              style={{ fill: "var(--text)" }}
            />
          </g>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        tokens per target pass: {sim.toFixed(1)} here,{" "}
        {expectedTokens(alpha, k).toFixed(2)} expected; speed-up about{" "}
        {(expectedTokens(alpha, k) / (k * COST + 1)).toFixed(2)}x
      </div>
      <figcaption className="viz-caption">
        Ten rounds of speculative decoding. A small model drafts several tokens;
        one pass of the large model checks them all. Accepted drafts are
        coloured, the first rejected one is red and later drafts are discarded;
        every round also yields one token from the large model (dark), a
        correction after a rejection or a bonus when all drafts pass. The
        speed-up assumes a draft step costs a tenth of a target step; ten rounds vary by chance around the expected count.
      </figcaption>
    </figure>
  );
}
