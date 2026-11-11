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
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`log = [("f3a", "Fix off-by-one in loader"), ("b21", "Add loader"), ("9c0", "Initial commit")]
good = {"9c0": True, "b21": False, "f3a": True}
print(next(h for h, _ in reversed(log) if not good[h]))`}</Code>
          <p>Commits listed newest first, with whether tests passed at each. Which commit is the first bad one?</p>
        </>
      ),
      answer: { kind: "choice", options: ["b21", "f3a", "9c0", "None of them"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`log = """a1 2026-01-03 Asha Fix tokenizer
b2 2026-01-02 Ravi Add tokenizer
c3 2026-01-01 Asha Initial commit"""
rows = [l.split(" ", 3) for l in log.splitlines()]
by = {}
for _, _, who, _ in rows:
    by[who] = by.get(who, 0) + 1
print(by, rows[-1][3], min(r[1] for r in rows))`}</Code>
          <p>Summarising a one-line-per-commit log. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["{'Asha': 2, 'Ravi': 1} Initial commit 2026-01-01", "{'Asha': 2, 'Ravi': 1} Initial 2026-01-01", "{'Asha': 1, 'Ravi': 1} Initial commit 2026-01-03", "{'Asha': 2, 'Ravi': 1} Fix tokenizer 2026-01-01"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>bisect(commits, is_good)</C>, which finds the first bad commit in a list ordered oldest to newest, where the first is good, the last is bad, and once bad every later commit is bad. Use binary search, calling <C>is_good</C> as few times as possible, as <C>git bisect</C> does.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def bisect(commits, is_good):
    for c in commits:
        if not is_good(c):
            return c
`,
        solution: `def bisect(commits, is_good):
    lo, hi = 0, len(commits) - 1
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if is_good(commits[mid]):
            lo = mid
        else:
            hi = mid
    return commits[hi]
`,
        tests: [
          { name: "finds", code: `cs = list(range(100))
assert bisect(cs, lambda c: c < 37) == 37, 'The first bad commit here is 37.'` },
          { name: "few checks", code: `calls = []
def good(c):
    calls.append(c)
    return c < 600
assert bisect(list(range(1000)), good) == 600 and len(calls) <= 10, 'Halve the range each time: about log₂ 1000 ≈ 10 checks.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>blame(versions)</C>, which says which commit introduced each line of a file. versions is a list of (commit_id, lines) from oldest to newest. Every line of the first version belongs to its commit; for each later version, compare it with the previous one using <C>difflib.SequenceMatcher(None, old, new, autojunk=False).get_opcodes()</C>: lines in <C>equal</C> blocks keep their old attribution and all other lines of the new version belong to the new commit. Return a list of (commit_id, line) for the final version.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def blame(versions):
    cid, lines = versions[-1]
    return [(cid, l) for l in lines]
`,
        solution: `import difflib

def blame(versions):
    cid, lines = versions[0]
    owners = [cid] * len(lines)
    old = lines
    for cid, new in versions[1:]:
        nxt = [cid] * len(new)
        for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, old, new, autojunk=False).get_opcodes():
            if tag == 'equal':
                nxt[j1:j2] = owners[i1:i2]
        owners, old = nxt, new
    return list(zip(owners, old))
`,
        tests: [
          { name: "simple", code: `v = [('c1', ['a', 'b', 'c']), ('c2', ['a', 'B', 'c']), ('c3', ['a', 'B', 'c', 'd'])]
assert blame(v) == [('c1', 'a'), ('c2', 'B'), ('c1', 'c'), ('c3', 'd')]` },
          { name: "insert", code: `v = [('c1', ['x', 'y']), ('c2', ['new', 'x', 'y']), ('c3', ['new', 'x', 'mid', 'y'])]
assert blame(v) == [('c2', 'new'), ('c1', 'x'), ('c3', 'mid'), ('c1', 'y')], 'Inserting lines does not steal ownership of the lines around them.'` },
          { name: "delete and revert", code: `v = [('c1', ['a', 'b']), ('c2', ['a']), ('c3', ['a', 'b'])]
assert blame(v) == [('c1', 'a'), ('c3', 'b')], 'A line deleted and added back belongs to the commit that re-added it.'
assert blame([('only', [])]) == []` },
        ],
      },
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
