import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { HanoiViz } from "@/components/viz/HanoiViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.7.3",
  minutes: 75,
  links: {
    revisits: ["m0.1.1", "m0.7.1"],
    foreshadows: ["m1.5.1", "m1.5.2"],
  },

  puzzle: (
    <>
      <p>
        In 1883 the French mathematician Édouard Lucas sold a puzzle with a legend attached. In a temple at Benares, priests
        move a tower of 64 golden discs from one diamond needle to another, one disc at a time, never placing a larger disc
        on a smaller. When they finish, the world will end.
      </p>
      <p>How many moves do they need, at the least? And how could you be sure of the answer for 64 discs, without trying?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Try small towers. One disc takes 1 move; two take 3; three take 7. To move a tower of <M>n</M>, you must at some
        point move the largest disc, and before that the other <M>{"n - 1"}</M> must all be out of the way on the third peg.
        So: move <M>{"n - 1"}</M>, move the largest, move <M>{"n - 1"}</M> back on top. If <M>{"n - 1"}</M> discs need{" "}
        <M>{"2^{n-1} - 1"}</M> moves, then <M>n</M> discs need <M>{"2(2^{n-1} - 1) + 1 = 2^n - 1"}</M>.
      </p>
      <p>
        That argument is a chain: the answer for one disc gives it for two, two gives three, and so on for ever, like a row
        of dominoes each knocking over the next. This is <strong>induction</strong>. For 64 discs it gives{" "}
        <M>{"2^{64} - 1"}</M> moves, which at one a second is about 585 billion years. The world is safe for now.
      </p>
      <HanoiViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the principle of induction">
        <p>
          Let <M>{"P(n)"}</M> be a statement about the whole number <M>n</M>. Suppose that
        </p>
        <ul>
          <li><strong>base case:</strong> <M>{"P(1)"}</M> is true, and</li>
          <li><strong>inductive step:</strong> for every <M>{"k \\ge 1"}</M>, if <M>{"P(k)"}</M> is true then <M>{"P(k+1)"}</M> is true.</li>
        </ul>
        <p>Then <M>{"P(n)"}</M> is true for every whole number <M>{"n \\ge 1"}</M>.</p>
      </Theorem>
      <p>
        Why believe it? If some <M>{"P(n)"}</M> failed, there would be a smallest <M>n</M> for which it fails. It is not 1, by
        the base case. So <M>{"P(n-1)"}</M> holds, and the inductive step then gives <M>{"P(n)"}</M>, a contradiction. This
        rests on a basic property of the natural numbers from the very first lesson: every non-empty set of them has a
        smallest member. The base case can start at any number, not just 1.
      </p>

      <Example title="the sum of squares">
        <p>
          Let <M>{"P(n)"}</M> say <M>{"\\sum_{k=1}^{n} k^2 = \\tfrac{n(n+1)(2n+1)}{6}"}</M>. The base case: both sides are 1
          when <M>{"n = 1"}</M>. The inductive step: assume <M>{"P(k)"}</M>. Then
        </p>
        <MD>{"\\sum_{j=1}^{k+1} j^2 = \\frac{k(k+1)(2k+1)}{6} + (k+1)^2 = \\frac{(k+1)\\big(k(2k+1) + 6(k+1)\\big)}{6} = \\frac{(k+1)(k+2)(2k+3)}{6},"}</MD>
        <p>
          since <M>{"2k^2 + 7k + 6 = (k+2)(2k+3)"}</M>. That is exactly <M>{"P(k+1)"}</M>. By induction, the formula holds
          for every <M>n</M>.
        </p>
      </Example>

      <Theorem title="the tower puzzle">
        <p>A tower of <M>n</M> discs can be moved in <M>{"2^n - 1"}</M> moves, and no fewer.</p>
      </Theorem>
      <Proof>
        <p>
          Induction on <M>n</M>. One disc takes one move. Suppose <M>k</M> discs need exactly <M>{"2^k - 1"}</M> moves at best.
          With <M>{"k + 1"}</M> discs, the largest must move at least once, and at its first move the other <M>k</M> must all
          be on the third peg, which takes at least <M>{"2^k - 1"}</M> moves. After its last move they must all come back on
          top of it, at least <M>{"2^k - 1"}</M> more. So at least <M>{"2(2^k - 1) + 1 = 2^{k+1} - 1"}</M>, and the strategy
          in the picture achieves it.
        </p>
      </Proof>

      <Definition title="strong induction">
        <p>
          Sometimes the step from <M>k</M> to <M>{"k + 1"}</M> needs not just <M>{"P(k)"}</M> but some earlier case. It is
          equally valid to assume <M>{"P(1), \\ldots, P(k)"}</M> all at once and deduce <M>{"P(k+1)"}</M>. The same smallest
          counterexample argument justifies it.
        </p>
      </Definition>

      <Remark title="all horses are the same colour">
        <p>
          Here is a famous false proof. Claim: in any group of <M>n</M> horses, all are the same colour. Base case: one horse
          is one colour. Step: given <M>{"k + 1"}</M> horses, the first <M>k</M> are all one colour by assumption, and so are
          the last <M>k</M>; the two groups overlap, so all <M>{"k + 1"}</M> match. Where is the mistake? Try{" "}
          <M>{"k = 1"}</M>: the first horse and the last horse do not overlap. The step must work for <em>every</em>{" "}
          <M>k</M>, and here one link of the chain is missing. Finding exactly which step fails, the way a reviewer
          checks a proof line by line, is the skill.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "six-discs",
      rung: "check",
      prompt: <p>What is the least number of moves to shift a tower of 6 discs?</p>,
      answer: { kind: "numeric", value: 63 },
    },
    {
      key: "two-parts",
      rung: "check",
      prompt: <p>To prove that a statement <M>{"P(n)"}</M> holds for every whole number <M>{"n \\ge 1"}</M> by induction, which must you show? Select all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["P(1) is true", "for every k ≥ 1, if P(k) is true then P(k + 1) is true", "P(k) is true for some very large k", "P(n) is true for n = 1, 2 and 3"],
        correct: [0, 1],
      },
    },
    {
      key: "guess-formula",
      rung: "apply",
      prompt: (
        <p>
          Compute <M>{"\\tfrac{1}{1\\cdot2}"}</M>, <M>{"\\tfrac{1}{1\\cdot2} + \\tfrac{1}{2\\cdot3}"}</M> and the next sum.
          Guess a formula for <M>{"\\sum_{k=1}^{n} \\tfrac{1}{k(k+1)}"}</M> in terms of <M>n</M>.
        </p>
      ),
      answer: { kind: "expression", value: "n/(n+1)", variables: ["n"] },
    },
    {
      key: "powers-squares",
      rung: "apply",
      prompt: <p>From which whole number <M>n</M> onwards is <M>{"2^n > n^2"}</M> true for every number? (Check small cases; it fails at a few.)</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "geometric-check",
      rung: "apply",
      prompt: <p>Induction proves <M>{"1 + 2 + 4 + \\cdots + 2^{n-1} = 2^n - 1"}</M>. What is <M>{"1 + 2 + 4 + \\cdots + 2^{15}"}</M>?</p>,
      answer: { kind: "numeric", value: 65535 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`print(all(sum(2 ** i for i in range(n)) == 2 ** n - 1 for n in range(1, 50)))`}</Code>
          <p>This checks 1 + 2 + … + 2ⁿ⁻¹ = 2ⁿ − 1 for n below 50. What does it print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def moves(n, a='A', b='B', c='C'):
    if n == 0:
        return []
    return moves(n - 1, a, c, b) + [(a, c)] + moves(n - 1, b, a, c)
m = moves(3)
print(len(m), m[0], m[3])`}</Code>
          <p>The Tower of Hanoi moves for three discs from A to C. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["7 ('A', 'C') ('A', 'C')", "7 ('A', 'B') ('A', 'C')", "8 ('A', 'C') ('A', 'C')", "7 ('A', 'C') ('B', 'C')"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Induction mirrors recursion. Write <C>tower(n)</C>, the fewest moves to solve the Tower of Hanoi with n discs, recursively: tower(0) = 0 and tower(n) = 2 · tower(n − 1) + 1. Then compare it with 2ⁿ − 1.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def tower(n):
    return 2 * n
`,
        solution: `def tower(n):
    if n == 0:
        return 0
    return 2 * tower(n - 1) + 1
`,
        tests: [
          { name: "small", code: `assert [tower(n) for n in range(5)] == [0, 1, 3, 7, 15], 'Move n − 1 discs off, the big disc across, then n − 1 discs back on.'` },
          { name: "closed form", code: `assert all(tower(n) == 2 ** n - 1 for n in range(30)), 'The recursion matches 2ⁿ − 1.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>check_induction(P, base, n_max)</C>, a tester for a proof by induction: it returns the smallest n from <C>base</C> to <C>n_max</C> at which the predicate <C>P(n)</C> fails, or <C>None</C>. Then write <C>tiles(n)</C>, the number of ways to tile a 2 × n strip with 1 × 2 dominoes (an induction on n: the last column is one vertical domino or the last two columns are two horizontal ones), computed iteratively so that n = 1000 is fast.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def check_induction(P, base, n_max):
    return None

def tiles(n):
    if n <= 1:
        return 1
    return tiles(n - 1) + tiles(n - 2)
`,
        solution: `def check_induction(P, base, n_max):
    for n in range(base, n_max + 1):
        if not P(n):
            return n
    return None

def tiles(n):
    a, b = 1, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b if n >= 1 else 1
`,
        tests: [
          { name: "true claim", code: `assert check_induction(lambda n: sum(range(1, n + 1)) == n * (n + 1) // 2, 1, 200) is None, 'A true formula never fails.'` },
          { name: "false claim", code: `assert check_induction(lambda n: n * n - n + 41 in {p for p in range(2, 2000) if all(p % d for d in range(2, int(p ** 0.5) + 1))}, 1, 100) == 41, 'n² − n + 41 is prime for n = 1 … 40 but not 41.'` },
          { name: "base", code: `assert check_induction(lambda n: 2 ** n > n * n, 5, 100) is None and check_induction(lambda n: 2 ** n > n * n, 1, 100) == 2, 'Start at the given base.'` },
          { name: "tiles", code: `assert [tiles(n) for n in range(1, 8)] == [1, 2, 3, 5, 8, 13, 21] and tiles(0) == 1, 'The counts are Fibonacci numbers.'` },
          { name: "fast", code: `assert tiles(1000) % 1000000007 == 107579939, 'Iterate rather than recurse.'` },
        ],
      },
    },
    {
      key: "odd-induction",
      rung: "prove",
      prompt: <p>Prove by induction that <M>{"1 + 3 + 5 + \\cdots + (2n - 1) = n^2"}</M> for every whole number <M>{"n \\ge 1"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Checks the base case n = 1: both sides are 1.",
          "States the inductive hypothesis: the formula holds for n = k.",
          "Adds the next odd number, 2(k + 1) − 1 = 2k + 1, to get k² + 2k + 1.",
          "Recognises this as (k + 1)², and concludes by induction.",
        ],
      },
    },
    {
      key: "regions",
      rung: "stretch",
      prompt: (
        <p>
          Draw <M>n</M> straight lines in the plane, no two parallel and no three through one point. One line makes 2
          regions, two make 4, three make 7. The <M>n</M>th line crosses the others at <M>{"n - 1"}</M> points and so cuts
          through <M>n</M> regions, splitting each in two. How many regions do 10 lines make?
        </p>
      ),
      answer: { kind: "numeric", value: 56 },
    },
  ],

  teachBack:
    "Explain to a friend how induction works using a row of dominoes, and why both the base case and the inductive step are needed.",

  glimpse: (
    <p>
      Next, counting, where induction often supplies the proofs. Induction returns properly in Proof and Logic, with strong
      induction, the well-ordering principle and recursive definitions. In computing, the tower puzzle is the classic example
      of recursion, where a problem is solved by solving smaller copies of itself.
    </p>
  ),
};
