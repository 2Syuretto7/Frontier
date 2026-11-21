import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PairedCompareViz } from "@/components/viz/PairedCompareViz";
import type { LessonContent } from "@/lib/types";

const HARNESS = `def resolved(results, f2p, p2p):
    fixed = all(results.get(t, False) for t in f2p)       # the tests the fix must make pass
    kept = all(results.get(t, False) for t in p2p)        # the tests that passed before must still pass
    return fixed and kept

def resolve_rate(outcomes):
    return sum(outcomes) / len(outcomes)

def by_repo(instances):
    groups = {}
    for repo, ok in instances:
        groups.setdefault(repo, []).append(ok)
    return {r: resolve_rate(v) for r, v in sorted(groups.items())}`;

const STATS = `import math

def std_err(p, n):
    return math.sqrt(p * (1 - p) / n)

def paired_diff(a, b):
    d = [x - y for x, y in zip(a, b)]                      # per-task difference: 1, 0 or -1
    n = len(d)
    mean = sum(d) / n
    var = sum((x - mean) ** 2 for x in d) / n
    return mean, math.sqrt(var / n)

def tasks_needed(p, half_width, z=1.96):
    return math.ceil(z * z * p * (1 - p) / half_width ** 2 - 1e-9)`;

export const lesson: LessonContent = {
  id: "l13.5.1",
  minutes: 45,
  links: {
    requires: ["l13.2.2", "l8.2.4"],
    revisits: ["l13.4.3", "l13.4.1"],
    foreshadows: ["l13.5.2"],
  },

  puzzle: (
    <>
      <p>
        Two coding agents are run on the same 500 software tasks. One resolves 50% of them, the other 53%. The second
        team announces a new state of the art. Is three points on 500 tasks a real difference, or could the order flip on
        a rerun? And what exactly does &quot;resolved&quot; mean for a task taken from a real repository?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A software-engineering benchmark turns real fixed issues into tests: the agent sees the issue and the code before
        the fix, and succeeds if the tests that the real fix made pass now pass, without breaking the tests that already
        did. Its score is a proportion over a few hundred tasks, so it carries sampling noise of a few points. Because
        competing agents are run on the same tasks, the right comparison is task by task: much of the noise is in which
        tasks happen to be easy, and that is shared by both agents.
      </p>
      <PairedCompareViz />
    </>
  ),

  theory: (
    <>
      <Definition title="tasks from real repositories">
        <p>
          SWE-bench (Jimenez et al., 2023) collected 2,294 tasks from merged pull requests that resolved issues in 12 popular
          Python repositories. Each task gives the agent the issue text and the repository at the commit before the fix.
          The pull request&apos;s tests define two sets: FAIL_TO_PASS tests, which failed before the fix and pass after it,
          and PASS_TO_PASS tests, which passed both before and after. The agent&apos;s patch resolves the task if every test
          in both sets passes (<C>resolved</C>); the score is the resolve rate, often broken down by repository{" "}
          (<C>resolve_rate</C>, <C>by_repo</C>).
        </p>
        <Code>{HARNESS}</Code>
      </Definition>

      <Remark title="what went wrong, and the fixes">
        <p>
          Some issues were too vague to solve from their text, and some FAIL_TO_PASS tests checked details that the issue
          never mentioned, so a correct fix could fail. SWE-bench Verified is a subset of 500 tasks that human engineers
          screened for these problems. Other weaknesses are harder to screen out: the repositories and their fixes are public,
          so they may be in the training data; the tests may accept a wrong patch; one language and a few repositories
          dominate. Later benchmarks draw tasks continually from recent issues, cover other languages, or test work at the
          command line. The best systems resolved under 2% of the original tasks in 2023 and over 70% of Verified two
          years later, which is itself a reason to keep building harder ones.
        </p>
      </Remark>

      <Theorem title="pairing by task">
        <p>
          Let tasks be drawn independently from the benchmark, and let <M>{"X_i, Y_i \\in \\{0, 1\\}"}</M> record whether
          agents A and B resolve task i, with variances <M>{"\\sigma_A^2, \\sigma_B^2"}</M> and covariance{" "}
          <M>{"\\sigma_{AB}"}</M> across tasks. The mean difference over n tasks, <M>{"\\bar D = \\frac1n \\sum_i (X_i - Y_i)"}</M>,
          has variance
        </p>
        <MD>{"\\operatorname{Var}(\\bar D) = \\frac{\\sigma_A^2 + \\sigma_B^2 - 2\\sigma_{AB}}{n}"}</MD>
        <p>
          which is smaller than the unpaired value <M>{"(\\sigma_A^2 + \\sigma_B^2)/n"}</M> whenever the agents tend to succeed
          on the same tasks. It is estimated from the per-task differences (<C>paired_diff</C>), and a single rate has
          standard error <M>{"\\sqrt{p(1 - p)/n}"}</M> (<C>std_err</C>).
        </p>
        <Code>{STATS}</Code>
      </Theorem>
      <Proof>
        <p>
          The differences <M>{"D_i = X_i - Y_i"}</M> are independent across tasks, so{" "}
          <M>{"\\operatorname{Var}(\\bar D) = \\operatorname{Var}(D_1)/n"}</M>, and{" "}
          <M>{"\\operatorname{Var}(X - Y) = \\operatorname{Var}(X) + \\operatorname{Var}(Y) - 2\\operatorname{Cov}(X, Y)"}</M>.
          Treating the two scores as independent samples, as the comparison of training runs did with seeds, sets the
          covariance to zero and overstates the noise. A 95% interval of half-width w around a rate near p needs about{" "}
          <M>{"1.96^2 p(1 - p)/w^2"}</M> tasks (<C>tasks_needed</C>): 385 for ±5 points at p = 1/2, and four times as many to
          halve the width.
        </p>
      </Proof>

      <Theorem title="more runs or more tasks">
        <p>
          Let task i have solve probability <M>{"\\mu_i"}</M> for an agent, varying across tasks with variance{" "}
          <M>{"\\tau^2"}</M>, and let a single run have variance <M>{"\\sigma_i^2 = \\mu_i(1 - \\mu_i)"}</M>. Averaging k
          independent runs on each of n tasks gives a score with variance
        </p>
        <MD>{"\\frac{\\tau^2}{n} + \\frac{\\mathbb{E}[\\sigma_i^2]}{nk}"}</MD>
      </Theorem>
      <Proof>
        <p>
          The score is <M>{"\\frac1n\\sum_i \\bar R_i"}</M>, where <M>{"\\bar R_i"}</M> is the mean of k runs on task i, and
          the tasks are independent, so it suffices to find <M>{"\\operatorname{Var}(\\bar R_i)"}</M>. By the law of total
          variance, conditioning on the task,{" "}
          <M>{"\\operatorname{Var}(\\bar R_i) = \\operatorname{Var}(\\mathbb{E}[\\bar R_i \\mid \\mu_i]) + \\mathbb{E}[\\operatorname{Var}(\\bar R_i \\mid \\mu_i)] = \\tau^2 + \\mathbb{E}[\\sigma_i^2]/k"}</M>.
          Dividing by n gives the result. Repeated runs shrink only the second term; the first, which comes from which tasks
          were chosen, falls only with more tasks.
        </p>
      </Proof>

      <Example title="reading a leaderboard">
        <p>
          A score belongs to a system, not a model: the same model in different scaffolds, with different tool sets, step
          limits or numbers of attempts, can differ by more than the gaps between models. A careful report gives the
          scaffold, the budget, the number of runs, an interval, and the per-task outcomes so that others can pair against
          them. Differences of two or three points on 500 tasks deserve a paired test before a headline.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "se",
      rung: "check",
      prompt: <p>An agent resolves 250 of 500 tasks. What is the standard error of its resolve rate?</p>,
      answer: { kind: "numeric", value: 0.02236, tolerance: 0.0002 },
    },
    {
      key: "pairedz",
      rung: "check",
      prompt: (
        <p>
          On the same 500 tasks, agent B resolves 40 that agent A does not, and agent A resolves 25 that B does not. Using
          the paired standard error from the per-task differences, what is the difference in resolve rate divided by its
          standard error?
        </p>
      ),
      answer: { kind: "numeric", value: 1.867, tolerance: 0.005 },
    },
    {
      key: "f2p",
      rung: "apply",
      prompt: <p>Why does a SWE-bench task check PASS_TO_PASS tests as well as FAIL_TO_PASS tests?</p>,
      answer: {
        kind: "choice",
        options: [
          "A patch that fixes the issue by breaking existing behaviour should not count as a resolution",
          "To check that the agent ran the tests itself",
          "Because FAIL_TO_PASS tests are often missing",
          "To measure how fast the patch runs",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def resolved(results, f2p, p2p):
    fixed = all(results.get(t, False) for t in f2p)       # the tests the fix must make pass
    kept = all(results.get(t, False) for t in p2p)        # the tests that passed before must still pass
    return fixed and kept

def resolve_rate(outcomes):
    return sum(outcomes) / len(outcomes)

def by_repo(instances):
    groups = {}
    for repo, ok in instances:
        groups.setdefault(repo, []).append(ok)
    return {r: resolve_rate(v) for r, v in sorted(groups.items())}

res = {"t1": True, "t2": True, "t3": False}; print(resolved(res, ["t1"], ["t2"]), resolved(res, ["t1"], ["t2", "t3"]), resolved(res, ["t4"], []), resolved(res, [], []))
print(by_repo([("flask", True), ("django", False), ("flask", False), ("django", True), ("django", True)]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False False True\n{'django': 0.6666666666666666, 'flask': 0.5}",
          "True False True True\n{'django': 0.6666666666666666, 'flask': 0.5}",
          "True False False False\n{'django': 0.6666666666666666, 'flask': 0.5}",
          "True False False True\n{'flask': 0.5, 'django': 0.6666666666666666}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def std_err(p, n):
    return math.sqrt(p * (1 - p) / n)

def paired_diff(a, b):
    d = [x - y for x, y in zip(a, b)]                      # per-task difference: 1, 0 or -1
    n = len(d)
    mean = sum(d) / n
    var = sum((x - mean) ** 2 for x in d) / n
    return mean, math.sqrt(var / n)

def tasks_needed(p, half_width, z=1.96):
    return math.ceil(z * z * p * (1 - p) / half_width ** 2 - 1e-9)

a, b = [1, 1, 0, 1, 0], [1, 0, 0, 0, 1]; print([round(x, 4) for x in paired_diff(a, b)], round(std_err(0.5, 100), 4))
print(tasks_needed(0.5, 0.05), tasks_needed(0.5, 0.025), tasks_needed(0.0, 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.2, 0.3347] 0.05\n385 1537 0",
          "[0.2, 0.3464] 0.05\n385 1537 0",
          "[0.2, 0.3347] 0.05\n385 770 0",
          "[0.4, 0.3347] 0.05\n385 1537 0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>resolved(results, f2p, p2p)</C>, where results maps test names to booleans and a test missing from it
          counts as failed; <C>resolve_rate(outcomes)</C>; and <C>by_repo(instances)</C>, mapping each repository, in sorted
          order, to its resolve rate, from a list of (repository, resolved) pairs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def resolved(results, f2p, p2p):
    return all(results.get(t, False) for t in f2p)

def resolve_rate(outcomes):
    return 0.0

def by_repo(instances):
    return {}
`,
        solution: HARNESS,
        tests: [
          { name: "resolve", code: `r = {"a": True, "b": False}\nassert resolved(r, ["a"], []) and not resolved(r, ["a"], ["b"]) and not resolved(r, ["c"], [])` },
          { name: "repo", code: `assert by_repo([("x", True), ("y", False), ("x", False)]) == {"x": 0.5, "y": 0.0} and resolve_rate([True, True, False, True]) == 0.75` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>std_err(p, n)</C>; <C>paired_diff(a, b)</C> for two equal-length lists of 0s and 1s, returning the mean
          per-task difference a − b and its standard error, computed from the population variance of the differences; and{" "}
          <C>tasks_needed(p, half_width, z=1.96)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def std_err(p, n):
    return 0.0

def paired_diff(a, b):
    return 0.0, 0.0

def tasks_needed(p, half_width, z=1.96):
    return 0
`,
        solution: STATS,
        tests: [
          { name: "se", code: `assert abs(std_err(0.2, 400) - 0.02) < 1e-12 and tasks_needed(0.5, 0.05) == 385` },
          { name: "paired", code: `m, s = paired_diff([1, 1, 1, 0], [1, 0, 1, 0])\nassert abs(m - 0.25) < 1e-12 and abs(s - math.sqrt(0.1875 / 4)) < 1e-12 and paired_diff([1, 0], [1, 0]) == (0.0, 0.0)` },
        ],
      },
    },
    {
      key: "runs",
      rung: "stretch",
      prompt: (
        <p>
          On a 500-task benchmark, an agent&apos;s per-task solve probabilities have variance 0.15 across tasks, and the
          average single-run variance is 0.06. By what factor does averaging 4 runs per task reduce the standard error of
          its score, compared with one run?
        </p>
      ),
      answer: { kind: "numeric", value: 1.1282, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        A resolve rate says how often an agent succeeds once. A user who relies on it every day cares about something
        else: whether it succeeds every time, on the tasks it says it has done, and whether it fails safely when it does
        not. That is reliability.
      </p>
    </>
  ),
};
