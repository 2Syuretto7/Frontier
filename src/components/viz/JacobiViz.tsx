"use client";

import { useState } from "react";

const N = 6;
const PREFIX = [2];
const f = (seq: number[]) => (3 * seq[seq.length - 1] + seq.length) % 7; // a toy greedy "model"
const INITS: [string, number[]][] = [
  ["blank guess", [0, 0, 0, 0, 0, 0]],
  ["cached n-gram guess", [0, 2, 2, 3, 5, 5]],
];

export function greedy() {
  const seq = [...PREFIX];
  for (let i = 0; i < N; i++) seq.push(f(seq));
  return seq.slice(PREFIX.length);
}

/** Every Jacobi iterate, starting from the initial guess, until a fixed point. */
export function iterates(init: number[]) {
  const out = [init];
  for (;;) {
    const g = out[out.length - 1];
    const next = g.map((_, i) => f([...PREFIX, ...g.slice(0, i)]));
    out.push(next);
    if (next.every((v, i) => v === g[i])) return out;
  }
}

export function JacobiViz() {
  const [ii, setIi] = useState(0);
  const its = iterates(INITS[ii][1]);
  const truth = greedy();
  const C = 30,
    X0 = 70,
    Y0 = 4,
    RH = 26,
    W = 330;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Initial guess">
          {INITS.map(([name], j) => (
            <button
              key={name}
              type="button"
              className="seg"
              aria-pressed={ii === j}
              onClick={() => setIi(j)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + its.length * RH + 4}`}
        style={{
          width: "100%",
          maxWidth: 420,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Jacobi iterations converging to the greedy output"
      >
        {its.map((g, r) => {
          const fixedUpTo = g.findIndex((v, i) => v !== truth[i]);
          const prefixOk = fixedUpTo === -1 ? N : fixedUpTo;
          return (
            <g key={r}>
              <text
                x={X0 - 8}
                y={Y0 + r * RH + RH / 2 + 4}
                textAnchor="end"
                className="viz-label"
              >
                {r === 0 ? "guess" : `iter ${r}`}
              </text>
              {g.map((v, i) => (
                <g key={i}>
                  <rect
                    x={X0 + i * C + 1.5}
                    y={Y0 + r * RH + 2}
                    width={C - 3}
                    height={RH - 4}
                    rx={3}
                    style={{
                      fill:
                        i < prefixOk
                          ? "var(--accent)"
                          : v === truth[i]
                            ? "var(--accent-soft)"
                            : "var(--bg-subtle)",
                    }}
                    stroke="var(--border)"
                  />
                  <text
                    x={X0 + i * C + C / 2}
                    y={Y0 + r * RH + RH / 2 + 4}
                    textAnchor="middle"
                    className="mono"
                    style={{
                      fontSize: 12,
                      fill: i < prefixOk ? "var(--bg)" : "var(--text)",
                    }}
                  >
                    {v}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {its.length - 1} parallel passes to reach the fixed point for {N}{" "}
        tokens; greedy decoding needs {N}
      </div>
      <figcaption className="viz-caption">
        Jacobi decoding of six tokens with a toy greedy model. Each pass
        recomputes every position from the previous guess at once. Solid: a
        prefix that already matches greedy decoding and can never change again;
        light: a token that matches by luck but may still change. A good initial
        guess, for example from an n-gram cache, lets several tokens settle per
        pass.
      </figcaption>
    </figure>
  );
}
