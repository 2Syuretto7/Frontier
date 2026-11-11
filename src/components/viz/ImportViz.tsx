"use client";

import { useState } from "react";

type Place = { dir: string; label: string; mods: string[] };
const IMPORTS = ["import json", "import numpy", "import random", "from utils import metrics", "import tqdm"];

/** How Python searches sys.path for a module, and how a local file can shadow the standard library. */
export function ImportViz() {
  const [which, setWhich] = useState(2);
  const [renamed, setRenamed] = useState(false);
  const PATH: Place[] = [
    { dir: "/home/asha/project", label: "the script's own folder", mods: [renamed ? "my_random.py" : "random.py", "train.py", "utils/ (package)"] },
    { dir: "/usr/lib/python3.12", label: "the standard library", mods: ["json/", "os.py", "random.py", "pathlib.py"] },
    { dir: "/home/asha/project/.venv/lib/python3.12/site-packages", label: "installed packages", mods: ["numpy/", "torch/", "pytest/"] },
  ];
  const stmt = IMPORTS[which];
  const name = stmt.startsWith("from") ? "utils" : stmt.split(" ")[1];
  const has = (p: Place) => p.mods.some((m) => m === `${name}.py` || m === `${name}/` || m === `${name}/ (package)`);
  const hit = PATH.findIndex(has);
  const shadow = name === "random" && hit === 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Import statement">
          {IMPORTS.map((s, i) => <button key={s} type="button" className="seg" aria-pressed={which === i} onClick={() => setWhich(i)}><code>{s}</code></button>)}
        </div>
      </div>
      <ol className="imp-path" aria-label="sys.path, searched in order">
        {PATH.map((p, i) => (
          <li key={p.dir} className={i === hit ? "is-hit" : hit === -1 || i < hit ? "is-miss" : "is-skip"}>
            <div className="imp-dir"><b>{i + 1}.</b> <code>{p.dir}</code> <small>{p.label}</small></div>
            <div className="imp-mods">{p.mods.map((m) => <span key={m} className={i === hit && (m.startsWith(name + ".") || m.startsWith(name + "/")) ? "viz-chip is-on" : "viz-chip"}>{m}</span>)}</div>
          </li>
        ))}
      </ol>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setRenamed(!renamed)}>{renamed ? "Rename my_random.py back to random.py" : "Rename the local random.py to my_random.py"}</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        <code>{stmt}</code>:{" "}
        {hit === -1
          ? `no folder on the path has ${name}, so Python raises ModuleNotFoundError: No module named '${name}'. Install it into the environment first.`
          : shadow
            ? "found first in your own project folder, so your random.py is imported instead of the standard library's. Any code expecting random.shuffle now breaks. This is called shadowing."
            : `found in folder ${hit + 1}, ${PATH[hit].label}. Python stops at the first match and never looks further.`}
      </figcaption>
    </figure>
  );
}
