"use client";

import { useState } from "react";

const SHAPES: [string, number[]][] = [
  ["chain 1-1-1", [1, 1, 1]],
  ["tree 2-2-1", [2, 2, 1]],
  ["tree 3-2-1", [3, 2, 1]],
];
const TRUE_RANK = [1, 0, 0]; // the target's actual next token is the head's 2nd guess at depth 1, its 1st after that

type Node = { depth: number; rank: number; parent: number; onPath: boolean };

/** All nodes of the candidate tree, breadth first, marking those on the path the target accepts. */
export function buildTree(ks: number[]) {
  const nodes: Node[] = [];
  let frontier = [-1];
  ks.forEach((k, d) => {
    const next: number[] = [];
    frontier.forEach((p) => {
      const parentOn = p === -1 || nodes[p].onPath;
      for (let r = 0; r < k; r++) {
        nodes.push({
          depth: d,
          rank: r,
          parent: p,
          onPath: parentOn && r === TRUE_RANK[d],
        });
        next.push(nodes.length - 1);
      }
    });
    frontier = next;
  });
  return nodes;
}

export function DraftTreeViz() {
  const [si, setSi] = useState(2);
  const nodes = buildTree(SHAPES[si][1]);
  const accepted = nodes.filter((n) => n.onPath).length;
  const W = 330,
    Y0 = 20,
    DX = 80,
    X0 = 40,
    H = 190;
  const byDepth = [0, 1, 2].map((d) =>
    nodes.map((n, i) => ({ n, i })).filter((o) => o.n.depth === d),
  );
  const pos = new Map<number, [number, number]>();
  byDepth.forEach((lvl, d) =>
    lvl.forEach((o, j) =>
      pos.set(o.i, [
        X0 + (d + 1) * DX,
        Y0 + ((j + 0.5) / lvl.length) * (H - Y0),
      ]),
    ),
  );
  const root: [number, number] = [X0, Y0 + (H - Y0) / 2];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="Candidate tree shape"
        >
          {SHAPES.map(([name], j) => (
            <button
              key={name}
              type="button"
              className="seg"
              aria-pressed={si === j}
              onClick={() => setSi(j)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H + 8}`}
        style={{
          width: "100%",
          maxWidth: 420,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Tree of draft candidates verified in one pass"
      >
        {nodes.map((n, i) => {
          const [x, y] = pos.get(i)!;
          const [px, py] = n.parent === -1 ? root : pos.get(n.parent)!;
          return (
            <line
              key={`e${i}`}
              x1={px}
              y1={py}
              x2={x}
              y2={y}
              stroke={n.onPath ? "var(--accent)" : "var(--border-strong)"}
              strokeWidth={n.onPath ? 2.5 : 1}
            />
          );
        })}
        <circle
          cx={root[0]}
          cy={root[1]}
          r={8}
          style={{ fill: "var(--text)" }}
        />
        {nodes.map((n, i) => {
          const [x, y] = pos.get(i)!;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={6}
              style={{ fill: n.onPath ? "var(--accent)" : "var(--bg-subtle)" }}
              stroke="var(--text-muted)"
            />
          );
        })}
        {[1, 2, 3].map((d) => (
          <text
            key={d}
            x={X0 + d * DX}
            y={12}
            textAnchor="middle"
            className="viz-label"
          >{`+${d}`}</text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {nodes.length} candidate tokens checked in one pass; {accepted}{" "}
        accepted, plus the target&apos;s own next token
      </div>
      <figcaption className="viz-caption">
        Draft heads guess the next three tokens; their top guesses at each depth
        form a tree rooted at the current token (dark). One forward pass with a
        tree attention mask scores every node. Here the true next token is the
        first head&apos;s second guess, so a single chain of top guesses is
        rejected at once, while a tree that also tries the second guess keeps
        the whole accepted path (colour).
      </figcaption>
    </figure>
  );
}
