import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { CasesViz } from "@/components/viz/CasesViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.3.4",
  minutes: 65,
  links: {
    revisits: ["m0.1.2", "m1.1.2"],
    foreshadows: ["m4.4.3"],
  },

  puzzle: (
    <>
      <p>
        Six people meet at a party. Some pairs already know each other; the rest are strangers. Show that there must be three
        people who all know each other, or three people who are all strangers to each other.
      </p>
      <p>
        There are <M>{"2^{15} = 32768"}</M> ways the acquaintances could be arranged, far too many to check one by one. Yet a
        short argument settles every one of them. Before reading on, focus on a single guest and ask how many of the other
        five she knows.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Pick a guest, Anu. Of the other five, either at least three know Anu, or at least three are strangers to her, since
        five cannot split as two and two. That is the first split into cases. In the first case, look at three people who
        know Anu. If any two of them know each other, those two and Anu are three mutual acquaintances. If no two of them do,
        they are three mutual strangers. Either way, done. The second case is the same with the roles swapped.
      </p>
      <p>
        Every arrangement falls into one case or the other, and each case was handled. That is a{" "}
        <strong>proof by cases</strong>. With numbers, the most common split is by remainder: every integer leaves one of
        just a few remainders when divided by m. Explore below.
      </p>
      <CasesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="proof by cases">
        <p>
          To prove Q, find statements <M>{"P_1, \\dots, P_k"}</M> such that at least one of them must hold, and prove{" "}
          <M>{"P_i \\to Q"}</M> for each i. This is valid because
        </p>
        <MD>{"\\big((P_1 \\vee \\cdots \\vee P_k) \\wedge (P_1 \\to Q) \\wedge \\cdots \\wedge (P_k \\to Q)\\big) \\to Q"}</MD>
        <p>
          is a tautology. The cases must be <strong>exhaustive</strong>: together they must cover every possibility. They need
          not be exclusive, though it is tidier when they are.
        </p>
      </Definition>

      <Theorem title="n² + n is even">
        <p>For every integer n, <M>{"n^2 + n"}</M> is even.</p>
      </Theorem>
      <Proof>
        <p>Every integer is even or odd.</p>
        <p>
          <em>Case 1: n is even</em>, say <M>{"n = 2k"}</M>. Then <M>{"n^2 + n = 4k^2 + 2k = 2(2k^2 + k)"}</M>, which is even.
        </p>
        <p>
          <em>Case 2: n is odd</em>, say <M>{"n = 2k + 1"}</M>. Then{" "}
          <M>{"n^2 + n = 4k^2 + 4k + 1 + 2k + 1 = 2(2k^2 + 3k + 1)"}</M>, which is even.
        </p>
        <p>In both cases <M>{"n^2 + n"}</M> is even.</p>
      </Proof>

      <Theorem title="squares modulo 4">
        <p>Every perfect square leaves remainder 0 or 1 on division by 4.</p>
      </Theorem>
      <Proof>
        <p>
          If n is even, <M>{"n = 2k"}</M> and <M>{"n^2 = 4k^2"}</M>, remainder 0. If n is odd,{" "}
          <M>{"n = 2k + 1"}</M> and <M>{"n^2 = 4(k^2 + k) + 1"}</M>, remainder 1.
        </p>
      </Proof>
      <p>
        So no number of the form <M>{"4q + 3"}</M>, such as 4003, is a perfect square, and a sum of two squares leaves
        remainder 0, 1 or 2, never 3. A few lines of cases rule out infinitely many numbers.
      </p>

      <Example title="absolute value">
        <p>
          Statements about <M>{"|x|"}</M> are natural candidates, since <M>{"|x|"}</M> is defined by cases: <M>{"|x| = x"}</M>{" "}
          if <M>{"x \\ge 0"}</M> and <M>{"|x| = -x"}</M> if <M>{"x < 0"}</M>. To prove <M>{"|xy| = |x|\\,|y|"}</M>, split by the
          signs of x and y: four cases, each a line of algebra.
        </p>
      </Example>

      <Remark title="without loss of generality">
        <p>
          In the party proof the second case was the first with &ldquo;know&rdquo; and &ldquo;stranger&rdquo; swapped.
          Mathematicians write &ldquo;<strong>without loss of generality</strong>, at least three know Anu&rdquo;, meaning
          that the other case is the same argument with the names changed. Use the phrase only when that is truly so, and it
          is good manners to say why.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "exhaustive",
      rung: "check",
      prompt: <p>A student proves a statement about integers in two cases: n &gt; 0 and n &lt; 0. What is missing?</p>,
      answer: { kind: "choice", options: ["Nothing.", "The case n = 0.", "The case n is even.", "The case n is prime."], correct: [1] },
    },
    {
      key: "odd-square",
      rung: "check",
      prompt: <p>What remainder does the square of an odd number leave on division by 4?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "cubes",
      rung: "apply",
      prompt: <p>What is the largest whole number that divides <M>{"n^3 - n"}</M> for every integer n? (Try the visualisation with 2, 3 and 6.)</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "two-squares",
      rung: "apply",
      prompt: <p>Can 4003 be written as a sum of two perfect squares?</p>,
      answer: {
        kind: "choice",
        options: [
          "Yes.",
          "No: a sum of two squares leaves remainder 0, 1 or 2 on division by 4, but 4003 leaves 3.",
          "No: 4003 is prime.",
          "It cannot be decided without a computer.",
        ],
        correct: [1],
      },
    },
    {
      key: "five-cases",
      rung: "apply",
      prompt: <p>To prove a statement about every integer by splitting on its remainder when divided by 5, how many cases are needed?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`print({n % 3: (n * n) % 3 for n in range(30)})`}</Code>
          <p>Proof by cases on n mod 3. What does the dictionary show about n² mod 3?</p>
        </>
      ),
      answer: { kind: "choice", options: ["It is never 2", "It is always 0", "It equals n mod 3", "It is always 1"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def sign_case(x, y):
    if x >= 0 and y >= 0:
        return 'both'
    if x < 0 and y < 0:
        return 'both neg'
    return 'mixed'
cases = [sign_case(x, y) for x in (-2, 3) for y in (-1, 4)]
print(cases, all(abs(x * y) == abs(x) * abs(y) for x in range(-5, 6) for y in range(-5, 6)))`}</Code>
          <p>A proof of |xy| = |x||y| by cases on the signs. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["['both neg', 'mixed', 'mixed', 'both'] True", "['both', 'mixed', 'mixed', 'both neg'] True", "['both neg', 'mixed', 'mixed', 'both'] False", "['mixed', 'both neg', 'both', 'mixed'] True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>max_by_cases(a, b)</C> returning the maximum, and prove-by-testing the identity max(a, b) = (a + b + |a − b|)/2 by writing <C>formula(a, b)</C> too.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def max_by_cases(a, b):
    return a

def formula(a, b):
    return (a + b) / 2
`,
        solution: `def max_by_cases(a, b):
    if a >= b:
        return a
    return b

def formula(a, b):
    return (a + b + abs(a - b)) / 2
`,
        tests: [
          { name: "cases", code: `assert max_by_cases(3, 7) == 7 and max_by_cases(7, 3) == 7 and max_by_cases(2, 2) == 2, 'Handle a ≥ b and a < b.'` },
          { name: "identity", code: `assert all(formula(a, b) == max_by_cases(a, b) for a in range(-5, 6) for b in range(-5, 6)), 'The formula should agree with your cases everywhere.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>abs_ineq_cases(x, y)</C>, which returns the case used to prove the triangle inequality |x + y| ≤ |x| + |y|: <C>"same sign"</C> when x and y are both ≥ 0 or both ≤ 0 (equality then holds), and <C>"opposite"</C> otherwise. Then write <C>check_by_cases(xs)</C>, which returns a dict counting how many pairs from xs fell in each case, and raises <C>AssertionError</C> if any pair breaks the inequality or if a <C>"same sign"</C> pair fails to give equality. Zero counts as same sign with anything.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def abs_ineq_cases(x, y):
    return 'same sign'

def check_by_cases(xs):
    return {}
`,
        solution: `def abs_ineq_cases(x, y):
    if (x >= 0 and y >= 0) or (x <= 0 and y <= 0):
        return 'same sign'
    return 'opposite'

def check_by_cases(xs):
    counts = {'same sign': 0, 'opposite': 0}
    for x in xs:
        for y in xs:
            c = abs_ineq_cases(x, y)
            counts[c] += 1
            assert abs(x + y) <= abs(x) + abs(y)
            if c == 'same sign':
                assert abs(x + y) == abs(x) + abs(y)
    return counts
`,
        tests: [
          { name: "cases", code: `assert abs_ineq_cases(2, 3) == 'same sign' and abs_ineq_cases(-2, -3) == 'same sign' and abs_ineq_cases(0, -4) == 'same sign' and abs_ineq_cases(-1, 5) == 'opposite', 'Zero goes with either sign.'` },
          { name: "counts", code: `assert check_by_cases([-2, -1, 0, 1, 2]) == {'same sign': 17, 'opposite': 8}, 'All 25 ordered pairs are checked.'` },
          { name: "strict", code: `c = check_by_cases([-3, 5])
assert c == {'same sign': 2, 'opposite': 2}, 'Pairs of an element with itself count too.'` },
        ],
      },
    },
    {
      key: "absolute",
      rung: "prove",
      prompt: <p>Prove that for all real numbers x and y, <M>{"|xy| = |x|\\,|y|"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Splits into cases by the signs of x and y, covering every possibility.",
          "In each case, computes both sides using the definition of absolute value.",
          "Notes that both sides agree in every case and concludes.",
        ],
      },
    },
    {
      key: "party",
      rung: "stretch",
      prompt: (
        <p>
          Write out the party proof in full: among any six people, some three all know each other or some three are all
          strangers. Then show that five people are not enough, by describing an arrangement of five with neither.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Picks one person and argues that at least three of the other five are all acquaintances of that person, or all strangers.",
          "Handles the case of three acquaintances: either two of them know each other, giving a triangle with the chosen person, or they are three mutual strangers.",
          "Handles the other case by symmetry, explaining why it is the same argument.",
          "For five people, gives an arrangement such as five people in a circle, each knowing only the two neighbours, and checks it has no such three.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why no number that leaves remainder 3 on division by 4 can be a perfect square, by splitting into cases.",

  glimpse: (
    <p>
      Splitting by remainders is the start of modular arithmetic, which Discrete Mathematics builds into a powerful tool, used in hashing. The party puzzle is the smallest case of Ramsey&rsquo;s theorem, which says that complete disorder is impossible in any large enough structure. Next comes proving that something exists, and that it is the only one.
    </p>
  ),
};
