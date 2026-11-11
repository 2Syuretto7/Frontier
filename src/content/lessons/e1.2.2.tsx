import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GitBranchViz } from "@/components/viz/GitBranchViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.2.2",
  minutes: 50,
  links: {
    requires: ["e1.2.1"],
    revisits: ["m4.3.4"],
    parallels: ["m4.3.2"],
    foreshadows: ["e1.2.3"],
  },

  puzzle: (
    <>
      <p>
        Your training code works. You want to try a risky new optimiser, which might take days and might fail, while still
        fixing small bugs in the working version whenever they turn up.
      </p>
      <p>
        How could one repository hold both lines of work without them getting in each other&rsquo;s way? And if the experiment
        succeeds, how would you bring the two lines back together?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Commits form a graph: each points back to its parent. A <strong>branch</strong> is nothing more than a name attached
        to one commit, and that name moves forward each time you commit on it. Two branches are two names that can move
        independently, so the graph can fork. A <strong>merge</strong> joins the forks again.
      </p>
      <GitBranchViz />
      <p>
        Try two scenarios from Reset. First, commit on feature, switch to main and merge: main simply jumps forward. Then
        commit on both branches before merging: now Git must create a commit with two parents.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="branches and HEAD">
        <p>
          A <strong>branch</strong> is a movable name for a commit. <strong>HEAD</strong> records which branch you are on; a
          new commit gets the current commit as its parent, and the current branch moves to it.
        </p>
        <Code>{`git switch -c new-optimiser   # create a branch here and move onto it
git switch main               # go back; the working files change to match
git branch                    # list branches; * marks the current one`}</Code>
      </Definition>

      <Definition title="merging">
        <p>
          <C>git merge feature</C>, run on main, brings feature&rsquo;s commits into main. There are two cases:
        </p>
        <ul>
          <li>
            If main has no commits of its own since the branches split, main is an ancestor of feature, and Git does a{" "}
            <strong>fast-forward</strong>: it moves the name main to feature&rsquo;s commit.
          </li>
          <li>
            Otherwise Git performs a <strong>three-way merge</strong>, comparing both tips with their latest common ancestor,
            the <strong>merge base</strong>, and records the result as a <strong>merge commit</strong> with two parents.
          </li>
        </ul>
      </Definition>

      <Example title="how three-way merging decides">
        <p>
          For each part of each file, Git compares three versions: the base, main&rsquo;s and feature&rsquo;s. If only one side
          changed it, that change wins. If neither changed it, it stays. If both changed it differently, that is a{" "}
          <strong>conflict</strong>, and Git stops and marks the file:
        </p>
        <Code>{`<<<<<<< HEAD
lr = 3e-4
=======
lr = 1e-3
>>>>>>> feature`}</Code>
        <p>
          You edit the file to the version you want, delete the markers, then <C>git add</C> and <C>git commit</C> to finish the
          merge. Conflicts are not errors; they are Git declining to guess.
        </p>
      </Example>

      <Remark title="rebase, briefly">
        <p>
          <C>git rebase main</C>, run on a feature branch, replays its commits on top of main&rsquo;s latest commit, giving a
          straight history with no merge commit. It creates new commits with new hashes, so rebase only commits nobody else has
          built on: never rewrite history that others have pulled.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "what",
      rung: "check",
      prompt: <p>What is a Git branch?</p>,
      answer: { kind: "choice", options: ["A name that points to a commit and moves forward as you commit", "A full copy of the repository", "A folder inside .git holding changed files"], correct: [0] },
    },
    {
      key: "ff",
      rung: "check",
      prompt: <p>When can merging feature into main be a fast-forward?</p>,
      answer: { kind: "choice", options: ["When main has no commits that feature lacks", "When both branches changed different files", "Always"], correct: [0] },
    },
    {
      key: "count1",
      rung: "apply",
      prompt: <p>From the starting graph (A, B), you commit twice on feature, switch to main and merge. How many commits does the graph have?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "count2",
      rung: "apply",
      prompt: <p>From the start again, you commit twice on feature, then once on main, then merge feature into main. How many commits does the graph have now?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "parents",
      rung: "apply",
      prompt: <p>How many parents does an ordinary merge commit have?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`parents = {"A": [], "B": ["A"], "C": ["B"], "D": ["B"], "E": ["C", "D"]}
def ancestors(c):
    out = {c}
    for p in parents[c]:
        out |= ancestors(p)
    return out
print(sorted(ancestors("C") & ancestors("D")))`}</Code>
          <p>Commits shared by branches C and D. Which is their merge base, the newest common ancestor?</p>
        </>
      ),
      answer: { kind: "choice", options: ["B", "A", "E", "C"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`parents = {"A": [], "B": ["A"], "C": ["B"], "D": ["A"], "E": ["D"]}
def anc(c):
    s = {c}
    for p in parents[c]:
        s |= anc(p)
    return s
common = anc("C") & anc("E")
print(sorted(common), len(anc("C") - anc("E")))`}</Code>
          <p>Two branches that split after commit A. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["['A'] 2", "['A', 'B'] 2", "['A'] 3", "[] 3"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>merge3(base, ours, theirs)</C> for three lists of lines of equal length (no lines added or removed). For each line: if only one side changed it, take that side; if both made the same change, take it; if they changed it differently, put <C>"CONFLICT"</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def merge3(base, ours, theirs):
    return ours
`,
        solution: `def merge3(base, ours, theirs):
    out = []
    for b, o, t in zip(base, ours, theirs):
        if o == t or t == b:
            out.append(o)
        elif o == b:
            out.append(t)
        else:
            out.append('CONFLICT')
    return out
`,
        tests: [
          { name: "clean", code: `assert merge3(['a', 'b', 'c'], ['A', 'b', 'c'], ['a', 'b', 'C']) == ['A', 'b', 'C'], 'Take each side’s change where the other left the line alone.'` },
          { name: "conflict", code: `assert merge3(['x'], ['y'], ['z']) == ['CONFLICT'] and merge3(['x'], ['y'], ['y']) == ['y'], 'Different changes to one line conflict; the same change does not.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Commit graphs map each commit to its list of parents. Write <C>ancestors(parents, c)</C>, the set of c and everything reachable from it (iteratively); <C>merge_bases(parents, a, b)</C>, the sorted common ancestors that are not ancestors of another common ancestor (usually one, but criss-cross merges give two); and <C>is_fast_forward(parents, a, b)</C>, true when moving a branch from a to b needs no merge commit, that is when a is an ancestor of b.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def ancestors(parents, c):
    return {c}

def merge_bases(parents, a, b):
    return []

def is_fast_forward(parents, a, b):
    return False
`,
        solution: `def ancestors(parents, c):
    seen, stack = set(), [c]
    while stack:
        x = stack.pop()
        if x not in seen:
            seen.add(x)
            stack.extend(parents[x])
    return seen

def merge_bases(parents, a, b):
    common = ancestors(parents, a) & ancestors(parents, b)
    return sorted(c for c in common if not any(c != d and c in ancestors(parents, d) for d in common))

def is_fast_forward(parents, a, b):
    return a in ancestors(parents, b)
`,
        tests: [
          { name: "simple", code: `P = {'A': [], 'B': ['A'], 'C': ['B'], 'D': ['A'], 'E': ['D'], 'M': ['C', 'E']}
assert merge_bases(P, 'C', 'E') == ['A'] and merge_bases(P, 'M', 'E') == ['E'] and ancestors(P, 'M') == set('ABCDEM')` },
          { name: "criss-cross", code: `P = {'A': [], 'B': ['A'], 'C': ['A'], 'X': ['B', 'C'], 'Y': ['C', 'B']}
assert merge_bases(P, 'X', 'Y') == ['B', 'C'], 'A criss-cross merge has two best common ancestors.'` },
          { name: "ff", code: `P = {'A': [], 'B': ['A'], 'C': ['B'], 'D': ['A']}
assert is_fast_forward(P, 'A', 'C') and not is_fast_forward(P, 'C', 'A') and not is_fast_forward(P, 'C', 'D') and is_fast_forward(P, 'B', 'B')` },
          { name: "long", code: `P = {0: []}
for i in range(1, 5000):
    P[i] = [i - 1]
assert len(ancestors(P, 4999)) == 5000, 'No recursion limit for long histories.'` },
        ],
      },
    },
    {
      key: "base",
      rung: "prove",
      prompt: (
        <p>
          Explain why Git needs the merge base, and not just the two branch tips, to merge correctly. Use an example of a line
          that one branch changed and the other left alone.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that comparing only the two tips shows that a line differs, but not which side changed it.",
          "Uses the base to see which side departed from the original: if main changed a line and feature kept the base version, main's change should win.",
          "Explains that a conflict arises only when both sides changed the same part differently from the base.",
          "Gives a concrete example, such as a learning rate changed on one branch only.",
        ],
      },
    },
    {
      key: "threeway",
      rung: "stretch",
      prompt: <p>The merge base sets <C>lr = 0.001</C>. Main changed it to <C>0.002</C>; feature left it alone. What value of <C>lr</C> does the merge produce?</p>,
      answer: { kind: "numeric", value: 0.002 },
    },
  ],

  teachBack:
    "Explain to a friend what a branch really is, the difference between a fast-forward and a merge commit, and what a conflict is.",

  glimpse: (
    <p>
      Next, sharing branches with others through GitHub and pull requests. The commit graph is a directed acyclic graph, the same
      structure that orders the steps of a computation when a neural network is differentiated.
    </p>
  ),
};
