import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DoublingViz } from "@/components/viz/DoublingViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.1.1",
  minutes: 60,
  links: {
    requires: ["e1.5.2"],
    revisits: ["m4.5.2", "e0.2.2"],
    parallels: ["m4.5.3"],
    foreshadows: ["e2.1.2", "e2.1.3"],
  },

  puzzle: (
    <>
      <p>A function removes duplicates from a list while keeping the first occurrence of each item:</p>
      <Code>{`def dedupe(xs):
    seen, out = [], []
    for x in xs:
        if x not in seen:
            seen.append(x)
            out.append(x)
    return out`}</Code>
      <p>
        On 1000 items it is instant. On 100 000 distinct items it takes about a minute. Changing one character,{" "}
        <C>seen = set()</C> with <C>seen.add(x)</C>, brings it down to a few hundredths of a second. Nothing about the loop
        changed. What did?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        <C>x not in seen</C> looks like one step, but on a list it walks the list from the front. With k items seen so far, the
        i-th test costs up to k comparisons, so the whole loop does 0 + 1 + 2 + … + (n − 1), about n²/2 comparisons. On a set
        the test jumps straight to where x would be, so the loop does about n steps. Asymptotic analysis is the habit of
        counting what each line really costs and asking how the total grows with n.
      </p>
      <p>
        The cleanest experiment is to double n and see what happens to the count. Linear work doubles, quadratic work
        quadruples, logarithmic work grows by one step. Try each loop below.
      </p>
      <DoublingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the cost model">
        <p>
          We count <strong>basic operations</strong>: arithmetic on machine-sized numbers, comparisons, reading or writing one
          memory cell, a function call. Each costs a constant amount of time. The <strong>running time</strong> T(n) is the
          number of basic operations as a function of the input size n, and we describe it with the notation of{" "}
          <M>{"O"}</M>, <M>{"\\Omega"}</M> and <M>{"\\Theta"}</M>: <M>{"T = \\Theta(g)"}</M> means{" "}
          <M>{"c_1 g(n) \\le T(n) \\le c_2 g(n)"}</M> for some positive constants and all large n.
        </p>
      </Definition>

      <Definition title="worst, best and average case">
        <p>
          Inputs of the same size can cost different amounts. The <strong>worst case</strong> is the maximum over all inputs of
          size n, the <strong>best case</strong> the minimum, and the <strong>average case</strong> the expectation under a
          stated distribution of inputs. Linear search for x in a list of n items is Θ(1) at best (x is first), Θ(n) at worst
          (x is absent), and about n/2 comparisons on average if x is present at a uniformly random position. Unless we say
          otherwise, a bound means the worst case: it is a guarantee.
        </p>
      </Definition>

      <Theorem title="rules for loops">
        <ul>
          <li><strong>Sequence:</strong> the cost of A then B is the cost of A plus the cost of B, so the larger term wins.</li>
          <li><strong>Loop:</strong> the cost of a loop is the sum, over its iterations, of the cost of the body.</li>
          <li>
            <strong>Independent nested loops</strong> multiply: n outer trips of an m-step body cost Θ(nm). When the inner
            bound depends on the outer variable, add up the actual counts.
          </li>
        </ul>
      </Theorem>

      <Example title="four loops worth knowing">
        <ul>
          <li>
            <C>for i in range(n): for j in range(i)</C> runs <M>{"\\sum_{i=0}^{n-1} i = n(n-1)/2 = \\Theta(n^2)"}</M> times.
          </li>
          <li><C>while n &gt; 1: n //= 2</C> runs <M>{"\\lfloor \\log_2 n \\rfloor = \\Theta(\\log n)"}</M> times.</li>
          <li>
            <C>for i in 1..n: for j in range(0, n, i)</C> runs <M>{"\\sum_i \\lceil n/i \\rceil \\approx n H_n \\approx n \\ln n"}</M>{" "}
            times, <M>{"\\Theta(n \\log n)"}</M>, because the harmonic number <M>{"H_n = 1 + \\tfrac12 + \\dots + \\tfrac1n"}</M>{" "}
            is about <M>{"\\ln n"}</M>.
          </li>
          <li>
            An inner loop of length i, with i doubling from 1 up to n, runs <M>{"1 + 2 + 4 + \\dots < 2n"}</M> times in all: two
            nested loops, yet Θ(n).
          </li>
        </ul>
      </Example>

      <Theorem title="the master theorem">
        <p>
          If a recursive algorithm splits a problem of size n into a subproblems of size n/b and does{" "}
          <M>{"f(n) = \\Theta(n^d)"}</M> work to split and combine, then <M>{"T(n) = aT(n/b) + f(n)"}</M> solves to
        </p>
        <ul>
          <li><M>{"\\Theta(n^d)"}</M> if <M>{"a < b^d"}</M> (the top level dominates);</li>
          <li><M>{"\\Theta(n^d \\log n)"}</M> if <M>{"a = b^d"}</M> (every level costs the same);</li>
          <li><M>{"\\Theta(n^{\\log_b a})"}</M> if <M>{"a > b^d"}</M> (the leaves dominate).</li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          Level j of the recursion tree has <M>{"a^j"}</M> subproblems of size <M>{"n/b^j"}</M>, costing{" "}
          <M>{"a^j (n/b^j)^d = n^d (a/b^d)^j"}</M> in total. There are <M>{"\\log_b n"}</M> levels, so T(n) is{" "}
          <M>{"n^d"}</M> times a geometric series with ratio <M>{"r = a/b^d"}</M>. If r &lt; 1 the series is a constant; if r = 1
          every term is 1 and there are <M>{"\\Theta(\\log n)"}</M> of them; if r &gt; 1 the last term dominates, giving{" "}
          <M>{"n^d r^{\\log_b n} = a^{\\log_b n} = n^{\\log_b a}"}</M>.
        </p>
      </Proof>
      <Example title="three recurrences">
        <p>
          Merge sort, <M>{"T(n) = 2T(n/2) + \\Theta(n)"}</M>: a = 2 = b¹, so <M>{"\\Theta(n \\log n)"}</M>. Binary search,{" "}
          <M>{"T(n) = T(n/2) + \\Theta(1)"}</M>: a = 1 = b⁰, so <M>{"\\Theta(\\log n)"}</M>. Karatsuba multiplication,{" "}
          <M>{"T(n) = 3T(n/2) + \\Theta(n)"}</M>: 3 &gt; 2, so <M>{"\\Theta(n^{\\log_2 3}) \\approx \\Theta(n^{1.585})"}</M>.
        </p>
      </Example>

      <Definition title="what Python's operations cost">
        <p>
          Asymptotic analysis of real code needs the cost of each built-in. For a list of length n: indexing, <C>len</C>,{" "}
          <C>append</C> and <C>pop()</C> are O(1) (append amortised, as the next lesson shows); <C>insert(0, x)</C>,{" "}
          <C>pop(0)</C>, <C>x in xs</C>, <C>xs.index(x)</C> and <C>xs.remove(x)</C> are O(n); a slice <C>xs[a:b]</C> copies, so
          costs O(b − a); <C>sorted</C> is O(n log n). For a dict or set, lookup, insertion and deletion are O(1) on average.
          Building a string with <C>s += piece</C> in a loop can copy the whole string each time, O(n²) in total, where{" "}
          <C>{`"".join(pieces)`}</C> is O(n).
        </p>
      </Definition>

      <Remark title="measure the input honestly">
        <p>
          The size n is the length of the input. For a list it is the number of items; for a number it is the number of digits
          or bits. Testing whether N is prime by trying every divisor up to <M>{"\\sqrt N"}</M> takes{" "}
          <M>{"\\sqrt N = 2^{b/2}"}</M> steps for a b-bit number: exponential in the input size, which is why cryptography can
          rely on factoring being hard.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "triangle",
      rung: "check",
      prompt: (
        <>
          <Code>{`for i in range(n):
    for j in range(i, n):
        work()`}</Code>
          <p>How does the number of calls to <C>work()</C> grow with n?</p>
        </>
      ),
      answer: { kind: "choice", options: ["Θ(n²)", "Θ(n)", "Θ(n log n)", "Θ(n³)"], correct: [0] },
    },
    {
      key: "halve",
      rung: "check",
      prompt: <p>How many times does the body of <C>while n &gt; 1: n //= 2</C> run when n starts at 1000?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "harmonic",
      rung: "apply",
      prompt: (
        <>
          <Code>{`for i in range(1, n + 1):
    for j in range(i, n + 1, i):
        work()`}</Code>
          <p>What is the growth rate of the number of calls to <C>work()</C>?</p>
        </>
      ),
      answer: { kind: "choice", options: ["Θ(n log n)", "Θ(n²)", "Θ(n)", "Θ(n √n)"], correct: [0] },
    },
    {
      key: "master",
      rung: "apply",
      prompt: <p>Solve <M>{"T(n) = 4T(n/2) + n"}</M>. What is the exponent p in <M>{"T(n) = \\Theta(n^p)"}</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "doubling",
      rung: "apply",
      prompt: <p>A function takes 0.4 s on 100 000 items and 3.2 s on 200 000 items. If its cost is about <M>{"c\\,n^p"}</M>, what is p?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "builtins",
      rung: "apply",
      prompt: <p>Which of these loops over a list <C>xs</C> of n items is Θ(n²) in the worst case?</p>,
      answer: {
        kind: "choice",
        options: [
          "while xs: xs.pop(0)",
          "while xs: xs.pop()",
          "for x in xs: total += x",
          "for i in range(len(xs)): xs[i] *= 2",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def count(n):
    c = 0
    i = 1
    while i < n:
        for j in range(i):
            c += 1
        i *= 2
    return c

print(count(1000), count(2000))`}</Code>
          <p>Two nested loops. What does this print, and so how does the count grow?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1023 2047", "9990 21978", "10 11", "511 1023"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`calls = 0

def f(n):
    global calls
    calls += 1
    if n <= 1:
        return 1
    return f(n // 2) + f(n // 2) + f(n // 2)

f(64)
a = calls
calls = 0
f(128)
print(a, calls, round(calls / a, 2))`}</Code>
          <p>Count the calls in a recursion with three half-size subproblems. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1093 3280 3.0", "127 255 2.01", "1093 2186 2.0", "729 2187 3.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Turn the doubling experiment into a tool. Write <C>fit_power(ns, costs)</C>, which fits <M>{"\\text{cost} \\approx a\\,n^b"}</M>{" "}
            by least squares on the logarithms (the slope of log cost against log n is b) and returns <C>(a, b)</C>. Then write{" "}
            <C>classify(ns, costs)</C>, which returns whichever of <C>"log n"</C>, <C>"n"</C>, <C>"n log n"</C>, <C>"n^2"</C>,{" "}
            <C>"n^3"</C> fits best: divide the costs by each candidate g(n) and pick the candidate whose ratios are most nearly
            constant, measured by max ratio ÷ min ratio.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def fit_power(ns, costs):
    return (1.0, 1.0)

def classify(ns, costs):
    return "n"
`,
        solution: `import math

def fit_power(ns, costs):
    xs = [math.log(n) for n in ns]
    ys = [math.log(c) for c in costs]
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
    return (math.exp(my - b * mx), b)

CANDIDATES = {
    "log n": lambda n: math.log(n),
    "n": lambda n: n,
    "n log n": lambda n: n * math.log(n),
    "n^2": lambda n: n ** 2,
    "n^3": lambda n: n ** 3,
}

def classify(ns, costs):
    def spread(g):
        r = [c / g(n) for n, c in zip(ns, costs)]
        return max(r) / min(r)
    return min(CANDIDATES, key=lambda name: spread(CANDIDATES[name]))
`,
        tests: [
          { name: "exact powers", code: `ns = [2 ** k for k in range(4, 12)]
a, b = fit_power(ns, [5 * n ** 2 for n in ns])
assert abs(b - 2) < 1e-9 and abs(a - 5) < 1e-6, 'For cost = 5n², the slope is 2 and the constant 5.'
a, b = fit_power(ns, [0.5 * n ** 1.5 for n in ns])
assert abs(b - 1.5) < 1e-9 and abs(a - 0.5) < 1e-6` },
          { name: "n log n slope", code: `import math
ns = [2 ** k for k in range(10, 20)]
a, b = fit_power(ns, [n * math.log2(n) for n in ns])
assert 1.0 < b < 1.15, 'n log n fits a power a little above 1.'` },
          { name: "classify", code: `import math
ns = [2 ** k for k in range(10, 21)]
assert classify(ns, [0.5 * n * n + 100 * n for n in ns]) == "n^2", 'Lower-order terms fade as n grows.'
assert classify(ns, [3 * n * math.log2(n) + 7 for n in ns]) == "n log n"
assert classify(ns, [20 * math.log2(n) for n in ns]) == "log n"
assert classify(ns, [n + 1000 for n in ns]) == "n"
assert classify(ns, [n ** 3 / 6 for n in ns]) == "n^3"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Each of these functions is correct but quadratic, because of a hidden linear-time operation inside a loop:</p>
          <Code>{`def dedupe(xs):            # keep first occurrences, in order
    out = []
    for x in xs:
        if x not in out:
            out.append(x)
    return out

def common(a, b):          # items of a that also occur in b, in a's order
    return [x for x in a if x in b]

def pair_with_sum(xs, t):  # first (i, j), i < j, by smallest j, with xs[i] + xs[j] == t
    for j in range(len(xs)):
        for i in range(j):
            if xs[i] + xs[j] == t:
                return (i, j)
    return None`}</Code>
          <p>
            Rewrite all three to run in O(n) expected time, with exactly the same results. For <C>pair_with_sum</C>, the smallest
            j comes first and, for that j, the smallest i.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def dedupe(xs):
    return list(xs)

def common(a, b):
    return []

def pair_with_sum(xs, t):
    return None
`,
        solution: `def dedupe(xs):
    seen, out = set(), []
    for x in xs:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out

def common(a, b):
    bs = set(b)
    return [x for x in a if x in bs]

def pair_with_sum(xs, t):
    first = {}
    for j, x in enumerate(xs):
        if t - x in first:
            return (first[t - x], j)
        if x not in first:
            first[x] = j
    return None
`,
        tests: [
          { name: "small", code: `assert dedupe([3, 1, 3, 2, 1, 4]) == [3, 1, 2, 4] and dedupe([]) == []
assert common([5, 1, 5, 2], [2, 5, 9]) == [5, 5, 2]
assert pair_with_sum([2, 7, 11, 15], 9) == (0, 1) and pair_with_sum([1, 2], 7) is None` },
          { name: "pair order", code: `assert pair_with_sum([3, 3, 4, 2], 6) == (0, 1), 'Equal values can pair.'
assert pair_with_sum([5, 1, 5, 1], 6) == (0, 1)
assert pair_with_sum([4, 9, 2, 2], 4) == (2, 3), 'An item cannot pair with itself.'
assert pair_with_sum([1, 5, 1, 5], 6) == (0, 1) and pair_with_sum([2, 1, 1, 4], 5) == (1, 3), 'Smallest j, then smallest i.'` },
          { name: "random agreement", code: `import random
rng = random.Random(1)
def slow(xs, t):
    for j in range(len(xs)):
        for i in range(j):
            if xs[i] + xs[j] == t:
                return (i, j)
for _ in range(300):
    xs = [rng.randint(0, 20) for _ in range(rng.randint(0, 25))]
    t = rng.randint(0, 40)
    assert pair_with_sum(xs, t) == slow(xs, t), (xs, t)` },
          { name: "fast", code: `import time
n = 200000
xs = list(range(n)) + list(range(n))
t0 = time.time()
assert dedupe(xs) == list(range(n))
assert len(common(list(range(n)), list(range(n // 2, 3 * n // 2)))) == n // 2
assert pair_with_sum(list(range(0, 2 * n, 2)), 4 * n - 6) == (n - 2, n - 1)
assert time.time() - t0 < 3, 'Use sets and dicts so that each test is O(1).'` },
        ],
      },
    },
    {
      key: "geometric",
      rung: "prove",
      prompt: <p>Prove that the function <C>count(n)</C> in the reading exercise returns less than 2n for every n ≥ 2.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Identifies the values of i as 1, 2, 4, …, 2ᵏ where 2ᵏ is the largest power of two below n.",
          "Sums the inner loop counts as the geometric series 1 + 2 + … + 2ᵏ = 2ᵏ⁺¹ − 1.",
          "Uses 2ᵏ < n to conclude 2ᵏ⁺¹ − 1 < 2n.",
        ],
      },
    },
    {
      key: "nlog2n",
      rung: "stretch",
      prompt: (
        <p>
          The master theorem as stated needs <M>{"f(n) = \\Theta(n^d)"}</M>. Show directly from the recursion tree that{" "}
          <M>{"T(n) = 2T(n/2) + n\\log_2 n"}</M>, with T(1) = 0 and n a power of 2, is <M>{"\\Theta(n \\log^2 n)"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Level j has 2ʲ subproblems of size n/2ʲ, costing n log₂(n/2ʲ) = n(log₂ n − j) in total.",
          "Sums over j = 0, …, log₂ n − 1 to get n(L + (L − 1) + … + 1) = n L(L + 1)/2 with L = log₂ n.",
          "Concludes that this is Θ(n log² n), giving both the upper and the lower bound.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why the list version of dedupe is quadratic and the set version linear, and how doubling n tells you the growth rate of a piece of code.",

  glimpse: (
    <p>
      Worst-case bounds can be pessimistic for a sequence of operations where expensive steps are rare: amortised analysis, next,
      averages the cost over the sequence. Asymptotics also say nothing about constants, so the third lesson in this chapter
      turns to measuring real running times honestly. Every later data structure in this course is judged by these bounds.
    </p>
  ),
};
