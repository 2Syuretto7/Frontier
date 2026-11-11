"use client";

import { useState } from "react";

type Local = { ok: boolean; seen: number; done: boolean; got: boolean };
type St = { bal: number; pc: [number, number]; loc: [Local, Local]; trace: string; retries: number };

const L0: Local = { ok: false, seen: 0, done: false, got: false };
const START: St = { bal: 100, pc: [0, 0], loc: [L0, L0], trace: "", retries: 0 };

const PLAIN = ["if balance >= 80:", "    balance -= 80"];
const CAS = ["seen = balance", "if seen < 80: give up", "CAS(balance, seen, seen - 80) or retry"];

/** Two threads each withdraw 80 from a balance of 100: check-then-act can overdraw, compare-and-swap cannot. */
export function RaceViz() {
  const [cas, setCas] = useState(false);
  const [s, setS] = useState<St>(START);
  const prog = cas ? CAS : PLAIN;
  const step = (t: 0 | 1) => {
    const l: Local = { ...s.loc[t] };
    if (l.done) return;
    let { bal, retries } = s;
    let pc = s.pc[t];
    if (!cas) {
      if (pc === 0) { l.ok = bal >= 80; pc = l.ok ? 1 : 2; }
      else { bal -= 80; l.got = true; pc = 2; }
      l.done = pc === 2;
    } else {
      if (pc === 0) { l.seen = bal; pc = 1; }
      else if (pc === 1) { if (l.seen < 80) { l.done = true; pc = 3; } else pc = 2; }
      else if (bal === l.seen) { bal = l.seen - 80; l.got = true; l.done = true; pc = 3; }
      else { retries++; pc = 0; }
    }
    const loc = [...s.loc] as [Local, Local];
    loc[t] = l;
    const pcs = [...s.pc] as [number, number];
    pcs[t] = pc;
    setS({ bal, pc: pcs, loc, trace: s.trace + "AB"[t], retries });
  };
  const both = s.loc[0].done && s.loc[1].done;
  const got = s.loc.filter((l) => l.got).length;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Implementation">
        <button type="button" className="seg" aria-pressed={!cas} onClick={() => { setCas(false); setS(START); }}>check then act</button>
        <button type="button" className="seg" aria-pressed={cas} onClick={() => { setCas(true); setS(START); }}>compare-and-swap</button>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => step(0)} disabled={s.loc[0].done}>Step thread A</button>
        <button type="button" className="btn" onClick={() => step(1)} disabled={s.loc[1].done}>Step thread B</button>
        <button type="button" className="btn" onClick={() => setS(START)}>Reset</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {[0, 1].map((t) => (
          <div key={t} style={{ flex: "1 1 12rem", minWidth: 0 }}>
            <div className="mono" style={{ fontWeight: 600, marginBottom: 4 }}>
              thread {"AB"[t]}{cas ? `: seen = ${s.loc[t].seen}` : ""} {s.loc[t].done ? (s.loc[t].got ? "(withdrew)" : "(refused)") : ""}
            </div>
            <pre className="mono" style={{ margin: 0, fontSize: 13, lineHeight: 1.6, overflowX: "auto" }}>
              {prog.map((line, i) => (
                <div key={i} style={!s.loc[t].done && i === s.pc[t] ? { background: "var(--accent-soft)", borderRadius: 4 } : undefined}>{line}</div>
              ))}
            </pre>
          </div>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Balance <span className="mono">{s.bal}</span>. Steps: <span className="mono">{s.trace || "none"}</span>
        {cas ? <>, failed CAS attempts <span className="mono">{s.retries}</span></> : null}.{" "}
        {both
          ? s.bal < 0
            ? `Both withdrawals went through: ${got} × 80 from 100. Each thread checked before the other acted.`
            : "Only one withdrawal succeeded, as it should."
          : cas
            ? "Let both read 100 first: the second CAS finds the balance changed, retries, and then refuses."
            : "Try A, B, A, B: both checks see 100 before either subtracts."}
      </figcaption>
    </figure>
  );
}
