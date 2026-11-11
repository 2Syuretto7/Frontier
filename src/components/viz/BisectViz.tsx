"use client";

import { useState } from "react";
import { makeRng } from "./ml";

const N = 16;

/** Binary search through history for the commit that introduced a bug. */
export function BisectViz() {
  const [seed, setSeed] = useState(3);
  const culprit = 1 + Math.floor(makeRng(seed * 101)() * (N - 1));
  const [good, setGood] = useState(0);
  const [bad, setBad] = useState(N - 1);
  const [tests, setTests] = useState<{ c: number; ok: boolean }[]>([]);
  const done = bad - good === 1;
  const mid = Math.floor((good + bad) / 2);
  const test = () => {
    const ok = mid < culprit;
    setTests([...tests, { c: mid, ok }]);
    if (ok) setGood(mid); else setBad(mid);
  };
  const reset = (s: number) => { setSeed(s); setGood(0); setBad(N - 1); setTests([]); };
  return (
    <figure className="viz">
      <div className="bisect-row" role="img" aria-label={`Commits 1 to ${N}; the bug lies between commit ${good + 1} and commit ${bad + 1}`}>
        {Array.from({ length: N }, (_, c) => {
          const t = tests.find((x) => x.c === c);
          const cls = c === 0 || (t && t.ok) ? "is-good" : c === N - 1 || (t && !t.ok) ? "is-bad" : c > good && c < bad ? "is-open" : "is-out";
          return <div key={c} className={`bisect-cell ${cls}${!done && c === mid ? " is-mid" : ""}${done && c === bad ? " is-found" : ""}`}>{c + 1}</div>;
        })}
      </div>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={test} disabled={done}>Test commit {mid + 1}</button>
        <button type="button" className="btn" onClick={() => reset(seed + 1)}>Hide a new bug</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {done
          ? `Found it: commit ${bad + 1} is the first bad one, after ${tests.length} test${tests.length === 1 ? "" : "s"}. Checking every commit one by one could have taken up to ${N - 2}.`
          : `Commit 1 is known good and commit ${N} is known bad. The first bad commit is somewhere from ${good + 2} to ${bad + 1}; testing the middle one halves the range.`}
        {tests.length > 0 && !done ? ` Last test: commit ${tests[tests.length - 1].c + 1} is ${tests[tests.length - 1].ok ? "good" : "bad"}.` : ""}
      </figcaption>
    </figure>
  );
}
