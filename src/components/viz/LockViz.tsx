"use client";

import { useState } from "react";

const MONTHS = ["Jan", "Mar", "May", "Jul", "Sep", "Nov"];
/** Releases of a fictional data-loading library, by the month they appeared. Version 3 renamed a function. */
const RELEASES = [
  { v: "2.4.0", m: 0 }, { v: "2.4.1", m: 1 }, { v: "2.5.0", m: 2 }, { v: "3.0.0", m: 4, breaking: true }, { v: "3.0.1", m: 5, breaking: true },
];

/** Installing from a version range against installing from a lock file, as new releases appear. */
export function LockViz() {
  const [m, setM] = useState(0);
  const [locked, setLocked] = useState(false);
  const available = RELEASES.filter((r) => r.m <= m);
  const chosenRange = available[available.length - 1];
  const chosen = locked ? RELEASES[0] : chosenRange;
  const ok = !chosen.breaking;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="What you install from">
          <button type="button" className="seg" aria-pressed={!locked} onClick={() => setLocked(false)}>pyproject.toml: fastload &gt;= 2.4</button>
          <button type="button" className="seg" aria-pressed={locked} onClick={() => setLocked(true)}>uv.lock: fastload == 2.4.0</button>
        </div>
      </div>
      <ol className="lock-releases" aria-label="Releases available">
        {RELEASES.map((r) => (
          <li key={r.v} className={`${r.m <= m ? "is-out" : "is-future"}${r === chosen ? " is-chosen" : ""}${r.breaking ? " is-breaking" : ""}`}>
            <code>{r.v}</code><small>{MONTHS[r.m]}{r.breaking ? ", renames load()" : ""}</small>
          </li>
        ))}
      </ol>
      <div className="viz-sliders">
        <label>
          you run the install in: {MONTHS[m]}
          <input type="range" min={0} max={MONTHS.length - 1} value={m} onChange={(e) => setM(Number(e.target.value))} />
        </label>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{chosen.v}</b><span>version installed</span></div>
        <div className="ml-stat"><b style={{ color: ok ? "var(--success)" : "var(--danger)" }}>{ok ? "passes" : "fails"}</b><span>your training script</span></div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {locked
          ? "The lock file names one exact version, so every install, in any month and on any machine, gets 2.4.0, the version the code was written and tested against."
          : ok
            ? `The range allows anything from 2.4 up, so the installer picks the newest release available in ${MONTHS[m]}: ${chosen.v}. It still works, for now.`
            : `In ${MONTHS[m]} the newest release is ${chosen.v}, which renamed a function your code calls. Same code, same pyproject.toml, broken install.`}
      </figcaption>
    </figure>
  );
}
