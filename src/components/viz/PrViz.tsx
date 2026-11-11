"use client";

import { useState } from "react";

type Step = { cmd?: string; note: string; commits: number; checks: "none" | "running" | "fail" | "pass"; review: "none" | "changes" | "approved"; comment?: boolean; fixed?: boolean; merged?: boolean };

const STEPS: Step[] = [
  { cmd: "git switch -c warmup-guard", note: "Start a branch for one focused change, so main stays untouched while you work.", commits: 0, checks: "none", review: "none" },
  { cmd: "git commit -am \"Add learning-rate warmup\" && git push -u origin warmup-guard", note: "Commit, then push the branch to GitHub. -u remembers where it goes, so later pushes need no arguments.", commits: 1, checks: "none", review: "none" },
  { note: "Open a pull request: a request to merge warmup-guard into main. The description says what changed, why, and how it was tested.", commits: 1, checks: "running", review: "none" },
  { note: "Continuous integration runs the tests and the linter on the branch. The linter fails: an unused import.", commits: 1, checks: "fail", review: "none" },
  { cmd: "git commit -am \"Remove unused import\" && git push", note: "Fix it and push again. The pull request updates itself, and the checks run again and pass.", commits: 2, checks: "pass", review: "none" },
  { note: "A reviewer reads the diff and leaves a comment on one line, requesting a change.", commits: 2, checks: "pass", review: "changes", comment: true },
  { cmd: "git commit -am \"Guard against zero warmup steps\" && git push", note: "Address the comment in a new commit, reply to it, and ask for another look. The checks pass again.", commits: 3, checks: "pass", review: "changes", comment: true, fixed: true },
  { note: "The reviewer approves. With passing checks and an approval, the pull request can be merged.", commits: 3, checks: "pass", review: "approved", comment: true, fixed: true },
  { note: "Squash and merge: the three commits become one tidy commit on main, and the branch is deleted.", commits: 3, checks: "pass", review: "approved", comment: true, fixed: true, merged: true },
];

const CHECK = { none: "not run", running: "running…", fail: "1 failing", pass: "all passing" };
const REVIEW = { none: "waiting", changes: "changes requested", approved: "approved" };

/** The life of a pull request, from branch to merge. */
export function PrViz() {
  const [i, setI] = useState(0);
  const s = STEPS[i];
  return (
    <figure className="viz">
      <div className="pr-card">
        <div className="pr-title"><span className={`pr-badge${s.merged ? " is-merged" : ""}`}>{s.merged ? "Merged" : i >= 2 ? "Open" : "Draft branch"}</span> Add learning-rate warmup</div>
        <dl className="pr-rows">
          <div><dt>Commits</dt><dd>{s.merged ? "1 on main (squashed)" : s.commits}</dd></div>
          <div><dt>Checks</dt><dd className={s.checks === "fail" ? "is-bad" : s.checks === "pass" ? "is-good" : undefined}>{CHECK[s.checks]}</dd></div>
          <div><dt>Review</dt><dd className={s.review === "changes" ? "is-bad" : s.review === "approved" ? "is-good" : undefined}>{REVIEW[s.review]}</dd></div>
        </dl>
        {i >= 2 && (
          <pre className="pr-diff">
            <span className="pr-ctx">  def lr_at(step, base, warmup):</span>
            {s.fixed ? <span className="pr-add">+     warmup = max(warmup, 1)</span> : null}
            <span className="pr-add">+     if step &lt; warmup:</span>
            <span className={s.comment && !s.fixed ? "pr-add is-commented" : "pr-add"}>+         return base * step / warmup</span>
            <span className="pr-ctx">      return base</span>
          </pre>
        )}
        {s.comment && (
          <div className="pr-comment">
            <b>reviewer</b>: If warmup is 0, this line divides by zero. Can we guard against it?
            {s.fixed && <div><b>you</b>: Good catch. Added a guard and a test for warmup = 0.</div>}
          </div>
        )}
      </div>
      {s.cmd && <pre className="git-status">$ {s.cmd}</pre>}
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setI(i + 1)} disabled={i === STEPS.length - 1}>Next step</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">Step {i + 1} of {STEPS.length}. {s.note}</figcaption>
    </figure>
  );
}
