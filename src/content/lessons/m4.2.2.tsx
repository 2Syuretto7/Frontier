import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { RecurrenceRootViz } from "@/components/viz/RecurrenceRootViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.2.2",
  minutes: 65,
  links: {
    requires: ["m4.1.1", "m1.5.4", "m0.3.3"],
    foreshadows: ["m4.2.3", "m4.5.3", "e2.7.3"],
  },

  puzzle: (
    <>
      <p>
        How many ways can you climb a staircase of n steps, taking one or two steps at a time? For n = 1, 2, 3, 4 the answers
        are 1, 2, 3, 5. Is there a formula for n = 100 that does not mean listing the ways?
      </p>
      <p>
        The answers obey a rule linking each to the ones before. Turning such a rule into a formula is the subject of this
        lesson.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A recurrence describes a sequence by how each term is built from earlier ones. For a linear recurrence, try a
        geometric sequence <M>{"r^n"}</M>: it works exactly when r solves a quadratic, and every solution is a mix of these
        geometric pieces. The largest root wins in the long run, so the ratio of consecutive terms settles to it. Change the
        coefficients and starting values below.
      </p>
      <RecurrenceRootViz />
    </>
  ),

  theory: (
    <>
      <Definition title="recurrence relation">
        <p>
          A <strong>recurrence relation</strong> gives <M>{"a_n"}</M> in terms of earlier terms, together with enough{" "}
          <strong>initial conditions</strong> to start it. It is <strong>linear homogeneous of order 2 with constant
          coefficients</strong> when <M>{"a_n = p\\,a_{n-1} + q\\,a_{n-2}"}</M>.
        </p>
      </Definition>

      <Example title="the staircase">
        <p>
          The last move onto step n is a single step from n − 1 or a double step from n − 2. These cases are disjoint, so the
          sum rule gives <M>{"a_n = a_{n-1} + a_{n-2}"}</M>, with <M>{"a_1 = 1, a_2 = 2"}</M>. These are the Fibonacci
          numbers, shifted by one place.
        </p>
      </Example>

      <Theorem title="solving second-order linear recurrences">
        <p>
          Let the <strong>characteristic equation</strong> <M>{"x^2 = px + q"}</M> have roots <M>{"r_1, r_2"}</M>. If{" "}
          <M>{"r_1 \\ne r_2"}</M>, every solution is <M>{"a_n = A r_1^n + B r_2^n"}</M>. If <M>{"r_1 = r_2 = r \\ne 0"}</M>,
          every solution is <M>{"a_n = (A + Bn) r^n"}</M>. A and B are fixed by the initial conditions.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"r^n"}</M> satisfies the recurrence exactly when <M>{"r^n = p r^{n-1} + q r^{n-2}"}</M>, that is, when{" "}
          <M>{"r^2 = pr + q"}</M>. The recurrence is linear, so any combination <M>{"A r_1^n + B r_2^n"}</M> also satisfies it.
          A solution is determined by <M>{"a_0, a_1"}</M>, and when <M>{"r_1 \\ne r_2"}</M> the equations{" "}
          <M>{"A + B = a_0"}</M>, <M>{"A r_1 + B r_2 = a_1"}</M> always have a solution, so every sequence is of this form.
          The repeated-root case is checked by substituting <M>{"n r^n"}</M>.
        </p>
      </Proof>

      <Example title="Binet's formula">
        <p>
          For <M>{"F_n = F_{n-1} + F_{n-2}"}</M>, <M>{"F_0 = 0, F_1 = 1"}</M>: <M>{"x^2 = x + 1"}</M> has roots{" "}
          <M>{"\\varphi = \\tfrac{1+\\sqrt5}{2}"}</M> and <M>{"\\psi = \\tfrac{1-\\sqrt5}{2}"}</M>. The initial conditions give{" "}
          <M>{"A = -B = 1/\\sqrt5"}</M>, so <M>{"F_n = (\\varphi^n - \\psi^n)/\\sqrt5"}</M>. Since <M>{"|\\psi| < 1"}</M>,{" "}
          <M>{"F_n"}</M> is the integer nearest to <M>{"\\varphi^n/\\sqrt5"}</M>, and grows like <M>{"1.618^n"}</M>.
        </p>
      </Example>

      <Example title="a first-order recurrence with a constant">
        <p>
          The Tower of Hanoi needs <M>{"T_n = 2T_{n-1} + 1"}</M> moves, <M>{"T_0 = 0"}</M>. Adding 1 to both sides gives{" "}
          <M>{"T_n + 1 = 2(T_{n-1} + 1)"}</M>, a geometric sequence, so <M>{"T_n = 2^n - 1"}</M>.
        </p>
      </Example>

      <Remark title="recurrences for running times">
        <p>
          Algorithms produce recurrences too. A loop that does n work and then recurses on n − 1 costs{" "}
          <M>{"T(n) = T(n-1) + n"}</M>, which sums to about <M>{"n^2/2"}</M>. Divide and conquer gives recurrences like{" "}
          <M>{"T(n) = 2T(n/2) + n"}</M>, solved later in this course. Computing <M>{"F_n"}</M> by the recurrence directly,
          without remembering earlier values, makes about <M>{"\\varphi^n"}</M> calls; remembering them makes n. That is
          dynamic programming in one line.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "iterate",
      rung: "check",
      prompt: <p>If <M>{"a_0 = 2"}</M> and <M>{"a_n = 3a_{n-1} - 1"}</M>, what is <M>{"a_4"}</M>?</p>,
      answer: { kind: "numeric", value: 122 },
    },
    {
      key: "stairs",
      rung: "check",
      prompt: <p>How many ways are there to climb 10 stairs taking 1 or 2 steps at a time?</p>,
      answer: { kind: "numeric", value: 89 },
    },
    {
      key: "solve",
      rung: "apply",
      prompt: <p>Solve <M>{"a_n = 5a_{n-1} - 6a_{n-2}"}</M> with <M>{"a_0 = 1, a_1 = 4"}</M>. What is <M>{"a_6"}</M>?</p>,
      answer: { kind: "numeric", value: 1394 },
    },
    {
      key: "repeated",
      rung: "apply",
      prompt: <p>Solve <M>{"a_n = 4a_{n-1} - 4a_{n-2}"}</M> with <M>{"a_0 = 1, a_1 = 4"}</M>. What is <M>{"a_5"}</M>?</p>,
      answer: { kind: "numeric", value: 192 },
    },
    {
      key: "tiles",
      rung: "apply",
      prompt: <p>A 1 × n strip is tiled with 1 × 1 squares in 2 colours and 1 × 2 dominoes in 1 colour. With <M>{"t_n = 2t_{n-1} + t_{n-2}"}</M>, <M>{"t_0 = 1, t_1 = 2"}</M>, find <M>{"t_5"}</M>.</p>,
      answer: { kind: "numeric", value: 70 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`a = [1, 2]
for n in range(2, 8):
    a.append(a[-1] + a[-2])
print(a[-1])`}</Code>
          <p>The staircase recurrence, from a₁ = 1 and a₂ = 2. What is the last term printed?</p>
        </>
      ),
      answer: { kind: "numeric", value: 34 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from functools import lru_cache
calls = 0
def f(n):
    global calls
    calls += 1
    return n if n < 2 else f(n - 1) + f(n - 2)
@lru_cache(None)
def g(n):
    return n if n < 2 else g(n - 1) + g(n - 2)
print(f(10), calls, g(10), g.cache_info().currsize)`}</Code>
          <p>Naive recursion against memoised recursion for F₁₀. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["55 177 55 11", "55 109 55 11", "55 177 55 10", "89 177 89 11"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>solve2(p, q, a0, a1, n)</C>, which returns aₙ for aₙ = p·aₙ₋₁ + q·aₙ₋₂ by iterating (not recursing), and <C>binet(n)</C>, the n-th Fibonacci number computed as <C>round(φⁿ / √5)</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def solve2(p, q, a0, a1, n):
    if n == 0:
        return a0
    if n == 1:
        return a1
    return p * solve2(p, q, a0, a1, n - 1) + q * solve2(p, q, a0, a1, n - 2)

def binet(n):
    return n
`,
        solution: `import math

def solve2(p, q, a0, a1, n):
    a, b = a0, a1
    for _ in range(n):
        a, b = b, p * b + q * a
    return a

def binet(n):
    phi = (1 + math.sqrt(5)) / 2
    return round(phi ** n / math.sqrt(5))
`,
        tests: [
          { name: "fibonacci", code: `assert [solve2(1, 1, 0, 1, n) for n in range(10)] == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34], 'Start from a₀ and a₁ and step forward.'` },
          { name: "other", code: `assert solve2(5, -6, 1, 4, 6) == 1394 and solve2(4, -4, 1, 4, 5) == 192, 'Check against the closed forms from the lesson.'` },
          { name: "fast", code: `_orig = solve2
_calls = [0]
def solve2(*a):
    _calls[0] += 1
    assert _calls[0] < 5000, 'Iterate: recursion without memory makes about φⁿ calls.'
    return _orig(*a)
try:
    assert solve2(1, 1, 0, 1, 300) == 222232244629420445529739893461909967206666939096499764990979600, 'Iterate from a₀ and a₁.'
finally:
    solve2 = _orig` },
          { name: "binet", code: `assert all(binet(n) == solve2(1, 1, 0, 1, n) for n in range(60)), 'round(φⁿ/√5) gives Fₙ.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>kth_term(coeffs, init, n, mod)</C> for the linear recurrence aₙ = c₁aₙ₋₁ + c₂aₙ₋₂ + … + c_k aₙ₋ₖ, given <C>coeffs</C> = [c₁, …, c_k] and <C>init</C> = [a₀, …, a_(k−1)]: return aₙ mod <C>mod</C>. Use the k × k companion matrix (first row the coefficients, ones just below the diagonal) and repeated squaring, so that n = 10¹⁸ takes about 60 matrix products. Coefficients may be negative; the answer must lie in [0, mod).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def kth_term(coeffs, init, n, mod):
    return 0
`,
        solution: `def kth_term(coeffs, init, n, mod):
    k = len(coeffs)
    if n < k:
        return init[n] % mod
    def mul(A, B):
        return [[sum(A[i][t] * B[t][j] for t in range(k)) % mod for j in range(k)] for i in range(k)]
    M = [[0] * k for _ in range(k)]
    M[0] = [c % mod for c in coeffs]
    for i in range(1, k):
        M[i][i - 1] = 1
    Rm = [[int(i == j) for j in range(k)] for i in range(k)]
    e = n - k + 1
    while e:
        if e & 1:
            Rm = mul(Rm, M)
        M = mul(M, M)
        e >>= 1
    state = [init[k - 1 - i] for i in range(k)]
    return sum(Rm[0][j] * state[j] for j in range(k)) % mod
`,
        tests: [
          { name: "fibonacci", code: `assert kth_term([1, 1], [0, 1], 10, 10 ** 9) == 55 and kth_term([1, 1], [0, 1], 1, 7) == 1 and kth_term([1, 1], [0, 1], 0, 7) == 0, 'F₁₀ = 55.'` },
          { name: "tribonacci", code: `M = 10 ** 9 + 7
a = [0, 0, 1]
for _ in range(300):
    a.append((a[-1] + a[-2] + a[-3]) % M)
assert all(kth_term([1, 1, 1], [0, 0, 1], n, M) == a[n] for n in range(300)), 'Order 3 against a loop.'` },
          { name: "huge", code: `M = 10 ** 9 + 7
def fd(n):
    if n == 0:
        return (0, 1)
    a, b = fd(n // 2)
    c = a * (2 * b - a) % M
    d = (a * a + b * b) % M
    return (d, (c + d) % M) if n % 2 else (c, d)
assert kth_term([1, 1], [0, 1], 10 ** 18, M) == fd(10 ** 18)[0], 'F at 10¹⁸ by fast doubling.'` },
          { name: "negative", code: `assert kth_term([2, -1], [0, 1], 10 ** 15, 10 ** 9 + 7) == 10 ** 15 % (10 ** 9 + 7) and kth_term([0, -1], [1, 0], 3, 5) == 0 and kth_term([0, -1], [1, 0], 2, 5) == 4, 'aₙ = 2aₙ₋₁ − aₙ₋₂ gives aₙ = n; results lie in [0, mod).'` },
        ],
      },
    },
    {
      key: "verify",
      rung: "prove",
      prompt: (
        <p>
          Prove that if r is a root of <M>{"x^2 = px + q"}</M> then <M>{"a_n = r^n"}</M> satisfies{" "}
          <M>{"a_n = pa_{n-1} + qa_{n-2}"}</M>, and that any combination <M>{"Ar_1^n + Br_2^n"}</M> of two such solutions does
          too.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Multiplies r² = pr + q by rⁿ⁻² to get rⁿ = p rⁿ⁻¹ + q rⁿ⁻².",
          "Writes the recurrence for A r₁ⁿ + B r₂ⁿ and splits it into A times one identity plus B times the other.",
          "Names linearity of the recurrence as the reason combinations of solutions are solutions.",
        ],
      },
    },
    {
      key: "strings",
      rung: "stretch",
      prompt: <p>How many binary strings of length 10 have no two consecutive 1s?</p>,
      answer: { kind: "numeric", value: 144 },
    },
  ],

  teachBack:
    "Explain to a friend how to find a recurrence by looking at the last step, and how the characteristic equation turns the Fibonacci recurrence into a formula.",

  glimpse: (
    <p>
      Generating functions, next, solve recurrences by turning a sequence into a single function. Data Structures and
      Algorithms meets recurrences as running times, and dynamic programming is the art of evaluating a recurrence without
      recomputing its terms.
    </p>
  ),
};
