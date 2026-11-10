"use client";

import { useState } from "react";

const FACTS = ["has feathers", "flies", "lays eggs", "has fur", "gives milk", "eats meat", "has hooves", "swims", "has black and white colours"];

const RULES: { if: string[]; then: string }[] = [
  { if: ["has feathers"], then: "is a bird" },
  { if: ["flies", "lays eggs"], then: "is a bird" },
  { if: ["has fur"], then: "is a mammal" },
  { if: ["gives milk"], then: "is a mammal" },
  { if: ["is a mammal", "eats meat"], then: "is a carnivore" },
  { if: ["is a mammal", "has hooves"], then: "is an ungulate" },
  { if: ["is an ungulate", "has black and white colours"], then: "IS A ZEBRA" },
  { if: ["is a mammal", "swims", "has black and white colours"], then: "IS AN ORCA" },
  { if: ["is a bird", "swims", "has black and white colours"], then: "IS A PENGUIN" },
];

/** A tiny expert system. Tick what you observe; the rules fire one after another until nothing new follows. */
export function ExpertSystemViz() {
  const [seen, setSeen] = useState<Record<string, boolean>>({ "has fur": true, "has hooves": true, "has black and white colours": true });
  const known = new Set(FACTS.filter((f) => seen[f]));
  const fired: { rule: number; then: string }[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    RULES.forEach((r, i) => {
      if (!known.has(r.then) && r.if.every((c) => known.has(c))) {
        known.add(r.then);
        fired.push({ rule: i, then: r.then });
        changed = true;
      }
    });
  }
  const answers = fired.filter((f) => f.then.startsWith("IS"));

  return (
    <figure className="viz">
      <p className="viz-caption" style={{ marginTop: 0 }}>What do you observe about the animal?</p>
      <div className="viz-remainders">
        {FACTS.map((f) => (
          <button key={f} type="button" className={seen[f] ? "viz-chip is-on" : "viz-chip"} aria-pressed={!!seen[f]} onClick={() => setSeen({ ...seen, [f]: !seen[f] })} style={{ cursor: "pointer" }}>{f}</button>
        ))}
      </div>
      <ol className="standard-form" style={{ marginTop: 12 }}>
        {RULES.map((r, i) => {
          const f = fired.find((x) => x.rule === i);
          return (
            <li key={i} style={{ color: f ? "var(--text)" : "var(--text-faint)", fontSize: 14 }}>
              IF {r.if.join(" AND ")} THEN {r.then.toLowerCase()}{f ? `  (fired, step ${fired.indexOf(f) + 1})` : ""}
            </li>
          );
        })}
      </ol>
      <figcaption className="viz-caption" aria-live="polite">
        {answers.length
          ? <>Conclusion: the animal {answers.map((a) => a.then.toLowerCase()).join(", and it ")}.</>
          : <>No rule reaches an answer. The system knows nothing beyond its nine rules.</>}{" "}
        Every step can be explained by pointing at a rule. Now tick &ldquo;has feathers&rdquo; as well: the rules happily conclude
        that the animal is both a bird and a mammal, and nothing in the system notices.
      </figcaption>
    </figure>
  );
}
