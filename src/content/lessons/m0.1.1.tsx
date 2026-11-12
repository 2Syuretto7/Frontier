import { M, MD } from "@/components/Math";
import { Axiom, Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { PairingViz } from "@/components/viz/PairingViz";
import { SuccessorViz } from "@/components/viz/SuccessorViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.1.1",
  minutes: 60,
  links: {
    foreshadows: ["m0.7.3", "m1.5.1", "m1.8.1", "m1.8.2"],
  },

  puzzle: (
    <>
      <p>
        A shepherd cannot count. Every morning the flock goes out to graze, and every evening it comes back. How can the
        shepherd be certain that every sheep has returned?
      </p>
      <p>Think about it for a minute before reading on. There is an answer that needs no numbers at all.</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Here is one answer. As each sheep leaves in the morning, the shepherd drops a stone into a bag. In the evening,
        as each sheep returns, a stone comes out. If the bag is empty when the last sheep is in, all is well. If stones
        remain, sheep are missing.
      </p>
      <p>
        The shepherd never said &ldquo;seven&rdquo;. They only <em>paired</em> things: one stone for one sheep. Two
        collections are the same size exactly when they can be paired with nothing left over. That idea is older than
        numerals, and it is what counting really is.
      </p>
      <PairingViz />
      <p>
        A number, then, is a name for a size. And there is a simplest way to produce every possible size: start with
        nothing, and keep adding one more. The numbers you reach this way, 0, 1, 2, 3 and so on forever, are the{" "}
        <strong>natural numbers</strong>.
      </p>
      <SuccessorViz />
    </>
  ),

  theory: (
    <>
      <p>
        We now make these ideas exact. At the end of the nineteenth century, Richard Dedekind and Giuseppe Peano showed
        that everything true about the natural numbers follows from a handful of plain statements about 0 and
        &ldquo;the next number&rdquo;. We write <M>{"S(n)"}</M> for the <em>successor</em> of <M>n</M>, the number
        after <M>n</M>.
      </p>

      <Axiom title="Peano">
        <ol>
          <li><M>0</M> is a natural number.</li>
          <li>Every natural number <M>n</M> has a successor <M>{"S(n)"}</M>, which is also a natural number.</li>
          <li><M>0</M> is not the successor of any natural number.</li>
          <li>Different numbers have different successors: if <M>{"S(m) = S(n)"}</M> then <M>{"m = n"}</M>.</li>
          <li>
            <strong>Induction.</strong> If a property holds for <M>0</M>, and whenever it holds for <M>n</M> it also
            holds for <M>{"S(n)"}</M>, then it holds for every natural number.
          </li>
        </ol>
      </Axiom>

      <p>
        Each axiom rules out a way counting could go wrong. Axiom 3 stops the numbers looping back to the start, like the
        hours on a clock. Axiom 4 stops two different numbers merging into one. Axiom 5 says there is nothing else: every
        natural number is reached from 0 by finitely many steps of adding one.
      </p>

      <Definition title="numerals">
        <p>
          We name the numbers by <M>{"1 = S(0)"}</M>, <M>{"2 = S(1)"}</M>, <M>{"3 = S(2)"}</M>, and so on. So{" "}
          <M>{"3 = S(S(S(0)))"}</M>.
        </p>
      </Definition>

      <Definition title="addition">
        <p>For all natural numbers <M>a</M> and <M>b</M>,</p>
        <MD>{"a + 0 = a, \\qquad a + S(b) = S(a + b)."}</MD>
        <p>
          In words: adding nothing changes nothing, and adding one more than <M>b</M> gives one more than adding{" "}
          <M>b</M>. This defines <M>{"a + b"}</M> for every <M>b</M>, because every <M>b</M> is reached from 0 by
          successors.
        </p>
      </Definition>

      <Theorem>
        <p><M>{"2 + 2 = 4"}</M>.</p>
      </Theorem>
      <Proof>
        <p>Using the definition of addition one step at a time, and the numerals:</p>
        <MD>{"\\begin{aligned} 2 + 2 &= 2 + S(1) = S(2 + 1) \\\\ &= S(2 + S(0)) = S(S(2 + 0)) \\\\ &= S(S(2)) = S(3) = 4. \\end{aligned}"}</MD>
      </Proof>

      <p>
        This is not pedantry. It shows that arithmetic is not a list of facts to be memorised but a consequence of a
        few definitions, which is the spirit of all the mathematics ahead.
      </p>

      <Proposition>
        <p>No natural number is its own successor: <M>{"S(n) \\neq n"}</M> for every <M>n</M>.</p>
      </Proposition>
      <Proof>
        <p>We use the induction axiom on the property &ldquo;<M>{"S(n) \\neq n"}</M>&rdquo;.</p>
        <p>
          <em>It holds for 0.</em> By axiom 3, <M>0</M> is not the successor of anything, so <M>{"S(0) \\neq 0"}</M>.
        </p>
        <p>
          <em>If it holds for n, it holds for S(n).</em> Suppose <M>{"S(n) \\neq n"}</M>. If we had{" "}
          <M>{"S(S(n)) = S(n)"}</M>, axiom 4 would give <M>{"S(n) = n"}</M>, contradicting our supposition. So{" "}
          <M>{"S(S(n)) \\neq S(n)"}</M>.
        </p>
        <p>By the induction axiom, the property holds for every natural number.</p>
      </Proof>

      <Remark>
        <p>
          It follows that counting never gets stuck or repeats: there is no largest natural number, since <M>{"S(n)"}</M>{" "}
          is always a new number beyond <M>n</M>.
        </p>
      </Remark>

      <p>Finally, we can return to the shepherd and say exactly what counting a collection means.</p>

      <Definition title="counting">
        <p>
          A collection has <M>n</M> elements if its elements can be paired, one to one and with nothing left over, with
          the numbers <M>{"1, 2, \\ldots, n"}</M>. Such a pairing is called a <strong>one-to-one correspondence</strong>.
        </p>
      </Definition>

      <Example>
        <p>
          The letters <M>{"\\{p, q, r\\}"}</M> pair with <M>{"\\{1, 2, 3\\}"}</M> by <M>{"p \\mapsto 1"}</M>,{" "}
          <M>{"q \\mapsto 2"}</M>, <M>{"r \\mapsto 3"}</M>, so the collection has 3 elements. Pairing them in a different
          order, say <M>{"r \\mapsto 1, p \\mapsto 2, q \\mapsto 3"}</M>, gives the same answer. That the answer never
          depends on the order you count in is a theorem, which you will prove in Proof and Logic.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "numeral",
      rung: "check",
      prompt: <p>Write <M>{"S(S(S(S(0))))"}</M> as an ordinary numeral.</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "not-an-axiom",
      rung: "check",
      prompt: <p>Which of these is <strong>not</strong> one of the Peano axioms as stated in this lesson?</p>,
      answer: {
        kind: "choice",
        options: [
          "0 is a natural number.",
          "Every natural number has a successor.",
          "Every natural number has a number before it.",
          "Different numbers have different successors.",
        ],
        correct: [2],
      },
    },
    {
      key: "steps",
      rung: "apply",
      prompt: (
        <p>
          Computing <M>{"3 + 4"}</M> using only <M>{"a + 0 = a"}</M> and <M>{"a + S(b) = S(a + b)"}</M>, how many times
          must you use the second rule?
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "leftover",
      rung: "apply",
      prompt: (
        <p>
          You pair the collection <M>{"A = \\{p, q, r, s\\}"}</M> with <M>{"B = \\{1, 2, 3\\}"}</M> by{" "}
          <M>{"p \\mapsto 1, q \\mapsto 2, r \\mapsto 3"}</M>, and <M>s</M> is left over. What can you conclude?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "A has more elements than B.",
          "A and B have the same number of elements.",
          "B has more elements than A.",
          "Nothing, because a different pairing might use up s.",
        ],
        correct: [0],
      },
    },
    {
      key: "loop",
      rung: "apply",
      prompt: (
        <p>
          On a clock, the hour after 12 is 1. Treating &ldquo;the next hour&rdquo; as a successor, which Peano axiom
          does a clock break?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Axiom 2: every number has a successor.",
          "Axiom 3: the starting point is not a successor.",
          "Axiom 4: different numbers have different successors.",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`n = 10
pairs = n // 2
print(pairs * (n + 1))`}</Code>
          <p>Gauss&rsquo;s trick pairs 1 with 10, 2 with 9, and so on: each pair adds to 11. What does it print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 55 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`n = 27
n = 3 * n + 1    # 27 is odd
n = n // 2       # the result is even
n = 3 * n + 1    # and this one is odd
print(n)`}</Code>
          <p>The Collatz rule halves even numbers and sends odd n to 3n + 1. What does this print after three steps from 27?</p>
        </>
      ),
      answer: { kind: "numeric", value: 124 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>digit_sum(n)</C>, the sum of the decimal digits of a natural number n below 1000, using <C>%</C> and <C>//</C> rather than converting to a string. For example, <C>digit_sum(472)</C> is 4 + 7 + 2 = 13.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def digit_sum(n):
    return n % 10
`,
        solution: `def digit_sum(n):
    units = n % 10
    tens = n // 10 % 10
    hundreds = n // 100
    return units + tens + hundreds
`,
        tests: [
          { name: "examples", code: `assert digit_sum(0) == 0 and digit_sum(7) == 7 and digit_sum(472) == 13, 'n % 10 is the last digit and n // 10 drops it.'` },
          { name: "all three digits", code: `assert digit_sum(999) == 27 and digit_sum(105) == 6 and digit_sum(40) == 4, 'n // 10 % 10 is the tens digit and n // 100 the hundreds digit.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Place value works in any base b. Write <C>digit(n, b, k)</C>, the digit of n in base b that is worth b<sup>k</sup> (so k = 0 is the last digit), and <C>from_digits(d2, d1, d0, b)</C>, the number whose three base-b digits are d2, d1, d0, computed by Horner&rsquo;s rule as (d2·b + d1)·b + d0. For example, 13 in base 2 is 1101, so <C>digit(13, 2, 2)</C> is 1, and <C>from_digits(1, 0, 1, 2)</C> is 5.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def digit(n, b, k):
    return n % b

def from_digits(d2, d1, d0, b):
    return d2 + d1 + d0
`,
        solution: `def digit(n, b, k):
    return n // b ** k % b

def from_digits(d2, d1, d0, b):
    return (d2 * b + d1) * b + d0
`,
        tests: [
          { name: "digits", code: `assert digit(13, 2, 0) == 1 and digit(13, 2, 1) == 0 and digit(13, 2, 2) == 1 and digit(255, 8, 2) == 3, 'Divide by b to the power k to drop the last k digits, then take % b.'` },
          { name: "back", code: `assert from_digits(1, 0, 1, 2) == 5 and from_digits(3, 7, 7, 8) == 255 and from_digits(4, 7, 2, 10) == 472, 'Horner: (d2·b + d1)·b + d0.'` },
          { name: "round trip", code: `assert all(from_digits(digit(n, b, 2), digit(n, b, 1), digit(n, b, 0), b) == n for b in range(2, 11) for n in range(b ** 3)), 'Taking a number apart and putting it back should give the same number.'` },
        ],
      },
    },
    {
      key: "one-plus-two",
      rung: "prove",
      prompt: (
        <p>
          Prove from the definition of addition and the numerals that <M>{"1 + 2 = 3"}</M>. Justify every step.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes 2 as S(1) and applies a + S(b) = S(a + b).",
          "Writes 1 as S(0) and applies the rule again.",
          "Uses a + 0 = a to finish.",
          "Converts S(S(1)) to 3 using the numerals.",
        ],
      },
    },
    {
      key: "pairings",
      rung: "stretch",
      prompt: <p>In how many different ways can <M>{"\\{a, b, c\\}"}</M> be paired one to one with <M>{"\\{1, 2, 3\\}"}</M>?</p>,
      answer: { kind: "numeric", value: 6 },
    },
  ],

  teachBack:
    "Explain to a curious twelve-year-old why 2 + 2 = 4 is something you can prove, not just something you memorise. Use your own words and no symbols if you can.",

  glimpse: (
    <>
      <p>
        Next you will ask what happens when you try to count backwards past zero, which leads to the integers.
        The induction axiom returns as a full proof technique in Proof and Logic, and the shepherd&rsquo;s pairing idea
        returns in its most surprising form when you pair up <em>infinite</em> collections and discover that some
        infinities are larger than others.
      </p>
    </>
  ),
};
