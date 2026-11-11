import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LockViz } from "@/components/viz/LockViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.4.3",
  minutes: 45,
  links: {
    requires: ["e1.4.2"],
    revisits: ["e1.2.3"],
    foreshadows: ["e1.5.1"],
  },

  puzzle: (
    <>
      <p>
        In January your training script runs perfectly. In September a colleague clones the same repository, runs the same
        install command, and the script crashes on its first line. Nobody changed a single file.
      </p>
      <p>What changed? And what single file would have prevented it?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        The world changed: a library released a new version. <C>pyproject.toml</C> said &ldquo;version 2.4 or newer&rdquo;, so
        September&rsquo;s install picked the newest, which renamed a function. A <strong>lock file</strong> records the exact
        version that was installed and tested, so every later install reproduces it. Move the slider through the year.
      </p>
      <LockViz />
    </>
  ),

  theory: (
    <>
      <Definition title="version numbers">
        <p>
          Most packages use <strong>semantic versioning</strong>, <C>MAJOR.MINOR.PATCH</C>. A patch release fixes bugs, a minor
          release adds features without breaking existing code, and a major release may break it. The promise is a convention,
          not a guarantee: minor releases do break things in practice.
        </p>
      </Definition>

      <Definition title="ranges and pins">
        <ul>
          <li><C>numpy&gt;=2.0</C>: any version from 2.0 up.</li>
          <li><C>numpy&gt;=2.0,&lt;3</C>: any 2.x version.</li>
          <li><C>numpy~=2.1.0</C>: compatible release, meaning at least 2.1.0 but below 2.2.</li>
          <li><C>numpy==2.1.3</C>: exactly one version, a <strong>pin</strong>.</li>
        </ul>
        <p>
          A library should declare ranges, so it can be installed alongside others. An application or experiment should also
          keep a lock file, so it can be reproduced exactly.
        </p>
      </Definition>

      <Definition title="lock files">
        <p>
          A <strong>resolver</strong> finds versions of every package, including the packages they depend on, that satisfy all
          the ranges at once. A <strong>lock file</strong> records the result: exact versions and hashes of every package in the
          whole tree. With uv:
        </p>
        <Code>{`uv lock            # resolve pyproject.toml and write uv.lock
uv sync            # make .venv match uv.lock exactly
uv lock --upgrade  # deliberately move to newer versions, then rerun the tests`}</Code>
        <p>Commit the lock file. Upgrading becomes a deliberate change in a pull request, tested by CI, rather than an accident.</p>
      </Definition>

      <Example title="dependencies of dependencies">
        <p>
          You list 5 packages. Each brings its own dependencies, so the lock file often names 50 or more. Any of them can release
          a breaking version. The lock file pins all of them, which is why it matters more than the short list you wrote.
        </p>
      </Example>

      <Remark title="reproducibility in research">
        <p>
          A result you cannot rerun is hard to trust. Record the commit hash of the code, the lock file, the configuration and
          the random seeds for every run. Lab infrastructure automates this, but the habit starts here.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lock",
      rung: "check",
      prompt: <p>What does a lock file record?</p>,
      answer: { kind: "choice", options: ["The exact version of every package in the dependency tree", "The allowed ranges you wrote by hand", "Which files are locked from editing"], correct: [0] },
    },
    {
      key: "semver",
      rung: "check",
      prompt: <p>Under semantic versioning, which release may break existing code?</p>,
      answer: { kind: "choice", options: ["2.4.1 to 3.0.0", "2.4.0 to 2.4.1", "2.4.1 to 2.5.0"], correct: [0] },
    },
    {
      key: "month",
      rung: "apply",
      prompt: <p>In the demonstration, installing from the range, in which month does the script first fail?</p>,
      answer: { kind: "choice", options: ["Sep", "Jul", "Nov", "It never fails"], correct: [0] },
    },
    {
      key: "tilde",
      rung: "apply",
      prompt: <p>Which of these versions does <C>~=2.1.0</C> allow? Select all that apply.</p>,
      answer: { kind: "choice", options: ["2.1.0", "2.1.7", "2.2.0", "3.0.0"], correct: [0, 1] },
    },
    {
      key: "commitlock",
      rung: "apply",
      prompt: <p>Should <C>uv.lock</C> be committed to an experiment&rsquo;s repository?</p>,
      answer: { kind: "choice", options: ["Yes, so every machine installs the same versions", "No, it is generated", "Only on the main branch"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def parse(v):
    return tuple(int(x) for x in v.split("."))
versions = ["1.10.0", "1.9.3", "1.2.11"]
print(max(versions), max(versions, key=parse))`}</Code>
          <p>Comparing versions as text and as tuples of numbers. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.9.3 1.10.0", "1.10.0 1.10.0", "1.9.3 1.9.3", "1.2.11 1.10.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`reqs = ["numpy==1.26.4", "pandas>=2.0", "requests"]
pinned = [r for r in reqs if "==" in r]
names = [r.split("==")[0].split(">=")[0] for r in reqs]
print(pinned, names)`}</Code>
          <p>Which requirements are pinned to an exact version? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["['numpy==1.26.4'] ['numpy', 'pandas', 'requests']", "['numpy==1.26.4', 'pandas>=2.0'] ['numpy', 'pandas', 'requests']", "['numpy==1.26.4'] ['numpy==1.26.4', 'pandas>=2.0', 'requests']", "[] ['numpy', 'pandas', 'requests']"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>satisfies(version, spec)</C> for specs like <C>"&gt;=1.4,&lt;2.0"</C> or <C>"==1.26.4"</C>: comma-separated clauses, each an operator from <C>==</C>, <C>&gt;=</C>, <C>&lt;=</C>, <C>&gt;</C>, <C>&lt;</C> followed by a dotted version. Compare versions as tuples of integers.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def satisfies(version, spec):
    return version in spec
`,
        solution: `import operator

OPS = [('==', operator.eq), ('>=', operator.ge), ('<=', operator.le), ('>', operator.gt), ('<', operator.lt)]

def parse(v):
    return tuple(int(x) for x in v.split('.'))

def satisfies(version, spec):
    v = parse(version)
    for clause in spec.split(','):
        clause = clause.strip()
        for sym, op in OPS:
            if clause.startswith(sym):
                if not op(v, parse(clause[len(sym):])):
                    return False
                break
    return True
`,
        tests: [
          { name: "range", code: `assert satisfies('1.10.0', '>=1.4,<2.0') and not satisfies('2.0.0', '>=1.4,<2.0'), 'Every clause must hold.'` },
          { name: "numeric", code: `assert not satisfies('1.9.0', '>=1.10'), 'Compare numbers, not text: 9 < 10.'` },
          { name: "pin", code: `assert satisfies('1.26.4', '==1.26.4') and not satisfies('1.26.3', '==1.26.4'), 'A pin allows one version.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a tiny dependency resolver. The index maps each package name to a dict from version string to that version&rsquo;s own requirements (a dict from name to spec). <C>satisfies(version, spec)</C> is given. Write <C>resolve(index, requirements)</C>, which returns a dict from every needed package to a chosen version so that every requirement of the top level and of every chosen version is satisfied, or <C>None</C> if that is impossible. Search by backtracking: pick packages in alphabetical order of name, and try versions from newest to oldest.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def _v(s):
    return tuple(int(x) for x in s.split('.'))

def satisfies(version, spec):
    if not spec:
        return True
    for clause in spec.split(','):
        for op in ('==', '>=', '<=', '>', '<'):
            if clause.startswith(op):
                a, b = _v(version), _v(clause[len(op):])
                if not {'==': a == b, '>=': a >= b, '<=': a <= b, '>': a > b, '<': a < b}[op]:
                    return False
                break
    return True

def resolve(index, requirements):
    return None
`,
        solution: `def _v(s):
    return tuple(int(x) for x in s.split('.'))

def satisfies(version, spec):
    if not spec:
        return True
    for clause in spec.split(','):
        for op in ('==', '>=', '<=', '>', '<'):
            if clause.startswith(op):
                a, b = _v(version), _v(clause[len(op):])
                if not {'==': a == b, '>=': a >= b, '<=': a <= b, '>': a > b, '<': a < b}[op]:
                    return False
                break
    return True

def resolve(index, requirements):
    def constraints(chosen):
        cons = [(n, s) for n, s in requirements.items()]
        for n, v in chosen.items():
            cons += list(index[n][v].items())
        return cons
    def ok(chosen):
        return all(n not in chosen or satisfies(chosen[n], s) for n, s in constraints(chosen))
    def search(chosen):
        needed = sorted({n for n, _ in constraints(chosen)} - set(chosen))
        if not needed:
            return dict(chosen)
        name = needed[0]
        if name not in index:
            return None
        for v in sorted(index[name], key=_v, reverse=True):
            chosen[name] = v
            if ok(chosen):
                r = search(chosen)
                if r is not None:
                    return r
            del chosen[name]
        return None
    return search({})
`,
        tests: [
          { name: "simple", code: `index = {'app': {'1.0.0': {'lib': '>=2.0'}}, 'lib': {'1.5.0': {}, '2.1.0': {}, '2.3.0': {}}}
assert resolve(index, {'app': ''}) == {'app': '1.0.0', 'lib': '2.3.0'}, 'Newest versions that fit.'` },
          { name: "backtrack", code: `index = {
    'a': {'2.0.0': {'c': '>=2.0'}, '1.0.0': {'c': '<2.0'}},
    'b': {'1.0.0': {'c': '<2.0'}},
    'c': {'1.0.0': {}, '2.0.0': {}},
}
assert resolve(index, {'a': '', 'b': ''}) == {'a': '1.0.0', 'b': '1.0.0', 'c': '1.0.0'}, 'a 2.0 needs c ≥ 2 but b needs c < 2, so fall back to a 1.0.'` },
          { name: "impossible", code: `index = {'x': {'1.0.0': {'y': '==1.0.0'}}, 'y': {'2.0.0': {}}}
assert resolve(index, {'x': ''}) is None and resolve({'p': {'1.0.0': {}}}, {'p': '>=2.0'}) is None and resolve({}, {}) == {}` },
        ],
      },
    },
    {
      key: "policy",
      rung: "prove",
      prompt: (
        <p>
          Propose a dependency policy for a small research team: what goes in <C>pyproject.toml</C>, what goes in the lock
          file, when and how versions are upgraded, and what each run records. Justify each choice.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Declares direct dependencies with sensible ranges in pyproject.toml.",
          "Commits the lock file and installs with uv sync, so every machine and CI use identical versions.",
          "Upgrades deliberately, for example with uv lock --upgrade in a pull request whose tests must pass.",
          "Records per run the commit hash, the lock file or its hash, the configuration and seeds, so results can be reproduced.",
        ],
      },
    },
    {
      key: "range",
      rung: "stretch",
      prompt: <p>Which range would have kept the demonstration&rsquo;s script working in every month while still accepting bug-fix and feature releases?</p>,
      answer: { kind: "choice", options: ["fastload>=2.4,<3", "fastload>=2.4", "fastload==3.0.0", "fastload<2.4"], correct: [0] },
    },
  ],

  teachBack:
    "Explain to a friend why the same install command can give different results in different months, and how a lock file fixes it.",

  glimpse: (
    <p>
      Next, NumPy, the package nearly every other in this field depends on. Its arrays are where Python meets fast numerical
      computing.
    </p>
  ),
};
