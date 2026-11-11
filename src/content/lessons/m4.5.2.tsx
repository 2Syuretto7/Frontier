import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { GrowthRateViz } from "@/components/viz/GrowthRateViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.5.2",
  minutes: 60,
  links: {
    requires: ["m4.5.1", "m2.9.1", "m0.4.3"],
    foreshadows: ["m4.5.3", "e2.1.1"],
  },

  puzzle: (
    <>
      <p>
        Algorithm A takes <M>{"100n"}</M> steps on an input of size n. Algorithm B takes <M>{"n^2"}</M>. B is faster for small
        inputs. Which would you rather run on a million items, and is there a way to say so without fussing over the constant
        100?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        For large inputs, the shape of the growth matters far more than constant factors. A quadratic eventually overtakes any
        linear function, and an exponential overtakes any polynomial. See how long each growth rate takes at a billion steps a
        second below.
      </p>
      <GrowthRateViz />
    </>
  ),

  theory: (
    <>
      <Definition title="big-O, big-Omega, big-Theta">
        <p>
          For functions f, g from the positive integers to the positive reals:
        </p>
        <ul>
          <li>
            <M>{"f = O(g)"}</M> if there are constants C &gt; 0 and <M>{"n_0"}</M> with <M>{"f(n) \\le C g(n)"}</M> for all{" "}
            <M>{"n \\ge n_0"}</M>;
          </li>
          <li><M>{"f = \\Omega(g)"}</M> if <M>{"g = O(f)"}</M>;</li>
          <li><M>{"f = \\Theta(g)"}</M> if both hold: f and g grow at the same rate up to constants.</li>
        </ul>
      </Definition>

      <Example title="a polynomial">
        <p>
          <M>{"3n^2 + 10n + 7 = \\Theta(n^2)"}</M>: for n ≥ 1 it is at most <M>{"3n^2 + 10n^2 + 7n^2 = 20n^2"}</M>, and at
          least <M>{"3n^2"}</M>. In general a polynomial of degree d with positive leading coefficient is{" "}
          <M>{"\\Theta(n^d)"}</M>.
        </p>
      </Example>

      <Theorem title="the limit test">
        <p>
          If <M>{"f(n)/g(n) \\to L"}</M> with <M>{"0 < L < \\infty"}</M>, then <M>{"f = \\Theta(g)"}</M>. If the limit is 0,
          then <M>{"f = O(g)"}</M> but not <M>{"\\Theta(g)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          If the ratio tends to L, then for large n it lies between L/2 and 2L, which gives both bounds with C = 2L and C = 2/L.
          If it tends to 0, it is eventually below 1, so f ≤ g; and f ≥ cg fails for every c &gt; 0 eventually.
        </p>
      </Proof>

      <Theorem title="the hierarchy">
        <p>
          For constants a &gt; 0, b &gt; 1 and k &gt; 0:{" "}
          <M>{"1 \\prec \\log n \\prec n^{a} \\prec n^{a}\\log n \\prec n^{a+k} \\prec b^n \\prec n!"}</M>, where{" "}
          <M>{"f \\prec g"}</M> means <M>{"f/g \\to 0"}</M>. Logarithms to different bases differ by a constant factor, so the
          base is usually omitted.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each comparison is a limit from Calculus. For instance <M>{"(\\log n)/n^a \\to 0"}</M> and{" "}
          <M>{"n^k / b^n \\to 0"}</M> by l&rsquo;Hôpital&rsquo;s rule or by comparing growth rates of the logarithms;{" "}
          <M>{"b^n/n! \\to 0"}</M> because beyond n = 2b each extra factor multiplies the ratio by less than ½.
        </p>
      </Proof>

      <Theorem title="rules">
        <p>
          <M>{"O(f) + O(g) = O(\\max(f, g))"}</M>: the slower part of a program dominates its sequence. And{" "}
          <M>{"O(f)\\cdot O(g) = O(fg)"}</M>: a loop of f(n) passes doing g(n) work each costs <M>{"O(f g)"}</M>.
        </p>
      </Theorem>

      <Example title="counting loops">
        <p>
          Two nested loops over n items, each doing constant work, cost <M>{"\\Theta(n^2)"}</M>. A loop that halves n each pass
          runs <M>{"\\Theta(\\log n)"}</M> times. Trying every subset of n items costs at least <M>{"2^n"}</M>.
        </p>
      </Example>

      <Remark title="what big-O hides">
        <p>
          Big-O describes growth, not speed. An <M>{"O(n)"}</M> algorithm with a huge constant, or poor use of the processor
          cache, can lose to an <M>{"O(n \\log n)"}</M> one at every size you care about. Asymptotics tell you which algorithm
          to try first; benchmarks tell you which to keep.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dominant",
      rung: "check",
      prompt: <p>Which is the tightest bound for <M>{"5n^3 + 2^{10} n^2 + 7"}</M>?</p>,
      answer: { kind: "choice", options: ["Θ(n²)", "Θ(n³)", "Θ(2¹⁰ n²)", "Θ(n⁵)"], correct: [1] },
    },
    {
      key: "loops",
      rung: "check",
      prompt: <p>A loop runs i from 1 to n, and inside it j runs from 1 to i. How many times does the inner body run when n = 100?</p>,
      answer: { kind: "numeric", value: 5050 },
    },
    {
      key: "crossover",
      rung: "apply",
      prompt: <p>Algorithm A takes 100n steps, algorithm B takes n² steps. For the smallest n above which A is strictly faster, what is n?</p>,
      answer: { kind: "numeric", value: 101 },
    },
    {
      key: "order",
      rung: "apply",
      prompt: <p>Which grows fastest?</p>,
      answer: { kind: "choice", options: ["n¹⁰⁰", "1.01ⁿ", "n log n", "(log n)¹⁰⁰⁰"], correct: [1] },
    },
    {
      key: "halving",
      rung: "apply",
      prompt: <p>A loop starts at n = 1 000 000 and replaces n by n // 2 until n is 0. How many passes does it make?</p>,
      answer: { kind: "numeric", value: 20 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
for n in (10, 1000, 10 ** 6):
    print(n, round(n * math.log2(n) / n ** 2, 4))`}</Code>
          <p>The ratio n log₂ n / n² for growing n. What is the last value printed?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0", "0.0199", "1.0", "0.332"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Count steps instead of guessing. Write <C>count_steps(n)</C>, which returns a dict with the exact number of times the innermost line runs in three loops: <C>"nested"</C> (i from 0 to n − 1, j from 0 to n − 1), <C>"triangle"</C> (i from 0 to n − 1, j from 0 to i − 1) and <C>"halving"</C> (k starts at n and becomes k // 2 while k &gt; 0). Use closed forms, not loops.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def count_steps(n):
    return {'nested': n * n, 'triangle': n * n, 'halving': n}
`,
        solution: `def count_steps(n):
    return {'nested': n * n, 'triangle': n * (n - 1) // 2, 'halving': n.bit_length()}
`,
        tests: [
          { name: "small", code: `def brute(n):
    a = sum(1 for i in range(n) for j in range(n))
    b = sum(1 for i in range(n) for j in range(i))
    k, c = n, 0
    while k > 0:
        k //= 2; c += 1
    return {'nested': a, 'triangle': b, 'halving': c}
assert all(count_steps(n) == brute(n) for n in range(1, 60)), 'Compare with running the loops.'` },
          { name: "large", code: `assert count_steps(10 ** 6) == {'nested': 10 ** 12, 'triangle': 499999500000, 'halving': 20}, 'Halving a million takes 20 passes.'` },
        ],
      },
    },
    {
      key: "proof",
      rung: "prove",
      prompt: <p>Prove from the definition that <M>{"2n^2 + 5n = O(n^2)"}</M> and that <M>{"n^2"}</M> is not <M>{"O(n)"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Gives explicit constants, for example C = 7 and n₀ = 1, using 5n ≤ 5n² for n ≥ 1.",
          "For the second part, supposes n² ≤ Cn for all n ≥ n₀.",
          "Derives n ≤ C for all large n, which fails for n > max(C, n₀).",
        ],
      },
    },
    {
      key: "factorial",
      rung: "stretch",
      prompt: <p>Is <M>{"\\log_2(n!) = \\Theta(n \\log n)"}</M>? Answer by choosing.</p>,
      answer: { kind: "choice", options: ["Yes", "No: it is Θ(n)", "No: it is Θ(n²)", "No: it is Θ(log n)"], correct: [0] },
    },
  ],

  teachBack:
    "Explain to a friend what f = O(g) means, why constant factors are ignored, and how logarithms, polynomials and exponentials rank against each other.",

  glimpse: (
    <p>
      Next, divide and conquer, whose running times come from recurrences like T(n) = 2T(n/2) + n. Data Structures and
      Algorithms extends big-O to amortised costs and pairs it with honest benchmarking.
    </p>
  ),
};
