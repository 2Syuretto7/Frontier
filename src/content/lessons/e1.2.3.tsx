import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PrViz } from "@/components/viz/PrViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.2.3",
  minutes: 45,
  links: {
    requires: ["e1.2.2", "e1.1.4"],
    revisits: ["e0.6.2"],
    foreshadows: ["e1.2.4", "e1.4.3"],
  },

  puzzle: (
    <>
      <p>
        Four people work on the same training code. Each has their own copy, and each wants to change it. One person&rsquo;s
        change has a subtle bug that would quietly corrupt every run.
      </p>
      <p>
        How should changes travel between the four copies? At what point, and by whom, should the bug be caught?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Everyone shares one central repository, usually on GitHub. Nobody changes its main branch directly. Instead, each
        change lives on its own branch and arrives as a <strong>pull request</strong>: a proposal to merge, shown as a diff,
        which automated checks test and at least one other person reads before it goes in. The bug is caught before it reaches
        main, by the tests or by the reviewer.
      </p>
      <PrViz />
    </>
  ),

  theory: (
    <>
      <Definition title="remotes">
        <p>
          A <strong>remote</strong> is another copy of the repository that yours can exchange commits with. After{" "}
          <C>git clone</C>, the original is called <C>origin</C>.
        </p>
        <Code>{`git clone git@github.com:lab/trainer.git   # copy the repository, over SSH
git fetch                                  # download new commits, change nothing locally
git pull                                   # fetch, then merge into your current branch
git push -u origin my-branch               # upload a branch; -u remembers the pairing`}</Code>
      </Definition>

      <Definition title="pull requests and continuous integration">
        <p>
          A <strong>pull request</strong> asks to merge one branch into another, with a description and a page for discussion.
          Every push to its branch updates it. <strong>Continuous integration</strong> (CI) runs the test suite and other
          checks automatically on each push, so problems show up before review, not after merging.
        </p>
      </Definition>

      <Example title="a description that helps the reviewer">
        <Code>{`Add linear learning-rate warmup

Why: runs with batch size 1024 diverge in the first 200 steps.
What: lr rises linearly from 0 to its base value over warmup_steps.
Testing: unit test for the schedule, including warmup_steps = 0;
a 2,000-step run now trains smoothly (loss curve attached).`}</Code>
      </Example>

      <Remark title="reviewing well">
        <p>
          Keep pull requests small, ideally a few hundred lines at most, because review quality falls quickly with size.
          Reviewers look first for correctness (edge cases, off-by-one errors, silent shape mistakes), then for tests, then for
          clarity. Comments should be specific and kind: point at the line, say why, and suggest a fix. Authors answer every
          comment, with a change or a reason.
        </p>
      </Remark>

      <Definition title="ways to merge">
        <ul>
          <li><strong>Merge commit</strong>: keeps every commit of the branch and adds a merge commit.</li>
          <li><strong>Squash and merge</strong>: combines the branch into a single new commit on main.</li>
          <li><strong>Rebase and merge</strong>: replays each commit onto main, with no merge commit.</li>
        </ul>
      </Definition>
    </>
  ),

  practice: [
    {
      key: "ci",
      rung: "check",
      prompt: <p>What does continuous integration do for a pull request?</p>,
      answer: { kind: "choice", options: ["Runs tests and checks automatically on every push", "Merges it as soon as it is opened", "Reviews the code's style for you"], correct: [0] },
    },
    {
      key: "pull",
      rung: "check",
      prompt: <p><C>git pull</C> is equivalent to which pair of steps?</p>,
      answer: { kind: "choice", options: ["git fetch, then git merge", "git push, then git fetch", "git clone, then git commit"], correct: [0] },
    },
    {
      key: "squash",
      rung: "apply",
      prompt: <p>A pull request with 5 commits is squashed and merged. How many new commits appear on main?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "mergecommit",
      rung: "apply",
      prompt: <p>The same 5-commit pull request is merged with a merge commit instead, and main had moved on meanwhile. How many new commits does main&rsquo;s history gain?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "size",
      rung: "apply",
      prompt: <p>Which pull request is easiest to review well?</p>,
      answer: { kind: "choice", options: ["150 lines adding one feature with its tests", "3,000 lines refactoring and adding two features", "40 lines changed across 25 unrelated files"], correct: [0] },
    },
    {
      key: "review",
      rung: "prove",
      prompt: (
        <p>
          You review a pull request that changes how the training loss is averaged across GPUs. Describe what you would check,
          in order, and write one example review comment that is specific and constructive.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Checks correctness first: whether the average is over all examples or over per-GPU means, and edge cases such as an uneven last batch.",
          "Checks that tests cover the change, ideally comparing against a single-device computation.",
          "Checks clarity: names, comments and the description explaining why.",
          "Writes a comment that points to a line, explains the problem and suggests a fix, without vague criticism.",
        ],
      },
    },
    {
      key: "u",
      rung: "stretch",
      prompt: <p>What does the <C>-u</C> in <C>git push -u origin my-branch</C> do?</p>,
      answer: { kind: "choice", options: ["Sets origin/my-branch as the upstream, so later git push and git pull need no arguments", "Forces the push over other people's work", "Pushes every local branch"], correct: [0] },
    },
  ],

  teachBack:
    "Explain to a friend the life of a pull request, what CI adds, and what makes a pull request easy to review.",

  glimpse: (
    <p>
      Next, reading history: finding when, why and by whom a line changed. Pinning dependencies, later in this course, keeps CI
      testing exactly the libraries you use.
    </p>
  ),
};
