import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BisectViz } from "@/components/viz/BisectViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.2.4",
  minutes: 45,
  links: {
    requires: ["e1.2.2"],
    revisits: ["e0.6.1"],
    parallels: ["m4.5.3"],
    foreshadows: ["e2.5.2"],
  },

  puzzle: (
    <>
      <p>
        Validation accuracy used to be 91%. Today it is 84%. There have been 300 commits in between, by six people, and nobody
        remembers changing anything that matters.
      </p>
      <p>
        You can check out any commit and run a ten-minute evaluation on it. What is the fewest number of evaluations that is
        guaranteed to find the commit that caused the drop?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Test the commit halfway through. If it is still good, the culprit is in the second half; if bad, the first. Each test
        halves the suspects, so 300 shrink to one in nine tests. Git automates this as <C>git bisect</C>. Try it below.
      </p>
      <BisectViz />
      <p>
        Bisecting is one of several ways to read history. Others answer when a line changed, who changed it, and, from the
        commit message, why.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="looking at history">
        <Code>{`git log --oneline --graph      # compact history with branch structure
git log -p -- src/loss.py      # every change to one file, with diffs
git show 3f2c1ab               # one commit: message and diff
git diff v1.2 main             # everything that changed between two points
git blame src/loss.py          # the last commit to touch each line`}</Code>
      </Definition>

      <Definition title="bisect">
        <p>Given a good commit and a bad commit, <C>git bisect</C> binary-searches the commits between them:</p>
        <Code>{`git bisect start
git bisect bad                  # the current commit is bad
git bisect good v1.2            # this older one was good
# Git checks out a commit halfway; test it, then say
git bisect good                 # or: git bisect bad
# ... repeat until Git names the first bad commit, then
git bisect reset`}</Code>
        <p>
          With <C>n</C> candidate commits, it needs about <C>log₂ n</C> tests. <C>git bisect run ./check.sh</C> runs a script
          at each step, using its exit status to decide good or bad, so the whole search runs unattended.
        </p>
      </Definition>

      <Example title="why this works">
        <p>
          Bisect assumes the property is monotone: every commit before the culprit is good and every commit after it is bad.
          If the bug comes and goes, or the test is flaky, the search can point at the wrong commit. Make the test deterministic,
          for example by fixing random seeds, before bisecting.
        </p>
      </Example>

      <Remark title="undoing safely">
        <p>
          <C>git revert abc123</C> makes a new commit that undoes <C>abc123</C>; it is safe on shared branches because it adds
          history rather than rewriting it. <C>git reset</C> moves a branch backwards and should only be used on commits you
          have not shared. And if you ever lose a commit, <C>git reflog</C> lists everywhere HEAD has been recently, so it can
          almost always be recovered.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "blame",
      rung: "check",
      prompt: <p>Which command shows the last commit to change each line of a file?</p>,
      answer: { kind: "choice", options: ["git blame", "git log --oneline", "git status", "git bisect"], correct: [0] },
    },
    {
      key: "revert",
      rung: "check",
      prompt: <p>A bad commit is already on the shared main branch. How should you undo it?</p>,
      answer: { kind: "choice", options: ["git revert, which adds a commit undoing it", "git reset, then force-push", "Delete the repository and clone again"], correct: [0] },
    },
    {
      key: "k1024",
      rung: "apply",
      prompt: <p>About how many tests does bisect need to find the culprit among 1,024 candidate commits?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "k16",
      rung: "apply",
      prompt: <p>In the demonstration, commit 1 is good, commit 16 is bad, and the first bad commit is one of commits 2 to 16. What is the largest number of tests bisect can need?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "time",
      rung: "apply",
      prompt: <p>Each test is a 6-minute evaluation, and there are 4,096 candidate commits. How many minutes does an automated bisect take?</p>,
      answer: { kind: "numeric", value: 72 },
    },
    {
      key: "assume",
      rung: "prove",
      prompt: (
        <p>
          Explain why bisect needs about <C>log₂ n</C> tests, and describe two situations in which it would name the wrong
          commit. How would you guard against each?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that each test, if the property is monotone, rules out half of the remaining candidates, so after k tests about n / 2^k remain.",
          "Concludes that k ≈ log₂ n tests reduce the candidates to one.",
          "Names a flaky or non-deterministic test (for example unseeded training) and guards by fixing seeds or repeating runs.",
          "Names a bug that appears, disappears and reappears, or several causes, and guards by checking the found commit and its neighbours directly.",
        ],
      },
    },
    {
      key: "three",
      rung: "stretch",
      prompt: <p>From the puzzle: what is the fewest number of tests guaranteed to find the culprit among 300 candidate commits?</p>,
      answer: { kind: "numeric", value: 9 },
    },
  ],

  teachBack:
    "Explain to a friend how git bisect finds a bad commit, why it takes about log₂ n steps, and why revert is safer than reset on shared branches.",

  glimpse: (
    <p>
      Next, Python itself, in depth. Binary search, the idea behind bisect, is studied properly in Data Structures and Algorithms.
    </p>
  ),
};
