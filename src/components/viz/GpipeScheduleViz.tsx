"use client";

import { useState } from "react";

const P = 4, F = 1, B = 2;
const MS = [2, 4, 8];

/** GPipe on four equal stages: every forward, then every backward, last stage first. Times in forward-pass units. */
export function gpipe(m: number) {
  const blocks: { s: number; kind: "F" | "B"; j: number; a: number; b: number }[] = [];
  const fe: number[][] = Array.from({ length: P }, () => []);
  const be: number[][] = Array.from({ length: P }, () => []);
  for (let s = 0; s < P; s++)
    for (let j = 0; j < m; j++) {
      const a = Math.max(s ? fe[s - 1][j] : 0, j ? fe[s][j - 1] : 0);
      fe[s][j] = a + F;
      blocks.push({ s, kind: "F", j, a, b: a + F });
    }
  for (let s = P - 1; s >= 0; s--)
    for (let j = 0; j < m; j++) {
      const prev = s < P - 1 ? be[s + 1][j] : fe[s][m - 1];
      const a = Math.max(prev, j ? be[s][j - 1] : fe[s][m - 1]);
      be[s][j] = a + B;
      blocks.push({ s, kind: "B", j, a, b: a + B });
    }
  const end = Math.max(...blocks.map((x) => x.b));
  return { blocks, end, bubble: 1 - (m * (F + B) * P) / (P * end) };
}

export function GpipeScheduleViz() {
  const [i, setI] = useState(1);
  const m = MS[i];
  const r = gpipe(m);
  const W = 330, X0 = 50, PW = 272, RH = 20, Y0 = 6, MAX = 33;
  const px = (t: number) => X0 + (t / MAX) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Micro-batches">
          {MS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={i === j} onClick={() => setI(j)}>m = {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + P * RH + 8}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="GPipe schedule of forward and backward passes on four stages">
        {Array.from({ length: P }, (_, s) => (
          <g key={s}>
            <text x={X0 - 6} y={Y0 + s * RH + 13} textAnchor="end" className="viz-label">stage {s}</text>
            <rect x={px(0)} y={Y0 + s * RH} width={px(r.end) - px(0)} height={RH - 3} style={{ fill: "var(--bg-subtle)" }} />
          </g>
        ))}
        {r.blocks.map((x, k) => (
          <g key={k}>
            <rect x={px(x.a)} y={Y0 + x.s * RH} width={px(x.b) - px(x.a) - 0.8} height={RH - 3}
              style={{ fill: x.kind === "F" ? "var(--accent)" : "var(--text-muted)" }} opacity={x.kind === "F" ? 0.85 : 0.7} />
            {m <= 4 && <text x={(px(x.a) + px(x.b)) / 2} y={Y0 + x.s * RH + 12} textAnchor="middle" className="viz-label" style={{ fill: "var(--bg)", fontSize: 8 }}>{x.j}</text>}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        step {r.end} units, bubble {(100 * r.bubble).toFixed(1)}%; each stage holds activations for {m} micro-batches at the turn
      </div>
      <figcaption className="viz-caption">
        Accent blocks are forward passes and grey blocks backward passes, which take twice as long. A stage waits for the previous
        stage before its first forward and for the next stage before its first backward. The idle triangles, the bubble, are the same
        size whatever m is, so more micro-batches make them a smaller share of the step, but every forward finishes before any
        backward begins, so each stage stores all m micro-batches&apos; activations.
      </figcaption>
    </figure>
  );
}
