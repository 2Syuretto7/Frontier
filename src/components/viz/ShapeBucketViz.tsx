"use client";

import { useState } from "react";
import { makeRng } from "./ml";

/** Sequence lengths of 40 batches, drawn between 1 and 512. */
const rng = makeRng(5);
export const LENGTHS = Array.from({ length: 40 }, () => 1 + Math.floor(rng() * 512));

const POLICIES = ["exact shapes", "multiples of 64", "powers of two"] as const;
type Policy = (typeof POLICIES)[number];

export function padTo(n: number, p: Policy) {
  if (p === "exact shapes") return n;
  if (p === "multiples of 64") return Math.ceil(n / 64) * 64;
  return 2 ** Math.ceil(Math.log2(n));
}

/** Which calls trace (a new padded shape) and the fraction of computed positions that are padding. */
export function simulate(p: Policy) {
  const seen = new Set<number>();
  let real = 0, total = 0;
  const miss = LENGTHS.map((n) => {
    const m = padTo(n, p);
    real += n;
    total += m;
    const fresh = !seen.has(m);
    seen.add(m);
    return fresh;
  });
  return { miss, traces: seen.size, waste: 1 - real / total };
}

export function ShapeBucketViz() {
  const [p, setP] = useState<Policy>("exact shapes");
  const { miss, traces, waste } = simulate(p);
  const W = 320, COLS = 10, CW = W / COLS, RH = 30;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {POLICIES.map((x) => (
          <button key={x} type="button" className="seg" aria-pressed={p === x} onClick={() => setP(x)}>{x}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${4 * RH + 4}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Forty calls, marking those that trigger a new trace">
        {LENGTHS.map((n, i) => {
          const x = (i % COLS) * CW, y = Math.floor(i / COLS) * RH;
          return (
            <g key={i}>
              <rect x={x + 2} y={y + 2} width={CW - 4} height={RH - 4} rx={3} fill={miss[i] ? "var(--danger)" : "var(--accent)"} fillOpacity={miss[i] ? 0.75 : 0.25} />
              <text x={x + CW / 2} y={y + RH / 2 + 4} textAnchor="middle" className="viz-label" style={{ fill: "var(--text)" }}>{padTo(n, p)}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`${traces} traces and compilations for 40 calls, ${(100 * waste).toFixed(1)}% of computed positions are padding`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Forty calls of a jitted function on batches whose sequence length varies between 1 and 512; each cell shows the
        length the function actually sees. A red cell is a shape the cache has not seen, so the function is traced and
        compiled again; blue cells reuse a compiled version. With exact shapes almost every call compiles. Padding to a
        few bucket sizes caps the number of compilations, at the price of computing on padding, which a mask must then
        ignore.
      </figcaption>
    </figure>
  );
}
