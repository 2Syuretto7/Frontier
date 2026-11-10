"use client";

import { useState } from "react";

type Part = { text: string; line?: number; why?: string };
type Case = { label: string; file: string; code: string[]; output?: string; tb: Part[] };

const CASES: Case[] = [
  {
    label: "TypeError",
    file: "shop.py",
    code: [
      "def total_cost(prices):",
      "    total = 0",
      "    for p in prices:",
      "        total = total + p",
      "    return total",
      "",
      'prices = [120, 85, "40", 60]',
      "print(total_cost(prices))",
    ],
    tb: [
      { text: "Traceback (most recent call last):", why: "A traceback lists the calls that were in progress when the error happened, oldest first. So read it from the bottom up." },
      { text: '  File "shop.py", line 8, in <module>', line: 8, why: "The first call: line 8 of the main program, which Python calls <module>, called total_cost." },
      { text: "    print(total_cost(prices))", line: 8 },
      { text: "          ~~~~~~~~~~^^^^^^^^", line: 8, why: "The markers point to the part of the line that was running: the call to total_cost." },
      { text: '  File "shop.py", line 4, in total_cost', line: 4, why: "Inside that call, the error happened on line 4 of total_cost. The last File line is where the program actually stopped." },
      { text: "    total = total + p", line: 4 },
      { text: "            ~~~~~~^~~", line: 4, why: "The caret marks the + that failed." },
      { text: "TypeError: unsupported operand type(s) for +: 'int' and 'str'", line: 4, why: "The last line says what went wrong: + was given an int and a str. So p was a string. Looking at the data, \"40\" was written with quotation marks. The bug is in the data on line 7, though the error appeared on line 4." },
    ],
  },
  {
    label: "NameError",
    file: "grade.py",
    code: ["score = 72", "if scroe > 50:", '    print("pass")'],
    tb: [
      { text: "Traceback (most recent call last):", why: "Start at the bottom: the last line names the error." },
      { text: '  File "grade.py", line 2, in <module>', line: 2, why: "The error is on line 2 of the main program." },
      { text: "    if scroe > 50:", line: 2 },
      { text: "       ^^^^^", line: 2, why: "The carets point at the name Python could not find." },
      { text: "NameError: name 'scroe' is not defined. Did you mean: 'score'?", line: 2, why: "A NameError means a name was used that was never assigned. Usually it is a typing mistake, and Python even suggests the likely intended name." },
    ],
  },
  {
    label: "IndexError",
    file: "marks.py",
    code: ["marks = [72, 85, 64]", "for i in range(1, 4):", "    print(marks[i])"],
    output: "85\n64",
    tb: [
      { text: "Traceback (most recent call last):", why: "Notice the program printed 85 and 64 before failing. Output before a traceback tells you how far it got." },
      { text: '  File "marks.py", line 3, in <module>', line: 3, why: "The error is on line 3, inside the loop." },
      { text: "    print(marks[i])", line: 3 },
      { text: "          ~~~~~^^^", line: 3, why: "The markers point to the indexing marks[i]." },
      { text: "IndexError: list index out of range", line: 3, why: "The list has indices 0, 1 and 2, but the loop reached i = 3. The range should be range(0, 3), or better range(len(marks)). The missing 72 in the output is a second clue: the loop also started one too late." },
    ],
  },
];

/** Click through the parts of a real Python traceback. */
export function TracebackViz() {
  const [c, setC] = useState(0);
  const [p, setP] = useState(0);
  const k = CASES[c];
  const part = k.tb[p];
  let why = part.why;
  for (let j = p; !why && j >= 0; j--) why = k.tb[j].why;

  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Error">
        {CASES.map((x, i) => (
          <button key={x.label} type="button" className="seg" aria-pressed={i === c} onClick={() => { setC(i); setP(0); }}>{x.label}</button>
        ))}
      </div>
      <p className="viz-caption" style={{ margin: "12px 0 6px" }}>{k.file}</p>
      <pre className="trace-code">
        {k.code.map((l, i) => (
          <span key={i} className={part.line === i + 1 ? "trace-line is-on" : "trace-line"}>
            <span className="trace-ln">{i + 1}</span>{l || " "}
          </span>
        ))}
      </pre>
      <p className="viz-caption" style={{ margin: "12px 0 6px" }}>Output. Click any line of the traceback.</p>
      <div className="trace-code" role="list">
        {k.output && <span className="trace-line" style={{ color: "var(--text-muted)" }}>{k.output}</span>}
        {k.tb.map((t, i) => (
          <button
            key={i}
            type="button"
            role="listitem"
            className={i === p ? "trace-line tb-line is-on" : "trace-line tb-line"}
            onClick={() => setP(i)}
          >
            {t.text}
          </button>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">{why}</figcaption>
    </figure>
  );
}
