import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GitStageViz } from "@/components/viz/GitStageViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.2.1",
  minutes: 50,
  links: {
    requires: ["e1.1.3"],
    revisits: ["e0.6.4"],
    parallels: ["m4.4.4"],
    foreshadows: ["e1.2.2", "e1.2.4"],
  },

  puzzle: (
    <>
      <p>
        Your model trained beautifully on Tuesday. Since then you have changed six files, and now the loss explodes. You have
        folders called <C>train_v2</C>, <C>train_final</C> and <C>train_final_REAL</C>, and none of them is Tuesday&rsquo;s.
      </p>
      <p>
        What would you want a tool to have recorded, at each point you were happy with the code, so that you could see exactly
        what changed and go back?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        You want snapshots: the complete state of the project at moments you chose, each with a note saying why, linked in
        order. <strong>Git</strong> records exactly that. Each snapshot is a <strong>commit</strong>, and you decide precisely
        which changes go into each one by first placing them in a <strong>staging area</strong>.
      </p>
      <p>
        Edit files, stage some of them, and commit. Notice that a commit includes only what was staged, and that{" "}
        <C>git status</C> always tells you where every change is.
      </p>
      <GitStageViz />
    </>
  ),

  theory: (
    <>
      <Definition title="repository and commit">
        <p>
          A <strong>repository</strong> is a project folder whose history Git tracks, stored in a hidden <C>.git</C>{" "}
          directory. A <strong>commit</strong> records a snapshot of every tracked file, an author, a time, a message, and a
          link to its parent commit. Its identifier is a hash of all of that: 40 hexadecimal characters, usually shortened to the
          first 7. Change anything, even one character of history, and the hash changes.
        </p>
      </Definition>

      <Definition title="the three areas">
        <ul>
          <li>The <strong>working directory</strong>: the files you edit.</li>
          <li>The <strong>staging area</strong> (or index): the snapshot you are preparing.</li>
          <li>The <strong>repository</strong>: the commits made so far.</li>
        </ul>
        <p>
          <C>git add</C> copies changes from the first to the second; <C>git commit</C> records the second as a new commit.
        </p>
      </Definition>

      <Example title="a first session">
        <Code>{`git init                       # start tracking this folder
git status                     # what has changed, and where is it?
git add train.py               # stage one file
git diff --staged              # review exactly what will be committed
git commit -m "Add warmup to the learning-rate schedule"
git log --oneline              # the history, newest first`}</Code>
      </Example>

      <Remark title="good commits">
        <p>
          A good commit makes one logical change and says why in its message: &ldquo;Lower batch size to fit in 24 GB&rdquo;, not
          &ldquo;fix&rdquo;. Small, focused commits are easy to review, easy to revert and easy to search later. The staging area
          exists so you can split a messy afternoon of edits into such commits.
        </p>
      </Remark>

      <Definition title="what not to commit">
        <p>
          A file named <C>.gitignore</C> lists patterns Git should ignore. In ML projects it should cover datasets, model
          checkpoints, logs and virtual environments, which are large and can be regenerated, and above all secrets such as{" "}
          <C>.env</C> files with API keys. A secret committed once stays in the history even after you delete the file.
        </p>
        <Code>{`data/
checkpoints/
*.pt
.venv/
.env`}</Code>
      </Definition>
    </>
  ),

  practice: [
    {
      key: "commit",
      rung: "check",
      prompt: <p>What does <C>git commit</C> record?</p>,
      answer: { kind: "choice", options: ["The staged snapshot, with a message and a link to its parent", "Every change in the working directory, staged or not", "Only the names of the changed files"], correct: [0] },
    },
    {
      key: "ignore",
      rung: "check",
      prompt: <p>Which of these belong in <C>.gitignore</C> for an ML project? Select all that apply.</p>,
      answer: { kind: "choice", options: ["checkpoints/", ".env", "train.py", "README.md"], correct: [0, 1] },
    },
    {
      key: "unstaged",
      rung: "apply",
      prompt: <p>You edit <C>train.py</C> and <C>README.md</C>, run <C>git add train.py</C>, then <C>git commit</C>. Which file does <C>git status</C> now list as changed?</p>,
      answer: { kind: "choice", options: ["README.md", "train.py", "Both", "Neither"], correct: [0] },
    },
    {
      key: "hex",
      rung: "apply",
      prompt: <p>A full Git commit hash, in its usual SHA-1 form, has how many hexadecimal characters?</p>,
      answer: { kind: "numeric", value: 40 },
    },
    {
      key: "short",
      rung: "apply",
      prompt: <p>How many different values can a 7-character hexadecimal short hash take?</p>,
      answer: { kind: "numeric", value: 268435456 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import hashlib
def blob_id(text):
    data = text.encode()
    return hashlib.sha1(b"blob %d\\0" % len(data) + data).hexdigest()
print(blob_id("hello\\n")[:7], blob_id("hello\\n") == blob_id("hello\\n"))`}</Code>
          <p>Git names a file's contents by a hash. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["ce01362 True", "ce01362 False", "aaf4c61 True", "a different hash each run"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import hashlib
def h(s):
    return hashlib.sha1(s.encode()).hexdigest()[:7]
a = h("tree t1\\n\\nfirst")
b = h("tree t1\\nparent " + a + "\\n\\nsecond")
print(len(a), a == h("tree t1\\n\\nfirst"), b == h("tree t1\\nparent " + a + "\\n\\nsecond!"))`}</Code>
          <p>Commit ids are hashes of content, and changing one character changes the hash. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["7 True False", "40 True False", "7 True True", "7 False False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Git stores commits by content. Write <C>commit_id(tree, parent, message)</C>, which returns the SHA-1 hex digest of the text <C>"tree " + tree + "\n" + "parent " + parent + "\n" + "\n" + message</C>, leaving out the parent line when <C>parent</C> is <C>None</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import hashlib

def commit_id(tree, parent, message):
    return hashlib.sha1(message.encode()).hexdigest()
`,
        solution: `import hashlib

def commit_id(tree, parent, message):
    head = f'tree {tree}\\n' + (f'parent {parent}\\n' if parent else '')
    return hashlib.sha1((head + '\\n' + message).encode()).hexdigest()
`,
        tests: [
          { name: "root", code: `import hashlib
assert commit_id('t1', None, 'init') == hashlib.sha1(b'tree t1\\n\\ninit').hexdigest(), 'A first commit has no parent line.'` },
          { name: "chain", code: `import hashlib
assert commit_id('t2', 'abc', 'fix') == hashlib.sha1(b'tree t2\\nparent abc\\n\\nfix').hexdigest(), 'Include the parent, so changing history changes every later id.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Git names every object by the SHA-1 hex digest of its contents. Write <C>blob_id(text)</C>, the digest of <C>&quot;blob &quot; + text</C>; <C>tree_id(files)</C>, for a dict from path to text, the digest of the sorted lines <C>{`f"{path} {blob_id(text)}"`}</C> joined by newlines; and <C>commit_id(files, parent, message)</C>, the digest of <C>{`f"tree {tree_id(files)}\\nparent {parent}\\n\\n{message}"`}</C>, where parent is <C>&quot;none&quot;</C> for a first commit.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import hashlib

def blob_id(text):
    return ''

def tree_id(files):
    return ''

def commit_id(files, parent, message):
    return ''
`,
        solution: `import hashlib

def blob_id(text):
    return hashlib.sha1(('blob ' + text).encode()).hexdigest()

def tree_id(files):
    lines = sorted(f'{path} {blob_id(text)}' for path, text in files.items())
    return hashlib.sha1('\\n'.join(lines).encode()).hexdigest()

def commit_id(files, parent, message):
    s = f'tree {tree_id(files)}\\nparent {parent}\\n\\n{message}'
    return hashlib.sha1(s.encode()).hexdigest()
`,
        tests: [
          { name: "blob", code: `import hashlib
assert blob_id('hi') == hashlib.sha1(b'blob hi').hexdigest() and blob_id('hi') != blob_id('hi!'), 'Hash "blob " followed by the text.'` },
          { name: "tree", code: `import hashlib
want = hashlib.sha1(('a.txt ' + blob_id('one') + '\\nb.txt ' + blob_id('two')).encode()).hexdigest()
assert tree_id({'b.txt': 'two', 'a.txt': 'one'}) == want, 'Sort the lines, so the order of the dict does not matter.'` },
          { name: "commit", code: `import hashlib
c1 = commit_id({'x': 'hi'}, 'none', 'm')
assert c1 == hashlib.sha1(f'tree {tree_id({"x": "hi"})}\\nparent none\\n\\nm'.encode()).hexdigest(), 'Follow the recipe exactly.'
assert commit_id({'x': 'hi'}, c1, 'm') != c1, 'Same files and message but a different parent gives a different id.'` },
        ],
      },
    },
    {
      key: "staging",
      rung: "prove",
      prompt: (
        <p>
          You spent a morning fixing a data-loading bug and, along the way, renaming variables in three unrelated files. Explain
          how you would use the staging area to turn this into good commits, and why that is better than one commit of
          everything.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Stages only the files, or parts of files, for the bug fix, checks them with git diff --staged, and commits with a message explaining the fix.",
          "Then stages and commits the renames separately, with their own message.",
          "Explains that focused commits can be reviewed, reverted or found by bisect independently.",
          "Notes that a single mixed commit hides the real fix among unrelated changes.",
        ],
      },
    },
    {
      key: "birthday",
      rung: "stretch",
      prompt: (
        <p>
          A repository has 10,000 commits. Using the birthday approximation <C>n² / (2N)</C> with <C>N = 16⁷</C>, estimate the
          probability that two of them share the same 7-character short hash. Give two decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.186, tolerance: 0.006 },
    },
  ],

  teachBack:
    "Explain to a friend what a commit is, what the staging area is for, and what should never be committed.",

  glimpse: (
    <p>
      Next, branches, which let several lines of work grow side by side, and merges, which join them. Hashing, the idea behind
      commit identifiers, returns in Data Structures and Algorithms.
    </p>
  ),
};
