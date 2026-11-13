"use client";

import { useState } from "react";

const NODES = ["A", "B", "C", "D", "E"] as const;
type N = (typeof NODES)[number];
const PARENTS: Record<N, N[]> = { A: [], B: ["A"], C: ["B"], D: ["A"], E: ["C", "D"] };
const POS: Record<N, [number, number]> = { A: [165, 24], B: [80, 78], C: [80, 140], D: [250, 108], E: [165, 176] };
const EDGES: [N, N][] = NODES.flatMap((v) => PARENTS[v].map((p) => [p, v] as [N, N]));

function descendants(v: N): Set<N> {
  const out = new Set<N>([v]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const [p, c] of EDGES) if (out.has(p) && !out.has(c)) { out.add(c); grew = true; }
  }
  return out;
}

function paths(x: N, y: N): N[][] {
  const res: N[][] = [];
  const go = (path: N[]) => {
    const v = path[path.length - 1];
    if (v === y) { res.push(path); return; }
    for (const [p, c] of EDGES) {
      const w = p === v ? c : c === v ? p : null;
      if (w && !path.includes(w)) go([...path, w]);
    }
  };
  go([x]);
  return res;
}

function blocker(path: N[], obs: Set<N>): string | null {
  for (let i = 1; i < path.length - 1; i++) {
    const [a, m, b] = [path[i - 1], path[i], path[i + 1]];
    const collider = PARENTS[m].includes(a) && PARENTS[m].includes(b);
    if (collider) {
      if (![...descendants(m)].some((d) => obs.has(d))) return `${m} is an unobserved collider`;
    } else if (obs.has(m)) return `${m} is observed and not a collider`;
  }
  return null;
}

/** d-separation on a five-node graph: choose two variables and a set of observed ones, and see which paths are blocked. */
export function DsepPathViz() {
  const [x, setX] = useState<N>("B");
  const [y, setY] = useState<N>("D");
  const [obs, setObs] = useState<Set<N>>(new Set(["A"]));
  const toggle = (v: N) => {
    const s = new Set(obs);
    if (s.has(v)) s.delete(v); else s.add(v);
    setObs(s);
  };
  const ps = x === y ? [] : paths(x, y);
  const verdicts = ps.map((p) => ({ p, why: blocker(p, obs) }));
  const open = verdicts.filter((v) => v.why === null);
  const sep = x !== y && !obs.has(x) && !obs.has(y) && open.length === 0;
  const onOpen = new Set(open.flatMap(({ p }) => p.slice(1).map((v, i) => `${p[i]}${v}`)));
  const W = 330, H = 200;
  const row = (label: string, val: N, set: (v: N) => void) => (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <span className="mono" style={{ fontSize: 13, minWidth: 64 }}>{label}</span>
      {NODES.map((v) => (
        <button key={v} type="button" className="seg" aria-pressed={val === v} onClick={() => set(v)}>{v}</button>
      ))}
    </div>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
        {row("first", x, setX)}
        {row("second", y, setY)}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: 13, minWidth: 64 }}>observed</span>
          {NODES.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={obs.has(v)} onClick={() => toggle(v)}>{v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Directed graph with active paths highlighted">
        <defs>
          <marker id="dsep-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)" />
          </marker>
        </defs>
        {EDGES.map(([p, c]) => {
          const [x1, y1] = POS[p], [x2, y2] = POS[c];
          const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
          const active = onOpen.has(`${p}${c}`) || onOpen.has(`${c}${p}`);
          return (
            <line key={p + c} x1={x1 + 15 * ux} y1={y1 + 15 * uy} x2={x2 - 15 * ux} y2={y2 - 15 * uy}
              stroke={active ? "var(--danger)" : "var(--text-muted)"} strokeWidth={active ? 2.6 : 1.4} markerEnd="url(#dsep-arrow)" />
          );
        })}
        {NODES.map((v) => (
          <g key={v}>
            <circle cx={POS[v][0]} cy={POS[v][1]} r={14} fill={obs.has(v) ? "var(--accent)" : "none"} fillOpacity={obs.has(v) ? 0.35 : 1}
              stroke={v === x || v === y ? "var(--text)" : "var(--border)"} strokeWidth={v === x || v === y ? 2.2 : 1.2} />
            <text x={POS[v][0]} y={POS[v][1] + 4} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {x === y ? "choose two different variables" : obs.has(x) || obs.has(y) ? "an endpoint is observed; choose others" : sep ? `${x} and ${y} are d-separated given {${[...obs].sort().join(", ")}}` : `${x} and ${y} are d-connected given {${[...obs].sort().join(", ")}}`}
      </div>
      <ul className="mono" style={{ fontSize: 12, margin: "0 0 6px", paddingLeft: 18 }}>
        {verdicts.map(({ p, why }) => (
          <li key={p.join("")}>{p.join(" – ")}: {why ?? "open"}</li>
        ))}
      </ul>
      <figcaption className="viz-caption" aria-live="polite">
        Observed variables are shaded and open paths are drawn in red. A path is blocked by an observed variable in a chain
        or fork, and by a collider (both arrows pointing in) unless the collider or one of its descendants is observed. Two
        variables are d-separated when every path between them is blocked; then they are conditionally independent in
        every distribution that factorises over the graph. Try B and D with A observed, then also observe E.
      </figcaption>
    </figure>
  );
}
