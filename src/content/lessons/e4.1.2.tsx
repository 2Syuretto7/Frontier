import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShrinkViz } from "@/components/viz/ShrinkViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.1.2",
  minutes: 55,
  links: {
    requires: ["e4.1.1"],
    revisits: ["e1.3.4"],
    foreshadows: ["e4.2.2", "e4.1.4"],
  },

  puzzle: (
    <>
      <p>
        You wrote five careful tests for your tokeniser and they all pass. A user then feeds it a string containing an emoji
        followed by a space at the very end, and it crashes. You never thought of that case, so you never tested it.
      </p>
      <p>Is there a way to test for the cases you have not thought of?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Instead of listing inputs and their answers, state something that must be true for <em>every</em> input, such as
        &ldquo;sorting gives the same items in order&rdquo; or &ldquo;decoding what you encoded gives back the original&rdquo;.
        Then let the computer try hundreds of random inputs. When one breaks the rule, it simplifies that input step by step,
        keeping it failing, until it is as small as possible.
      </p>
      <ShrinkViz />
      <p>
        The random failing list is long and confusing. The shrunk one has just two equal numbers, which tells you exactly what
        the bug is: the function loses duplicates.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="property-based test">
        <p>
          A <strong>property</strong> is a statement about a function that should hold for all valid inputs. A{" "}
          <strong>property-based test</strong> generates many random inputs, checks the property on each, and reports a
          counterexample if one fails. In Python the library <C>hypothesis</C> does this:
        </p>
        <Code>{`from hypothesis import given, strategies as st

@given(st.lists(st.integers()))
def test_sort(xs):
    out = my_sort(xs)
    assert all(a <= b for a, b in zip(out, out[1:]))   # ordered
    assert sorted(out) == sorted(xs)                     # same items`}</Code>
      </Definition>

      <Example title="properties that are easy to state">
        <ul>
          <li>
            <strong>Round trip:</strong> <C>decode(encode(x)) == x</C>, for serialisation, compression, tokenisers and
            configuration files.
          </li>
          <li>
            <strong>Invariant:</strong> something the output always satisfies, such as probabilities summing to 1 or a mask
            hiding every future position.
          </li>
          <li>
            <strong>Oracle:</strong> agree with a slow, obviously correct reference, such as a fused attention kernel against
            the three-line version.
          </li>
          <li>
            <strong>Metamorphic:</strong> how the output must change when the input changes, such as shuffling the rows of a
            batch shuffling the per-example losses the same way.
          </li>
        </ul>
      </Example>

      <Definition title="shrinking">
        <p>
          When a generated input fails, the tool tries simpler versions of it, such as removing an item or moving a number
          towards zero, and keeps any that still fail. It repeats until no simpler version fails. The result is a{" "}
          <strong>minimal</strong> counterexample in the sense that every single simplification of it passes.
        </p>
      </Definition>

      <Theorem title="how many random tests">
        <p>
          Suppose each random input independently triggers a bug with probability <M>p</M>. Then <M>n</M> inputs all miss it
          with probability <M>{"(1 - p)^n \\le e^{-pn}"}</M>, so
        </p>
        <MD>{"n \\ge \\frac{\\ln(1/\\delta)}{p}"}</MD>
        <p>inputs are enough to find the bug with probability at least <M>{"1 - \\delta"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          The inputs are independent, so the probability that all <M>n</M> miss is the product <M>{"(1 - p)^n"}</M>. Since{" "}
          <M>{"1 - p \\le e^{-p}"}</M> for all real <M>p</M> (the line <M>{"1 - p"}</M> is tangent to the convex curve{" "}
          <M>{"e^{-p}"}</M> at 0), the product is at most <M>{"e^{-pn}"}</M>. If <M>{"n \\ge \\ln(1/\\delta)/p"}</M> then{" "}
          <M>{"e^{-pn} \\le \\delta"}</M>.
        </p>
      </Proof>
      <p>
        So a bug triggered by one input in a hundred is found with 95% probability after about 300 tries, but a bug triggered
        by one in a million needs millions. Property tests find bugs in the common shapes of input; the rare corners still need
        a generator that produces them often, which is why <C>hypothesis</C> deliberately favours empty lists, zeros, huge
        numbers and repeated values.
      </p>

      <Remark title="seeds">
        <p>
          A random test that fails once and then passes is worse than useless unless you can replay it. Test tools record the
          seed, or the failing input itself, so the failure can be reproduced exactly and turned into an ordinary regression
          test.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "which",
      rung: "check",
      prompt: <p>Which of these are properties that every correct sorting function satisfies, for every input list?</p>,
      answer: {
        kind: "choice",
        options: [
          "The output has the same length as the input",
          "Each item of the output is at most the next",
          "The output contains no repeated items",
          "Sorting the output again changes nothing",
        ],
        correct: [0, 1, 3],
      },
    },
    {
      key: "tries",
      rung: "apply",
      prompt: (
        <p>
          A bug is triggered by one random input in a thousand. What is the smallest number of independent random inputs that
          gives at least a 99% chance of triggering it at least once? Use the exact probability <M>{"(1 - p)^n"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 4603 },
    },
    {
      key: "minimal",
      rung: "apply",
      prompt: <p>For the buggy sort in the visualisation, what do all minimal failing inputs have in common?</p>,
      answer: {
        kind: "choice",
        options: ["They contain exactly two items, which are equal", "They are empty", "They contain a negative number", "They are already sorted"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def encode(s):
    out = []
    for ch in s:
        if out and out[-1][0] == ch:
            out[-1][1] += 1
        else:
            out.append([ch, 1])
    return "".join(f"{c}{n}" for c, n in out)

def decode(t):
    return "".join(t[i] * int(t[i + 1]) for i in range(0, len(t) - 1, 2))

bad = [s for s in ["", "a", "aab", "abc", "a" * 12, "zz1"] if decode(encode(s)) != s]
print([len(s) for s in bad], encode("aab"))`}</Code>
          <p>A round-trip property for run-length encoding, checked on six strings. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[12] a2b1", "[] a2b1", "[12, 3] a2b1", "[12] aab"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def fails(xs):
    return len(xs) != len(set(xs))

xs = [7, 3, 9, 3, 5]
changed = True
while changed:
    changed = False
    for i in range(len(xs)):
        smaller = xs[:i] + xs[i + 1:]
        if fails(smaller):
            xs, changed = smaller, True
            break
print(xs)`}</Code>
          <p>Shrinking by removing one item at a time while the input still fails. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[3, 3]", "[3]", "[7, 3, 3]", "[3, 9, 3]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a property checker. <C>gen_list(rng, max_len, lo, hi)</C> returns a random list: its length is{" "}
            <C>rng.randint(0, max_len)</C>, then each item is <C>rng.randint(lo, hi)</C>, drawn in order.{" "}
            <C>check_property(prop, gen, n, seed)</C> makes one <C>random.Random(seed)</C>, calls <C>gen(rng)</C> up to n times,
            and returns the first input for which <C>prop</C> returns False, or <C>None</C> if all pass.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import random

def gen_list(rng, max_len, lo, hi):
    return []

def check_property(prop, gen, n, seed):
    return None
`,
        solution: `import random

def gen_list(rng, max_len, lo, hi):
    n = rng.randint(0, max_len)
    return [rng.randint(lo, hi) for _ in range(n)]

def check_property(prop, gen, n, seed):
    rng = random.Random(seed)
    for _ in range(n):
        x = gen(rng)
        if not prop(x):
            return x
    return None
`,
        tests: [
          { name: "generator", code: `import random
r1, r2 = random.Random(3), random.Random(3)
for _ in range(20):
    n = r2.randint(0, 6)
    assert gen_list(r1, 6, -5, 5) == [r2.randint(-5, 5) for _ in range(n)], 'Draw the length first, then each item in order.'` },
          { name: "finds the bug", code: `def my_sort(xs):
    return sorted(set(xs))
def prop(xs):
    return my_sort(xs) == sorted(xs)
gen = lambda rng: gen_list(rng, 8, 0, 9)
x = check_property(prop, gen, 200, 1)
assert x is not None and len(set(x)) < len(x), 'Return a failing input: one with a repeated item.'
assert check_property(lambda xs: sorted(sorted(xs)) == sorted(xs), gen, 200, 1) is None, 'A true property gives None.'` },
          { name: "first failure", code: `seen = []
def prop(x):
    seen.append(x)
    return x < 7
import random
r = random.Random(5)
want = None
for _ in range(100):
    v = r.randint(0, 9)
    if v >= 7:
        want = v
        break
assert check_property(prop, lambda rng: rng.randint(0, 9), 100, 5) == want and seen[-1] == want, 'Stop at the first failure.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>shrink(xs, fails)</C> for a list of integers that fails. Repeatedly build the candidates in this order:
            first xs with item i removed, for each i; then, for each i with a non-zero item x, xs with x replaced by{" "}
            <C>int(x / 2)</C> and then by x moved one step towards zero. Move to the first candidate that still fails and
            start again. When no candidate fails, return xs.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def shrink(xs, fails):
    return xs
`,
        solution: `def shrink(xs, fails):
    xs = list(xs)
    while True:
        cands = [xs[:i] + xs[i + 1:] for i in range(len(xs))]
        for i, x in enumerate(xs):
            if x != 0:
                step = 1 if x > 0 else -1
                for y in (int(x / 2), x - step):
                    cands.append(xs[:i] + [y] + xs[i + 1:])
        for c in cands:
            if fails(c):
                xs = c
                break
        else:
            return xs
`,
        tests: [
          { name: "duplicates", code: `assert shrink([7, 3, 9, 3, 5], lambda xs: len(xs) != len(set(xs))) == [3, 3], 'Removing items alone gets to [3, 3].'` },
          { name: "values", code: `assert shrink([7, 3, 9, 3, 5], lambda xs: any(x >= 5 for x in xs)) == [5], 'Halve, then step towards zero.'
assert shrink([-8, 40], lambda xs: sum(xs) <= -3) == [-3] and shrink([7, 3, 9, 3, 5], lambda xs: sum(xs) >= 10) == [5, 5]` },
          { name: "minimal", code: `import random
rng = random.Random(4)
for _ in range(30):
    xs = [rng.randint(-20, 20) for _ in range(rng.randint(1, 8))]
    f = lambda v: sum(abs(t) for t in v) >= 15
    if not f(xs):
        continue
    out = shrink(xs, f)
    assert f(out), 'The result must still fail.'
    for i in range(len(out)):
        assert not f(out[:i] + out[i + 1:]), 'No single removal may still fail.'` },
        ],
      },
    },
    {
      key: "bound",
      rung: "prove",
      prompt: (
        <p>
          Prove that if each of n independent random inputs triggers a bug with probability p, and{" "}
          <M>{"n \\ge \\ln(1/\\delta)/p"}</M>, then the probability that none of them triggers it is at most δ.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "By independence, the probability that all n inputs miss is (1 − p)^n.",
          "Uses 1 − p ≤ e^(−p), with a reason (for example convexity of e^(−p), or the tangent line at 0).",
          "Concludes (1 − p)^n ≤ e^(−pn), since both sides are non-negative and raising to the n-th power preserves the inequality.",
          "Shows e^(−pn) ≤ δ when n ≥ ln(1/δ)/p, since then pn ≥ ln(1/δ).",
        ],
      },
    },
    {
      key: "dups",
      rung: "stretch",
      prompt: (
        <p>
          A generator makes lists of exactly 5 items, each uniform on 0 to 9 independently. What is the probability that a list
          has a repeated item, and so exposes the buggy sort? Give it to four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6976, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a property-based test is, give two kinds of property you could check, and explain why shrinking the failing input matters.",

  glimpse: (
    <p>
      Many properties of numerical code are only true approximately: floating-point arithmetic rounds. Next, testing
      numerical code with tolerances, and checking a gradient against a finite difference.
    </p>
  ),
};
