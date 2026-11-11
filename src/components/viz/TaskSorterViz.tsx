"use client";

import { useState } from "react";

type Kind = "regression" | "classification" | "clustering";
const LABEL: Record<Kind, string> = { regression: "Regression", classification: "Classification", clustering: "Clustering" };

const TASKS: { text: string; kind: Kind; why: string }[] = [
  { text: "Predict tomorrow's maximum temperature in Pune from today's weather readings.", kind: "regression", why: "The output is a number on a continuous scale. Experience: past days with their next-day temperature. Performance: average error in degrees." },
  { text: "Decide whether a card payment is fraudulent, using thousands of past payments that investigators have labelled.", kind: "classification", why: "The output is one of two labels. Experience: labelled past payments. Performance: how many frauds are caught, and how many honest payments are wrongly blocked." },
  { text: "Group a shop's customers into a few types by their buying habits, with no types given in advance.", kind: "clustering", why: "There are no labels to learn from, so the task is to find structure. Performance is harder to define: groups should be tight, distinct and useful to the shop." },
  { text: "Estimate the selling price of a flat from its size, floor and locality.", kind: "regression", why: "A price is a number. Experience: recent sales. Performance: typical error in rupees, or in percentage terms." },
  { text: "Read a photo of a handwritten digit and say which digit, 0 to 9, it is.", kind: "classification", why: "Ten labels rather than two, but still a choice among fixed categories. Performance: the fraction of digits read correctly." },
];

/** Sort machine-learning tasks by the kind of output they need. */
export function TaskSorterViz() {
  const [picks, setPicks] = useState<Record<number, Kind>>({});
  const right = TASKS.filter((t, i) => picks[i] === t.kind).length;
  return (
    <figure className="viz">
      <ol className="sorter">
        {TASKS.map((t, i) => {
          const p = picks[i];
          return (
            <li key={i} className="sorter-item">
              <p className="sorter-q">{t.text}</p>
              <div className="segmented" role="group" aria-label="Kind of task">
                {(Object.keys(LABEL) as Kind[]).map((k) => (
                  <button key={k} type="button" aria-pressed={p === k} className={p === k ? (k === t.kind ? "seg is-right" : "seg is-wrong") : "seg"} onClick={() => setPicks((x) => ({ ...x, [i]: k }))}>{LABEL[k]}</button>
                ))}
              </div>
              {p && <p className="sorter-why">{p === t.kind ? "Right. " : `Not quite: it is ${LABEL[t.kind].toLowerCase()}. `}{t.why}</p>}
            </li>
          );
        })}
      </ol>
      <figcaption className="viz-caption" aria-live="polite">{Object.keys(picks).length ? `${right} of ${TASKS.length} right so far.` : "Pick the kind of task for each."}</figcaption>
    </figure>
  );
}
