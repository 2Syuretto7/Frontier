"use client";

import { useState } from "react";

type Kind = "leak" | "fine";
const LABEL: Record<Kind, string> = { leak: "Leakage", fine: "Sound" };

const CASES: { text: string; kind: Kind; why: string }[] = [
  { text: "To predict which customers will cancel next month, a model uses the feature “date the account was closed”.", kind: "leak", why: "That field is filled in only after a customer cancels, so it encodes the answer. It will be blank for every customer the model is asked about." },
  { text: "Several chest X-rays per patient are shuffled and split at random into training and test sets.", kind: "leak", why: "The same patient appears on both sides, so the model can score well by recognising patients rather than disease. Split by patient instead." },
  { text: "Daily sales are shuffled into random folds, and the model is scored on predicting days that fall between training days.", kind: "leak", why: "The model sees the days after the ones it predicts. In use it only ever has the past, so train on earlier days and test on later ones." },
  { text: "The 20 features most correlated with the label are chosen using the whole dataset, and then the model is cross-validated on those features.", kind: "leak", why: "The validation folds helped choose the features, so the score is optimistic. Feature selection must happen inside each training fold." },
  { text: "Feature means and standard deviations are computed on the training split only, then used to standardise both the training and test splits.", kind: "fine", why: "The test split influences nothing, exactly as new data will not. This is the right way to scale." },
  { text: "Exact duplicate rows are removed from the dataset before it is split.", kind: "fine", why: "Removing duplicates first stops the same example from landing on both sides of the split, which would itself be a leak." },
  { text: "Settings are tuned on a validation set, and the final model is scored once on a test set nobody has looked at.", kind: "fine", why: "The test set played no part in any decision, so its score is an honest estimate." },
];

/** Decide which pipelines let information from the test data, or from the future, leak into training. */
export function LeakageViz() {
  const [picks, setPicks] = useState<Record<number, Kind>>({});
  const right = CASES.filter((t, i) => picks[i] === t.kind).length;
  return (
    <figure className="viz">
      <ol className="sorter">
        {CASES.map((t, i) => {
          const p = picks[i];
          return (
            <li key={i} className="sorter-item">
              <p className="sorter-q">{t.text}</p>
              <div className="segmented" role="group" aria-label="Leakage or sound">
                {(Object.keys(LABEL) as Kind[]).map((k) => (
                  <button key={k} type="button" aria-pressed={p === k} className={p === k ? (k === t.kind ? "seg is-right" : "seg is-wrong") : "seg"} onClick={() => setPicks((x) => ({ ...x, [i]: k }))}>{LABEL[k]}</button>
                ))}
              </div>
              {p && <p className="sorter-why">{p === t.kind ? "Right. " : `Not quite: this is ${t.kind === "leak" ? "leakage" : "sound"}. `}{t.why}</p>}
            </li>
          );
        })}
      </ol>
      <figcaption className="viz-caption" aria-live="polite">{Object.keys(picks).length ? `${right} of ${CASES.length} right so far.` : "Decide whether each pipeline leaks."}</figcaption>
    </figure>
  );
}
