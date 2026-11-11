import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { DiagonalViz } from "@/components/viz/DiagonalViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.8.3",
  minutes: 70,
  links: {
    revisits: ["m1.4.5", "m1.3.3"],
    foreshadows: ["m8.1.3"],
  },

  puzzle: (
    <>
      <p>
        The hotel of the last lesson could take in any countable crowd. So try to list every infinite sequence of zeros and
        ones, such as <M>{"0101010\\ldots"}</M> or <M>{"1101000\\ldots"}</M>, one per room. Infinitely many rooms; surely
        enough?
      </p>
      <p>
        Suppose someone hands you a list and claims it is complete. Can you, without checking the rooms one by one forever,
        prove that some sequence is missing?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Georg Cantor found a way in 1891. Build a new sequence d one digit at a time: make its first digit differ from the
        first digit of the first sequence, its second digit differ from the second digit of the second sequence, and so on
        down the diagonal. Then d differs from every sequence in the list somewhere, so it is not in the list.
      </p>
      <p>
        Try to defeat the argument below. Change any digits you like; d changes with them and still escapes.
      </p>
      <DiagonalViz />
    </>
  ),

  theory: (
    <>
      <Definition title="uncountable">
        <p>A set is <strong>uncountable</strong> if it is not countable.</p>
      </Definition>

      <Theorem title="Cantor, 1891">
        <p>The set <M>{"\\{0, 1\\}^{\\mathbb{N}}"}</M> of all infinite sequences of zeros and ones is uncountable.</p>
      </Theorem>
      <Proof>
        <p>
          It is infinite, so suppose for contradiction that <M>{"s_0, s_1, s_2, \\dots"}</M> lists it, and write{" "}
          <M>{"s_i(j)"}</M> for the j-th digit of <M>{"s_i"}</M>. Define a sequence d by
        </p>
        <MD>{"d(j) = 1 - s_j(j)."}</MD>
        <p>
          Then d is a sequence of zeros and ones, so <M>{"d = s_k"}</M> for some k. But{" "}
          <M>{"d(k) = 1 - s_k(k) \\ne s_k(k)"}</M>, a contradiction.
        </p>
      </Proof>

      <Theorem title="the real numbers are uncountable">
        <p>The interval <M>{"(0, 1)"}</M>, and hence <M>{"\\mathbb{R}"}</M>, is uncountable.</p>
      </Theorem>
      <Proof>
        <p>
          Send each sequence s of zeros and ones to the real number with decimal digits{" "}
          <M>{"0.d_0 d_1 d_2 \\ldots"}</M>, where <M>{"d_j = 5"}</M> if <M>{"s(j) = 0"}</M> and <M>{"d_j = 6"}</M> if{" "}
          <M>{"s(j) = 1"}</M>. Decimals using only the digits 5 and 6 have no second decimal form (the trouble with{" "}
          <M>{"0.1999\\ldots = 0.2"}</M> needs a 9 or a 0), so different sequences give different numbers: this is an injection
          into <M>{"(0, 1)"}</M>. If <M>{"(0, 1)"}</M> were countable, its subset, the image of this injection, would be
          countable, and so would the set of sequences. That contradicts Cantor&rsquo;s theorem.
        </p>
      </Proof>

      <Theorem title="Cantor's theorem">
        <p>For every set A, there is no surjection <M>{"f : A \\to \\mathcal{P}(A)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>Given any <M>{"f : A \\to \\mathcal{P}(A)"}</M>, let</p>
        <MD>{"D = \\{\\, a \\in A : a \\notin f(a) \\,\\}."}</MD>
        <p>
          If <M>{"D = f(k)"}</M> for some k, then <M>{"k \\in D"}</M> if and only if <M>{"k \\notin f(k) = D"}</M>, which is
          impossible. So D is not in the image of f.
        </p>
      </Proof>
      <p>
        This is the diagonal argument again: membership of a in <M>{"f(a)"}</M> plays the role of the diagonal digit. So every
        set has strictly more subsets than elements, and the sizes of infinite sets climb without end:{" "}
        <M>{"\\mathbb{N}"}</M>, <M>{"\\mathcal{P}(\\mathbb{N})"}</M>, <M>{"\\mathcal{P}(\\mathcal{P}(\\mathbb{N}))"}</M>, &hellip;
      </p>

      <Example title="transcendental numbers exist">
        <p>
          A real number is <strong>algebraic</strong> if it is a root of a non-zero polynomial with integer coefficients. There
          are countably many such polynomials, each with finitely many roots, so the algebraic numbers are countable. Since{" "}
          <M>{"\\mathbb{R}"}</M> is not, some real numbers are not algebraic: they are <strong>transcendental</strong>. Cantor
          gave this argument in 1874, proving that transcendental numbers exist, indeed that all but countably many reals are
          transcendental, without exhibiting a single one.
        </p>
      </Example>

      <Remark title="diagonals everywhere">
        <p>
          The set D in Cantor&rsquo;s theorem is a close relative of Russell&rsquo;s paradoxical set of all sets that are not
          members of themselves. The same self-referential twist proves that no program can decide whether every program halts,
          and lies at the heart of Gödel&rsquo;s incompleteness theorems. Some mathematicians of Cantor&rsquo;s day, notably
          Leopold Kronecker, rejected his work; David Hilbert later declared that no one would expel mathematics from the
          paradise Cantor had created.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "diag",
      rung: "check",
      prompt: (
        <p>
          A list begins <M>{"s_0 = 0110\\ldots"}</M>, <M>{"s_1 = 1010\\ldots"}</M>, <M>{"s_2 = 0011\\ldots"}</M>,{" "}
          <M>{"s_3 = 1111\\ldots"}</M>. What are the first four digits of the diagonal sequence d?
        </p>
      ),
      answer: { kind: "choice", options: ["1100", "1000", "0011", "1010"], correct: [0] },
    },
    {
      key: "which-unc",
      rung: "check",
      prompt: <p>Which of these sets are uncountable?</p>,
      answer: {
        kind: "choice",
        options: ["ℝ", "𝒫(ℕ)", "ℚ", "the set of finite strings of zeros and ones", "the interval [0, 0.001]"],
        correct: [0, 1, 4],
      },
    },
    {
      key: "power-small",
      rung: "apply",
      prompt: (
        <p>
          Let <M>{"A = \\{1, 2, 3\\}"}</M>. Whatever function <M>{"f : A \\to \\mathcal{P}(A)"}</M> you choose, at least how many
          subsets of A are not of the form <M>{"f(a)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "cantor-D",
      rung: "apply",
      prompt: (
        <p>
          Let <M>{"A = \\{1, 2, 3\\}"}</M> and <M>{"f(1) = \\{1, 2\\}"}</M>, <M>{"f(2) = \\{3\\}"}</M>,{" "}
          <M>{"f(3) = \\{1, 3\\}"}</M>. Which set is Cantor&rsquo;s D?
        </p>
      ),
      answer: { kind: "choice", options: ["∅", "{2}", "{1, 3}", "{2, 3}"], correct: [1] },
    },
    {
      key: "irrational",
      rung: "apply",
      prompt: <p>Which of these follows from the results of this lesson and the last?</p>,
      answer: {
        kind: "choice",
        options: [
          "The irrational numbers are uncountable.",
          "The irrational numbers are countable.",
          "Every real number is transcendental.",
          "π is transcendental.",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`rows = ['0110', '1010', '0001', '1111']
diag = ''.join('1' if rows[i][i] == '0' else '0' for i in range(4))
print(diag, diag in rows)`}</Code>
          <p>Cantor's diagonal string differs from every row. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1110 False", "0001 False", "1110 True", "0110 True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`rows = ['0101', '1100', '0011', '1110']
diag = ''.join('1' if rows[i][i] == '0' else '0' for i in range(4))
print(diag, diag in rows, [r[i] != diag[i] for i, r in enumerate(rows)])`}</Code>
          <p>Cantor's diagonal flips the i-th digit of the i-th row. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1001 False [True, True, True, True]", "0101 True [False, True, True, True]", "1001 False [False, False, False, False]", "0110 False [True, True, True, True]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>diagonal(rows)</C>, which takes a list of n binary strings, each of length at least n, and returns a string of length n that differs from row i in position i.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def diagonal(rows):
    return rows[0][:len(rows)]
`,
        solution: `def diagonal(rows):
    return ''.join('1' if r[i] == '0' else '0' for i, r in enumerate(rows))
`,
        tests: [
          { name: "example", code: `assert diagonal(['0110', '1010', '0001', '1111']) == '1110', 'Flip the i-th character of the i-th row.'` },
          { name: "not listed", code: `import random
random.seed(1)
rows = [''.join(random.choice('01') for _ in range(30)) for _ in range(30)]
d = diagonal(rows)
assert all(d[i] != rows[i][i] for i in range(30)) and d not in [r[:30] for r in rows], 'The diagonal string must differ from every row.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Cantor&rsquo;s theorem says no function from a set S onto its power set exists, because the diagonal set D = {"{x ∈ S : x ∉ f(x)}"} is never an output. Write <C>diagonal_set(f, S)</C>, and <C>check_cantor(n)</C>, which goes through all functions from {"{0, …, n − 1}"} to its power set (as tuples of frozensets, n ≤ 3) and returns the number checked after asserting that D is missed by each. Then write <C>halting_style(programs)</C> for a list of functions from int to bool: return a new function g with g(i) ≠ programs[i](i) for every i, so g is not in the list.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def diagonal_set(f, S):
    return set()

def check_cantor(n):
    return 0

def halting_style(programs):
    return programs[0]
`,
        solution: `from itertools import combinations, product

def diagonal_set(f, S):
    return frozenset(x for x in S if x not in f(x))

def check_cantor(n):
    S = list(range(n))
    P = [frozenset(c) for r in range(n + 1) for c in combinations(S, r)]
    count = 0
    for outs in product(P, repeat=n):
        f = lambda x, o=outs: o[x]
        assert diagonal_set(f, S) not in outs
        count += 1
    return count

def halting_style(programs):
    return lambda i: not programs[i](i)
`,
        tests: [
          { name: "diagonal", code: `f = {0: frozenset({0, 1}), 1: frozenset(), 2: frozenset({1})}.get
assert diagonal_set(f, [0, 1, 2]) == {1, 2}, '0 ∈ f(0), 1 ∉ f(1), 2 ∉ f(2).'` },
          { name: "all functions", code: `assert check_cantor(1) == 2 and check_cantor(2) == 16 and check_cantor(3) == 512, 'There are (2ⁿ)ⁿ functions to check.'` },
          { name: "halting", code: `progs = [lambda i: True, lambda i: i % 2 == 0, lambda i: i > 1, lambda i: False]
g = halting_style(progs)
assert all(g(i) != progs[i](i) for i in range(4)), 'g disagrees with program i at input i.'` },
        ],
      },
    },
    {
      key: "irr-proof",
      rung: "prove",
      prompt: <p>Prove that the set of irrational numbers is uncountable.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Supposes the irrationals are countable.",
          "Notes that the rationals are countable and ℝ is their union with the irrationals.",
          "Uses that a union of two countable sets is countable to make ℝ countable.",
          "Concludes this contradicts the uncountability of ℝ.",
        ],
      },
    },
    {
      key: "functions",
      rung: "stretch",
      prompt: (
        <p>
          Use a diagonal argument to prove that the set of all functions <M>{"\\mathbb{N} \\to \\mathbb{N}"}</M> is uncountable.
          Then explain why the same argument does not show that <M>{"\\mathbb{Q}"}</M> is uncountable, if you try to diagonalise
          against decimal expansions of rationals.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Supposes f₀, f₁, f₂, … lists all functions ℕ → ℕ.",
          "Defines g(n) = fₙ(n) + 1 and shows g differs from each fₙ at n.",
          "Concludes the set is uncountable.",
          "Explains that the diagonal number built from rationals need not be rational (its decimal need not repeat), so it can escape a list of rationals without contradiction.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend Cantor's diagonal argument: why any list of infinite 0-1 sequences must miss one, and what that tells us about the real numbers.",

  glimpse: (
    <p>
      So some infinite sets are larger than others. The last lesson of the course shows why this matters for probability: on an uncountable set such as an interval, every single point can have probability zero. The same diagonal argument proves, in the theory of computation, that no program can decide whether every other program halts.
    </p>
  ),
};
