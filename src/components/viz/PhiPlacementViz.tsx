"use client";

import { useState } from "react";

const CFG: Record<string, string[]> = {
  entry: ["then", "else"],
  then: ["join"],
  else: ["join"],
  join: ["head"],
  head: ["body", "exit"],
  body: ["head"],
  exit: [],
};
const POS: Record<string, [number, number]> = {
  entry: [150, 22],
  then: [80, 72],
  else: [220, 72],
  join: [150, 122],
  head: [150, 172],
  body: [260, 172],
  exit: [150, 222],
};
const NODES = Object.keys(CFG);

function phis(defs: string[]): string[] {
  const preds: Record<string, string[]> = {};
  NODES.forEach((n) => (preds[n] = NODES.filter((p) => CFG[p].includes(n))));
  const dom: Record<string, Set<string>> = {};
  NODES.forEach((n) => (dom[n] = new Set(NODES)));
  dom.entry = new Set(["entry"]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of NODES) {
      if (n === "entry") continue;
      const inter = new Set(
        [...dom[preds[n][0]]].filter((x) =>
          preds[n].every((p) => dom[p].has(x)),
        ),
      );
      inter.add(n);
      if (inter.size !== dom[n].size) {
        dom[n] = inter;
        changed = true;
      }
    }
  }
  const df: Record<string, Set<string>> = {};
  NODES.forEach((n) => (df[n] = new Set()));
  for (const a of NODES)
    for (const b of CFG[a])
      for (const x of dom[a]) if (x === b || !dom[b].has(x)) df[x].add(b);
  const out = new Set<string>();
  const work = [...defs];
  while (work.length) {
    const b = work.pop() as string;
    for (const f of df[b])
      if (!out.has(f)) {
        out.add(f);
        work.push(f);
      }
  }
  return [...out];
}

export function PhiPlacementViz() {
  const [defs, setDefs] = useState<string[]>(["entry", "then"]);
  const ph = phis(defs);
  const toggle = (n: string) =>
    setDefs((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n]));
  const W = 330,
    H = 250,
    bw = 60,
    bh = 26;
  return (
    <figure className="viz">
      <p className="viz-label" style={{ marginTop: 0 }}>
        Click a block to toggle an assignment to x in it.
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A control-flow graph with blocks that assign x and the blocks that need phi nodes"
      >
        <defs>
          <marker
            id="phi-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)" />
          </marker>
        </defs>
        {NODES.flatMap((a) =>
          CFG[a].map((b) => {
            const [x1, y1] = POS[a],
              [x2, y2] = POS[b];
            if (a === "body")
              return (
                <path
                  key={a + b}
                  d={`M ${x1} ${y1 - bh / 2} C ${x1} ${y1 - 40}, ${x2 + 40} ${y2 - 40}, ${x2 + bw / 2} ${y2 - 6}`}
                  fill="none"
                  stroke="var(--text-muted)"
                  markerEnd="url(#phi-arrow)"
                />
              );
            const horiz = y1 === y2;
            return (
              <line
                key={a + b}
                x1={horiz ? x1 + bw / 2 : x1}
                y1={horiz ? y1 : y1 + bh / 2}
                x2={horiz ? x2 - bw / 2 : x2}
                y2={horiz ? y2 : y2 - bh / 2}
                stroke="var(--text-muted)"
                markerEnd="url(#phi-arrow)"
              />
            );
          }),
        )}
        {NODES.map((n) => {
          const [x, y] = POS[n];
          const d = defs.includes(n),
            p = ph.includes(n);
          return (
            <g
              key={n}
              role="button"
              tabIndex={0}
              aria-pressed={d}
              aria-label={`${n}: ${d ? "assigns x" : "no assignment"}`}
              onClick={() => toggle(n)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggle(n);
              }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={x - bw / 2}
                y={y - bh / 2}
                width={bw}
                height={bh}
                rx={4}
                fill={d ? "var(--accent)" : "var(--surface)"}
                fillOpacity={d ? 0.3 : 1}
                stroke={p ? "var(--success)" : "var(--border)"}
                strokeWidth={p ? 3 : 1}
              />
              <text x={x} y={y + 4} textAnchor="middle" className="viz-label">
                {n}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        x assigned in: {defs.length ? defs.join(", ") : "nowhere"}; phi needed
        in: {ph.length ? ph.join(", ") : "no block"}
      </p>
      <figcaption className="viz-caption">
        Shaded blocks assign x; blocks outlined in green need a phi node to
        merge the versions of x arriving along different edges. They are the
        iterated dominance frontier of the assigning blocks: an assignment
        inside the loop body needs a phi at the loop header, and an assignment
        on one side of the branch needs one at the join.
      </figcaption>
    </figure>
  );
}
