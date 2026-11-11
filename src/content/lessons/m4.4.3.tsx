import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ModFieldViz } from "@/components/viz/ModFieldViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.4.3",
  minutes: 65,
  links: {
    requires: ["m4.4.2", "m1.6.2"],
    foreshadows: ["m4.4.4", "e2.3.1"],
  },

  puzzle: (
    <>
      <p>
        What are the last two digits of <M>{"7^{2026}"}</M>? Computing the number in full would need about 1700 digits. Yet the
        answer takes a minute by hand.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        On a clock, 9 o&rsquo;clock plus 5 hours is 2 o&rsquo;clock: arithmetic where only the remainder matters. Remainders
        modulo n can be added and multiplied consistently, and when n is prime they can also be divided. Explore the
        multiplication table modulo n below; try a prime and then a composite.
      </p>
      <ModFieldViz />
    </>
  ),

  theory: (
    <>
      <Definition title="congruence">
        <p>
          For a positive integer n, <M>{"a \\equiv b \\pmod n"}</M> means n | (a − b): a and b leave the same remainder on
          division by n. This is an equivalence relation, whose n classes are represented by 0, 1, …, n − 1. Their set is
          written <M>{"\\mathbb Z_n"}</M>.
        </p>
      </Definition>

      <Theorem title="congruences respect arithmetic">
        <p>
          If <M>{"a \\equiv a'"}</M> and <M>{"b \\equiv b' \\pmod n"}</M>, then <M>{"a + b \\equiv a' + b'"}</M> and{" "}
          <M>{"ab \\equiv a'b' \\pmod n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write a′ = a + kn and b′ = b + ln. Then a′ + b′ = a + b + (k + l)n, and a′b′ = ab + (al + bk + kln)n.
        </p>
      </Proof>
      <Remark title="what this buys">
        <p>
          You may reduce modulo n at every step of a calculation. In particular powers can be computed by repeated squaring,
          reducing as you go, so <M>{"a^k \\bmod n"}</M> takes about <M>{"\\log_2 k"}</M> multiplications of numbers below n.
        </p>
      </Remark>

      <Theorem title="inverses">
        <p>
          a has a multiplicative inverse modulo n, a number x with <M>{"ax \\equiv 1 \\pmod n"}</M>, if and only if
          gcd(a, n) = 1. In particular, when p is prime every a not divisible by p has an inverse, so <M>{"\\mathbb Z_p"}</M>{" "}
          is a field.
        </p>
      </Theorem>
      <Proof>
        <p>
          If gcd(a, n) = 1, Bézout gives ax + ny = 1, so <M>{"ax \\equiv 1"}</M>. Conversely, if ax = 1 + kn then any common
          divisor of a and n divides 1.
        </p>
      </Proof>

      <Theorem title="Fermat's little theorem">
        <p>
          If p is prime and p does not divide a, then <M>{"a^{p-1} \\equiv 1 \\pmod p"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The numbers a, 2a, …, (p − 1)a are non-zero modulo p and distinct (if ia ≡ ja, multiply by the inverse of a to get
          i ≡ j). So they are 1, 2, …, p − 1 in some order. Multiplying all of them:{" "}
          <M>{"a^{p-1}(p-1)! \\equiv (p-1)!"}</M>, and (p − 1)! is invertible modulo p, so cancel it.
        </p>
      </Proof>

      <Theorem title="Euler's theorem">
        <p>
          If gcd(a, n) = 1 then <M>{"a^{\\varphi(n)} \\equiv 1 \\pmod n"}</M>, where <M>{"\\varphi(n)"}</M> counts the numbers
          in 1, …, n coprime to n. The same proof works, using only the residues coprime to n.
        </p>
      </Theorem>

      <Example title="the last two digits">
        <p>
          We want <M>{"7^{2026} \\bmod 100"}</M>. Note <M>{"7^2 = 49"}</M> and <M>{"7^4 = 2401 \\equiv 1 \\pmod{100}"}</M>.
          Since 2026 = 4 · 506 + 2, <M>{"7^{2026} \\equiv 7^2 = 49"}</M>. The last two digits are 49.
        </p>
      </Example>

      <Theorem title="the Chinese remainder theorem">
        <p>
          If m and n are coprime, the pair of congruences <M>{"x \\equiv a \\pmod m"}</M>, <M>{"x \\equiv b \\pmod n"}</M> has
          exactly one solution modulo mn.
        </p>
      </Theorem>
      <Proof>
        <p>
          Uniqueness: two solutions differ by a multiple of m and of n, hence of mn. Existence: the mn numbers 0, …, mn − 1 give
          mn distinct pairs of remainders, by uniqueness, and there are only mn pairs, so every pair occurs.
        </p>
      </Proof>
    </>
  ),

  practice: [
    {
      key: "clock",
      rung: "check",
      prompt: <p>It is 10 o&rsquo;clock on a 12-hour clock. What time will it be in 100 hours?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "inverse",
      rung: "check",
      prompt: <p>Find the inverse of 3 modulo 11, as a number from 1 to 10.</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "power",
      rung: "apply",
      prompt: <p>What is <M>{"3^{100} \\bmod 7"}</M>?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "crt",
      rung: "apply",
      prompt: <p>Find the smallest positive x with x ≡ 2 (mod 3), x ≡ 3 (mod 5) and x ≡ 2 (mod 7).</p>,
      answer: { kind: "numeric", value: 23 },
    },
    {
      key: "phi",
      rung: "apply",
      prompt: <p>What is <M>{"\\varphi(100)"}</M>?</p>,
      answer: { kind: "numeric", value: 40 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`print(pow(7, 2026, 100), pow(3, -1, 11), (17 * 23) % 7 == ((17 % 7) * (23 % 7)) % 7)`}</Code>
          <p>Modular powers, an inverse, and reducing before multiplying. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["49 4 True", "49 4 False", "1 4 True", "49 3 True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>power_mod(a, k, n)</C> by repeated squaring, reducing modulo n at every step, without <C>pow</C> or <C>**</C>, and <C>crt(a, m, b, n)</C>, the unique x in [0, mn) with x ≡ a (mod m) and x ≡ b (mod n) for coprime m and n. You may use <C>pow(m, -1, n)</C> for the inverse in <C>crt</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def power_mod(a, k, n):
    r = 1 % n
    # Square a and halve k on each step.
    return r

def crt(a, m, b, n):
    return a
`,
        solution: `def power_mod(a, k, n):
    r, a = 1 % n, a % n
    while k:
        if k & 1:
            r = r * a % n
        a = a * a % n
        k >>= 1
    return r

def crt(a, m, b, n):
    t = ((b - a) * pow(m, -1, n)) % n
    return (a + m * t) % (m * n)
`,
        tests: [
          { name: "powers", code: `assert power_mod(7, 2026, 100) == 49 and power_mod(3, 100, 7) == 4 and power_mod(5, 0, 13) == 1, 'Square and reduce; multiply in a factor for each 1 bit of k.'` },
          { name: "huge", code: `assert power_mod(2, 10 ** 18, 1000000007) == pow(2, 10 ** 18, 1000000007), 'An exponent of 10¹⁸ needs about 60 squarings, not 10¹⁸ multiplications.'` },
          { name: "crt", code: `x = crt(2, 3, 3, 5)
assert x == 8 and crt(crt(2, 3, 3, 5), 15, 2, 7) == 23, 'x ≡ 2 (mod 3) and x ≡ 3 (mod 5) gives 8.'` },
        ],
      },
    },
    {
      key: "zerodiv",
      rung: "prove",
      prompt: (
        <p>
          Prove that if n is composite, <M>{"\\mathbb Z_n"}</M> has non-zero a, b with <M>{"ab \\equiv 0"}</M>, and that such
          an a has no inverse modulo n.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes n = ab with 1 < a, b < n, so a and b are non-zero modulo n but ab ≡ 0.",
          "Supposes ax ≡ 1 and multiplies ab ≡ 0 by x to get b ≡ 0.",
          "Concludes the contradiction, so a has no inverse.",
        ],
      },
    },
    {
      key: "digits",
      rung: "stretch",
      prompt: <p>What are the last two digits of <M>{"3^{2026}"}</M>? Give the number from 0 to 99.</p>,
      answer: { kind: "numeric", value: 29 },
    },
  ],

  teachBack:
    "Explain to a friend why you can reduce modulo n at every step of a calculation, when a number has an inverse modulo n, and how to find the last two digits of a huge power.",

  glimpse: (
    <p>
      Next, hashing, which uses arithmetic modulo a prime to scatter keys evenly. Public-key cryptography, from RSA to
      elliptic curves, is modular arithmetic with very large numbers, and Fermat&rsquo;s little theorem is the reason RSA
      decryption works.
    </p>
  ),
};
