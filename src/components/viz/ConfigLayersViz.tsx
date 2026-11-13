"use client";

import { useState } from "react";

type Layer = { name: string; values: Record<string, string> };

const DEFAULTS: Record<string, string> = {
  "model.width": "256",
  "model.depth": "4",
  "optim.lr": "0.1",
  "optim.name": "sgd",
  "data.batch": "64",
  seed: "0",
};

const LAYERS: Layer[] = [
  { name: "experiments/deep.yaml", values: { "model.depth": "12", "optim.lr": "0.03" } },
  { name: "command line", values: { "optim.lr": "0.01", seed: "3", "optim.lrr": "0.5" } },
];

/** Defaults, an experiment file and command-line overrides, merged in order. Where does each value come from? */
export function ConfigLayersViz() {
  const [on, setOn] = useState([true, true]);
  const [strict, setStrict] = useState(false);
  const resolved: Record<string, { v: string; from: string }> = {};
  for (const k of Object.keys(DEFAULTS)) resolved[k] = { v: DEFAULTS[k], from: "defaults" };
  const unknown: string[] = [];
  LAYERS.forEach((l, i) => {
    if (!on[i]) return;
    for (const [k, v] of Object.entries(l.values)) {
      if (!(k in DEFAULTS)) {
        unknown.push(k);
        if (!strict) resolved[k] = { v, from: l.name };
      } else resolved[k] = { v, from: l.name };
    }
  });
  const failed = strict && unknown.length > 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {LAYERS.map((l, i) => (
          <button key={l.name} type="button" className="seg" aria-pressed={on[i]} onClick={() => setOn(on.map((x, j) => (j === i ? !x : x)))}>
            {l.name}: {Object.entries(l.values).map(([k, v]) => `${k}=${v}`).join(" ")}
          </button>
        ))}
        <button type="button" className="seg" aria-pressed={strict} onClick={() => setStrict(!strict)}>reject unknown keys</button>
      </div>
      {failed ? (
        <div className="mono" style={{ color: "var(--danger)", fontSize: 14, margin: "8px 0" }}>
          ValueError: unknown key {unknown.map((k) => `'${k}'`).join(", ")}. Did you mean &apos;optim.lr&apos;?
        </div>
      ) : (
        <table className="mono" style={{ fontSize: 13, borderCollapse: "collapse", margin: "8px 0", width: "100%" }}>
          <tbody>
            {Object.entries(resolved).map(([k, { v, from }]) => (
              <tr key={k} style={{ borderTop: "1px solid var(--border)", color: k in DEFAULTS ? undefined : "var(--danger)" }}>
                <td style={{ padding: "2px 8px 2px 0" }}>{k}</td>
                <td style={{ padding: "2px 8px" }}>{v}</td>
                <td style={{ padding: "2px 0", color: "var(--text-muted)", overflowWrap: "anywhere" }}>{from}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <figcaption className="viz-caption" aria-live="polite">
        {failed
          ? "The typo stops the run before it starts, instead of after a day of training with the learning rate you did not mean."
          : unknown.length
            ? "optim.lrr is a typo. Without strict checking it is stored and ignored, and the run silently uses lr = 0.01 or whatever came before."
            : "Later layers override earlier ones, key by key. Save this resolved table with the run."}
      </figcaption>
    </figure>
  );
}
