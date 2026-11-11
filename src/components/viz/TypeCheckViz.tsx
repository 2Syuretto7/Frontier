"use client";

import { useState } from "react";

type Kind = "error" | "fine";
const CASES: { code: string; kind: Kind; why: string }[] = [
  { code: "def scale(x: float, k: float) -> float:\n    return x * k\n\nscale(\"3\", 2.0)", kind: "error", why: "\"3\" is a str, but x is declared float. The checker reports it before the program ever runs." },
  { code: "def scale(x: float, k: float) -> float:\n    return x * k\n\nscale(3, 2.0)", kind: "fine", why: "An int is accepted where a float is expected: the type system treats int as compatible with float." },
  { code: "def first(xs: list[int]) -> int:\n    return xs[0]\n\nn: int = first([4, 5])\nn.upper()", kind: "error", why: "n is an int, which has no method upper. The checker knows this from the return annotation alone." },
  { code: "def find(name: str, names: list[str]) -> int | None:\n    return names.index(name) if name in names else None\n\nk = find(\"b\", [\"a\", \"b\"])\nprint(k + 1)", kind: "error", why: "k may be None, and None + 1 fails. The checker makes you handle the None case first, for example with if k is not None." },
  { code: "from dataclasses import dataclass\n\n@dataclass\nclass Config:\n    lr: float\n    epochs: int = 10\n\ncfg = Config(lr=3e-4)", kind: "fine", why: "The dataclass generates __init__(self, lr, epochs=10). Passing lr alone is correct; epochs takes its default." },
  { code: "from dataclasses import dataclass\n\n@dataclass\nclass Config:\n    lr: float\n    epochs: int = 10\n\ncfg = Config(lr=3e-4, epoch=5)", kind: "error", why: "There is no field called epoch; the generated __init__ only accepts lr and epochs. A typo caught before a long run starts." },
  { code: "x: int = \"seven\"\nprint(x)", kind: "error", why: "The annotation says int but the value is a str. Python itself would run this without complaint, because annotations are not enforced at run time; the checker is what catches it." },
];

/** Decide which snippets a static type checker such as mypy or pyright would reject. */
export function TypeCheckViz() {
  const [picks, setPicks] = useState<Record<number, Kind>>({});
  const right = CASES.filter((c, i) => picks[i] === c.kind).length;
  return (
    <figure className="viz">
      <ol className="sorter">
        {CASES.map((c, i) => {
          const p = picks[i];
          return (
            <li key={i} className="sorter-item">
              <pre className="code-block" style={{ marginBottom: 10 }}><code>{c.code}</code></pre>
              <div className="segmented" role="group" aria-label="Type checker verdict">
                {(["error", "fine"] as Kind[]).map((k) => (
                  <button key={k} type="button" aria-pressed={p === k} className={p === k ? (k === c.kind ? "seg is-right" : "seg is-wrong") : "seg"} onClick={() => setPicks((x) => ({ ...x, [i]: k }))}>{k === "error" ? "Type error" : "Passes"}</button>
                ))}
              </div>
              {p && <p className="sorter-why">{p === c.kind ? "Right. " : `Not quite: ${c.kind === "error" ? "the checker reports an error" : "this passes"}. `}{c.why}</p>}
            </li>
          );
        })}
      </ol>
      <figcaption className="viz-caption" aria-live="polite">{Object.keys(picks).length ? `${right} of ${CASES.length} right so far.` : "For each snippet, decide whether a type checker would report an error."}</figcaption>
    </figure>
  );
}
