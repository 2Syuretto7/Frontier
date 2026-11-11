"use client";

import { useMemo, useState } from "react";

type Ins = { label?: string; op: string; args: string[]; note: string };

const PROGRAMS: Record<string, { title: string; code: Ins[] }> = {
  loop: {
    title: "loop: sum 1..4",
    code: [
      { op: "li", args: ["r1", "0"], note: "total = 0" },
      { op: "li", args: ["r2", "1"], note: "i = 1" },
      { op: "li", args: ["r3", "4"], note: "n = 4" },
      { label: "loop", op: "blt", args: ["r3", "r2", "done"], note: "if n < i, leave" },
      { op: "add", args: ["r1", "r1", "r2"], note: "total += i" },
      { op: "addi", args: ["r2", "r2", "1"], note: "i += 1" },
      { op: "j", args: ["loop"], note: "back to the test" },
      { label: "done", op: "halt", args: [], note: "stop" },
    ],
  },
  call: {
    title: "call: square twice",
    code: [
      { op: "li", args: ["r1", "3"], note: "argument" },
      { op: "call", args: ["sq"], note: "push return address, jump" },
      { op: "call", args: ["sq"], note: "again, on the result" },
      { op: "halt", args: [], note: "stop" },
      { label: "sq", op: "push", args: ["r2"], note: "save r2 for the caller" },
      { op: "mul", args: ["r2", "r1", "r1"], note: "r2 = r1 * r1" },
      { op: "mov", args: ["r1", "r2"], note: "result in r1" },
      { op: "pop", args: ["r2"], note: "restore r2" },
      { op: "ret", args: [], note: "pop address, jump back" },
    ],
  },
};

type State = { pc: number; regs: number[]; stack: { v: number; ret: boolean }[]; done: boolean; steps: number };

function step(code: Ins[], s: State): State {
  if (s.done || s.pc >= code.length) return { ...s, done: true };
  const at = (l: string) => code.findIndex((c) => c.label === l);
  const ri = (r: string) => Number(r.slice(1));
  const regs = [...s.regs], stack = [...s.stack];
  const { op, args: a } = code[s.pc];
  let pc = s.pc + 1, done = false;
  switch (op) {
    case "li": regs[ri(a[0])] = Number(a[1]); break;
    case "mov": regs[ri(a[0])] = regs[ri(a[1])]; break;
    case "add": regs[ri(a[0])] = regs[ri(a[1])] + regs[ri(a[2])]; break;
    case "mul": regs[ri(a[0])] = regs[ri(a[1])] * regs[ri(a[2])]; break;
    case "addi": regs[ri(a[0])] = regs[ri(a[1])] + Number(a[2]); break;
    case "blt": if (regs[ri(a[0])] < regs[ri(a[1])]) pc = at(a[2]); break;
    case "j": pc = at(a[0]); break;
    case "push": stack.push({ v: regs[ri(a[0])], ret: false }); break;
    case "pop": regs[ri(a[0])] = stack.pop()!.v; break;
    case "call": stack.push({ v: pc, ret: true }); pc = at(a[0]); break;
    case "ret": pc = stack.pop()!.v; break;
    case "halt": done = true; break;
  }
  return { pc, regs, stack, done: done || pc >= code.length, steps: s.steps + 1 };
}

const START: State = { pc: 0, regs: [0, 0, 0, 0], stack: [], done: false, steps: 0 };

/** A toy processor: step through a program and watch the program counter, registers and stack change. */
export function AsmStepViz() {
  const [prog, setProg] = useState<keyof typeof PROGRAMS>("loop");
  const [n, setN] = useState(0);
  const code = PROGRAMS[prog].code;
  const s = useMemo(() => {
    let st = START;
    for (let i = 0; i < n; i++) st = step(code, st);
    return st;
  }, [code, n]);
  const choose = (p: keyof typeof PROGRAMS) => { setProg(p); setN(0); };
  const last = n > 0 ? code[prevPc(code, n)] : null;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Program">
        {(Object.keys(PROGRAMS) as (keyof typeof PROGRAMS)[]).map((p) => (
          <button key={p} type="button" className="seg" aria-pressed={prog === p} onClick={() => choose(p)}>{PROGRAMS[p].title}</button>
        ))}
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setN(n + 1)} disabled={s.done}>Step</button>
        <button type="button" className="btn" onClick={() => setN(n + 200)} disabled={s.done}>Run to end</button>
        <button type="button" className="btn" onClick={() => setN(0)}>Reset</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-start" }}>
        <pre className="mono" style={{ margin: 0, fontSize: 13, lineHeight: 1.6, flex: "1 1 18rem", minWidth: 0, overflowX: "auto" }}>
          {code.map((c, i) => (
            <div key={i} style={i === s.pc && !s.done ? { background: "var(--accent-soft, rgba(127,127,255,0.18))", borderRadius: 4 } : undefined}>
              <span style={{ display: "inline-block", width: "1.6rem", opacity: 0.6 }}>{i}</span>
              <span style={{ display: "inline-block", width: "3.4rem" }}>{c.label ? c.label + ":" : ""}</span>
              <span style={{ display: "inline-block", width: "2.8rem" }}>{c.op}</span>
              <span style={{ display: "inline-block", width: "7.5rem" }}>{c.args.join(", ")}</span>
              <span style={{ opacity: 0.6 }}>; {c.note}</span>
            </div>
          ))}
        </pre>
        <div style={{ flex: "0 1 12rem" }}>
          <table className="table mono" style={{ fontSize: 13 }}>
            <tbody>
              <tr><td>pc</td><td>{s.done ? "halted" : s.pc}</td></tr>
              {s.regs.map((v, i) => i > 0 && <tr key={i}><td>r{i}</td><td>{v}</td></tr>)}
              <tr><td>stack</td><td>{s.stack.length ? s.stack.map((e) => (e.ret ? `ret→${e.v}` : String(e.v))).join(" ") : "empty"}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {n === 0
          ? "The highlighted line is the one the program counter points at. Press Step to run it."
          : s.done
            ? `Halted after ${s.steps} instructions. Every loop and function call was only jumps, compares and a stack.`
            : `Ran ${last ? last.op : ""} (${s.steps} so far). A branch or jump sets pc; every other instruction just moves on to pc + 1.`}
      </figcaption>
    </figure>
  );
}

/** Index of the instruction executed by the n-th step. */
function prevPc(code: Ins[], n: number): number {
  let st = START;
  for (let i = 0; i < n - 1; i++) st = step(code, st);
  return st.pc;
}
