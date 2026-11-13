"use client";

import { useState } from "react";

const DIFF: { text: string; bug?: string }[] = [
  { text: "  def evaluate(model, loader):" },
  { text: "+     model.train()", bug: "Should be model.eval(): dropout stays on and batch norm keeps updating its statistics during evaluation." },
  { text: "      total, correct = 0, 0" },
  { text: "      for x, y in loader:" },
  { text: "+         logits = model(x)           # (batch, classes)" },
  { text: "+         pred = logits.argmax(axis=0)", bug: "axis=0 is the batch axis. The prediction for each example is the argmax over classes, axis=-1." },
  { text: "          correct += (pred == y).sum()" },
  { text: "          total += len(y)" },
  { text: "+     return correct / len(loader)", bug: "len(loader) is the number of batches, not examples. Divide by total." },
];

/** A three-bug diff. Tap the lines you would comment on, then check. */
export function ReviewHuntViz() {
  const [flagged, setFlagged] = useState<number[]>([]);
  const [shown, setShown] = useState(false);
  const bugs = DIFF.map((d, i) => (d.bug ? i : -1)).filter((i) => i >= 0);
  const found = flagged.filter((i) => DIFF[i].bug).length;
  const wrong = flagged.length - found;
  return (
    <figure className="viz">
      <div className="mono" style={{ fontSize: 13, overflowX: "auto" }}>
        {DIFF.map((d, i) => {
          const on = flagged.includes(i);
          const cls = shown ? (d.bug ? (on ? "is-right" : "is-wrong") : on ? "is-wrong" : "") : "";
          return (
            <div key={i}>
              <button type="button" className={`seg ${cls}`} aria-pressed={on} disabled={shown}
                onClick={() => setFlagged(on ? flagged.filter((j) => j !== i) : [...flagged, i])}
                style={{ display: "block", width: "100%", textAlign: "left", whiteSpace: "pre", borderRadius: 0, fontFamily: "inherit" }}>
                {d.text}
              </button>
              {shown && d.bug && <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "2px 8px 6px", whiteSpace: "normal" }}>{d.bug}</div>}
            </div>
          );
        })}
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setShown(true)} disabled={shown}>Check my review</button>
        <button type="button" className="btn" onClick={() => { setShown(false); setFlagged([]); }}>Start again</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {shown
          ? `You found ${found} of ${bugs.length} bugs${wrong ? ` and flagged ${wrong} correct line${wrong === 1 ? "" : "s"}` : ""}. None of them raises an error.`
          : "This change adds an evaluation function. It runs without an error and returns a number. Tap each line you would comment on."}
      </figcaption>
    </figure>
  );
}
