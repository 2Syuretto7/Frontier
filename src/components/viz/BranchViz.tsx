"use client";

import { useState } from "react";

const CONDS: { line: number; limit: number; print: number; word: string }[] = [
  { line: 2, limit: 35, print: 3, word: "Very hot" },
  { line: 4, limit: 25, print: 5, word: "Warm" },
  { line: 6, limit: 15, print: 7, word: "Mild" },
];

/** Move the temperature and watch which branch of an if, elif, else statement runs. */
export function BranchViz() {
  const [t, setT] = useState(31);
  const lines = [
    `temp = ${t}`,
    "if temp >= 35:",
    '    print("Very hot")',
    "elif temp >= 25:",
    '    print("Warm")',
    "elif temp >= 15:",
    '    print("Mild")',
    "else:",
    '    print("Cold")',
    'print("Done")',
  ];
  const run = new Set<number>([1]);
  const checked: string[] = [];
  let word = "Cold";
  let hit = false;
  for (const c of CONDS) {
    run.add(c.line);
    const ok = t >= c.limit;
    checked.push(`temp >= ${c.limit} is ${ok ? "True" : "False"}`);
    if (ok) { run.add(c.print); word = c.word; hit = true; break; }
  }
  if (!hit) { run.add(8); run.add(9); }
  run.add(10);

  return (
    <figure className="viz">
      <div className="trace">
        <pre className="trace-code" aria-label="Program">
          {lines.map((l, k) => (
            <span key={k} className={run.has(k + 1) ? "trace-line is-on" : "trace-line"}>
              <span className="trace-ln">{k + 1}</span>{l}
            </span>
          ))}
        </pre>
        <div className="trace-side">
          <div className="trace-box">
            <h4>Conditions checked</h4>
            <p className="trace-out">{checked.join("\n")}</p>
          </div>
          <div className="trace-box">
            <h4>Output</h4>
            <p className="trace-out">{`${word}\nDone`}</p>
          </div>
        </div>
      </div>
      <div className="viz-sliders">
        <label>
          temp = {t}
          <input className="viz-range" type="range" min={0} max={45} value={t} onChange={(e) => setT(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Highlighted lines run. {hit ? `Python checks the conditions in order and runs only the first branch whose condition is True: "${word}".` : "Every condition is False, so the else branch runs."}
      </figcaption>
    </figure>
  );
}
