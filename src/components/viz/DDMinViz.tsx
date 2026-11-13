"use client";

import { useState } from "react";

const LINES = [
  "data = load('train.csv')",
  "data = data.dropna()",
  "x = normalise(data.x)",
  "y = data.y",
  "model = MLP(width=512)",
  "model.init(seed=0)",
  "model.half()",
  "log = Logger('run7')",
  "aug = RandomCrop(32)",
  "x = aug(x)",
  "opt = SGD(model, lr=1.0)",
  "sched = Cosine(opt, 1000)",
  "ema = EMA(model)",
  "loss = train(model, x, y, opt)",
  "save(model, 'ckpt.pt')",
  "print(loss)",
];
// The failure, a NaN loss, needs both half precision and the large learning rate.
const fails = (s: number[]) => s.includes(6) && s.includes(10);

type Step = { tried: number[]; failed: boolean; kept: number[] };

function trace(): Step[] {
  const steps: Step[] = [];
  let items = LINES.map((_, i) => i);
  let n = 2;
  const test = (s: number[]) => {
    const f = fails(s);
    steps.push({ tried: s, failed: f, kept: f ? s : items });
    return f;
  };
  while (items.length >= 2) {
    const chunks = Array.from({ length: n }, (_, i) => items.slice(Math.floor((i * items.length) / n), Math.floor(((i + 1) * items.length) / n)));
    const hit = chunks.find((c) => test(c));
    if (hit) { items = hit; n = 2; continue; }
    const comp = n > 2 ? chunks.map((c) => items.filter((x) => !c.includes(x))).find((c) => test(c)) : undefined;
    if (comp) { items = comp; n = Math.max(n - 1, 2); continue; }
    if (n >= items.length) break;
    n = Math.min(2 * n, items.length);
  }
  return steps;
}
const STEPS = trace();

/** Delta debugging on a sixteen-line script: test chunks, then complements, then finer chunks. */
export function DDMinViz() {
  const [k, setK] = useState(0);
  const cur = k > 0 ? STEPS[k - 1] : null;
  const kept = cur ? (cur.failed ? cur.tried : STEPS.slice(0, k).reverse().find((s) => s.failed)?.tried ?? LINES.map((_, i) => i)) : LINES.map((_, i) => i);
  const done = k === STEPS.length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="btn" onClick={() => setK(Math.min(k + 1, STEPS.length))} disabled={done}>Run next test</button>
        <button type="button" className="btn" onClick={() => setK(STEPS.length)} disabled={done}>Run all</button>
        <button type="button" className="btn" onClick={() => setK(0)} disabled={k === 0}>Reset</button>
      </div>
      <ol className="mono" start={0} style={{ fontSize: 13, lineHeight: 1.6, paddingLeft: 28, margin: "8px 0", overflowWrap: "anywhere" }}>
        {LINES.map((l, i) => {
          const inTrial = cur?.tried.includes(i);
          const alive = kept.includes(i);
          return (
            <li key={i} style={{ color: !alive ? "var(--text-faint)" : undefined, textDecoration: !alive ? "line-through" : undefined, background: inTrial ? (cur!.failed ? "var(--accent-soft)" : "transparent") : undefined, outline: inTrial ? "1px solid var(--border)" : undefined }}>
              {l}
            </li>
          );
        })}
      </ol>
      <figcaption className="viz-caption" aria-live="polite">
        {!cur
          ? "The full script ends with a NaN loss. Each test runs only some of its lines and reports whether the NaN appears."
          : done
            ? `Done after ${STEPS.length} tests: ${kept.length} lines remain, and removing either one makes the NaN disappear.`
            : `Test ${k}: ran ${cur.tried.length} line${cur.tried.length === 1 ? "" : "s"}, ${cur.failed ? "NaN appears, so keep only these" : "no NaN, so the cause is not inside these alone"}. ${kept.length} lines remain.`}
      </figcaption>
    </figure>
  );
}
