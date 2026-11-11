"use client";

import { useState } from "react";

const FILES = ["train.py", "README.md", "config.yaml"];
type Snap = Record<string, number>;
type Commit = { id: string; msg: string; snap: Snap };

function shortHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16).padStart(8, "0").slice(0, 7);
}

const MESSAGES = ["Add training script", "Tune learning rate", "Document how to run", "Lower batch size", "Fix typo in config", "Log validation loss"];

/** The three places a file lives in Git: your working directory, the staging area and the commits. */
export function GitStageViz() {
  const first: Snap = { "train.py": 1, "README.md": 1, "config.yaml": 1 };
  const [work, setWork] = useState<Snap>(first);
  const [stage, setStage] = useState<Snap>(first);
  const [commits, setCommits] = useState<Commit[]>([{ id: shortHash("init"), msg: "First version", snap: first }]);
  const [note, setNote] = useState("Everything matches: the working directory, the staging area and the last commit hold the same versions.");
  const head = commits[commits.length - 1].snap;
  const state = (f: string) => (work[f] !== stage[f] ? (stage[f] !== head[f] ? "staged, then modified again" : "modified") : stage[f] !== head[f] ? "staged" : "unchanged");
  const staged = FILES.filter((f) => stage[f] !== head[f]);
  const edit = (f: string) => { setWork({ ...work, [f]: work[f] + 1 }); setNote(`You saved a change to ${f}. Git notices it differs from the staging area, but records nothing yet.`); };
  const add = (f: string) => { setStage({ ...stage, [f]: work[f] }); setNote(work[f] === stage[f] ? `${f} has no new changes to stage.` : `git add ${f} copies its current version into the staging area: the next commit will include it.`); };
  const commit = () => {
    if (!staged.length) { setNote("git commit refuses: nothing is staged, so there is nothing new to record."); return; }
    const msg = MESSAGES[(commits.length - 1) % MESSAGES.length];
    const id = shortHash(JSON.stringify(stage) + commits.length);
    setCommits([...commits, { id, msg, snap: { ...stage } }]);
    setNote(`git commit records a snapshot of the staging area as commit ${id}, "${msg}". Changes that were not staged stay out of it.`);
  };
  const restore = (f: string) => { setWork({ ...work, [f]: stage[f] }); setNote(`git restore ${f} throws away the unstaged edits, bringing back the staged version. This cannot be undone.`); };
  return (
    <figure className="viz">
      <div className="git-cols">
        <div className="git-col">
          <h4>Working directory</h4>
          {FILES.map((f) => (
            <div key={f} className={`git-file is-${state(f).split(",")[0].replace(/\s.*/, "")}`}>
              <span>{f} <small>v{work[f]}</small></span>
              <span className="git-acts">
                <button type="button" className="seg" onClick={() => edit(f)}>edit</button>
                <button type="button" className="seg" onClick={() => add(f)}>add</button>
                {work[f] !== stage[f] && <button type="button" className="seg" onClick={() => restore(f)}>restore</button>}
              </span>
            </div>
          ))}
        </div>
        <div className="git-col">
          <h4>Staging area</h4>
          {FILES.map((f) => <div key={f} className={`git-file${stage[f] !== head[f] ? " is-staged" : ""}`}><span>{f} <small>v{stage[f]}</small></span></div>)}
          <button type="button" className="btn btn-primary" style={{ marginTop: 8, width: "100%" }} onClick={commit}>git commit</button>
        </div>
        <div className="git-col">
          <h4>Commits</h4>
          <ol className="git-log">
            {[...commits].reverse().map((c, i) => (
              <li key={c.id + i}><code>{c.id}</code> {c.msg}{i === 0 && <span className="git-head"> HEAD</span>}</li>
            ))}
          </ol>
        </div>
      </div>
      <pre className="git-status" aria-label="git status">{`$ git status
${staged.length ? "Changes to be committed:\n" + staged.map((f) => `    modified: ${f}`).join("\n") + "\n" : ""}${FILES.some((f) => work[f] !== stage[f]) ? "Changes not staged for commit:\n" + FILES.filter((f) => work[f] !== stage[f]).map((f) => `    modified: ${f}`).join("\n") + "\n" : ""}${!staged.length && FILES.every((f) => work[f] === stage[f]) ? "nothing to commit, working tree clean\n" : ""}`}</pre>
      <figcaption className="viz-caption" aria-live="polite">{note}</figcaption>
    </figure>
  );
}
