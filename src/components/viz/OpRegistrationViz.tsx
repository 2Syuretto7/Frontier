"use client";

import { useState } from "react";

const FAKES = ["no fake", "fake, right shapes", "fake, wrong shape"];
const GRADS = ["no autograd", "autograd registered"];

/**
 * What happens to a custom operator wrapping a Triton kernel, depending on whether it has a fake (meta) implementation, whether that
 * implementation reports the right output shape, and whether a backward formula is registered.
 */
export function opOutcomes(fake: number, grad: number) {
  const noFake = "error: no fake implementation";
  const noGrad = "error: no autograd formula";
  const wrong = "traces, wrong shapes downstream";
  const fwdC = fake === 0 ? noFake : fake === 2 ? wrong : "ok, one node in the graph";
  return [
    { action: "eager forward", ok: true, msg: "ok, runs the kernel" },
    { action: "eager backward", ok: grad === 1, msg: grad === 1 ? "ok" : noGrad },
    { action: "compiled forward", ok: fake === 1, msg: fwdC },
    { action: "compiled backward", ok: fake === 1 && grad === 1, msg: fake !== 1 ? fwdC : grad === 1 ? "ok" : noGrad },
    {
      action: "opcheck",
      ok: fake === 1 && grad === 1,
      msg: fake === 1 && grad === 1 ? "passes" : [fake === 0 ? "fake missing" : fake === 2 ? "fake shape differs" : "", grad === 0 ? "autograd missing" : ""].filter(Boolean).join("; "),
    },
  ];
}

export function OpRegistrationViz() {
  const [f, setF] = useState(0);
  const [g, setG] = useState(0);
  const rows = opOutcomes(f, g);
  const W = 340, RH = 26, H = rows.length * RH + 8, X1 = 124;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Fake implementation">
          {FAKES.map((n, i) => <button key={n} type="button" className="seg" aria-pressed={f === i} onClick={() => setF(i)}>{n}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Autograd registration">
          {GRADS.map((n, i) => <button key={n} type="button" className="seg" aria-pressed={g === i} onClick={() => setG(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Outcome of each use of a custom operator">
        {rows.map((r, i) => (
          <g key={r.action}>
            <rect x={2} y={4 + i * RH} width={W - 4} height={RH - 3} style={{ fill: r.ok ? "var(--bg-subtle)" : "var(--surface)", stroke: r.ok ? "var(--border)" : "var(--accent)" }} />
            <text x={10} y={4 + i * RH + 16} className="viz-label">{r.action}</text>
            <text x={X1} y={4 + i * RH + 16} className="viz-label" style={{ fill: r.ok ? "var(--text-muted)" : "var(--accent)" }}>{r.msg}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {rows.filter((r) => r.ok).length} of {rows.length} uses work
      </div>
      <figcaption className="viz-caption">
        A custom operator that launches a Triton kernel, with different parts registered. Eager execution needs only the kernel. Tracing
        for torch.compile runs the fake implementation on tensors that have shapes but no data, so a missing fake fails and a wrong one
        silently corrupts every shape downstream. Backward needs a registered formula. opcheck exercises all of these at once.
      </figcaption>
    </figure>
  );
}
