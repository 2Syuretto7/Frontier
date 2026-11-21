"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const D = 4,
  NL = 2 ** D;

/** Leaf reached by descending a complete binary AND tree: informed challengers head for the false leaf, random ones flip coins. */
export function challengePath(bad: number, informed: boolean, seed: number) {
  const r = rand(seed);
  let lo = 0,
    size = NL;
  const path = [0];
  let node = 0;
  for (let d = 0; d < D; d++) {
    size /= 2;
    const right = informed ? bad >= lo + size : r() < 0.5;
    if (right) lo += size;
    node = 2 * node + 1 + (right ? 1 : 0);
    path.push(node);
  }
  return { path, leaf: lo };
}

export function DebateTreeViz() {
  const [bad, setBad] = useState(10);
  const [informed, setInformed] = useState(true);
  const [seed, setSeed] = useState(1);
  const { path, leaf } = challengePath(bad, informed, seed);
  const W = 330,
    H = 200;
  const pos = (node: number) => {
    const d = Math.floor(Math.log2(node + 1));
    const i = node - (2 ** d - 1);
    return { x: 10 + ((i + 0.5) / 2 ** d) * (W - 20), y: 20 + d * 38 };
  };
  const nodes = Array.from({ length: 2 ** (D + 1) - 1 }, (_, n) => n);
  const onPath = new Set(path);
  const caught = leaf === bad;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <button
          type="button"
          className="seg"
          aria-pressed={informed}
          onClick={() => setInformed(true)}
        >
          informed challenger
        </button>
        <button
          type="button"
          className="seg"
          aria-pressed={!informed}
          onClick={() => setInformed(false)}
        >
          random challenger
        </button>
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>
          new challenge
        </button>
        <label className="viz-label">
          false step: {bad + 1}{" "}
          <input
            type="range"
            min={0}
            max={NL - 1}
            value={bad}
            onChange={(e) => setBad(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A debate descending an argument tree to one step the judge checks"
      >
        {nodes
          .filter((n) => n > 0)
          .map((n) => {
            const a = pos(n),
              b = pos(Math.floor((n - 1) / 2));
            const hot = onPath.has(n) && onPath.has(Math.floor((n - 1) / 2));
            return (
              <line
                key={n}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={hot ? "var(--accent)" : "var(--border)"}
                strokeWidth={hot ? 3 : 1}
              />
            );
          })}
        {nodes.map((n) => {
          const p = pos(n);
          const isLeaf = n >= NL - 1;
          const li = n - (NL - 1);
          const fill =
            isLeaf && li === bad
              ? "var(--danger)"
              : onPath.has(n)
                ? "var(--accent)"
                : "var(--surface)";
          return (
            <circle
              key={n}
              cx={p.x}
              cy={p.y}
              r={isLeaf ? 6 : 7}
              fill={fill}
              stroke="var(--text-muted)"
            />
          );
        })}
        <text x={W / 2} y={H - 6} textAnchor="middle" className="viz-label">
          {caught
            ? "the judge checks the false step: the lie is exposed"
            : "the judge checks a true step: the lie survives"}
        </text>
      </svg>
      <figcaption className="viz-caption">
        A false claim is backed by an argument of 16 steps, all needed, one of
        them false (red). The judge checks only the one step the debate leads
        to. A challenger who knows where the flaw is points to the half
        containing it at every level and always exposes it with a single check.
        A challenger who only suspects a flaw somewhere descends at random and
        finds it one time in 16, which is the obfuscated-arguments problem.
      </figcaption>
    </figure>
  );
}
