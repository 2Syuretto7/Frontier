"use client";

import { useState } from "react";

type S = { x: number; reg: [number, number]; pc: [number, number]; owner: number | null; trace: string };

const START: S = { x: 0, reg: [0, 0], pc: [0, 0], owner: null, trace: "" };

/** Two threads run x = x + 1 as load, add and store; you choose which thread takes the next step, with or without a lock. */
export function InterleaveViz() {
  const [locked, setLocked] = useState(false);
  const [s, setS] = useState<S>(START);
  const prog = locked ? ["lock(m)", "r = x", "r = r + 1", "x = r", "unlock(m)"] : ["r = x", "r = r + 1", "x = r"];
  const done = (t: number) => s.pc[t] >= prog.length;
  const blocked = (t: number) => !done(t) && prog[s.pc[t]] === "lock(m)" && s.owner !== null && s.owner !== t;
  const step = (t: 0 | 1) => {
    if (done(t) || blocked(t)) return;
    const op = prog[s.pc[t]];
    const reg = [...s.reg] as [number, number], pc = [...s.pc] as [number, number];
    let { x, owner } = s;
    if (op === "lock(m)") owner = t;
    else if (op === "unlock(m)") owner = null;
    else if (op === "r = x") reg[t] = x;
    else if (op === "r = r + 1") reg[t] += 1;
    else x = reg[t];
    pc[t]++;
    setS({ x, reg, pc, owner, trace: s.trace + "AB"[t] });
  };
  const toggle = (v: boolean) => { setLocked(v); setS(START); };
  const finished = done(0) && done(1);
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Locking">
        <button type="button" className="seg" aria-pressed={!locked} onClick={() => toggle(false)}>no lock</button>
        <button type="button" className="seg" aria-pressed={locked} onClick={() => toggle(true)}>with a lock</button>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => step(0)} disabled={done(0) || blocked(0)}>Step thread A</button>
        <button type="button" className="btn" onClick={() => step(1)} disabled={done(1) || blocked(1)}>Step thread B</button>
        <button type="button" className="btn" onClick={() => setS(START)}>Reset</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {[0, 1].map((t) => (
          <div key={t} style={{ flex: "1 1 9rem", minWidth: 0 }}>
            <div className="mono" style={{ fontWeight: 600, marginBottom: 4 }}>
              thread {"AB"[t]}: r = {s.reg[t]} {blocked(t) ? "(blocked)" : done(t) ? "(done)" : ""}
            </div>
            <pre className="mono" style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
              {prog.map((line, i) => (
                <div key={i} style={i === s.pc[t] ? { background: "var(--accent-soft)", borderRadius: 4 } : i < s.pc[t] ? { opacity: 0.5 } : undefined}>
                  {line}
                </div>
              ))}
            </pre>
          </div>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Shared <span className="mono">x = {s.x}</span>
        {locked && <>, lock m held by <span className="mono">{s.owner === null ? "nobody" : "AB"[s.owner]}</span></>}. Steps so far:{" "}
        <span className="mono">{s.trace || "none"}</span>.{" "}
        {finished
          ? s.x === 2
            ? "Both increments counted."
            : "Both threads finished but x is 1: they both read 0 before either wrote, so one update was lost."
          : locked
            ? "Try to interleave the threads: whoever holds the lock keeps the other out of the load, add and store."
            : "Try A, B, A, B, A, B: each thread reads x before the other writes it."}
      </figcaption>
    </figure>
  );
}
