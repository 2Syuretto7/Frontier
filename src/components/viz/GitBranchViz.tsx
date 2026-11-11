"use client";

import { useState } from "react";

type C = { id: number; lane: 0 | 1; parents: number[]; label: string };
type State = { commits: C[]; main: number; feature: number; head: "main" | "feature"; note: string };

const START: State = {
  commits: [
    { id: 0, lane: 0, parents: [], label: "A" },
    { id: 1, lane: 0, parents: [0], label: "B" },
  ],
  main: 1, feature: 1, head: "main",
  note: "Two commits on main. The branch feature was just created: it is only a second name for commit B.",
};
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Branches as movable names for commits, and what merging does to the graph. */
export function GitBranchViz() {
  const [s, setS] = useState<State>(START);
  const isAncestor = (a: number, b: number): boolean => a === b || s.commits[b].parents.some((p) => isAncestor(a, p));
  const commit = () => {
    const id = s.commits.length;
    const parent = s[s.head];
    const c: C = { id, lane: s.head === "main" ? 0 : 1, parents: [parent], label: LETTERS[id] };
    setS({ ...s, commits: [...s.commits, c], [s.head]: id, note: `New commit ${c.label} on ${s.head}. Its parent is ${s.commits[parent].label}, and the name ${s.head} moves forward to it; the other branch does not move.` });
  };
  const switchTo = (b: "main" | "feature") => setS({ ...s, head: b, note: `git switch ${b}: HEAD now points at ${b}, and the files in your working directory become those of commit ${s.commits[s[b]].label}.` });
  const merge = () => {
    if (s.head !== "main") { setS({ ...s, note: "Switch to main first: you merge another branch into the one you are on." }); return; }
    if (isAncestor(s.feature, s.main)) { setS({ ...s, note: "Nothing to merge: every commit on feature is already part of main." }); return; }
    if (isAncestor(s.main, s.feature)) {
      setS({ ...s, main: s.feature, note: `Fast-forward: main had no commits of its own since feature branched off, so Git simply moves the name main forward to ${s.commits[s.feature].label}. No new commit is needed.` });
      return;
    }
    const id = s.commits.length;
    const c: C = { id, lane: 0, parents: [s.main, s.feature], label: LETTERS[id] };
    setS({ ...s, commits: [...s.commits, c], main: id, note: `Both branches moved on, so Git makes a merge commit ${c.label} with two parents, ${s.commits[s.main].label} and ${s.commits[s.feature].label}, combining their changes. If both had changed the same lines, Git would stop and ask you to resolve the conflict.` });
  };
  const W = 46, H = 70, X = (id: number) => 24 + id * W, Y = (lane: number) => 30 + lane * H;
  const width = Math.max(340, X(s.commits.length) + 40);
  const tag = (name: "main" | "feature") => {
    const c = s.commits[s[name]];
    const both = s.main === s.feature && name === "feature";
    return (
      <g key={name}>
        <rect x={X(c.id) - 30} y={Y(c.lane) + (name === "main" ? -30 : 16) + (both ? 18 : 0)} width={60} height={18} rx={3} className={s.head === name ? "git-tag is-head" : "git-tag"} />
        <text x={X(c.id)} y={Y(c.lane) + (name === "main" ? -17 : 29) + (both ? 18 : 0)} textAnchor="middle" className="git-tag-text">{name}{s.head === name ? " *" : ""}</text>
      </g>
    );
  };
  return (
    <figure className="viz">
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${Y(1) + 60}`} style={{ minWidth: Math.min(width, 600), width: "100%" }} role="img" aria-label="Commit graph">
          {s.commits.flatMap((c) => c.parents.map((p) => {
            const pc = s.commits[p];
            return <path key={`${c.id}-${p}`} d={`M${X(pc.id)} ${Y(pc.lane)} C ${X(pc.id) + W / 2} ${Y(pc.lane)}, ${X(c.id) - W / 2} ${Y(c.lane)}, ${X(c.id)} ${Y(c.lane)}`} className="git-edge" />;
          }))}
          {s.commits.map((c) => (
            <g key={c.id}>
              <circle cx={X(c.id)} cy={Y(c.lane)} r={13} className={c.parents.length > 1 ? "git-node is-merge" : "git-node"} />
              <text x={X(c.id)} y={Y(c.lane) + 4} textAnchor="middle" className="git-node-text">{c.label}</text>
            </g>
          ))}
          {tag("main")}
          {tag("feature")}
        </svg>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={commit}>Commit on {s.head}</button>
        <button type="button" className="btn" onClick={() => switchTo(s.head === "main" ? "feature" : "main")}>Switch to {s.head === "main" ? "feature" : "main"}</button>
        <button type="button" className="btn" onClick={merge}>Merge feature into main</button>
        <button type="button" className="btn" onClick={() => setS(START)}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">{s.note} The star marks the branch HEAD points to.</figcaption>
    </figure>
  );
}
