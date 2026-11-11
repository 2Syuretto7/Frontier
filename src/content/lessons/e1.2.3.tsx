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
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import difflib
old = ["def area(r):", "    return 3.14 * r * r"]
new = ["def area(r):", "    return math.pi * r * r"]
print(sum(1 for l in difflib.unified_diff(old, new, lineterm="") if l[:1] in "+-" and l[:3] not in ("+++", "---")))`}</Code>
          <p>A reviewer sees a diff. How many changed lines (+ or −) does it show?</p>
        </>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import difflib
a = "the cat sat".split()
b = "the dog sat down".split()
print([x for x in difflib.ndiff(a, b) if x[0] in "+-"])`}</Code>
          <p>A word-level diff with difflib. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["['- cat', '+ dog', '+ down']", "['+ dog', '- cat', '+ down']", "['- cat', '+ dog']", "['- the cat sat', '+ the dog sat down']"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>review(diff)</C>, which takes a unified diff as a list of lines and returns (added, removed), the counts of lines starting with + and −, not counting the <C>+++</C> and <C>---</C> header lines. Reviewers use these numbers to judge a pull request&rsquo;s size.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def review(diff):
    return (sum(l.startswith('+') for l in diff), sum(l.startswith('-') for l in diff))
`,
        solution: `def review(diff):
    added = sum(1 for l in diff if l.startswith('+') and not l.startswith('+++'))
    removed = sum(1 for l in diff if l.startswith('-') and not l.startswith('---'))
    return (added, removed)
`,
        tests: [
          { name: "counts", code: `d = ['--- a/x.py', '+++ b/x.py', '@@ -1,2 +1,3 @@', ' a', '-b', '+B', '+c']
assert review(d) == (2, 1), 'Skip the +++ and --- headers.'` },
          { name: "edges", code: `assert review([]) == (0, 0) and review([' +x', ' -y', '@@ -1 +1 @@']) == (0, 0) and review(['++x', '--y', '+', '-']) == (2, 2), 'Only the first character decides; context lines start with a space.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write your own diff from the longest common subsequence. <C>lcs_table(a, b)</C> returns the (len(a) + 1) × (len(b) + 1) table where entry [i][j] is the LCS length of a[i:] and b[j:]. <C>diff(a, b)</C> walks the table from the start and returns lines prefixed <C>"  "</C> (kept), <C>"- "</C> (removed) or <C>"+ "</C> (added): keep a line when a[i] == b[j]; otherwise remove a[i] if that keeps the LCS (table[i + 1][j] ≥ table[i][j + 1]), else add b[j]. <C>patch(a, d)</C> applies such a diff to a and returns b, raising <C>ValueError</C> if a kept or removed line does not match.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def lcs_table(a, b):
    return [[0] * (len(b) + 1) for _ in range(len(a) + 1)]

def diff(a, b):
    return ['- ' + x for x in a] + ['+ ' + x for x in b]

def patch(a, d):
    return [l[2:] for l in d if l[0] == '+']
`,
        solution: `def lcs_table(a, b):
    T = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) - 1, -1, -1):
        for j in range(len(b) - 1, -1, -1):
            T[i][j] = T[i + 1][j + 1] + 1 if a[i] == b[j] else max(T[i + 1][j], T[i][j + 1])
    return T

def diff(a, b):
    T = lcs_table(a, b)
    i = j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] == b[j]:
            out.append('  ' + a[i]); i += 1; j += 1
        elif T[i + 1][j] >= T[i][j + 1]:
            out.append('- ' + a[i]); i += 1
        else:
            out.append('+ ' + b[j]); j += 1
    out += ['- ' + x for x in a[i:]] + ['+ ' + x for x in b[j:]]
    return out

def patch(a, d):
    out, i = [], 0
    for line in d:
        tag, text = line[:2], line[2:]
        if tag == '+ ':
            out.append(text)
            continue
        if i >= len(a) or a[i] != text:
            raise ValueError('patch does not apply')
        if tag == '  ':
            out.append(text)
        i += 1
    if i != len(a):
        raise ValueError('patch does not apply')
    return out
`,
        tests: [
          { name: "example", code: `assert diff(['the', 'cat', 'sat'], ['the', 'dog', 'sat', 'down']) == ['  the', '- cat', '+ dog', '  sat', '+ down'] and lcs_table(['a', 'b'], ['b'])[0][0] == 1` },
          { name: "minimal", code: `import random
random.seed(4)
for _ in range(200):
    a = [random.choice('abc') for _ in range(random.randint(0, 10))]
    b = [random.choice('abc') for _ in range(random.randint(0, 10))]
    d = diff(a, b)
    kept = sum(l.startswith('  ') for l in d)
    assert patch(a, d) == b and kept == lcs_table(a, b)[0][0], f'{a} → {b}'` },
          { name: "conflict", code: `try:
    patch(['x', 'y'], ['  x', '- z'])
    assert False, 'A removed line that does not match must raise ValueError.'
except ValueError:
    pass
assert patch([], ['+ new']) == ['new']` },
        ],
      },
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
