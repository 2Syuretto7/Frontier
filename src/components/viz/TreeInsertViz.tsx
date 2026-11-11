"use client";

import { useState } from "react";

type T = { key: number; left: T | null; right: T | null; h: number } | null;

const ht = (t: T) => (t ? t.h : 0);
const mk = (key: number, left: T, right: T): T => ({ key, left, right, h: 1 + Math.max(ht(left), ht(right)) });
const rotR = (t: NonNullable<T>): T => { const l = t.left!; return mk(l.key, l.left, mk(t.key, l.right, t.right)); };
const rotL = (t: NonNullable<T>): T => { const r = t.right!; return mk(r.key, mk(t.key, t.left, r.left), r.right); };

function insert(t: T, k: number, avl: boolean, log: string[]): T {
  if (!t) return mk(k, null, null);
  if (k === t.key) return t;
  let n = k < t.key ? mk(t.key, insert(t.left, k, avl, log), t.right) : mk(t.key, t.left, insert(t.right, k, avl, log));
  if (!avl || !n) return n;
  const bal = ht(n.left) - ht(n.right);
  if (bal > 1) {
    if (k > n.left!.key) { log.push(`left-right case at ${n.key}`); n = mk(n.key, rotL(n.left!), n.right); } else log.push(`right rotation at ${n.key}`);
    return rotR(n!);
  }
  if (bal < -1) {
    if (k < n.right!.key) { log.push(`right-left case at ${n.key}`); n = mk(n.key, n.left, rotR(n.right!)); } else log.push(`left rotation at ${n.key}`);
    return rotL(n!);
  }
  return n;
}

const ORDERS: Record<string, number[]> = {
  Sorted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  Shuffled: [8, 3, 12, 1, 6, 10, 14, 5, 2, 15, 7, 9, 13, 4, 11],
  Zigzag: [1, 15, 2, 14, 3, 13, 4, 12, 5, 11, 6, 10, 7, 9, 8],
};

/** Inserting keys one at a time into a plain binary search tree, or into an AVL tree that rotates to stay balanced. */
export function TreeInsertViz({ balanced = false }: { balanced?: boolean }) {
  const [order, setOrder] = useState("Sorted");
  const [k, setK] = useState(7);
  const [avl, setAvl] = useState(balanced);
  const keys = ORDERS[order].slice(0, k);
  let t: T = null;
  let last: string[] = [];
  for (const key of keys) { const log: string[] = []; t = insert(t, key, avl, log); last = log; }
  const nodes: { key: number; x: number; y: number }[] = [];
  const edges: [number, number, number, number][] = [];
  let rank = 0;
  const walk = (n: T, depth: number): [number, number] | null => {
    if (!n) return null;
    const l = walk(n.left, depth + 1);
    const me: [number, number] = [rank++, depth];
    const r = walk(n.right, depth + 1);
    for (const c of [l, r]) if (c) edges.push([me[0], me[1], c[0], c[1]]);
    nodes.push({ key: n.key, x: me[0], y: me[1] });
    return me;
  };
  walk(t, 0);
  const height = ht(t) - 1;
  const totalDepth = nodes.reduce((s, n) => s + n.y, 0);
  const W = 560, dx = W / 16, dy = 34, H = Math.max(5, ht(t)) * dy + 20;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Insertion order">
        {Object.keys(ORDERS).map((o) => <button key={o} type="button" className="seg" aria-pressed={order === o} onClick={() => setOrder(o)}>{o}</button>)}
      </div>
      {!balanced && (
        <div className="segmented" role="group" aria-label="Tree type">
          <button type="button" className="seg" aria-pressed={!avl} onClick={() => setAvl(false)}>Plain BST</button>
          <button type="button" className="seg" aria-pressed={avl} onClick={() => setAvl(true)}>AVL tree</button>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Tree of ${keys.length} keys with height ${height}`}>
        {edges.map(([x1, y1, x2, y2], i) => <line key={i} x1={dx * (x1 + 1)} y1={18 + y1 * dy} x2={dx * (x2 + 1)} y2={18 + y2 * dy} className="plot-line" />)}
        {nodes.map((n) => (
          <g key={n.key}>
            <circle cx={dx * (n.x + 1)} cy={18 + n.y * dy} r={13} className={n.key === keys[keys.length - 1] ? "viz-node is-paired" : "viz-node"} />
            <text x={dx * (n.x + 1)} y={18 + n.y * dy + 4} textAnchor="middle" className="viz-label">{n.key}</text>
          </g>
        ))}
      </svg>
      <div className="viz-sliders">
        <label><span>Keys inserted <span className="mono">{k}</span></span><input type="range" min={1} max={15} value={k} onChange={(e) => setK(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Inserted {keys.join(", ")}. Height <span className="mono">{height}</span>; average depth <span className="mono">{(totalDepth / keys.length).toFixed(2)}</span>;
        the best possible height for {keys.length} keys is <span className="mono">{Math.floor(Math.log2(keys.length))}</span>.{" "}
        {avl ? (last.length ? `The last insertion triggered a ${last[0]}. ` : "The last insertion needed no rotation. ") : ""}
        {avl ? "Rotations keep the heights of every node's two subtrees within 1 of each other, so the height stays logarithmic whatever the order." : "A plain BST takes the shape the insertion order gives it: sorted keys make a path."}
      </figcaption>
    </figure>
  );
}
