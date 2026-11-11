import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { EuclidRectViz } from "@/components/viz/EuclidRectViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.4.2",
  minutes: 60,
  links: {
    requires: ["m4.4.1"],
    foreshadows: ["m4.4.3", "m4.5.1"],
  },

  puzzle: (
    <>
      <p>
        You have a 6-litre and a 10-litre jug and a tap. Can you measure exactly 4 litres? Exactly 3? The answer depends on a
        single number computed from 6 and 10.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The greatest common divisor of a and b is the side of the largest square tile that tiles an a × b rectangle exactly.
        Euclid&rsquo;s algorithm finds it by cutting off the biggest squares it can, again and again, from what remains. Change
        a and b below.
      </p>
      <EuclidRectViz />
    </>
  ),

  theory: (
    <>
      <Definition title="greatest common divisor">
        <p>
          For integers a and b, not both 0, gcd(a, b) is the largest integer dividing both. They are{" "}
          <strong>coprime</strong> if gcd(a, b) = 1. The <strong>least common multiple</strong> lcm(a, b) is the smallest
          positive integer divisible by both.
        </p>
      </Definition>

      <Theorem title="the key step">
        <p>If a = qb + r, then gcd(a, b) = gcd(b, r).</p>
      </Theorem>
      <Proof>
        <p>
          A common divisor of a and b divides r = a − qb, so it is a common divisor of b and r. A common divisor of b and r
          divides a = qb + r. The two pairs have the same common divisors, so the same greatest one.
        </p>
      </Proof>

      <Theorem title="Euclid's algorithm">
        <p>
          To find gcd(a, b) with a ≥ b &gt; 0, replace (a, b) by (b, a mod b) until the second number is 0; the first is then
          the gcd. It takes at most about <M>{"2\\log_2 b"}</M> steps.
        </p>
      </Theorem>
      <Proof>
        <p>
          The gcd is unchanged at each step, and gcd(g, 0) = g. The second number strictly decreases, so the process stops. For
          the speed: after two steps the first number at least halves, because if r = a mod b then r &lt; b and r ≤ a − b,
          so r &lt; a/2.
        </p>
      </Proof>

      <Example title="gcd(252, 198)">
        <p>
          252 = 1 · 198 + 54; 198 = 3 · 54 + 36; 54 = 1 · 36 + 18; 36 = 2 · 18 + 0. So gcd = 18.
        </p>
      </Example>

      <Theorem title="Bézout's identity">
        <p>
          There are integers x and y with ax + by = gcd(a, b). In fact gcd(a, b) is the smallest positive number of the form
          ax + by.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let d be the smallest positive value of ax + by (it exists by well-ordering). Divide a by d: a = qd + r with
          0 ≤ r &lt; d. Then r = a − q(ax + by) is also of the form ax′ + by′, and smaller than d, so r = 0 and d | a. Likewise
          d | b. Any common divisor of a and b divides ax + by = d, so d is the greatest.
        </p>
      </Proof>
      <Example title="extended Euclid">
        <p>
          Run Euclid backwards: 18 = 54 − 36 = 54 − (198 − 3 · 54) = 4 · 54 − 198 = 4(252 − 198) − 198 = 4 · 252 − 5 · 198.
        </p>
      </Example>

      <Theorem title="Euclid's lemma">
        <p>If a prime p divides ab, then p | a or p | b.</p>
      </Theorem>
      <Proof>
        <p>
          If p does not divide a, then gcd(p, a) = 1, so px + ay = 1 for some x, y. Multiply by b: pbx + aby = b. Both terms on
          the left are divisible by p, so p | b.
        </p>
      </Proof>

      <Example title="the jugs">
        <p>
          With 6- and 10-litre jugs the amounts you can measure are exactly the multiples of gcd(6, 10) = 2 that fit, so 4 is
          possible and 3 is not.
        </p>
      </Example>

      <Remark title="lcm">
        <p>
          gcd(a, b) · lcm(a, b) = ab for positive a, b: in the prime factorisations, the gcd takes the smaller exponent of each
          prime, the lcm the larger, and min + max = sum.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gcd",
      rung: "check",
      prompt: <p>What is gcd(1071, 462)?</p>,
      answer: { kind: "numeric", value: 21 },
    },
    {
      key: "lcm",
      rung: "check",
      prompt: <p>What is lcm(24, 36)?</p>,
      answer: { kind: "numeric", value: 72 },
    },
    {
      key: "bezout",
      rung: "apply",
      prompt: <p>Find integers x, y with 35x + 13y = 1. Give the value of x with 0 ≤ x &lt; 13.</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "steps",
      rung: "apply",
      prompt: <p>How many division steps does Euclid&rsquo;s algorithm take on (89, 55), counting the last step that leaves remainder 0?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "jugs",
      rung: "apply",
      prompt: <p>With jugs of 21 and 35 litres, what is the smallest positive amount of water you can measure exactly?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`a, b = 252, 198
while b:
    a, b = b, a % b
print(a)`}</Code>
          <p>Euclid's algorithm. What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 18 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>ext_gcd(a, b)</C>, the extended Euclidean algorithm, returning (g, x, y) with g = gcd(a, b) and ax + by = g, for non-negative a and b not both 0. Do not use <C>math.gcd</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def ext_gcd(a, b):
    return (1, 0, 0)
`,
        solution: `def ext_gcd(a, b):
    if b == 0:
        return (a, 1, 0)
    g, x, y = ext_gcd(b, a % b)
    return (g, y, x - (a // b) * y)
`,
        tests: [
          { name: "lesson", code: `g, x, y = ext_gcd(252, 198)
assert g == 18 and 252 * x + 198 * y == 18, 'gcd(252, 198) = 18, and x, y must satisfy Bézout.'` },
          { name: "random", code: `import math, random
random.seed(5)
for _ in range(300):
    a, b = random.randint(0, 10 ** 6), random.randint(1, 10 ** 6)
    g, x, y = ext_gcd(a, b)
    assert g == math.gcd(a, b) and a * x + b * y == g, 'Unwind the recursion: from (b, a mod b) back to (a, b).'` },
        ],
      },
    },
    {
      key: "coprime",
      rung: "prove",
      prompt: <p>Prove that if gcd(a, b) = 1 and a | bc, then a | c.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Uses Bézout to write ax + by = 1.",
          "Multiplies by c: acx + bcy = c.",
          "Notes a divides both terms on the left, so a | c.",
        ],
      },
    },
    {
      key: "fibworst",
      rung: "stretch",
      prompt: <p>Among all pairs a ≥ b with b ≤ 100, Euclid&rsquo;s algorithm takes the most steps on consecutive Fibonacci numbers. What is the largest Fibonacci number at most 100?</p>,
      answer: { kind: "numeric", value: 89 },
    },
  ],

  teachBack:
    "Explain to a friend why Euclid's algorithm works, why it is fast, and how running it backwards gives Bézout's identity.",

  glimpse: (
    <p>
      Next, modular arithmetic, where Bézout&rsquo;s identity becomes the recipe for dividing modulo n. Euclid&rsquo;s
      algorithm is also our first serious algorithm, and later in this course it is the example used to define running time.
    </p>
  ),
};
