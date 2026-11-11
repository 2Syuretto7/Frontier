"use client";

import { useState } from "react";

type Mode = "global" | "venv";
const NEEDS = { A: { name: "old-paper-repro", numpy: "1.26", rule: "numpy < 2" }, B: { name: "new-project", numpy: "2.1", rule: "numpy >= 2" } };

/** One shared environment against one environment per project. */
export function EnvViz() {
  const [mode, setMode] = useState<Mode>("global");
  const [done, setDone] = useState<("A" | "B")[]>([]);
  const install = (p: "A" | "B") => setDone((d) => (d.includes(p) ? d : [...d, p]));
  const envs = mode === "global"
    ? [{ label: "one global environment", path: "/usr/lib/python3.12/site-packages", numpy: done.length ? NEEDS[done[done.length - 1]].numpy : "—", users: done }]
    : (["A", "B"] as const).map((p) => ({ label: `${NEEDS[p].name}/.venv`, path: `~/${NEEDS[p].name}/.venv`, numpy: done.includes(p) ? NEEDS[p].numpy : "—", users: done.includes(p) ? [p] : [] }));
  const works = (p: "A" | "B") => {
    if (!done.includes(p)) return null;
    const env = envs.find((e) => e.users.includes(p))!;
    return p === "A" ? env.numpy.startsWith("1.") : env.numpy.startsWith("2.");
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Environment setup">
          <button type="button" className="seg" aria-pressed={mode === "global"} onClick={() => { setMode("global"); setDone([]); }}>One global environment</button>
          <button type="button" className="seg" aria-pressed={mode === "venv"} onClick={() => { setMode("venv"); setDone([]); }}>A virtual environment each</button>
        </div>
      </div>
      <div className="env-projects">
        {(["A", "B"] as const).map((p) => {
          const w = works(p);
          return (
            <div key={p} className="env-proj">
              <b>{NEEDS[p].name}</b>
              <small>needs {NEEDS[p].rule}</small>
              <button type="button" className="btn" onClick={() => install(p)} disabled={done.includes(p)}>Install its requirements</button>
              <span className={w === null ? "env-status" : w ? "env-status is-ok" : "env-status is-bad"}>{w === null ? "not set up" : w ? "runs" : "broken: wrong numpy"}</span>
            </div>
          );
        })}
      </div>
      <div className="env-envs">
        {envs.map((e) => (
          <div key={e.label} className="env-env"><code>{e.path}</code><span>numpy {e.numpy}</span></div>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {mode === "global"
          ? done.length < 2 ? "Install both projects' requirements, in either order." : "Both projects share one numpy. Installing the second project's requirements replaced the version the first one needs, so one of them is now broken."
          : done.length < 2 ? "Each project gets its own folder of packages. Install both." : "Each environment has its own numpy, so both projects run. Nothing one installs can break the other."}
      </figcaption>
    </figure>
  );
}
