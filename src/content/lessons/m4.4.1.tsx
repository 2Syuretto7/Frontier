import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { DivisionViz } from "@/components/viz/DivisionViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.4.1",
  minutes: 55,
  links: {
    requires: ["m1.5.3", "m1.3.3"],
    foreshadows: ["m4.4.2", "m4.4.3"],
  },

  puzzle: (
    <>
      <p>
        A number is divisible by 9 exactly when the sum of its digits is. Is that a coincidence of base ten, or a theorem? And
        why can every whole number be split into primes in only one way?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Divisibility is the arithmetic of remainders. Dividing n by d leaves a unique remainder between 0 and d − 1: it is the
        smallest non-negative number you can reach from n by subtracting copies of d. Change n and d below and watch the
        subtraction stop.
      </p>
      <DivisionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="divides">
        <p>
          For integers a and b, <strong>a divides b</strong>, written a | b, if b = ak for some integer k. Then a is a{" "}
          <strong>divisor</strong> of b and b a <strong>multiple</strong> of a.
        </p>
      </Definition>

      <Theorem title="properties">
        <p>
          If a | b and a | c then a | (xb + yc) for all integers x, y. If a | b and b | c then a | c. If a | b and b ≠ 0 then
          |a| ≤ |b|.
        </p>
      </Theorem>
      <Proof>
        <p>
          With b = ak and c = al, xb + yc = a(xk + yl). With b = ak and c = bl, c = a(kl). If b = ak with b ≠ 0 then k ≠ 0, so
          |k| ≥ 1 and |b| = |a||k| ≥ |a|.
        </p>
      </Proof>

      <Theorem title="the division algorithm">
        <p>
          For integers n and d with d &gt; 0 there are unique integers q and r with n = qd + r and 0 ≤ r &lt; d.
        </p>
      </Theorem>
      <Proof>
        <p>
          Existence: the set {"{n − qd : q an integer}"} contains non-negative numbers, so by well-ordering it has a least
          non-negative element r = n − qd. If r ≥ d then r − d is a smaller non-negative element, so r &lt; d. Uniqueness: if
          qd + r = q′d + r′ with both remainders in [0, d), then d | (r − r′) and |r − r′| &lt; d, so r = r′ and q = q′.
        </p>
      </Proof>

      <Definition title="primes">
        <p>
          An integer p ≥ 2 is <strong>prime</strong> if its only positive divisors are 1 and p; otherwise it is{" "}
          <strong>composite</strong>. A composite n has a divisor d with 1 &lt; d ≤ √n, since if n = ab with a ≤ b then
          a² ≤ n. So to test primality it is enough to try divisors up to √n.
        </p>
      </Definition>

      <Theorem title="the fundamental theorem of arithmetic">
        <p>
          Every integer n ≥ 2 is a product of primes, and this product is unique apart from the order of the factors.
        </p>
      </Theorem>
      <Proof>
        <p>
          Existence was proved by strong induction in Proof and Logic. Uniqueness rests on Euclid&rsquo;s lemma, proved in the
          next lesson: if a prime p divides ab, it divides a or b. Given two factorisations{" "}
          <M>{"p_1 \\cdots p_r = q_1 \\cdots q_s"}</M>, the prime <M>{"p_1"}</M> divides the right side, so it divides some{" "}
          <M>{"q_j"}</M>, and as <M>{"q_j"}</M> is prime, <M>{"p_1 = q_j"}</M>. Cancel and repeat.
        </p>
      </Proof>

      <Example title="the rule for 9">
        <p>
          <M>{"n = \\sum d_i 10^i"}</M> and <M>{"10^i - 1 = 99\\cdots9"}</M> is divisible by 9, so{" "}
          <M>{"n - \\sum d_i = \\sum d_i(10^i - 1)"}</M> is divisible by 9. Hence n and its digit sum leave the same remainder
          on division by 9. The same argument gives the rule for 3, and, using 10 ≡ −1, the alternating-sum rule for 11.
        </p>
      </Example>

      <Remark title="factoring is hard">
        <p>
          Multiplying two 300-digit primes takes a moment; recovering them from the product is beyond any known classical
          algorithm in any reasonable time. RSA encryption is built on that asymmetry.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rem",
      rung: "check",
      prompt: <p>What is the remainder when −17 is divided by 5, with 0 ≤ r &lt; 5?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "primes",
      rung: "check",
      prompt: <p>To test whether 391 is prime by trial division, what is the largest prime you need to try?</p>,
      answer: { kind: "numeric", value: 19 },
    },
    {
      key: "factor",
      rung: "apply",
      prompt: <p>391 is not prime. What is its largest prime factor?</p>,
      answer: { kind: "numeric", value: 23 },
    },
    {
      key: "eleven",
      rung: "apply",
      prompt: <p>What is the remainder when 918 273 645 is divided by 9?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "zeros",
      rung: "apply",
      prompt: <p>How many zeros does 100! end with?</p>,
      answer: { kind: "numeric", value: 24 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`n = 360
f, d = [], 2
while n > 1:
    while n % d == 0:
        f.append(d)
        n //= d
    d += 1
print(f)`}</Code>
          <p>Trial division factorises 360. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2, 2, 2, 3, 3, 5]", "[2, 3, 5]", "[2, 2, 3, 3, 5]", "[8, 9, 5]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`print(-7 // 2, -7 % 2, divmod(-7, -2), int(-7 / 2))`}</Code>
          <p>Python&rsquo;s floor division and remainder with negative numbers, and truncation. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-4 1 (3, -1) -3", "-3 -1 (3, -1) -3", "-4 1 (4, 1) -4", "-4 -1 (3, -1) -3"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>divmod_floor(n, d)</C>, which returns (q, r) with n = qd + r and 0 ≤ r &lt; d for any integer n and d &gt; 0, without using <C>//</C>, <C>%</C> or <C>divmod</C>, and <C>is_prime(n)</C> by trial division up to √n.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def divmod_floor(n, d):
    q = int(n / d)
    return (q, n - q * d)

