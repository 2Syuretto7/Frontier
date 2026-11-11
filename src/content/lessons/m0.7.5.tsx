import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { PascalViz } from "@/components/viz/PascalViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.7.5",
  minutes: 70,
  links: {
    revisits: ["m0.2.6", "m0.7.3"],
    foreshadows: ["m2.8.5", "m4.1.3"],
  },

  puzzle: (
    <>
      <p>Look at the powers of 11:</p>
      <MD>{"11^0 = 1, \\quad 11^1 = 11, \\quad 11^2 = 121, \\quad 11^3 = 1331, \\quad 11^4 = 14641."}</MD>
      <p>
        Read the digits as rows, and stack them in a triangle. What rule makes each row from the one above? And why should
        powers of 11 have anything to do with expanding <M>{"(1 + x)^n"}</M>?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Since <M>{"11 = 10 + 1"}</M>, a power of 11 is <M>{"(10 + 1)^n"}</M>, and expanding <M>{"(x + 1)^n"}</M> gives the
        same coefficients 1, 4, 6, 4, 1 for <M>{"n = 4"}</M>. Each row comes from the one above by adding neighbours, because
        multiplying by <M>{"(1 + x)"}</M> adds each coefficient to the one beside it.
      </p>
      <p>
        And the numbers are old friends: 6 is <M>{"\\binom42"}</M>, the number of ways to choose 2 things from 4. Expanding{" "}
        <M>{"(1 + x)^4"}</M> means choosing, from each of the four brackets, either the 1 or the <M>x</M>; the coefficient of{" "}
        <M>{"x^2"}</M> counts the ways to choose which two brackets supply an <M>x</M>. (The pattern of digits breaks at{" "}
        <M>{"11^5"}</M>, where the coefficients 10 start to carry.)
      </p>
      <PascalViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Pascal’s triangle">
        <p>
          Row <M>n</M> of <strong>Pascal&rsquo;s triangle</strong>, counting the top as row 0, lists{" "}
          <M>{"\\binom{n}{0}, \\binom{n}{1}, \\ldots, \\binom{n}{n}"}</M>.
        </p>
      </Definition>

      <Proposition title="Pascal’s rule">
        <p>For <M>{"1 \\le r \\le n"}</M>, <M>{"\\binom{n+1}{r} = \\binom{n}{r-1} + \\binom{n}{r}"}</M>.</p>
      </Proposition>
      <Proof>
        <p>
          Choose <M>r</M> people from a group of <M>{"n + 1"}</M>, one of whom is Asha. Either Asha is chosen, and the other{" "}
          <M>{"r - 1"}</M> come from the remaining <M>n</M>, in <M>{"\\binom{n}{r-1}"}</M> ways; or she is not, and all{" "}
          <M>r</M> come from the remaining <M>n</M>, in <M>{"\\binom{n}{r}"}</M> ways. These cases do not overlap, so add.
        </p>
      </Proof>

      <Theorem title="the binomial theorem">
        <p>For every whole number <M>n</M> and all numbers <M>a</M> and <M>b</M>,</p>
        <MD>{"(a + b)^n = \\sum_{r=0}^{n} \\binom{n}{r} a^{n-r} b^{r} = a^n + \\binom{n}{1}a^{n-1}b + \\binom{n}{2}a^{n-2}b^2 + \\cdots + b^n."}</MD>
      </Theorem>
      <Proof>
        <p>
          Multiply out <M>{"(a + b)(a + b)\\cdots(a + b)"}</M>, with <M>n</M> brackets, by choosing one letter from each
          bracket in every possible way and adding the products. A product equals <M>{"a^{n-r}b^r"}</M> exactly when{" "}
          <M>b</M> was chosen from <M>r</M> of the brackets, and there are <M>{"\\binom{n}{r}"}</M> ways to pick which{" "}
          <M>r</M>. (Induction with Pascal&rsquo;s rule gives a second proof.)
        </p>
      </Proof>

      <Proposition title="row sums">
        <p>
          <M>{"\\sum_{r=0}^{n} \\binom{n}{r} = 2^n"}</M>, and, for <M>{"n \\ge 1"}</M>,{" "}
          <M>{"\\sum_{r=0}^{n} (-1)^r \\binom{n}{r} = 0"}</M>.
        </p>
      </Proposition>
      <Proof>
        <p>
          Put <M>{"a = b = 1"}</M> in the binomial theorem, then <M>{"a = 1"}</M>, <M>{"b = -1"}</M>. The first also has a
          counting proof: both sides count all the subsets of a set of <M>n</M> things, since each thing is either in or out.
        </p>
      </Proof>

      <Example title="a quick estimate">
        <p>
          <M>{"1.01^{10} = (1 + 0.01)^{10} = 1 + 10(0.01) + 45(0.0001) + 120(0.000001) + \\cdots \\approx 1.1046"}</M>. The
          later terms shrink so fast that the first few give the answer to four decimal places, a trick for compound interest
          long before calculators.
        </p>
      </Example>

      <Remark title="a triangle with many names">
        <p>
          The triangle is called Pascal&rsquo;s after Blaise Pascal&rsquo;s treatise of 1654, but it is much older. The
          tenth-century commentator Halayudha described it, as the <em>meru-prastāra</em>, the staircase of Mount Meru, to
          count Pingala&rsquo;s metres. In Persia it is linked with al-Karaji and Omar Khayyam, in China it is Yang Hui&rsquo;s
          triangle, from his book of 1261. Shade its odd entries, as in the picture, and a pattern appears that the Polish
          mathematician Wacław Sierpiński studied in 1915, a shape made of smaller copies of itself.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "choose",
      rung: "check",
      prompt: <p>What is <M>{"\\binom{6}{2}"}</M>?</p>,
      answer: { kind: "numeric", value: 15 },
    },
    {
      key: "coefficient",
      rung: "check",
      prompt: <p>What is the coefficient of <M>{"x^3"}</M> in <M>{"(1 + x)^5"}</M>?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "coefficient-2",
      rung: "apply",
      prompt: <p>What is the coefficient of <M>{"x^2"}</M> in <M>{"(2 + x)^5"}</M>?</p>,
      answer: { kind: "numeric", value: 80 },
    },
    {
      key: "row-sum",
      rung: "apply",
      prompt: <p>What is <M>{"\\binom{10}{0} + \\binom{10}{1} + \\cdots + \\binom{10}{10}"}</M>?</p>,
      answer: { kind: "numeric", value: 1024 },
    },
    {
      key: "estimate",
      rung: "apply",
      prompt: <p>Use the binomial theorem to find <M>{"1.01^5"}</M> to four decimal places.</p>,
      answer: { kind: "numeric", value: 1.051, tolerance: 0.0001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`row = [1]
for _ in range(5):
    row = [a + b for a, b in zip([0] + row, row + [0])]
print(row)`}</Code>
          <p>Each row of Pascal's triangle comes from the one above. Which row is printed?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1, 5, 10, 10, 5, 1]", "[1, 4, 6, 4, 1]", "[1, 6, 15, 20, 15, 6, 1]", "[1, 5, 10, 5, 1]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`row = [1]
for _ in range(6):
    row = [a + b for a, b in zip([0] + row, row + [0])]
print(row, sum(row), row[2])`}</Code>
          <p>Building Pascal's triangle row by row. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1, 6, 15, 20, 15, 6, 1] 64 15", "[1, 5, 10, 10, 5, 1] 32 10", "[1, 6, 15, 20, 15, 6, 1] 64 20", "[1, 7, 21, 35, 35, 21, 7, 1] 128 21"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>expand(a, b, n)</C>, which returns the coefficients of (ax + b)ⁿ as a list from the xⁿ term down to the constant, using the binomial theorem and <C>math.comb</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def expand(a, b, n):
    return [math.comb(n, k) for k in range(n + 1)]
`,
        solution: `import math

def expand(a, b, n):
    return [math.comb(n, k) * a ** (n - k) * b ** k for k in range(n + 1)]
`,
        tests: [
          { name: "plain", code: `assert expand(1, 1, 4) == [1, 4, 6, 4, 1], '(x + 1)⁴ gives a row of Pascal’s triangle.'` },
          { name: "weighted", code: `assert expand(2, -3, 2) == [4, -12, 9] and expand(1, -1, 3) == [1, -3, 3, -1], 'Each term carries a^(n − k) b^k.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>binom_mod_p(n, k, p)</C>, the binomial coefficient C(n, k) modulo a prime p, for n and k up to 10¹⁸, by Lucas&rsquo;s theorem: write n and k in base p and multiply C(nᵢ, kᵢ) mod p over the digits (0 if some kᵢ &gt; nᵢ). Compute each small C(nᵢ, kᵢ) with <C>math.comb</C>. Then write <C>odd_entries(n)</C>, the number of odd numbers in row n of Pascal&rsquo;s triangle, which by Lucas is 2 to the number of 1 bits of n.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `from math import comb

def binom_mod_p(n, k, p):
    return 1 if k <= n else 0

def odd_entries(n):
    return n + 1
`,
        solution: `from math import comb

def binom_mod_p(n, k, p):
    r = 1
    while n or k:
        a, b = n % p, k % p
        if b > a:
            return 0
        r = r * comb(a, b) % p
        n //= p
        k //= p
    return r

def odd_entries(n):
    return 2 ** bin(n).count('1')
`,
        tests: [
          { name: "small", code: `from math import comb
assert all(binom_mod_p(n, k, p) == comb(n, k) % p for p in [2, 3, 5, 7] for n in range(40) for k in range(n + 1)), 'Lucas agrees with direct computation.'` },
          { name: "zero", code: `assert binom_mod_p(10, 3, 2) == 0 and binom_mod_p(5, 7, 3) == 0, 'C(10, 3) = 120 is even; k > n gives 0.'` },
          { name: "huge", code: `assert binom_mod_p(10 ** 18, 5 * 10 ** 17, 13) == 0 and binom_mod_p(2 ** 60, 2 ** 59, 2) == 0 and binom_mod_p(2 ** 60 - 1, 12345, 2) == 1, 'Work digit by digit; do not build the huge binomial.'` },
          { name: "speed", code: `import time
t = time.time()
binom_mod_p(10 ** 18 + 7, 10 ** 17 + 3, 999983)
assert time.time() - t < 2, 'Lucas needs only a few digits.'` },
          { name: "odd", code: `assert [odd_entries(n) for n in range(8)] == [1, 2, 2, 4, 2, 4, 4, 8] and odd_entries(2 ** 40 - 1) == 2 ** 40, 'Count the 1 bits of n.'` },
        ],
      },
    },
    {
      key: "pascal-proof",
      rung: "prove",
      prompt: (
        <p>
          Prove Pascal&rsquo;s rule <M>{"\\binom{n+1}{r} = \\binom{n}{r-1} + \\binom{n}{r}"}</M> from the factorial formula.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes both terms on the right with the factorial formula.",
          "Puts them over the common denominator r!(n + 1 − r)!.",
          "Shows the numerator becomes n!·r + n!·(n + 1 − r) = n!(n + 1) = (n + 1)!.",
          "Recognises the result as the formula for (n + 1 choose r).",
        ],
      },
    },
    {
      key: "middle-term",
      rung: "stretch",
      prompt: <p>What is the coefficient of <M>{"x^4"}</M> in the expansion of <M>{"\\left(x + \\tfrac1x\\right)^8"}</M>?</p>,
      answer: { kind: "numeric", value: 28 },
    },
  ],

  teachBack:
    "Explain to a friend why the coefficient of x squared in (1 + x) to the power 4 is the number of ways to choose 2 things from 4.",

  glimpse: (
    <p>
      Next, data and chance, a first look. Newton extended the binomial theorem to powers that are not whole numbers,
      which leads in Calculus to Taylor series. In Discrete Mathematics the triangle hides dozens of identities, and in
      Probability the binomial coefficients give the chance of <M>r</M> heads in <M>n</M> tosses of a coin.
    </p>
  ),
};
