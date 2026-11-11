import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SpotErrorViz } from "@/components/viz/SpotErrorViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.3.6",
  minutes: 60,
  links: {
    revisits: ["m1.3.1", "m1.3.3"],
    foreshadows: ["m1.5.1", "m8.1.1"],
  },

  puzzle: (
    <>
      <p>Here is a complete argument, written in a style common in exam scripts:</p>
      <MD>{"n \\text{ odd} \\Rightarrow n = 2k+1 \\Rightarrow n^2 = 4k^2+4k+1 \\Rightarrow \\text{odd} \\;\\checkmark"}</MD>
      <p>
        Is it a proof? It contains the right ideas. But what is k? What is being proved: that n is odd, or that{" "}
        <M>{"n^2"}</M> is? Why is <M>{"4k^2 + 4k + 1"}</M> odd? A proof is not only a correct argument; it is a correct
        argument that a reader can check. This lesson is about the difference.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A proof is written for a sceptical but fair reader, often your future self. That reader should never have to guess
        what a letter means, why a step is allowed, or which method you are using. Good proofs are written in full sentences,
        with the symbols embedded in them.
      </p>
      <p>
        The best way to learn what goes wrong is to diagnose broken proofs. Each one below contains a single fatal error. Find
        the first line where the reasoning fails.
      </p>
      <SpotErrorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a checklist for writing proofs">
        <ol>
          <li><strong>State the claim</strong> precisely, as a theorem, before the proof.</li>
          <li><strong>Announce the method</strong> if it is not direct: &ldquo;We prove the contrapositive&rdquo;, &ldquo;Suppose, for contradiction, that&hellip;&rdquo;, &ldquo;We split into two cases.&rdquo;</li>
          <li><strong>Introduce every letter</strong> before using it, with its type: &ldquo;Let n be an odd integer. Then n = 2k + 1 for some integer k.&rdquo;</li>
          <li><strong>Write sentences.</strong> Symbols are nouns and verbs inside sentences; = and &lt; are verbs. Use words such as &ldquo;so&rdquo;, &ldquo;since&rdquo; and &ldquo;hence&rdquo; rather than chains of arrows.</li>
          <li><strong>Justify each step</strong> that is not routine algebra, by naming the definition or result used.</li>
          <li><strong>Finish</strong> by saying what has been shown, in the words of the claim.</li>
        </ol>
      </Definition>

      <Example title="the puzzle, rewritten">
        <Theorem>
          <p>If n is an odd integer, then <M>{"n^2"}</M> is odd.</p>
        </Theorem>
        <Proof>
          <p>
            Let n be an odd integer. By the definition of odd, <M>{"n = 2k + 1"}</M> for some integer k. Then
          </p>
          <MD>{"n^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1."}</MD>
          <p>Since <M>{"2k^2 + 2k"}</M> is an integer, <M>{"n^2"}</M> is odd by definition.</p>
        </Proof>
        <p>It is barely longer, and nothing is left for the reader to guess.</p>
      </Example>

      <Remark title="five classic errors">
        <ul>
          <li><strong>Proof by example.</strong> Checking a case proves a &ldquo;there exists&rdquo; statement, never a &ldquo;for all&rdquo;.</li>
          <li><strong>Proving the converse.</strong> Assuming the conclusion and deducing the hypothesis proves the wrong conditional.</li>
          <li><strong>Hidden division by zero</strong>, or by a quantity that might be zero.</li>
          <li><strong>One letter for two things.</strong> Writing m = 2k + 1 and n = 2k + 1 makes m and n equal.</li>
          <li>
            <strong>&ldquo;Clearly&rdquo;.</strong> The word is fine when the step really is clear to your intended reader. It
            is a warning sign when it covers a step you could not justify if asked.
          </li>
        </ul>
      </Remark>

      <Remark title="the end of a proof">
        <p>
          Many books end a proof with a small square, <M>{"\\square"}</M> or <M>{"\\blacksquare"}</M>, so the reader knows the
          argument is over. It was popularised by the mathematician Paul Halmos, and is sometimes called the{" "}
          <em>Halmos tombstone</em>. The older ending is Q.E.D., <em>quod erat demonstrandum</em>, &ldquo;which was to be
          shown&rdquo;, the Latin translation of the phrase with which Euclid ends his proofs.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "one-two",
      rung: "check",
      prompt: <p>In the proof that 1 = 2 in the visualisation, which step is invalid?</p>,
      answer: {
        kind: "choice",
        options: ["Multiplying both sides by a.", "Factoring both sides.", "Dividing both sides by a − b.", "Subtracting b² from both sides."],
        correct: [2],
      },
    },
    {
      key: "example",
      rung: "check",
      prompt: <p>For which kind of statement is a single example a complete proof?</p>,
      answer: { kind: "choice", options: ["for all x, P(x)", "there exists x with P(x)", "if P then Q", "P if and only if Q"], correct: [1] },
    },
    {
      key: "sentence",
      rung: "apply",
      prompt: <p>Which is the best way to begin a proof that the sum of two even numbers is even?</p>,
      answer: {
        kind: "choice",
        options: [
          "m + n = 2k + 2k = 4k, even.",
          "Let m and n be even integers. Then m = 2j and n = 2k for some integers j and k.",
          "Take m = 2 and n = 4.",
          "Suppose m + n is even.",
        ],
        correct: [1],
      },
    },
    {
      key: "converse",
      rung: "apply",
      prompt: (
        <p>
          A proof of &ldquo;if <M>{"n^2"}</M> is even then n is even&rdquo; begins &ldquo;Suppose n is even.&rdquo; What has
          gone wrong?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Nothing.",
          "It assumes the conclusion, so it can only prove the converse.",
          "It should begin 'Suppose n is odd.'",
          "Even numbers cannot be squared.",
        ],
        correct: [1],
      },
    },
    {
      key: "might-be-zero",
      rung: "apply",
      prompt: (
        <p>
          &ldquo;Claim: if <M>{"x^2 = x"}</M> then <M>{"x = 1"}</M>. Proof: divide both sides by x.&rdquo; Which real number
          is a counterexample to the claim?
        </p>
      ),
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def is_even(n):
    return n % 2 == 0
assert all(is_even(a + b) for a in range(0, 20, 2) for b in range(0, 20, 2))
print("checked")`}</Code>
          <p>The assert passes. Does that prove that the sum of any two even integers is even?</p>
        </>
      ),
      answer: { kind: "choice", options: ["No: it checks finitely many cases", "Yes: it checks enough cases", "Yes: assert statements are proofs", "No: the assert fails"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            A proof that a + b is even names witnesses: if a = 2j and b = 2k then a + b = 2(j + k). Write <C>sum_witness(j, k)</C> returning the witness for a + b, and <C>product_witness(j, k)</C> returning m with ab = 2m.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def sum_witness(j, k):
    return 0

def product_witness(j, k):
    return 0
`,
        solution: `def sum_witness(j, k):
    return j + k

def product_witness(j, k):
    return 2 * j * k
`,
        tests: [
          { name: "sum", code: `assert all(2 * j + 2 * k == 2 * sum_witness(j, k) for j in range(-5, 6) for k in range(-5, 6)), '2j + 2k = 2(j + k).'` },
          { name: "product", code: `assert all((2 * j) * (2 * k) == 2 * product_witness(j, k) for j in range(-5, 6) for k in range(-5, 6)), '(2j)(2k) = 2(2jk).'` },
        ],
      },
    },
    {
      key: "rewrite",
      rung: "prove",
      prompt: (
        <p>
          Rewrite this as a well-written proof: &ldquo;2a·2b = 4ab, 4 | 4ab ✓&rdquo;. The claim is that the product of two
          even integers is divisible by 4.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "States the claim and introduces the two even integers with letters.",
          "Unpacks evenness as m = 2a and n = 2b for integers a and b.",
          "Computes mn = 4ab and notes that ab is an integer.",
          "Concludes in words that 4 divides mn, by the definition of divides.",
        ],
      },
    },
    {
      key: "fix",
      rung: "stretch",
      prompt: (
        <p>
          Find the correct version of the claim &ldquo;if <M>{"x^2 = x"}</M> then <M>{"x = 1"}</M>&rdquo; for real numbers x, and
          prove it carefully, using cases.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "States the corrected claim: if x² = x, then x = 0 or x = 1.",
          "Rewrites the equation as x(x − 1) = 0.",
          "Uses that a product of real numbers is zero only if a factor is zero, giving two cases.",
          "Writes the proof in sentences, with a clear conclusion.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend the difference between having the right idea for a proof and having written a proof, using one of the broken proofs as an example.",

  glimpse: (
    <p>
      This completes the chapter on proof techniques. The next chapter introduces sets, the language in which almost all of
      modern mathematics is written; after that comes induction, the method for statements about every natural number. Real
      Analysis will test your proof-writing more than any course before it.
    </p>
  ),
};
