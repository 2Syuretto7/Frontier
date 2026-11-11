"use client";

import { useState } from "react";

const N = 2000, ERRORS = 200, REVIEWED = 100;
const CAUSES = [
  { name: "Forwarded threads", n: 30, note: "The model reads the forwarded message, not the new one on top." },
  { name: "Label is wrong", n: 22, note: "The model was right; the annotator was not. Fixing labels changes the score, not the model." },
  { name: "Mixed Hindi and English", n: 18, note: "Little training data is code-mixed. Collecting some is the likely fix." },
  { name: "Very short emails", n: 15, note: "Under ten words, there is often too little to go on." },
  { name: "Genuinely ambiguous", n: 10, note: "Careful people disagree. No model will fix these." },
  { name: "Other", n: 5, note: "One-off causes." },
];

/** Tallying a sample of a model's errors by cause, and the most each fix could gain. */
export function ErrorViz() {
  const [pick, setPick] = useState(0);
  const c = CAUSES[pick];
  const acc = 1 - ERRORS / N;
  const gain = (c.n / REVIEWED) * (ERRORS / N);
  const max = Math.max(...CAUSES.map((x) => x.n));
  return (
    <figure className="viz">
      <p className="viz-caption" style={{ marginTop: 0 }}>
        An email-routing model gets {ERRORS} of {N.toLocaleString("en-IN")} validation emails wrong. You read {REVIEWED} of those errors, chosen at random, and note the main cause of each.
      </p>
      <div role="group" aria-label="Causes of error" style={{ display: "grid", gap: 6, marginTop: 12 }}>
        {CAUSES.map((x, i) => (
          <button key={x.name} type="button" className="seg" aria-pressed={pick === i} onClick={() => setPick(i)} style={{ display: "grid", gridTemplateColumns: "minmax(0, 11em) 1fr 2.5em", alignItems: "center", gap: 8, textAlign: "left", height: "auto", padding: "6px 8px" }}>
            <span>{x.name}</span>
            <span style={{ display: "block", height: 10, width: `${(100 * x.n) / max}%`, background: pick === i ? "var(--accent)" : "var(--text-faint)", borderRadius: 2 }} />
            <span style={{ fontFamily: "var(--font-mono)", textAlign: "right" }}>{x.n}</span>
          </button>
        ))}
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{(acc * 100).toFixed(1)}%</b><span>accuracy now</span></div>
        <div className="ml-stat"><b>{((acc + gain) * 100).toFixed(1)}%</b><span>at most, if every “{c.name.toLowerCase()}” error were fixed</span></div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {c.n} of {REVIEWED} reviewed errors, so about {c.n}% of all {ERRORS} errors, or {Math.round((c.n / REVIEWED) * ERRORS)} emails. Fixing them all would add at most {(gain * 100).toFixed(1)} percentage points. {c.note}
      </figcaption>
    </figure>
  );
}
