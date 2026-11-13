import { M } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CiStagesViz } from "@/components/viz/CiStagesViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.6.2",
  minutes: 50,
  links: {
    requires: ["e4.6.1"],
    revisits: ["e1.2.3", "e1.4.3"],
    foreshadows: ["e4.6.3"],
  },

  puzzle: (
    <>
      <p>
        Your group shares one research repository. On Monday someone renames a config key; on Wednesday someone else&rsquo;s
        evaluation script starts silently using the default value; three weeks of results are compared against a baseline
        computed the old way. Everyone ran the tests they thought were relevant.
      </p>
      <p>What would have caught it on Monday?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Continuous integration runs every check on every proposed change, automatically, on a clean machine, and shows the
        result on the pull request. It removes &ldquo;I forgot to run the tests&rdquo; and &ldquo;it works on my
        machine&rdquo;, and it makes the main branch something you can trust. Its value depends on speed: a check that takes an
        hour gets ignored.
      </p>
      <CiStagesViz />
      <p>
        Cache what does not change, run independent checks side by side, and put the cheapest checks where they report first.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="continuous integration">
        <p>
          A CI service, such as GitHub Actions, runs a workflow on each push and pull request: check out the code, install
          pinned dependencies, then run formatters, linters, type checkers and tests. The pull request shows a green or red
          check, and branch protection can require green before merging.
        </p>
        <Code>{`# .github/workflows/check.yml
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python: ["3.11", "3.12"]
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
        with: { enable-cache: true }
      - run: uv sync --frozen --python \${{ matrix.python }}
      - run: uv run ruff check .
      - run: uv run pytest -q --doctest-modules`}</Code>
      </Definition>

      <Example title="CI for machine learning code">
        <ul>
          <li>Unit tests and property tests of losses, metrics, data transforms and shape contracts.</li>
          <li>A <em>smoke test</em>: train a tiny model on a tiny dataset for a few steps and check the loss falls and nothing is NaN.</li>
          <li>
            <em>Regression checks</em>: compare key metrics or outputs on fixed inputs with stored values, with tolerances
            chosen as in the earlier lesson.
          </li>
          <li>Slow or GPU tests on a schedule, nightly, rather than on every push.</li>
        </ul>
      </Example>

      <Proposition title="flaky tests add up">
        <p>
          If a suite has n tests that each fail spuriously with probability f, independently, the whole suite goes red for no
          reason with probability <M>{"1 - (1 - f)^n \\le n f"}</M>. With 200 tests that each flake 0.5% of the time, that is
          about 63% of runs.
        </p>
      </Proposition>
      <Proof>
        <p>
          The suite is green only if every test passes, with probability <M>{"(1 - f)^n"}</M> by independence. Bernoulli&rsquo;s
          inequality <M>{"(1 - f)^n \\ge 1 - nf"}</M>, proved by induction on n, gives the bound.
        </p>
      </Proof>

      <Remark title="keep it trustworthy">
        <p>
          A check that is often red for no reason trains everyone to ignore red. Fix or delete a flaky test promptly, never
          weaken a test just to make it pass, and keep the main branch green so that red always means &ldquo;this change broke
          something&rdquo;.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "what",
      rung: "check",
      prompt: <p>What does continuous integration add over asking everyone to run the tests before pushing?</p>,
      answer: {
        kind: "choice",
        options: [
          "Every change is checked automatically on a clean machine with pinned dependencies, and the result is visible on the pull request",
          "The tests run faster",
          "It writes the tests for you",
          "It removes the need for code review",
        ],
        correct: [0],
      },
    },
    {
      key: "flaky",
      rung: "apply",
      prompt: <p>200 independent tests each fail spuriously 0.5% of the time. What is the probability that a run goes red for no reason? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.633, tolerance: 0.001 },
    },
    {
      key: "order",
      rung: "apply",
      prompt: <p>With one runner, in which order should these checks run to report common mistakes soonest?</p>,
      answer: {
        kind: "choice",
        options: [
          "lint (15 s), type check (40 s), unit tests (2 min), tiny training run (5 min)",
          "tiny training run, unit tests, type check, lint",
          "unit tests, lint, tiny training run, type check",
          "Order does not matter if all of them must pass",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools
matrix = {'python': ['3.11', '3.12'], 'os': ['ubuntu', 'macos'], 'torch': ['2.4']}
exclude = [{'python': '3.11', 'os': 'macos'}]
jobs = [dict(zip(matrix, combo)) for combo in itertools.product(*matrix.values())]
jobs = [j for j in jobs if not any(all(j[k] == v for k, v in e.items()) for e in exclude)]
print(len(jobs), jobs[-1]['os'])`}</Code>
          <p>Expanding a build matrix. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 macos", "4 macos", "3 ubuntu", "2 ubuntu"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`baseline = {'acc': 0.912, 'loss': 0.31, 'ms_per_step': 120}
current = {'acc': 0.905, 'loss': 0.33, 'ms_per_step': 150}
rules = {'acc': ('min', 0.01), 'loss': ('max', 0.05), 'ms_per_step': ('max', 0.2)}
bad = []
for k, (kind, tol) in rules.items():
    if kind == 'min' and current[k] < baseline[k] - tol:
        bad.append(k)
    if kind == 'max' and current[k] > baseline[k] * (1 + tol):
        bad.append(k)
print(bad)`}</Code>
          <p>A regression check against stored metrics. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["['loss', 'ms_per_step']", "['acc', 'loss', 'ms_per_step']", "['ms_per_step']", "['acc', 'ms_per_step']"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>Model a pipeline whose stages run as soon as their prerequisites finish, on as many runners as needed.</p>
          <ul>
            <li>
              <C>finish_times(durations, deps)</C>: durations maps each stage to seconds, deps maps a stage to the list of
              stages it needs (missing means none). Return a dict of finish times. Raise <C>ValueError</C> if the
              dependencies contain a cycle.
            </li>
            <li>
              <C>skipped(deps, failing)</C>: the sorted list of stages that never run because something they need, directly or
              indirectly, failed or was skipped.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def finish_times(durations, deps):
    return dict(durations)

def skipped(deps, failing):
    return []
`,
        solution: `def finish_times(durations, deps):
    done, visiting = {}, set()
    def finish(n):
        if n in done:
            return done[n]
        if n in visiting:
            raise ValueError(f'cycle through {n}')
        visiting.add(n)
        done[n] = max((finish(d) for d in deps.get(n, [])), default=0) + durations[n]
        visiting.discard(n)
        return done[n]
    for n in durations:
        finish(n)
    return done

def skipped(deps, failing):
    out, changed = set(), True
    while changed:
        changed = False
        for n, needs in deps.items():
            if n not in out and any(d in failing or d in out for d in needs):
                out.add(n)
                changed = True
    return sorted(out)
`,
        tests: [
          { name: "finish times", code: `d = {'install': 90, 'lint': 15, 'types': 40, 'tests': 120, 'smoke': 300, 'report': 5}
deps = {'lint': ['install'], 'types': ['install'], 'tests': ['install'], 'smoke': ['tests'], 'report': ['lint', 'types', 'smoke']}
assert finish_times(d, deps) == {'install': 90, 'lint': 105, 'types': 130, 'tests': 210, 'smoke': 510, 'report': 515}
assert finish_times({'a': 3, 'b': 4}, {}) == {'a': 3, 'b': 4}
try:
    finish_times({'a': 1, 'b': 1, 'c': 1}, {'a': ['c'], 'b': ['a'], 'c': ['b']})
except ValueError:
    pass
else:
    assert False, 'A cycle should raise ValueError.'` },
          { name: "skipped", code: `deps = {'lint': ['install'], 'types': ['install'], 'tests': ['install'], 'smoke': ['tests'], 'report': ['lint', 'types', 'smoke']}
assert skipped(deps, {'tests'}) == ['report', 'smoke']
assert skipped(deps, {'install'}) == ['lint', 'report', 'smoke', 'tests', 'types']
assert skipped(deps, {'report'}) == []
assert skipped(deps, set()) == []` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>flaky(history)</C>. history is a list of (commit, test, outcome) with outcome <C>&apos;pass&apos;</C> or{" "}
          <C>&apos;fail&apos;</C>. A test is flaky on a commit if it both passed and failed on that commit. Return a list of
          (test, number_of_commits_on_which_it_was_flaky) for every test flaky at least once, most flaky first, ties by name.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def flaky(history):
    return []
`,
        solution: `def flaky(history):
    seen = {}
    for commit, test, outcome in history:
        seen.setdefault((test, commit), set()).add(outcome)
    counts = {}
    for (test, commit), outcomes in seen.items():
        if len(outcomes) == 2:
            counts[test] = counts.get(test, 0) + 1
    return sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
`,
        tests: [
          { name: "counts", code: `h = [
    ('c1', 'test_loss', 'pass'), ('c1', 'test_loss', 'fail'),
    ('c1', 'test_io', 'pass'), ('c1', 'test_io', 'pass'),
    ('c2', 'test_loss', 'fail'), ('c2', 'test_loss', 'pass'), ('c2', 'test_loss', 'pass'),
    ('c2', 'test_shape', 'fail'), ('c3', 'test_shape', 'pass'),
    ('c3', 'test_seed', 'pass'), ('c3', 'test_seed', 'fail'),
    ('c3', 'test_io', 'fail'), ('c3', 'test_io', 'pass'),
]
assert flaky(h) == [('test_loss', 2), ('test_io', 1), ('test_seed', 1)], flaky(h)` },
          { name: "not flaky", code: `assert flaky([]) == []
assert flaky([('c1', 't', 'fail'), ('c2', 't', 'pass')]) == [], 'Failing on one commit and passing on another is a fix or a break, not a flake.'` },
        ],
      },
    },
    {
      key: "bound",
      rung: "prove",
      prompt: (
        <p>
          Prove that a suite of n independent tests, each failing spuriously with probability f, goes red spuriously with
          probability <M>{"1 - (1 - f)^n"}</M>, and that this is at most nf. If every failing test is automatically rerun once
          and counts as passed if the rerun passes, what does the probability become?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Multiplies the pass probabilities by independence to get (1 − f)^n for a green suite.",
          "Proves (1 − f)^n ≥ 1 − nf, by induction (Bernoulli's inequality) or by the union bound.",
          "With one rerun, a test is spuriously red only if both runs fail, probability f², so the suite probability becomes 1 − (1 − f²)^n.",
        ],
      },
    },
    {
      key: "retry",
      rung: "stretch",
      prompt: <p>With one automatic rerun, what is the probability that the 200-test suite with f = 0.005 goes red for no reason? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.005, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what continuous integration does for a shared research repository, and why a fast, reliable check matters more than a thorough but slow or flaky one.",

  glimpse: (
    <p>
      With tests and CI in place you can change code with confidence, but first you must find where to change it. Last in this
      track: finding your way in a large codebase you did not write.
    </p>
  ),
};
