"use client";

import { useState } from "react";

// frontdoor graph with a hidden confounder U
type G = Record<string, string[]>;
const F: G = { U: [], X: ["U"], M: ["X"], Y: ["M", "U"] };
const POS: Record<string, [number, number]> = {
  U: [170, 30],
  X: [60, 110],
  M: [170, 110],
  Y: [280, 110],
};

/** d-separation of sets A and B given C, by moralising the ancestral graph. */
export function dsep(g: G, A: string[], B: string[], C: string[]) {
  const keep = new Set([...A, ...B, ...C]);
  const stack = [...keep];
  while (stack.length)
    for (const p of g[stack.pop()!])
      if (!keep.has(p)) {
        keep.add(p);
        stack.push(p);
      }
  const adj: Record<string, Set<string>> = {};
  keep.forEach((v) => (adj[v] = new Set()));
  keep.forEach((v) =>
    g[v].forEach((p) => {
      adj[v].add(p);
      adj[p].add(v);
      g[v].forEach((q) => q !== p && adj[p].add(q));
    }),
  );
  const seen = new Set(A);
  const st = [...A];
  while (st.length)
    adj[st.pop()!].forEach((w) => {
      if (!C.includes(w) && !seen.has(w)) {
        seen.add(w);
        st.push(w);
      }
    });
  return !B.some((b) => seen.has(b));
}

const cut = (into: string[], outOf: string[]): G =>
  Object.fromEntries(
    Object.entries(F).map(([v, ps]) => [
      v,
      into.includes(v) ? [] : ps.filter((p) => !outOf.includes(p)),
    ]),
  );

export const STEPS = [
  {
    eq: "P(m | do(x)) = P(m | x)",
    rule: 2,
    into: [],
    out: ["X"],
    a: ["M"],
    b: ["X"],
    c: [],
    graph: "arrows out of X removed",
  },
  {
    eq: "P(x | do(m)) = P(x)",
    rule: 3,
    into: ["M"],
    out: [],
    a: ["X"],
    b: ["M"],
    c: [],
    graph: "arrows into M removed",
  },
  {
    eq: "P(y | do(m), x) = P(y | m, x)",
    rule: 2,
    into: [],
    out: ["M"],
    a: ["Y"],
    b: ["M"],
    c: ["X"],
    graph: "arrows out of M removed",
  },
  {
    eq: "P(y | do(x), m) = P(y | do(x), do(m))",
    rule: 2,
    into: ["X"],
    out: ["M"],
    a: ["Y"],
    b: ["M"],
    c: ["X"],
    graph: "into X and out of M removed",
  },
  {
    eq: "P(y | do(x), do(m)) = P(y | do(m))",
    rule: 3,
    into: ["X", "M"],
    out: [],
    a: ["Y"],
    b: ["X"],
    c: ["M"],
    graph: "arrows into X and M removed",
  },
];

export function DoCalculusViz() {
  const [k, setK] = useState(0);
  const s = STEPS[k];
  const g = cut(s.into, s.out);
  const ok = dsep(g, s.a, s.b, s.c);
  const edges = Object.entries(F).flatMap(([v, ps]) => ps.map((p) => [p, v]));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Derivation step">
          {STEPS.map((_, j) => (
            <button
              key={j}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              step {j + 1}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 200"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A step of the do-calculus derivation of the frontdoor formula, with the modified graph and the d-separation it needs"
      >
        <defs>
          <marker
            id="dcv-arrow"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>
        {edges.map(([p, c]) => {
          const kept = g[c].includes(p);
          const [x1, y1] = POS[p],
            [x2, y2] = POS[c];
          const d = Math.hypot(x2 - x1, y2 - y1);
          return (
            <line
              key={p + c}
              x1={x1 + ((x2 - x1) * 17) / d}
              y1={y1 + ((y2 - y1) * 17) / d}
              x2={x2 - ((x2 - x1) * 17) / d}
              y2={y2 - ((y2 - y1) * 17) / d}
              stroke={kept ? "var(--accent)" : "var(--border-strong)"}
              strokeWidth={kept ? 2 : 1}
              strokeDasharray={kept ? undefined : "3 3"}
              markerEnd={kept ? "url(#dcv-arrow)" : undefined}
            />
          );
        })}
        {Object.entries(POS).map(([v, [x, y]]) => (
          <g key={v}>
            <circle
              cx={x}
              cy={y}
              r={15}
              fill="var(--surface)"
              stroke={
                s.a.includes(v) || s.b.includes(v)
                  ? "var(--danger)"
                  : s.c.includes(v)
                    ? "var(--text)"
                    : "var(--text-muted)"
              }
              strokeWidth={s.c.includes(v) ? 2.5 : 1.2}
              strokeDasharray={v === "U" ? "3 2" : undefined}
            />
            <text x={x} y={y + 4} textAnchor="middle" className="viz-label">
              {v}
            </text>
          </g>
        ))}
        <text x={10} y={150} className="viz-label">
          {s.eq}
        </text>
        <text x={10} y={168} className="viz-label">
          rule {s.rule}, {s.graph}
        </text>
        <text x={10} y={186} className="viz-label">
          needs {s.a.join("")} ⊥ {s.b.join("")}
          {s.c.length ? ` given ${s.c.join("")}` : ""}: {ok ? "holds" : "fails"}
        </text>
      </svg>
      <figcaption className="viz-caption">
        U is a hidden common cause of X and Y. The five steps derive the
        frontdoor formula: P(y | do(x)) is the sum over m of P(m | x) times the
        sum over x′ of P(y | m, x′) P(x′), which uses only observed variables.
        Each step applies one rule of the do-calculus, licensed by a
        d-separation (red nodes, given the bold ones) in a graph with some
        arrows cut (faint).
      </figcaption>
    </figure>
  );
}
