"use client";

import { useState } from "react";

const PAIRS: [number[], number[]][] = [
  [[3, 4], [4]], [[3, 4], [3]], [[3, 1], [1, 4]], [[3, 4], [3, 1]], [[2, 3, 4], [3, 1]], [[8, 1, 6, 1], [7, 1, 5]],
];

export function broadcast(a: number[], b: number[]) {
  const n = Math.max(a.length, b.length);
  const A = [...Array(n - a.length).fill(null), ...a] as (number | null)[];
  const B = [...Array(n - b.length).fill(null), ...b] as (number | null)[];
  const rows = A.map((x, i) => {
    const y = B[i];
    const xa = x ?? 1, yb = y ?? 1;
    const ok = xa === yb || xa === 1 || yb === 1;
    return { x, y, ok, out: ok ? Math.max(xa, yb) : null };
  });
  return { rows, ok: rows.every((r) => r.ok), shape: rows.map((r) => r.out) };
}

/** Line two shapes up from the right and apply the broadcasting rule axis by axis. */
export function BroadcastViz() {
  const [pi, setPi] = useState(2);
  const [a, b] = PAIRS[pi];
  const r = broadcast(a, b);
  const fmt = (s: number[]) => `(${s.join(", ")}${s.length === 1 ? "," : ""})`;
  const grid2 = a.length <= 2 && b.length <= 2 && r.ok;
  const R = r.shape.length === 2 ? r.shape[0]! : 1, Cc = r.shape[r.shape.length - 1]!;
  const a2 = a.length === 2 ? a : [1, a[0]], b2 = b.length === 2 ? b : [1, b[0]];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Shapes">
          {PAIRS.map(([x, y], i) => <button key={i} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}><code>{fmt(x)} + {fmt(y)}</code></button>)}
        </div>
      </div>
      <table className="bc-table">
        <thead><tr><th></th>{r.rows.map((_, i) => <th key={i}>axis {i}</th>)}</tr></thead>
        <tbody>
          <tr><td>a</td>{r.rows.map((x, i) => <td key={i} className={x.x === null ? "is-pad" : undefined}>{x.x ?? "·"}</td>)}</tr>
          <tr><td>b</td>{r.rows.map((x, i) => <td key={i} className={x.y === null ? "is-pad" : undefined}>{x.y ?? "·"}</td>)}</tr>
          <tr className="bc-out"><td>result</td>{r.rows.map((x, i) => <td key={i} className={x.ok ? undefined : "is-bad"}>{x.ok ? x.out : "✗"}</td>)}</tr>
        </tbody>
      </table>
      {grid2 && (
        <div className="bc-grids">
          {[["a", a2], ["b", b2]].map(([name, s]) => {
            const sh = s as number[];
            return (
              <div key={name as string}>
                <div className="bc-label">{name as string} {fmt(name === "a" ? a : b)}</div>
                <div className="bc-grid" style={{ gridTemplateColumns: `repeat(${Cc}, 14px)` }}>
                  {Array.from({ length: R * Cc }, (_, k) => {
                    const i = Math.floor(k / Cc), j = k % Cc;
                    const real = (sh[0] === 1 ? i === 0 : true) && (sh[1] === 1 ? j === 0 : true);
                    return <span key={k} className={real ? "bc-cell is-real" : "bc-cell"} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <figcaption className="viz-caption" aria-live="polite">
        Shapes are aligned at the right, and a missing axis counts as size 1. On each axis the sizes must be equal, or one of them must be 1, which is stretched to match.{" "}
        {r.ok ? `So the result has shape ${fmt(r.shape as number[])}.` : "On the axis marked ✗ the sizes differ and neither is 1, so NumPy raises: operands could not be broadcast together."}
        {grid2 ? " In the grids, solid cells hold real values; hollow cells are the same values reused, without being copied." : ""}
      </figcaption>
    </figure>
  );
}
