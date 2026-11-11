"use client";

import { useState } from "react";

type Obj = { id: number; type: string; value: string };
type Step = { line: number; names: Record<string, number>; objs: Obj[]; out?: string; note: string };

const CODE = `a = [1, 2, 3]
b = a
b.append(4)
c = list(a)
c.append(5)
print(a, b is a, c == a)
s = "hi"
t = s
t = t + "!"
print(s, t)`;

const L1: Obj = { id: 1, type: "list", value: "[1, 2, 3]" };
const L1b: Obj = { ...L1, value: "[1, 2, 3, 4]" };
const L2: Obj = { id: 2, type: "list", value: "[1, 2, 3, 4]" };
const L2b: Obj = { ...L2, value: "[1, 2, 3, 4, 5]" };
const S1: Obj = { id: 3, type: "str", value: "'hi'" };
const S2: Obj = { id: 4, type: "str", value: "'hi!'" };

const STEPS: Step[] = [
  { line: 1, names: { a: 1 }, objs: [L1], note: "Python creates a list object, then binds the name a to it. The name is a label; the object lives separately." },
  { line: 2, names: { a: 1, b: 1 }, objs: [L1], note: "b = a copies nothing. It binds b to the same object, so there is one list with two names." },
  { line: 3, names: { a: 1, b: 1 }, objs: [L1b], note: "append changes the object in place. Since a and b name the same list, the change is visible through both." },
  { line: 4, names: { a: 1, b: 1, c: 2 }, objs: [L1b, L2], note: "list(a) builds a new list with the same items. c names a different object." },
  { line: 5, names: { a: 1, b: 1, c: 2 }, objs: [L1b, L2b], note: "Changing c's list leaves the first list alone." },
  { line: 6, names: { a: 1, b: 1, c: 2 }, objs: [L1b, L2b], out: "[1, 2, 3, 4] True False\n", note: "is asks whether two names refer to the same object; == asks whether the values are equal. Here c's list has an extra 5, so == is False." },
  { line: 7, names: { a: 1, b: 1, c: 2, s: 3 }, objs: [L1b, L2b, S1], out: "[1, 2, 3, 4] True False\n", note: "A string object, bound to s." },
  { line: 8, names: { a: 1, b: 1, c: 2, s: 3, t: 3 }, objs: [L1b, L2b, S1], out: "[1, 2, 3, 4] True False\n", note: "t names the same string object." },
  { line: 9, names: { a: 1, b: 1, c: 2, s: 3, t: 4 }, objs: [L1b, L2b, S1, S2], out: "[1, 2, 3, 4] True False\n", note: "Strings are immutable: t + \"!\" cannot change the old string, so it builds a new one and rebinds t. s still names 'hi'." },
  { line: 10, names: { a: 1, b: 1, c: 2, s: 3, t: 4 }, objs: [L1b, L2b, S1, S2], out: "[1, 2, 3, 4] True False\nhi hi!\n", note: "With immutable objects, sharing is never surprising, because nothing can change underneath you." },
];

/** Names are labels bound to objects: watch aliasing, copying and immutability. */
export function ObjectsViz() {
  const [i, setI] = useState(0);
  const s = STEPS[i];
  const prev = i ? STEPS[i - 1] : null;
  const lines = CODE.split("\n");
  return (
    <figure className="viz">
      <div className="trace">
        <pre className="trace-code" aria-label="Program">
          {lines.map((l, k) => <span key={k} className={k + 1 === s.line ? "trace-line is-on" : "trace-line"}><span className="trace-ln">{k + 1}</span>{l}</span>)}
        </pre>
        <div className="trace-side">
          <div className="trace-box">
            <h4>Names and objects</h4>
            <div className="obj-grid">
              <div className="obj-names">
                {Object.entries(s.names).map(([n, id]) => (
                  <div key={n} className={prev && prev.names[n] !== id ? "obj-name is-new" : "obj-name"}><code>{n}</code> <span aria-hidden>→</span> <span className={`obj-ref r${id}`}>#{id}</span></div>
                ))}
              </div>
              <div className="obj-objs">
                {s.objs.map((o) => {
                  const old = prev?.objs.find((p) => p.id === o.id);
                  return (
                    <div key={o.id} className={!old || old.value !== o.value ? "obj-box is-new" : "obj-box"}>
                      <span className={`obj-ref r${o.id}`}>#{o.id}</span> <small>{o.type}</small>
                      <div><code>{o.value}</code></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="trace-box"><h4>Output</h4><p className="trace-out">{s.out ?? ""}</p></div>
        </div>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setI(0)} disabled={i === 0}>Start again</button>
        <button type="button" className="btn" onClick={() => setI(i - 1)} disabled={i === 0}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setI(i + 1)} disabled={i === STEPS.length - 1}>Next step</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">Step {i + 1} of {STEPS.length}. {s.note}</figcaption>
    </figure>
  );
}
