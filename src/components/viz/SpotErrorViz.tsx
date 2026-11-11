"use client";

import { useState } from "react";

type Flawed = { claim: string; lines: string[]; bad: number; why: string };

const PROOFS: Flawed[] = [
  {
    claim: "1 = 2",
    lines: [
      "Let a and b be numbers with a = b.",
      "Multiply both sides by a: a² = ab.",
      "Subtract b² from both sides: a² − b² = ab − b².",
      "Factor both sides: (a + b)(a − b) = b(a − b).",
      "Divide both sides by a − b: a + b = b.",
      "Since a = b, this says 2b = b, and dividing by b gives 2 = 1.",
    ],
    bad: 4,
    why: "Since a = b, the number a − b is 0, and dividing by 0 is not allowed. Line 4 is true, but only because both sides are 0.",
  },
  {
    claim: "Every odd number has an odd square.",
    lines: [
      "Let n be odd.",
      "For example, take n = 3.",
      "Then n² = 9, which is odd.",
      "So the square of an odd number is odd.",
    ],
    bad: 1,
    why: "Choosing n = 3 proves the claim for 3 only. A proof about every odd n must work with an arbitrary one, written n = 2k + 1.",
  },
  {
    claim: "If n² is even, then n is even.",
    lines: [
      "Suppose n is even.",
      "Then n = 2k for some integer k.",
      "So n² = 4k² = 2(2k²).",
      "Hence n² is even, as required.",
    ],
    bad: 0,
    why: "This assumes the conclusion and proves the hypothesis: it is a correct proof of the converse, 'if n is even then n² is even'. The claim needs the contrapositive instead.",
  },
  {
    claim: "If m and n are odd, then m + n is even.",
    lines: [
      "Let m and n be odd.",
      "Then m = 2k + 1 and n = 2k + 1 for some integer k.",
      "So m + n = 4k + 2 = 2(2k + 1).",
      "Hence m + n is even.",
    ],
    bad: 1,
    why: "Using the same k for both numbers secretly assumes m = n. The fix is to use different letters: m = 2j + 1 and n = 2k + 1.",
  },
];

/** Flawed proofs to diagnose: click the first line that goes wrong. */
export function SpotErrorViz() {
  const [p, setP] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const P = PROOFS[p];
  const choose = (i: number) => { setP(i); setPick(null); };

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {PROOFS.map((x, i) => (
          <button key={x.claim} type="button" className={i === p ? "btn btn-primary" : "btn"} aria-pressed={i === p} onClick={() => choose(i)}>Proof {i + 1}</button>
        ))}
      </div>
      <p style={{ margin: "16px 0 8px" }}><strong>Claim:</strong> {P.claim}</p>
      <div className="choices" role="radiogroup" aria-label="Lines of the proof">
        {P.lines.map((line, i) => {
          const state = pick === null ? "" : i === P.bad ? "is-picked" : "";
          return (
            <label key={i} className={`choice ${state}`} style={pick === i && i !== P.bad ? { boxShadow: "inset 2px 0 0 var(--danger)" } : undefined}>
              <input type="radio" name={`proof-line-${p}`} checked={pick === i} onChange={() => setPick(i)} />
              <span><span className="mono">{i + 1}.</span> {line}</span>
            </label>
          );
        })}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {pick === null
          ? <>Click the first line where the reasoning goes wrong.</>
          : pick === P.bad
            ? <>Yes, line {P.bad + 1}. {P.why}</>
            : <>Line {pick + 1} is fine as it stands{pick > P.bad ? ", but something earlier has already gone wrong" : ""}. Look again.</>}
      </figcaption>
    </figure>
  );
}
