"use client";

import { useState } from "react";

const NUMS = [8, 6, 7, 5, 3, 10, 9];
const TARGET = 15;

/** Subset sum: checking a proposed answer takes one addition, but finding one may mean trying all 2ⁿ subsets. */
export function SubsetSumViz() {
  const [pick, setPick] = useState<boolean[]>(NUMS.map(() => false));
  const sum = NUMS.reduce((s, v, i) => s + (pick[i] ? v : 0), 0);
  let solutions = 0;
  for (let m = 0; m < 1 << NUMS.length; m++) if (NUMS.reduce((s, v, i) => s + (m & (1 << i) ? v : 0), 0) === TARGET) solutions++;
  const C = 64;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${NUMS.length * C + 10} 80`} role="img" aria-label={`Chosen numbers add to ${sum}`}>
        {NUMS.map((v, i) => (
          <g key={i} onClick={() => setPick(pick.map((b, j) => (j === i ? !b : b)))} style={{ cursor: "pointer" }}>
            <rect x={5 + i * C + 4} y={10} width={C - 8} height={C - 8} rx={8} className={pick[i] ? "viz-cell is-on" : "viz-cell"} />
            <text x={5 + i * C + C / 2} y={10 + C / 2} textAnchor="middle" className={pick[i] ? "viz-label is-on" : "viz-label"}>{v}</text>
          </g>
        ))}
      </svg>
      <p className={sum === TARGET ? "viz-verdict viz-verdict-right" : "viz-verdict viz-verdict-info"} style={{ margin: "8px 0 0" }}>
        Chosen sum {sum}{sum === TARGET ? ` = ${TARGET}: a certificate, checked in one pass.` : `, target ${TARGET}.`}
      </p>
      <figcaption className="viz-caption" aria-live="polite">
        Click numbers to choose a subset that adds to {TARGET}. Checking a choice is quick, but a search that tries every subset of{" "}
        {NUMS.length} numbers tries <span className="mono">2^{NUMS.length} = {2 ** NUMS.length}</span> of them ({solutions} work here). With 60 numbers that
        would be about 10¹⁸ subsets. Subset sum is in NP because answers are easy to check; nobody knows whether it is in P.
      </figcaption>
    </figure>
  );
}
