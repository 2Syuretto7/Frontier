import { M } from "@/components/Math";
import { Definition, Example, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FlagPathsViz } from "@/components/viz/FlagPathsViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.4.1",
  minutes: 50,
  links: {
    requires: ["e4.3.4"],
    revisits: ["e0.3.4", "e0.6.4"],
    foreshadows: ["e4.4.2", "e4.4.3"],
  },

  puzzle: (
    <>
      <p>
        One colleague writes every experiment as a fresh notebook, copies cells freely, and gets results in a day. Another
        writes a tested package with type hints and documentation, and takes a week for the same experiment. Both say the
        other is doing it wrong.
      </p>
      <p>Who is right?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Research code and production code have different jobs. Production code runs for years, for many users, and must not
        fail. Research code exists to answer questions quickly, and most of it is thrown away. But research code has one job
        that is not optional: its answers must be right, because a wrong conclusion costs far more than slow code. The art is
        to spend engineering effort exactly where it protects conclusions.
      </p>
      <p>
        One place research code quietly rots is the flag: each experiment adds an <C>if cfg.new_thing:</C>, and the number of
        paths through the code doubles each time.
      </p>
      <FlagPathsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="two kinds of code">
        <p>
          <strong>Production code</strong> optimises for reliability, maintainability and performance under real use: it has
          tests for every path, handles bad input, and changes slowly and carefully. <strong>Research code</strong> optimises
          for speed of iteration and correctness of conclusions: most of it is short-lived, but the parts that produce reported
          numbers must be trustworthy. Code that survives several projects, such as a data loader or an evaluation harness,
          should be promoted towards production standards.
        </p>
      </Definition>

      <Definition title="technical debt in machine learning">
        <p>Shortcuts that save time now and cost more later. Common forms in research code:</p>
        <ul>
          <li><strong>dead experimental paths</strong>: flags for ideas that failed, still in the code, still interacting;</li>
          <li><strong>copy-paste forks</strong>: three versions of the training loop, with a bug fixed in only one;</li>
          <li><strong>configuration debt</strong>: settings defined but unused, or used but undefined;</li>
          <li><strong>entanglement</strong>: changing one input, feature or setting changes everything downstream.</li>
        </ul>
      </Definition>

      <Proposition title="flags multiply">
        <p>
          With k independent boolean flags there are <M>{"2^k"}</M> configurations. Running the default and each flag alone
          tests k + 1 of them, a fraction that tends to 0. Testing every pair of flag values needs at least 4 runs, and a
          greedy choice of runs covers all pairs for 10 flags in about 9, so pairwise testing is cheap; full testing is not.
        </p>
      </Proposition>

      <Example title="what research code still needs">
        <ul>
          <li>Tests for the parts that compute reported numbers: metrics, losses, data splits and evaluation.</li>
          <li>Assertions on shapes and invariants, which cost nothing and catch silent bugs.</li>
          <li>A config and a commit hash with every result.</li>
          <li>Deletion: a failed idea&rsquo;s code removed once the notebook records the result, since git keeps history.</li>
        </ul>
        <Code>{`# Rule of three: copying once is fine; when a third copy appears, make a function.
def evaluate(model, loader, metrics):
    ...`}</Code>
      </Example>

      <Remark title="notebooks">
        <p>
          Notebooks are excellent for exploration and for plots, and poor at holding code that other code depends on: cells
          run out of order, hidden state survives, and diffs are hard to review. Move a function into a module when a second
          notebook wants it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "where",
      rung: "check",
      prompt: <p>In a research project with little time, where is careful engineering, such as tests, most worth spending?</p>,
      answer: {
        kind: "choice",
        options: [
          "The evaluation code and metrics that produce the numbers you report",
          "A plotting script used once",
          "Command-line help text",
          "Making the training loop run on any operating system",
        ],
        correct: [0],
      },
    },
    {
      key: "pairs",
      rung: "apply",
      prompt: <p>A training script has 10 boolean flags. Pairwise testing must cover every pair of flags with every combination of their two values. How many (pair, values) combinations is that?</p>,
      answer: { kind: "numeric", value: 180, tolerance: 0 },
    },
    {
      key: "dead",
      rung: "apply",
      prompt: (
        <p>
          A branch <C>if cfg.use_old_loss:</C> has not been taken in four months, and the notebook records that the old loss
          was worse. What should you do with it?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Delete it; git history and the notebook keep the record",
          "Keep it in case it is needed later",
          "Comment it out",
          "Add a test for it",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def lr_at(step, cfg):
    lr = cfg['lr']
    if cfg.get('warmup'):
        lr *= min(1, step / cfg['warmup'])
    if cfg.get('decay') and step > cfg.get('warmup', 0):
        lr *= 0.5 ** (step // 1000)
    return lr

cfgs = [{'lr': 1.0}, {'lr': 1.0, 'warmup': 500}, {'lr': 1.0, 'decay': True}, {'lr': 1.0, 'warmup': 500, 'decay': True}]
print([lr_at(250, c) for c in cfgs], [lr_at(2500, c) for c in cfgs])`}</Code>
          <p>Two flags that interact. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.5, 1.0, 0.5] [1.0, 1.0, 0.25, 0.25]",
          "[1.0, 0.5, 1.0, 0.25] [1.0, 1.0, 0.25, 0.25]",
          "[1.0, 0.5, 0.5, 0.5] [1.0, 1.0, 0.25, 0.125]",
          "[1.0, 0.5, 1.0, 0.5] [1.0, 5.0, 0.25, 1.25]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`steps = []
def step(f):
    steps.append(f.__name__)
    return f

@step
def load(x): return x + ['load']
@step
def clean(x): return x + ['clean']
@step
def load_v2(x): return x + ['load2']

pipeline = [load_v2, clean]
out = []
for f in pipeline:
    out = f(out)
print(out, steps)`}</Code>
          <p>A registry of pipeline steps after a few experiments. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['load2', 'clean'] ['load', 'clean', 'load_v2']",
          "['load2', 'clean'] ['load_v2', 'clean']",
          "['load', 'clean', 'load2'] ['load', 'clean', 'load_v2']",
          "['clean', 'load2'] ['load', 'clean', 'load_v2']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pairwise_cover(k)</C>, returning a list of tuples of k zeros and ones such that for every pair of positions i
          &lt; j and every pair of values (a, b), some tuple has a at i and b at j. Build it greedily: repeatedly add the tuple,
          among all <M>{"2^k"}</M>, that covers the most combinations not yet covered (ties to the first in{" "}
          <C>itertools.product((0, 1), repeat=k)</C> order), until all are covered.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools

def pairwise_cover(k):
    return list(itertools.product((0, 1), repeat=k))
`,
        solution: `import itertools

def pairwise_cover(k):
    pairs = [(i, j) for i in range(k) for j in range(i + 1, k)]
    need = {(i, j, a, b) for i, j in pairs for a in (0, 1) for b in (0, 1)}
    tests = []
    while need:
        best = max(itertools.product((0, 1), repeat=k), key=lambda v: sum((i, j, v[i], v[j]) in need for i, j in pairs))
        tests.append(best)
        need -= {(i, j, best[i], best[j]) for i, j in pairs}
    return tests
`,
        tests: [
          { name: "covers all pairs", code: `for k in [2, 3, 5, 8]:
    tests = pairwise_cover(k)
    assert all(len(t) == k and set(t) <= {0, 1} for t in tests)
    for i in range(k):
        for j in range(i + 1, k):
            seen = {(t[i], t[j]) for t in tests}
            assert seen == {(0, 0), (0, 1), (1, 0), (1, 1)}, f'k={k}: positions {i}, {j} only see {seen}'` },
          { name: "small", code: `assert len(pairwise_cover(2)) == 4
assert len(pairwise_cover(3)) == 4, 'Four runs can cover all pairs of three flags.'
assert len(pairwise_cover(10)) <= 10, f'{len(pairwise_cover(10))} runs; greedy should need about 9, not {2 ** 10}.'
assert pairwise_cover(2)[0] == (0, 0), 'Ties go to the first tuple in product order.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Configuration debt detector. Write <C>config_debt(source, defined)</C>: source is the text of a script, defined is
          the set of keys in its config. A key is read where the source contains the variable <C>cfg</C> (not, say, <C>mycfg</C>) as <C>cfg[&apos;key&apos;]</C> or{" "}
          <C>cfg.get(&apos;key&apos;</C>, with single or double quotes. Return (unused, undefined): sorted lists of defined keys
          never read, and keys read but not defined.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import re

def config_debt(source, defined):
    return [], []
`,
        solution: `import re

def config_debt(source, defined):
    pattern = r"""\\bcfg(?:\\[|\\.get\\()\\s*['"](\\w+)['"]"""
    read = set(re.findall(pattern, source))
    return sorted(set(defined) - read), sorted(read - set(defined))
`,
        tests: [
          { name: "script", code: `src = '''
lr = cfg['lr']
if cfg.get("warmup"):
    lr *= min(1, step / cfg["warmup"])
if cfg.get('decay', False):
    lr *= 0.5
batch = cfg['batch_size']
# cfg['old_flag'] is no longer used
'''
unused, undefined = config_debt(src, {'lr', 'warmup', 'decay', 'batch', 'use_old_loss'})
assert unused == ['batch', 'use_old_loss'], unused
assert undefined == ['batch_size', 'old_flag'], undefined` },
          { name: "edge cases", code: `assert config_debt('', {'a'}) == (['a'], [])
assert config_debt("x = cfg[ 'a' ] + mycfg['b'] + cfg.get( 'c')", set()) == ([], ['a', 'c']), 'mycfg is a different variable.'
assert config_debt("x = cfg.lr + other['d']", {'lr'}) == (['lr'], [])` },
        ],
      },
    },
    {
      key: "count",
      rung: "prove",
      prompt: (
        <p>
          Show that k boolean flags give <M>{"2^k"}</M> configurations, that testing the default and each flag alone covers a
          fraction <M>{"(k + 1)/2^k"}</M> that tends to 0, and that for k ≥ 2 any set of runs covering all pairs of flag values
          has at least 4 runs.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Counts configurations with the product rule: two choices for each of k flags.",
          "Notes that the default and the k single-flag runs are k + 1 distinct configurations, and that (k + 1)/2^k tends to 0 because 2^k grows faster than k.",
          "For the lower bound, fixes two flags and notes that their four value combinations must each appear, and one run shows only one combination, so at least 4 runs are needed.",
        ],
      },
    },
    {
      key: "frac",
      rung: "stretch",
      prompt: <p>With 10 flags, what fraction of configurations do the default plus single-flag runs cover? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0107, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how research code and production code differ in purpose, and which parts of research code still deserve careful engineering.",

  glimpse: (
    <p>
      The cure for most research-code debt is good boundaries between parts. Next, modularity: splitting a training program
      into pieces with small, clear interfaces, so that each can be tested and replaced on its own.
    </p>
  ),
};