def is_prime(n):
    return n > 1
`,
        solution: `def divmod_floor(n, d):
    q = 0
    while n - q * d >= d:
        q += 1
    while n - q * d < 0:
        q -= 1
    return (q, n - q * d)

def is_prime(n):
    if n < 2:
        return False
    k = 2
    while k * k <= n:
        if n - (n // k) * k == 0:
            return False
        k += 1
    return True
`,
        tests: [
          { name: "negative", code: `assert divmod_floor(-17, 5) == (-4, 3) and divmod_floor(17, 5) == (3, 2), 'The remainder must lie in [0, d), even for negative n.'` },
          { name: "agree", code: `assert all(divmod_floor(n, d) == divmod(n, d) for n in range(-40, 41) for d in range(1, 9)), 'Match Python’s divmod for positive d.'` },
          { name: "primes", code: `assert [n for n in range(50) if is_prime(n)] == [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47] and not is_prime(391), 'Try divisors up to √n.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>factorise(n)</C> for n ≥ 1, a dict mapping each prime factor to its exponent, by trial division up to √n (1 gives the empty dict). From the factorisation, write <C>num_divisors(n)</C> = Π (eᵢ + 1), <C>sigma(n)</C>, the sum of the divisors, Π (pᵢ^(eᵢ+1) − 1)/(pᵢ − 1), and <C>divisors(n)</C>, the sorted list of all divisors built by combining prime powers (do not test every number up to n).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def factorise(n):
    return {n: 1}

def num_divisors(n):
    return 2

def sigma(n):
    return n + 1

def divisors(n):
    return [1, n]
`,
        solution: `def factorise(n):
    f = {}
    q = 2
    while q * q <= n:
        while n % q == 0:
            f[q] = f.get(q, 0) + 1
            n //= q
        q += 1 if q == 2 else 2
    if n > 1:
        f[n] = f.get(n, 0) + 1
    return f

def num_divisors(n):
    r = 1
    for e in factorise(n).values():
        r *= e + 1
    return r

def sigma(n):
    r = 1
    for q, e in factorise(n).items():
        r *= (q ** (e + 1) - 1) // (q - 1)
    return r

def divisors(n):
    ds = [1]
    for q, e in factorise(n).items():
        ds = [d * q ** i for d in ds for i in range(e + 1)]
    return sorted(ds)
`,
        tests: [
          { name: "factorise", code: `assert factorise(360) == {2: 3, 3: 2, 5: 1} and factorise(1) == {} and factorise(999983) == {999983: 1} and factorise(2 ** 40 * 3) == {2: 40, 3: 1} and factorise(999983 * 1000003) == {999983: 1, 1000003: 1}, '360 = 2³ · 3² · 5.'` },
          { name: "counts", code: `assert num_divisors(360) == 24 and sigma(360) == 1170 and divisors(36) == [1, 2, 3, 4, 6, 9, 12, 18, 36], '360 has (3 + 1)(2 + 1)(1 + 1) = 24 divisors.'` },
          { name: "brute", code: `for n in range(1, 500):
    ds = [d for d in range(1, n + 1) if n % d == 0]
    assert divisors(n) == ds and num_divisors(n) == len(ds) and sigma(n) == sum(ds), f'n = {n}'` },
          { name: "perfect", code: `assert all(sigma(n) == 2 * n for n in (6, 28, 496, 8128, 33550336)) and sigma(12) != 24, 'Perfect numbers have σ(n) = 2n.'` },
        ],
      },
    },
    {
      key: "sumprove",
      rung: "prove",
      prompt: <p>Prove that if a | b and a | c then a | (b − c), and use it to show that consecutive integers n and n + 1 have no common divisor greater than 1.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes b = ak and c = al, so b − c = a(k − l).",
          "Applies this to n + 1 and n: any common divisor d divides 1.",
          "Concludes d = 1 (for positive d).",
        ],
      },
    },
    {
      key: "divisors",
      rung: "stretch",
      prompt: <p>What is the sum of all positive divisors of 360?</p>,
      answer: { kind: "numeric", value: 1170 },
    },
  ],

  teachBack:
    "Explain to a friend the division algorithm and why it gives a unique remainder, and why a number and its digit sum leave the same remainder on division by 9.",

  glimpse: (
    <p>
      Next, the greatest common divisor and Euclid&rsquo;s algorithm, which computes it without factoring. Remainders then
      become a number system of their own, modular arithmetic, which drives hashing and cryptography.
    </p>
  ),
};
