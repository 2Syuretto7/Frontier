"use client";

import { useState } from "react";

const BLOCK = 128;
export const CASES = [
  { label: "64", n: 64 },
  { label: "128", n: 128 },
  { label: "1024", n: 1024 },
  { label: "1", n: 1 },
  { label: "129", n: 129 },
  { label: "1000", n: 1000 },
  { label: "1000ᵀ", n: 1000, strided: true },
  { label: "1000+g", n: 1000, guard: true },
];
type Case = (typeof CASES)[number] & { strided?: boolean; guard?: boolean };

/** Five plausible bugs in a row-wise kernel with BLOCK = 128, and whether a test on a given input exposes each one. */
export const BUGS: { name: string; caught: (c: Case) => boolean }[] = [
  { name: "grid n // BLOCK", caught: (c) => c.n % BLOCK !== 0 },
  { name: "mask offs <= n", caught: (c) => !!c.guard && c.n % BLOCK !== 0 },
  { name: "one block per row", caught: (c) => c.n > BLOCK },
  { name: "assumes contiguous", caught: (c) => !!c.strided },
  { name: "bf16 accumulator", caught: (c) => c.n >= 1000 },
];

export const SUITES = [
  { name: "powers of two", cols: 3 },
  { name: "+ ragged sizes", cols: 6 },
  { name: "+ strides, guards", cols: 8 },
];

export function suiteCatches(s: number) {
  const cols = CASES.slice(0, SUITES[s].cols) as Case[];
  return BUGS.map((b) => cols.some((c) => b.caught(c)));
}

export function KernelTestSuiteViz() {
  const [s, setS] = useState(0);
  const used = SUITES[s].cols;
  const caught = suiteCatches(s);
  const X0 = 112, CW = 29, RH = 22, Y0 = 18, W = X0 + CASES.length * CW + 6, H = Y0 + BUGS.length * RH + 6;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Test suite">
          {SUITES.map((x, i) => <button key={x.name} type="button" className="seg" aria-pressed={s === i} onClick={() => setS(i)}>{x.name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Which test inputs expose which kernel bugs">
        {CASES.map((c, j) => (
          <text key={c.label} x={X0 + j * CW + CW / 2} y={12} textAnchor="middle" className="viz-label" style={{ fontSize: 9, opacity: j < used ? 1 : 0.4 }}>{c.label}</text>
        ))}
        {BUGS.map((b, i) => (
          <g key={b.name}>
            <text x={X0 - 6} y={Y0 + i * RH + 14} textAnchor="end" className="viz-label" style={{ fill: caught[i] ? "var(--text)" : "var(--accent)" }}>{b.name}</text>
            {CASES.map((c, j) => {
              const hit = b.caught(c as Case), on = j < used;
              return <rect key={j} x={X0 + j * CW} y={Y0 + i * RH} width={CW - 2} height={RH - 2}
                style={{ fill: hit ? (on ? "var(--accent)" : "var(--text-faint)") : "var(--bg-subtle)", stroke: "var(--border)" }} opacity={hit && !on ? 0.5 : 1} />;
            })}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        this suite catches {caught.filter(Boolean).length} of {BUGS.length} bugs{caught.some((c) => !c) ? `; misses: ${BUGS.filter((_, i) => !caught[i]).map((b) => b.name).join(", ")}` : ""}
      </div>
      <figcaption className="viz-caption">
        Rows are bugs in a kernel that processes rows of n elements in blocks of 128; columns are test inputs (ᵀ: a transposed view,
        +g: output followed by guard values that must stay untouched). A filled cell means a comparison with a reference would fail.
        Sizes that are multiples of the block hide most edge bugs; a write past the end shows up only when something checks the memory after
        the output.
      </figcaption>
    </figure>
  );
}
