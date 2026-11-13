"use client";

import { useState } from "react";

const SHAPES: number[][] = [[100, 1], [100], [1, 100], [4, 3], [3], [4, 1], [2, 4, 3], [5]];
const show = (s: number[]) => `(${s.join(", ")}${s.length === 1 ? "," : ""})`;

/** NumPy's rule: align from the right; each pair of sizes must agree or contain a 1. */
function broadcast(a: number[], b: number[]): { out: number[] | null; bad: number } {
  const n = Math.max(a.length, b.length);
  const out: number[] = [];
  for (let k = 1; k <= n; k++) {
    const x = a[a.length - k] ?? 1;
    const y = b[b.length - k] ?? 1;
    if (x !== y && x !== 1 && y !== 1) return { out: null, bad: k };
    out.unshift(x === 1 ? y : x);
  }
  return { out, bad: 0 };
}

function Row({ label, s, n, bad }: { label: string; s: number[]; n: number; bad: number }) {
  const cells = Array.from({ length: n }, (_, j) => s[s.length - (n - j)]);
  return (
    <tr>
      <th scope="row" className="mono" style={{ textAlign: "left", paddingRight: 10, fontWeight: 400, color: "var(--text-muted)" }}>{label}</th>
      {cells.map((c, j) => (
        <td key={j} className="mono" style={{ textAlign: "center", padding: "2px 10px", border: "1px solid var(--border)", color: bad === n - j ? "var(--danger)" : c === undefined ? "var(--text-faint)" : undefined }}>
          {c ?? "-"}
        </td>
      ))}
    </tr>
  );
}

/** Pick two shapes and see how NumPy lines them up and what it makes of them. */
export function BroadcastPairViz() {
  const [ia, setA] = useState(0);
  const [ib, setB] = useState(1);
  const a = SHAPES[ia], b = SHAPES[ib];
  const { out, bad } = broadcast(a, b);
  const n = Math.max(a.length, b.length);
  const pick = (cur: number, set: (i: number) => void, who: string) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 8 }}>
      <span className="mono" style={{ width: 16 }}>{who}</span>
      {SHAPES.map((s, i) => (
        <button key={i} type="button" className="seg" aria-pressed={cur === i} onClick={() => set(i)}>
          <span className="mono">{show(s)}</span>
        </button>
      ))}
    </div>
  );
  return (
    <figure className="viz">
      {pick(ia, setA, "a")}
      {pick(ib, setB, "b")}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", margin: "8px 0" }}>
          <tbody>
            <Row label="a" s={a} n={n} bad={bad} />
            <Row label="b" s={b} n={n} bad={bad} />
            {out && <Row label="a + b" s={out} n={n} bad={0} />}
          </tbody>
        </table>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {!out
          ? `Error: sizes ${a[a.length - bad]} and ${b[b.length - bad]} disagree and neither is 1. A loud failure, which is the good case.`
          : out.length > 1 && out.reduce((p, q) => p * q, 1) > Math.max(a.reduce((p, q) => p * q, 1), b.reduce((p, q) => p * q, 1))
            ? `a + b has shape ${show(out)}: ${out.reduce((p, q) => p * q, 1)} numbers, more than either input. If you meant an elementwise sum, this is a silent bug.`
            : `a + b has shape ${show(out)}. Missing sizes on the left count as 1, and a 1 stretches to match.`}
      </figcaption>
    </figure>
  );
}
