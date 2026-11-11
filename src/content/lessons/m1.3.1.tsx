import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { OddSumViz } from "@/components/viz/OddSumViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.3.1",
  minutes: 65,
  links: {
    revisits: ["m0.2.1", "m1.1.4"],
    foreshadows: ["m4.4.1"],
  },

  puzzle: (
    <>
      <p>Add some pairs of odd numbers: 3 + 5, 7 + 11, 13 + 21, 99 + 1.</p>
      <p>
        Every answer is even. You could check a million more pairs and they would all come out even. But checking is not
        proving, as the polynomial <M>{"n^2 + n + 41"}</M> taught you. How could you be <em>certain</em> that the sum of any
        two odd numbers, including ones nobody will ever write down, is even?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Think of an odd number as a collection of pairs with one left over. Two odd numbers bring two leftovers, and the two
        leftovers make a pair. Nothing is left over, so the sum is even. Try it below with different numbers.
      </p>
      <OddSumViz />
      <p>
        That picture is already a proof, because it does not depend on which odd numbers you picked. The algebra below says
        the same thing in a form that can be checked line by line: write each odd number as <M>{"2k + 1"}</M>, add, and
        regroup.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="even, odd, divides">
        <p>An integer n is <strong>even</strong> if <M>{"n = 2k"}</M> for some integer k, and <strong>odd</strong> if <M>{"n = 2k + 1"}</M> for some integer k.</p>
        <p>
          For integers a and b, <strong>a divides b</strong>, written <M>{"a \\mid b"}</M>, if <M>{"b = ak"}</M> for some
          integer k. So 3 divides 12 because <M>{"12 = 3 \\cdot 4"}</M>.
        </p>
      </Definition>

      <Definition title="direct proof">
        <p>
          To prove <M>{"P \\to Q"}</M> <strong>directly</strong>, assume P and reach Q by a chain of steps, each justified
          by a definition, an earlier result or a rule of algebra. To prove{" "}
          <M>{"\\forall x\\,(P(x) \\to Q(x))"}</M>, take an <em>arbitrary</em> x, assume P(x), and reach Q(x).
        </p>
      </Definition>

      <Theorem title="sum of two odd numbers">
        <p>If m and n are odd, then m + n is even.</p>
      </Theorem>
      <Proof>
        <p>
          Let m and n be odd. By definition there are integers j and k with <M>{"m = 2j + 1"}</M> and <M>{"n = 2k + 1"}</M>.
          Then
        </p>
        <MD>{"m + n = 2j + 1 + 2k + 1 = 2(j + k + 1)."}</MD>
        <p>Since j + k + 1 is an integer, m + n is even.</p>
      </Proof>

      <Remark title="unpack, compute, repack">
        <p>
          Most first proofs have the same shape. <strong>Unpack</strong> the hypothesis into its definition (odd means{" "}
          <M>{"2k + 1"}</M>). <strong>Compute</strong> with what you now have. <strong>Repack</strong> the result into the
          definition of the conclusion (even means 2 times an integer). Before starting, write down what you have and what
          you want, both in unpacked form; the gap between them is the proof.
        </p>
        <p>
          Two small points matter. Use <em>different</em> letters for different numbers: writing <M>{"m = 2k + 1"}</M> and{" "}
          <M>{"n = 2k + 1"}</M> would secretly assume m = n. And say why the final bracket is an integer, since that is what
          the definition asks for.
        </p>
      </Remark>

      <Theorem title="divisibility is transitive">
        <p>For integers a, b, c: if <M>{"a \\mid b"}</M> and <M>{"b \\mid c"}</M>, then <M>{"a \\mid c"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Suppose <M>{"a \\mid b"}</M> and <M>{"b \\mid c"}</M>. Then <M>{"b = aj"}</M> and <M>{"c = bk"}</M> for some integers j
          and k. Substituting, <M>{"c = (aj)k = a(jk)"}</M>, and jk is an integer, so <M>{"a \\mid c"}</M>.
        </p>
      </Proof>

      <Example title="a proof about squares">
        <p>
          Claim: if n is odd then <M>{"n^2"}</M> is odd. Unpack: <M>{"n = 2k + 1"}</M>. Compute:{" "}
          <M>{"n^2 = 4k^2 + 4k + 1"}</M>. Repack: <M>{"n^2 = 2(2k^2 + 2k) + 1"}</M>, and <M>{"2k^2 + 2k"}</M> is an integer,
          so <M>{"n^2"}</M> is odd.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "odd-def",
      rung: "check",
      prompt: <p>Which shows that 23 is odd according to the definition?</p>,
      answer: { kind: "choice", options: ["23 = 2 · 11 + 1", "23 = 2 · 11.5", "23 is not divisible by 3", "23 is prime"], correct: [0] },
    },
    {
      key: "divides",
      rung: "check",
      prompt: <p>Which of these are true?</p>,
      answer: { kind: "choice", options: ["4 | 20", "20 | 4", "7 | 0", "0 | 7"], correct: [0, 2] },
    },
    {
      key: "repack",
      rung: "apply",
      prompt: (
        <p>
          If <M>{"n = 2k + 1"}</M>, then <M>{"n^2 = 2m + 1"}</M> for a certain integer m. Write m in terms of k.
        </p>
      ),
      answer: { kind: "expression", value: "2*k^2 + 2*k", variables: ["k"] },
    },
    {
      key: "product",
      rung: "apply",
      prompt: (
        <p>
          With <M>{"m = 2j + 1"}</M> and <M>{"n = 2k + 1"}</M>, the product mn equals <M>{"2q + 1"}</M>. Write q in terms of
          j and k.
        </p>
      ),
      answer: { kind: "expression", value: "2*j*k + j + k", variables: ["j", "k"] },
    },
    {
      key: "letters",
      rung: "apply",
      prompt: (
        <p>
          A student writes: &ldquo;Let m and n be odd, so m = 2k + 1 and n = 2k + 1. Then m + n = 4k + 2 = 2(2k + 1), which is
          even.&rdquo; What is wrong?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Nothing: the proof is correct.",
          "Using the same k for both numbers assumes m = n, so only that special case is proved.",
          "4k + 2 is not even.",
          "Odd numbers cannot be written as 2k + 1.",
        ],
        correct: [1],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`bad = [(a, b) for a in range(-20, 21) for b in range(-20, 21) if a % 3 == 0 and b % 3 == 0 and (a * b + a + b) % 3 != 0]
print(len(bad), (7 * 3) % 9, (6 * 9 + 6 + 9) % 3)`}</Code>
          <p>A direct proof claims: if 3 | a and 3 | b then 3 | ab + a + b. The code hunts for counterexamples. What does it print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0 3 0", "1 3 0", "0 0 0", "0 3 1"], correct: [0] },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            A direct proof that the sum of two rationals is rational computes the witness: a/b + c/d = (ad + bc)/(bd). Write <C>add_witness(a, b, c, d)</C>, which returns that witness pair in lowest terms with a positive denominator, without using <C>fractions</C>. Then write <C>mean_between(a, b, c, d)</C>, the witness (p, q) in lowest terms for the claim that between two rationals a/b &lt; c/d there is a third, namely their average.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def add_witness(a, b, c, d):
    return (a + c, b + d)

def mean_between(a, b, c, d):
    return (a + c, b + d)
`,
        solution: `from math import gcd

def reduce(p, q):
    if q < 0:
        p, q = -p, -q
    g = gcd(p, q)
    return (p // g, q // g)

def add_witness(a, b, c, d):
    return reduce(a * d + b * c, b * d)

def mean_between(a, b, c, d):
    p, q = add_witness(a, b, c, d)
    return reduce(p, 2 * q)
`,
        tests: [
          { name: "add", code: `assert add_witness(1, 2, 1, 3) == (5, 6) and add_witness(1, 6, 1, 3) == (1, 2) and add_witness(1, 2, -1, 2) == (0, 1), 'Reduce by the gcd.'` },
          { name: "signs", code: `assert add_witness(1, -3, 1, 6) == (-1, 6) and add_witness(-1, -2, -1, -2) == (1, 1), 'Keep the denominator positive.'` },
          { name: "between", code: `from fractions import Fraction
for a, b, c, d in [(1, 3, 1, 2), (-5, 7, 2, 9), (0, 1, 1, 1000)]:
    p, q = mean_between(a, b, c, d)
    assert Fraction(a, b) < Fraction(p, q) < Fraction(c, d) and q > 0 and Fraction(p, q).denominator == q, (a, b, c, d)` },
          { name: "no fractions", code: `import inspect
assert 'Fraction' not in inspect.getsource(add_witness) and 'fractions' not in inspect.getsource(mean_between), 'Work with the integers.'` },
        ],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`print(all((m * m) % 2 == 1 for m in range(1, 100, 2)))`}</Code>
          <p>This checks that the square of every odd number below 100 is odd. A check is not a proof. What does it print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            A direct proof shows (2k + 1)² = 2(2k² + 2k) + 1. Write <C>odd_square_witness(k)</C>, which returns the j with (2k + 1)² = 2j + 1, from the proof&rsquo;s formula, not by dividing.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def odd_square_witness(k):
    return k
`,
        solution: `def odd_square_witness(k):
    return 2 * k * k + 2 * k
`,
        tests: [
          { name: "matches", code: `assert all((2 * k + 1) ** 2 == 2 * odd_square_witness(k) + 1 for k in range(-50, 50)), 'Expand (2k + 1)² and read off j.'` },
          { name: "values", code: `assert [odd_square_witness(k) for k in range(4)] == [0, 4, 12, 24] and odd_square_witness(-1) == 0, '1 = 2·0 + 1, 9 = 2·4 + 1, 25 = 2·12 + 1.'` },
          { name: "no division", code: `import inspect
src = inspect.getsource(odd_square_witness)
assert '/' not in src and '%' not in src, 'Use the formula from the proof, not division.'` },
        ],
      },
    },
    {
      key: "even-odd",
      rung: "prove",
      prompt: <p>Prove that if m is even and n is odd, then m + n is odd.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Unpacks the hypotheses with different letters, such as m = 2j and n = 2k + 1.",
          "Computes m + n = 2(j + k) + 1.",
          "Notes that j + k is an integer and concludes m + n is odd.",
        ],
      },
    },
    {
      key: "three-consecutive",
      rung: "stretch",
      prompt: (
        <p>
          The sum of any three consecutive integers n, n + 1, n + 2 is divisible by a fixed whole number greater than 1, for
          every n. What is the largest such number?
        </p>
      ),
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend how to prove that the sum of two odd numbers is even, and why checking a million examples would not have been enough.",

  glimpse: (
    <p>
      Some statements resist a direct attack: assuming the hypothesis gives you nothing useful to compute with. The next lesson shows the first way round this, proving the contrapositive instead. Divisibility, unpacked exactly as here, is the starting point of number theory in Discrete Mathematics, where it underlies modular arithmetic and hashing.
    </p>
  ),
};
