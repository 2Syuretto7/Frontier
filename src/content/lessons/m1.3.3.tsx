import { M, MD } from "@/components/Math";
import { Definition, Proof, Quote, Remark, Theorem } from "@/components/lesson/Blocks";
import { EuclidViz } from "@/components/viz/EuclidViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.3.3",
  minutes: 70,
  links: {
    revisits: ["m0.1.4", "m1.2.3"],
    foreshadows: ["m1.8.3", "m2.1.2"],
  },

  puzzle: (
    <>
      <p>
        Try to write <M>{"\\sqrt 2"}</M> as a fraction. <M>{"\\tfrac{7}{5} = 1.4"}</M> is close, as{" "}
        <M>{"7^2 = 49"}</M> and <M>{"2 \\cdot 5^2 = 50"}</M>. <M>{"\\tfrac{17}{12}"}</M> is closer: <M>{"289"}</M> against{" "}
        <M>{"288"}</M>. <M>{"\\tfrac{99}{70}"}</M> is closer still: <M>{"9801"}</M> against <M>{"9800"}</M>.
      </p>
      <p>
        Each time you are off by exactly 1, and you could go on forever. How could anyone prove that <em>no</em> fraction,
        among infinitely many, ever hits <M>{"\\sqrt 2"}</M> exactly? You cannot check them all.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Here is the trick. Suppose, for the sake of argument, that some fraction does work. Follow the consequences of that
        supposition carefully, and arrive at something impossible. Then the supposition was false. You never check a single
        fraction; you show that the very idea of one leads to absurdity.
      </p>
      <p>
        The same strategy proves there are infinitely many primes. Suppose the primes were a finite list. Multiply them all
        and add one. Try it below with any list you like.
      </p>
      <EuclidViz />
    </>
  ),

  theory: (
    <>
      <Definition title="proof by contradiction">
        <p>
          To prove a statement S by <strong>contradiction</strong>, assume <M>{"\\neg S"}</M> and deduce a contradiction: a
          statement of the form <M>{"R \\wedge \\neg R"}</M>, something known to be false. Since a true assumption cannot lead
          by valid steps to a falsehood, <M>{"\\neg S"}</M> is false, and so S is true.
        </p>
      </Definition>

      <Theorem title="the square root of 2 is irrational">
        <p>There are no integers a and b with <M>{"b \\ne 0"}</M> and <M>{"\\left(\\tfrac{a}{b}\\right)^2 = 2"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Suppose, for contradiction, that <M>{"\\sqrt 2 = \\tfrac{a}{b}"}</M> for integers a and b with{" "}
          <M>{"b \\ne 0"}</M>. Cancel common factors so that the fraction is in lowest terms: a and b are not both even.
          Squaring, <M>{"a^2 = 2b^2"}</M>, so <M>{"a^2"}</M> is even. By the previous lesson, a is even, say{" "}
          <M>{"a = 2c"}</M>. Then <M>{"4c^2 = 2b^2"}</M>, so <M>{"b^2 = 2c^2"}</M> is even, and again b is even. So a and b are
          both even, contradicting lowest terms. Hence no such fraction exists.
        </p>
      </Proof>

      <Theorem title="Euclid: there are infinitely many primes">
        <p>No finite list contains every prime.</p>
      </Theorem>
      <Proof>
        <p>
          Suppose, for contradiction, that <M>{"p_1, p_2, \\dots, p_n"}</M> are all the primes. Let
        </p>
        <MD>{"N = p_1 p_2 \\cdots p_n + 1."}</MD>
        <p>
          N is greater than 1, so it has a prime factor p. That p is on the list, so it divides the product{" "}
          <M>{"p_1 \\cdots p_n"}</M>. A number dividing both N and <M>{"N - 1"}</M> divides their difference, 1. But no prime
          divides 1. This contradiction shows the list was not complete.
        </p>
      </Proof>

      <Remark title="a common misreading">
        <p>
          The proof does not say that <M>{"p_1 \\cdots p_n + 1"}</M> is prime. The visualisation shows it often is not:{" "}
          <M>{"2 \\cdot 3 \\cdot 5 \\cdot 7 \\cdot 11 \\cdot 13 + 1 = 30031 = 59 \\cdot 509"}</M>. What the proof shows is that
          its prime factors are missing from the list. In fact Euclid, in Book IX of the <cite>Elements</cite>, argued without
          assuming the list was complete: given any primes, he produced another. That is a direct proof, slightly stronger,
          and many mathematicians prefer it.
        </p>
      </Remark>

      <Quote source={<>G. H. Hardy, <cite>A Mathematician&rsquo;s Apology</cite> (1940)</>}>
        <p>
          Reductio ad absurdum, which Euclid loved so much, is one of a mathematician&rsquo;s finest weapons. It is a far finer
          gambit than any chess gambit: a chess player may offer the sacrifice of a pawn or even a piece, but a mathematician
          offers the game.
        </p>
      </Quote>

      <Remark title="contradiction or contrapositive?">
        <p>
          To prove <M>{"P \\to Q"}</M> by contradiction, you assume P and <M>{"\\neg Q"}</M> together and look for any
          contradiction. A proof by contrapositive is the special case in which the contradiction is with P itself. If your
          contradiction proof ends with &ldquo;so not P, contradicting P&rdquo;, it can usually be rewritten more cleanly as a
          contrapositive proof.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "assume",
      rung: "check",
      prompt: <p>To prove &ldquo;there is no largest even number&rdquo; by contradiction, what do you assume?</p>,
      answer: {
        kind: "choice",
        options: ["There is no largest even number.", "There is a largest even number.", "Every even number is large.", "There is a largest odd number."],
        correct: [1],
      },
    },
    {
      key: "near-miss",
      rung: "check",
      prompt: <p>In the puzzle, <M>{"\\tfrac{99}{70}"}</M> nearly works. What is <M>{"99^2 - 2 \\cdot 70^2"}</M>?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "euclid-n",
      rung: "apply",
      prompt: <p>Compute <M>{"2 \\cdot 3 \\cdot 5 \\cdot 7 + 1"}</M>. (It happens to be prime.)</p>,
      answer: { kind: "numeric", value: 211 },
    },
    {
      key: "smallest-factor",
      rung: "apply",
      prompt: <p>What is the smallest prime factor of <M>{"2 \\cdot 3 \\cdot 5 \\cdot 7 \\cdot 11 \\cdot 13 + 1 = 30031"}</M>?</p>,
      answer: { kind: "numeric", value: 59 },
    },
    {
      key: "where",
      rung: "apply",
      prompt: <p>In the proof that <M>{"\\sqrt 2"}</M> is irrational, where exactly is the contradiction?</p>,
      answer: {
        kind: "choice",
        options: [
          "a² = 2b² is impossible.",
          "a and b are both even, but the fraction was in lowest terms.",
          "b = 0.",
          "a is both even and odd.",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction
found = [Fraction(p, q) for q in range(1, 300) for p in range(q, 2 * q) if p * p == 2 * q * q]
print(found)`}</Code>
          <p>A search for p/q with (p/q)² = 2. What does it print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[]", "[Fraction(99, 70)]", "[Fraction(7, 5)]", "An error"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
primes = [2, 3, 5, 7, 11, 13]
N = math.prod(primes) + 1
f = next(d for d in range(2, N + 1) if N % d == 0)
print(N, f, f in primes)`}</Code>
          <p>Euclid's construction from the first six primes. Is the product plus one prime? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["30031 59 False", "30031 30031 False", "30031 59 True", "30030 2 True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Euclid&rsquo;s proof that there are infinitely many primes multiplies the known primes and adds 1. Write <C>euclid_new_prime(primes)</C>, which returns the smallest prime factor of that number: a prime missing from the list.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def euclid_new_prime(primes):
    return primes[0]
`,
        solution: `def euclid_new_prime(primes):
    n = 1
    for p in primes:
        n *= p
    n += 1
    d = 2
    while n % d:
        d += 1
    return d
`,
        tests: [
          { name: "first five", code: `assert euclid_new_prime([2, 3, 5, 7, 11]) == 2311, '2·3·5·7·11 + 1 = 2311 is itself prime.'` },
          { name: "composite case", code: `assert euclid_new_prime([2, 3, 5, 7, 11, 13]) == 59, '30031 = 59 × 509, so the new prime is 59.'` },
          { name: "new", code: `ps = [2, 3, 5, 7, 11, 13, 17]
assert euclid_new_prime(ps) not in ps, 'The prime found is never in the list.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            A proof by contradiction often ends in a smaller counterexample, which is impossible. Write <C>descent(a, b)</C> for the claim that √2 is irrational: given positive integers with a² = 2b², the proof produces a smaller pair (2b − a, a − b). Your function should apply this step repeatedly and raise <C>ValueError("not a solution")</C> as soon as a pair fails a² = 2b². Since no pair ever works, the tests check that it always raises, and that it raises on the first step. Also write <C>near_misses(N)</C>, the pairs (a, b) with b ≤ N and |a² − 2b²| = 1, the closest the equation can come.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def descent(a, b):
    return (a, b)

def near_misses(N):
    return []
`,
        solution: `import math

def descent(a, b):
    while a > 0 and b > 0:
        if a * a != 2 * b * b:
            raise ValueError('not a solution')
        a, b = 2 * b - a, a - b
    raise ValueError('not a solution')

def near_misses(N):
    out = []
    for b in range(1, N + 1):
        a = math.isqrt(2 * b * b)
        for c in (a, a + 1):
            if abs(c * c - 2 * b * b) == 1:
                out.append((c, b))
    return out
`,
        tests: [
          { name: "raises", code: `for a, b in [(3, 2), (7, 5), (17, 12), (99, 70), (10, 7)]:
    try:
        descent(a, b)
        ok = False
    except ValueError:
        ok = True
    assert ok, (a, b)` },
          { name: "near", code: `assert near_misses(100) == [(1, 1), (3, 2), (7, 5), (17, 12), (41, 29), (99, 70)], 'The convergents of √2.'` },
          { name: "ratio", code: `a, b = near_misses(10 ** 6)[-1]
assert abs(a / b - 2 ** 0.5) < 1e-11, 'The near misses approach √2.'` },
        ],
      },
    },
    {
      key: "largest",
      rung: "prove",
      prompt: <p>Prove by contradiction that there is no largest even integer.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Assumes, for contradiction, that some even integer N is the largest.",
          "Considers N + 2 and shows it is even.",
          "Notes N + 2 > N, contradicting the assumption, and concludes.",
        ],
      },
    },
    {
      key: "root-three",
      rung: "stretch",
      prompt: (
        <p>
          Prove that <M>{"\\sqrt 3"}</M> is irrational. You may use the result of the previous lesson&rsquo;s stretch
          exercise: if 3 divides <M>{"n^2"}</M>, then 3 divides n.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Assumes √3 = a/b in lowest terms, with b ≠ 0.",
          "Derives a² = 3b², so 3 divides a², so 3 divides a; writes a = 3c.",
          "Derives b² = 3c², so 3 divides b.",
          "Notes that 3 divides both a and b, contradicting lowest terms.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how it is possible to prove that no fraction equals √2, without checking any fractions at all.",

  glimpse: (
    <p>
      Contradiction will return at the climax of this course, in Cantor&rsquo;s diagonal argument that some infinities are
      bigger than others. In Calculus, the completeness of the real numbers is the property that fills the gaps this lesson
      found in the rationals. Next comes proof by cases, for when a statement splits naturally into pieces.
    </p>
  ),
};
