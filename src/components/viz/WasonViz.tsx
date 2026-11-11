"use client";

import { useState } from "react";

const TASKS = [
  {
    name: "Letters and numbers",
    rule: "If a card has a vowel on one side, then it has an even number on the other side.",
    note: "Each card has a letter on one side and a number on the other.",
    cards: ["E", "K", "4", "7"],
    answer: [0, 3],
    why: [
      "E must be turned: an odd number behind it would break the rule.",
      "K need not be turned: the rule says nothing about consonants.",
      "4 need not be turned: the rule does not say even numbers have vowels behind them. That would be the converse.",
      "7 must be turned: a vowel behind it would break the rule. This is the contrapositive at work.",
    ],
  },
  {
    name: "Drinks and ages",
    rule: "If a person is drinking beer, then they must be over 18.",
    note: "Each card shows what a person is drinking on one side and their age on the other.",
    cards: ["beer", "cola", "25", "16"],
    answer: [0, 3],
    why: [
      "Beer must be checked: the drinker might be under age.",
      "Cola need not be checked: anyone may drink cola.",
      "25 need not be checked: an adult may drink anything.",
      "16 must be checked: if this person has beer, the rule is broken.",
    ],
  },
];

/** The Wason selection task: which cards must you turn over to test a conditional rule? */
export function WasonViz() {
  const [t, setT] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const task = TASKS[t];
  const correct = checked && picked.length === task.answer.length && task.answer.every((i) => picked.includes(i));
  const toggle = (i: number) => { setChecked(false); setPicked(picked.includes(i) ? picked.filter((j) => j !== i) : [...picked, i]); };
  const switchTask = (i: number) => { setT(i); setPicked([]); setChecked(false); };

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {TASKS.map((x, i) => (
          <button key={x.name} type="button" className={i === t ? "btn btn-primary" : "btn"} aria-pressed={i === t} onClick={() => switchTask(i)}>{x.name}</button>
        ))}
      </div>
      <p style={{ margin: "14px 0 4px" }}><strong>Rule:</strong> {task.rule}</p>
      <p className="viz-caption" style={{ margin: "0 0 12px" }}>{task.note} Which cards must you turn over to find out whether the rule is being broken? Pick them, then check.</p>
      <svg viewBox="0 0 580 130" role="group" aria-label="Four cards">
        {task.cards.map((c, i) => {
          const on = picked.includes(i);
          return (
            <g key={c} onClick={() => toggle(i)} style={{ cursor: "pointer" }} role="button" aria-pressed={on} aria-label={`Card ${c}`} tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(i); } }}>
              <rect x={20 + i * 140} y={10} width={110} height={110} rx={8} className={on ? "viz-cell is-on" : "viz-cell"} style={{ strokeWidth: on ? 2.5 : 1 }} />
              <text x={75 + i * 140} y={74} textAnchor="middle" className="viz-label" style={{ fontSize: c.length > 2 ? 20 : 30, fill: "var(--text)" }}>{c}</text>
            </g>
          );
        })}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => setChecked(true)} disabled={picked.length === 0}>Check</button>
        <button type="button" className="btn" onClick={() => { setPicked([]); setChecked(false); }} disabled={picked.length === 0}>Clear</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {!checked
          ? <>In experiments since Peter Wason&rsquo;s in 1966, most people get the first version wrong and the second right, though the logic is identical.</>
          : <>
              <span className={`viz-verdict viz-verdict-${correct ? "right" : "wrong"}`}>{correct ? "Right." : "Not quite."}</span>{" "}
              {task.why.join(" ")}
            </>}
      </figcaption>
    </figure>
  );
}
