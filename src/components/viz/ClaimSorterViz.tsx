"use client";

import { useState } from "react";

type Flaw = "fine" | "contamination" | "cherry" | "baseline" | "noise";
const LABEL: Record<Flaw, string> = { fine: "Looks sound", contamination: "Test leaked", cherry: "Cherry-picked", baseline: "No fair baseline", noise: "Within the noise" };

const CLAIMS: { text: string; flaw: Flaw; why: string }[] = [
  { text: "Our model scores 92% on a benchmark of maths problems that were posted, with solutions, on the web in 2019. It was trained on a web crawl from 2023.", flaw: "contamination", why: "The test questions and answers were probably in the training data. A high score may be memory, not reasoning." },
  { text: "Look at these five stunning stories our model wrote!", flaw: "cherry", why: "Five chosen examples say nothing about the typical output. Ask how they were picked and what the other ninety-five looked like." },
  { text: "Our new method improves accuracy from 61% to 74%, compared with the original model from three years ago.", flaw: "baseline", why: "Compared with an old, weak baseline, almost anything looks good. The fair comparison is against the best current method given the same compute." },
  { text: "Model A scores 70.4% and model B 70.1% on a 300-question test, each run once. A is better.", flaw: "noise", why: "On 300 questions, the score varies by a few points from random chance alone. A 0.3 point gap tells you nothing." },
  { text: "On a test set created after the training data was collected, with the same compute as the previous best method and averaged over five runs, the new method wins by 6 points.", flaw: "fine", why: "Fresh test data, a fair baseline, and repeated runs. Not proof, but this is what a careful claim looks like." },
];

/** Sort claims about AI results by what, if anything, is wrong with them. */
export function ClaimSorterViz() {
  const [picks, setPicks] = useState<Record<number, Flaw>>({});
  const right = CLAIMS.filter((c, i) => picks[i] === c.flaw).length;
  return (
    <figure className="viz">
      <ol className="sorter">
        {CLAIMS.map((c, i) => {
          const p = picks[i];
          return (
            <li key={i} className="sorter-item">
              <p className="sorter-q">{c.text}</p>
              <div className="segmented" role="group" aria-label="What is wrong with this claim">
                {(Object.keys(LABEL) as Flaw[]).map((k) => (
                  <button key={k} type="button" aria-pressed={p === k} className={p === k ? (k === c.flaw ? "seg is-right" : "seg is-wrong") : "seg"} onClick={() => setPicks((x) => ({ ...x, [i]: k }))}>{LABEL[k]}</button>
                ))}
              </div>
              {p && <p className="sorter-why">{p === c.flaw ? "Right. " : `Not quite: it is “${LABEL[c.flaw]}”. `}{c.why}</p>}
            </li>
          );
        })}
      </ol>
      <figcaption className="viz-caption" aria-live="polite">{Object.keys(picks).length ? `${right} of ${CLAIMS.length} right so far.` : "Pick the main problem with each claim."}</figcaption>
    </figure>
  );
}
