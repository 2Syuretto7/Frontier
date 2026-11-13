import { Definition, Example, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MutantViz } from "@/components/viz/MutantViz";
import type { LessonContent } from "@/lib/types";

const CLIP = `def clip(x, lo, hi):
    return max(lo, min(x, hi))
`;

export const lesson: LessonContent = {
  id: "e4.1.1",
  minutes: 55,
  links: {
    requires: ["e1.4.1"],
    revisits: ["e0.5.3", "e1.3.2"],
    foreshadows: ["e4.1.2", "e4.1.3", "e4.6.2"],
  },

  puzzle: (
    <>
      <p>
        You rewrite the function that normalises your dataset so that it runs ten times faster. You run it once in a notebook,
        glance at the first few numbers, and they look about right. A week later every experiment you have run since then
        turns out to be wrong, because the new version mishandled columns whose values were all equal.
      </p>
      <p>
        What would have caught the bug the moment you made it, and how would you know that your check was good enough?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <strong>test</strong> is a small program that runs your code on a case whose answer you already know and complains
        if the answer is different. Tests run in seconds, so you can run all of them after every change, and a bug you
        introduce today is caught today rather than a week later.
      </p>
      <p>
        But a test only catches the bugs it was designed to catch. One way to judge a set of tests is to break the code on
        purpose and see whether the tests notice. Below, <C>clip(x, lo, hi)</C> should return x limited to the range lo to hi.
        Each line under the tests is a plausible wrong version, called a <strong>mutant</strong>. Switch tests on and off and
        watch which mutants survive.
      </p>
      <MutantViz />
      <p>
        One ordinary case catches only the grossest bugs. The mutants that survive longest are wrong only at the edges: below
        the range, above it, and exactly on its boundary. Those are the cases good tests are made of.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="unit test">
        <p>
          A <strong>unit test</strong> checks one small piece of code, usually one function, on one case. It has three parts,
          often called <strong>arrange, act, assert</strong>: set up the inputs, call the code, and check the result. A test
          passes when it runs to the end, and fails when an assertion is false or an unexpected exception escapes.
        </p>
      </Definition>

      <Definition title="pytest">
        <p>
          <C>pytest</C> is the standard Python test runner. Run <C>pytest</C> in a project folder and it collects every file
          named <C>test_*.py</C> or <C>*_test.py</C>, runs every function in them whose name starts with <C>test</C>, and
          reports which passed. Tests use the plain <C>assert</C> statement; when one fails, pytest rewrites the message to show
          the values on both sides.
        </p>
        <Code>{`# test_stats.py
import pytest
from stats import mean

def test_mean_of_two():
    assert mean([2, 4]) == 3

def test_empty_list_is_an_error():
    with pytest.raises(ValueError):
        mean([])

@pytest.mark.parametrize("xs, want", [([1], 1), ([1, 2, 3], 2), ([-1, 1], 0)])
def test_mean_cases(xs, want):
    assert mean(xs) == want`}</Code>
        <p>
          <C>pytest.raises</C> passes only if the block raises the given exception. <C>parametrize</C> runs one test function
          once per case and reports each case separately. A <strong>fixture</strong> is an argument pytest supplies: for
          example a test that asks for <C>tmp_path</C> receives a fresh temporary folder, so it can write files without
          touching yours.
        </p>
      </Definition>

      <Example title="choosing the cases">
        <p>
          For <C>mean</C>, good cases are a typical list, a single item, negative numbers, and the empty list, which should
          raise an error rather than divide by zero. For any function, look for the <strong>boundaries</strong> in its input:
          empty and full, zero and one, the edges of a range, the first and last item. Bugs cluster there, because that is where
          a <C>&lt;</C> should have been <C>&lt;=</C>.
        </p>
      </Example>

      <Proposition title="tests show the presence of bugs, not their absence">
        <p>
          If a function f is tested on finitely many inputs and its domain is infinite, then some incorrect function passes
          every one of those tests.
        </p>
      </Proposition>
      <p>
        Change f at any input that no test uses: the changed function is wrong but agrees with f wherever it is tested. So no
        finite suite proves correctness. What a suite can do is rule out the bugs people actually make, which is why the mutants
        above are a fair measure. Tools such as <C>mutmut</C> generate mutants automatically and report the ones your suite
        lets through.
      </p>

      <Definition title="regression tests and test-driven development">
        <p>
          When you find a bug, first write a test that fails because of it, then fix the code. That <strong>regression
          test</strong> stays in the suite for ever, so the same bug cannot come back unnoticed. Kent Beck&rsquo;s{" "}
          <strong>test-driven development</strong> turns this into a habit: write a failing test (red), write the least code
          that passes it (green), then tidy the code while the tests stay green (refactor).
        </p>
      </Definition>

      <Remark title="tests in research code">
        <p>
          Research code changes daily and a wrong answer rarely crashes: it just produces a slightly worse number, which looks
          like a failed idea. Small tests on the pieces that are easy to get subtly wrong, such as masking, normalisation, loss
          functions and data splits, pay for themselves the first time they stop you discarding a good idea because of a bug.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "collect",
      rung: "check",
      prompt: <p>Running <C>pytest</C> in a folder, which of these functions does it run as tests?</p>,
      answer: {
        kind: "choice",
        options: [
          "test_split in the file test_data.py",
          "check_split in the file test_data.py",
          "test_split in the file data.py",
          "testSplit in the file data_test.py",
        ],
        correct: [0, 3],
      },
    },
    {
      key: "killed",
      rung: "apply",
      prompt: (
        <p>
          In the visualisation, keep only the tests <C>clip(5, 0, 10) == 5</C> and <C>clip(12, 0, 10) == 10</C>. How many of
          the five mutants do they catch?
        </p>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "needed",
      rung: "apply",
      prompt: <p>What is the smallest number of the four tests in the visualisation that together catch all five mutants?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def mean(xs):
    return sum(xs) / len(xs)

def test_mean():
    assert mean([2, 4]) == 3

def test_empty():
    assert mean([]) == 0

def test_float():
    assert mean([0.1, 0.2]) == 0.15

results = {}
for name, f in sorted(globals().items()):
    if name.startswith("test_"):
        try:
            f()
            results[name] = "pass"
        except AssertionError:
            results[name] = "fail"
        except Exception as e:
            results[name] = type(e).__name__
print(results)`}</Code>
          <p>A test runner in miniature: it finds the test functions and records what each one did. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'test_empty': 'ZeroDivisionError', 'test_float': 'fail', 'test_mean': 'pass'}",
          "{'test_empty': 'fail', 'test_float': 'pass', 'test_mean': 'pass'}",
          "{'test_empty': 'ZeroDivisionError', 'test_float': 'pass', 'test_mean': 'pass'}",
          "{'test_mean': 'pass', 'test_empty': 'fail', 'test_float': 'fail'}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def absolute(x):
    return x if x > 0 else -x

cases = [(0, 0), (1, 1), (-2, 2), (3, -3), (-4, 4)]
fails = [(x, want) for x, want in cases if absolute(x) != want]
print(len(fails), fails)`}</Code>
          <p>A parametrised test, written as a list of (input, expected) pairs. What does this print, and whose mistake is it?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1 [(3, -3)]", "0 []", "2 [(0, 0), (3, -3)]", "1 [(0, 0)]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            The starter gives a correct <C>clip(x, lo, hi)</C>. Write <C>test_clip()</C>, a test that passes for it. The checks
            will then swap in five wrong versions of <C>clip</C>, each wrong on a different kind of input, and your test must
            fail (raise <C>AssertionError</C>) for every one of them. Think about values below, inside, above and exactly on the
            edges of the range.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `${CLIP}
def test_clip():
    pass
`,
        solution: `${CLIP}
def test_clip():
    assert clip(5, 0, 10) == 5
    assert clip(-3, 0, 10) == 0
    assert clip(12, 0, 10) == 10
    assert clip(0, 0, 10) == 0
    assert clip(10, 0, 10) == 10
`,
        tests: [
          { name: "passes on correct code", code: `test_clip()` },
          {
            name: "catches every mutant",
            code: `good = clip
mutants = {
    'no lower bound': lambda x, lo, hi: min(x, hi),
    'no upper bound': lambda x, lo, hi: max(x, lo),
    'ignores x inside the range': lambda x, lo, hi: lo if x < lo else hi,
    'wrong at the top edge': lambda x, lo, hi: hi - 1 if x == hi else max(lo, min(x, hi)),
    'wrong at the bottom edge': lambda x, lo, hi: lo + 1 if x == lo else max(lo, min(x, hi)),
}
try:
    for name, bad in mutants.items():
        clip = bad
        try:
            test_clip()
        except AssertionError:
            continue
        assert False, f'Your test passes for a clip that is {name}. Add a case that exposes it.'
finally:
    clip = good`,
          },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write the heart of a test runner. <C>run_tests(namespace)</C> takes a dict of names to values (such as{" "}
            <C>globals()</C>), calls every callable whose name starts with <C>test</C>, in alphabetical order of name, and returns
            a dict from each such name to <C>&quot;pass&quot;</C>, <C>&quot;fail&quot;</C> (it raised{" "}
            <C>AssertionError</C>) or <C>&quot;error&quot;</C> (it raised any other exception). Then write{" "}
            <C>summary(results)</C>, a string such as <C>&quot;3 passed, 1 failed, 0 errors&quot;</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def run_tests(namespace):
    return {}

def summary(results):
    return ""
`,
        solution: `def run_tests(namespace):
    results = {}
    for name in sorted(namespace):
        f = namespace[name]
        if not name.startswith('test') or not callable(f):
            continue
        try:
            f()
            results[name] = 'pass'
        except AssertionError:
            results[name] = 'fail'
        except Exception:
            results[name] = 'error'
    return results

def summary(results):
    counts = [list(results.values()).count(k) for k in ('pass', 'fail', 'error')]
    return f'{counts[0]} passed, {counts[1]} failed, {counts[2]} errors'
`,
        tests: [
          {
            name: "runs and classifies",
            code: `order = []
def t_ok():
    order.append('ok')
def t_bad():
    order.append('bad')
    assert 1 == 2
def t_err():
    order.append('err')
    return 1 / 0
ns = {'test_ok': t_ok, 'test_bad': t_bad, 'test_err': t_err, 'helper': t_ok, 'test_value': 3}
r = run_tests(ns)
assert r == {'test_bad': 'fail', 'test_err': 'error', 'test_ok': 'pass'}, 'Only callables named test..., each classified.'
assert order == ['bad', 'err', 'ok'], 'Run them in alphabetical order of name.'`,
          },
          { name: "summary", code: `assert summary({'a': 'pass', 'b': 'pass', 'c': 'fail'}) == '2 passed, 1 failed, 0 errors' and summary({}) == '0 passed, 0 failed, 0 errors'` },
        ],
      },
    },
    {
      key: "absence",
      rung: "prove",
      prompt: (
        <p>
          Prove that for any function f from the integers to the integers and any finite set of test inputs T, there is a
          function g with g ≠ f that agrees with f on every input in T. What does this say about what a passing test suite
          proves?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Since T is finite and the integers are infinite, there is an integer n not in T.",
          "Defines g(x) = f(x) for x ≠ n and g(n) = f(n) + 1 (or any other value different from f(n)).",
          "Checks that g agrees with f on all of T, because n is not in T, and that g ≠ f, because they differ at n.",
          "Concludes that passing tests cannot prove correctness on an infinite domain; they only rule out the bugs the chosen cases would reveal.",
        ],
      },
    },
    {
      key: "pairs",
      rung: "stretch",
      prompt: (
        <p>
          A function takes three switches, each on or off, and you want every pair of switches to be tested in all four
          on/off combinations. Testing all 8 settings certainly does this. What is the smallest number of settings that does?
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
  ],

  teachBack:
    "Explain to a friend what a unit test is, how pytest finds and runs tests, and why deliberately breaking your code is a good way to judge your tests.",

  glimpse: (
    <p>
      Choosing cases by hand misses the ones you never thought of. Next, property-based testing: describe what must always be
      true, and let the computer search for an input that breaks it.
    </p>
  ),
};
