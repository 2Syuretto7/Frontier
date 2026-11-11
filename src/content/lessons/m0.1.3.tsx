import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { FractionBarsViz } from "@/components/viz/FractionBarsViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.1.3",
  minutes: 75,
  links: {
    foreshadows: ["m1.6.2", "m2.1.1", "m4.4.1"],
  },

  puzzle: (
    <>
      <p>
        Two friends share pizzas. At one table, 2 pizzas are shared equally by 3 people. At another, 3 pizzas are
        shared equally by 4 people. Which table gives each person more pizza, and by how much?
      </p>
      <p>
        Then a shop puts a price up by 20% and, a week later, takes 20% off the new price. Is the price back where it
        started? Decide each answer, then ask yourself how you would convince someone who disagreed.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each person at the first table gets <M>{"\\tfrac{2}{3}"}</M> of a pizza, and at the second{" "}
        <M>{"\\tfrac{3}{4}"}</M>. Comparing thirds with quarters is awkward, because the pieces are different sizes.
        The fix is to cut everything into pieces of the <em>same</em> size. Twelfths will do: two thirds is eight
        twelfths, three quarters is nine twelfths. The second table wins by one twelfth of a pizza.
      </p>
      <FractionBarsViz />
      <p>
        That one move, re-cutting into common pieces, explains almost everything about fractions. It explains why{" "}
        <M>{"\\tfrac{2}{3} = \\tfrac{4}{6}"}</M> (the same amount, cut finer), why we add fractions with a common
        denominator, and how to compare any two. Fractions also answer a question the integers cannot:{" "}
        <M>{"3x = 2"}</M> has no integer solution, but it has the solution <M>{"\\tfrac{2}{3}"}</M>.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="fractions">
        <p>
          A <strong>fraction</strong> <M>{"\\tfrac{a}{b}"}</M> is written with integers <M>a</M> (the{" "}
          <em>numerator</em>) and <M>b</M> (the <em>denominator</em>), where <M>{"b \\neq 0"}</M>. It names the number
          that, multiplied by <M>b</M>, gives <M>a</M>. Two fractions are <strong>equal</strong> when
        </p>
        <MD>{"\\frac{a}{b} = \\frac{c}{d} \\quad\\text{exactly when}\\quad ad = bc."}</MD>
        <p>
          The numbers that can be written this way are the <strong>rational numbers</strong>, written{" "}
          <M>{"\\mathbb{Q}"}</M> (for quotient). Every integer <M>n</M> is the rational number <M>{"\\tfrac{n}{1}"}</M>.
        </p>
      </Definition>

      <p>
        Why that test for equality? If <M>{"\\tfrac{a}{b}"}</M> and <M>{"\\tfrac{c}{d}"}</M> name the same number{" "}
        <M>x</M>, then <M>{"bx = a"}</M> and <M>{"dx = c"}</M>. Multiply the first by <M>d</M> and the second by{" "}
        <M>b</M>: both sides become <M>{"bdx"}</M>, so <M>{"ad = bc"}</M>. The test uses only multiplication of
        integers, which we already have.
      </p>

      <Proposition title="scaling">
        <p>For any integer <M>{"k \\neq 0"}</M>, <M>{"\\dfrac{a}{b} = \\dfrac{ka}{kb}"}</M>.</p>
      </Proposition>
      <Proof>
        <p>
          By the test, we need <M>{"a(kb) = b(ka)"}</M>. Both sides equal <M>{"kab"}</M> by commutativity and
          associativity.
        </p>
      </Proof>

      <p>
        Scaling is the re-cutting from the intuition. Reading it backwards, we may divide the top and bottom by any
        common factor. A fraction whose numerator and denominator have no common factor except <M>{"\\pm 1"}</M>, with a
        positive denominator, is in <strong>lowest terms</strong>. Every fraction has exactly one lowest-terms form;
        that it is <em>unique</em> needs the fact that whole numbers factor into primes in only one way, which you
        will prove in Discrete Mathematics.
      </p>

      <Definition title="arithmetic of fractions">
        <MD>{"\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}, \\qquad \\frac{a}{b} \\cdot \\frac{c}{d} = \\frac{ac}{bd}."}</MD>
      </Definition>

      <p>
        These are not arbitrary. The addition rule is the common-pieces idea: scale both fractions to the denominator{" "}
        <M>{"bd"}</M>, getting <M>{"\\tfrac{ad}{bd}"}</M> and <M>{"\\tfrac{bc}{bd}"}</M>, then add the numbers of pieces.
        The multiplication rule says that <M>{"\\tfrac{c}{d}"}</M> of <M>{"\\tfrac{a}{b}"}</M> of a whole is{" "}
        <M>{"\\tfrac{ac}{bd}"}</M> of it. Cut each of the <M>b</M> pieces of the whole into <M>d</M> smaller ones,
        so the whole is <M>{"bd"}</M> small pieces. From each of your <M>a</M> pieces you take <M>c</M> small ones, which
        is <M>{"ac"}</M> small pieces in all.
      </p>

      <Remark title="a check worth making">
        <p>
          The same number has many names: <M>{"\\tfrac{1}{2} = \\tfrac{2}{4}"}</M>. Does the sum depend on which names
          we use? It does not. If <M>{"\\tfrac{a}{b} = \\tfrac{a'}{b'}"}</M>, then replacing one by the other changes{" "}
          <M>{"\\tfrac{ad+bc}{bd}"}</M> into a fraction that passes the equality test with it. A mathematician says the
          operations are <em>well defined</em>. You will check this carefully when equivalence classes return in Proof
          and Logic.
        </p>
      </Remark>

      <Definition title="reciprocal and division">
        <p>
          If <M>{"a \\neq 0"}</M>, the <strong>reciprocal</strong> of <M>{"\\tfrac{a}{b}"}</M> is{" "}
          <M>{"\\tfrac{b}{a}"}</M>, because <M>{"\\tfrac{a}{b} \\cdot \\tfrac{b}{a} = \\tfrac{ab}{ab} = 1"}</M>.
          Dividing by a number means multiplying by its reciprocal:
        </p>
        <MD>{"\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\cdot \\frac{d}{c} \\qquad (c \\neq 0)."}</MD>
      </Definition>

      <Theorem title="no division by zero">
        <p>There is no rational number <M>x</M> with <M>{"0 \\cdot x = 1"}</M>. So <M>0</M> has no reciprocal.</p>
      </Theorem>
      <Proof>
        <p>
          The proof that <M>{"a \\cdot 0 = 0"}</M> in the previous lesson used only the laws of arithmetic, and they
          hold for fractions too. So <M>{"0 \\cdot x = 0"}</M> for every <M>x</M>. If also <M>{"0 \\cdot x = 1"}</M>, then{" "}
          <M>{"0 = 1"}</M>, which is false.
        </p>
      </Proof>

      <Definition title="ratio and proportion">
        <p>
          A <strong>ratio</strong> <M>{"a : b"}</M> compares two quantities by the fraction <M>{"\\tfrac{a}{b}"}</M>.
          Two ratios are <strong>in proportion</strong> when the fractions are equal: <M>{"a : b = c : d"}</M> means{" "}
          <M>{"ad = bc"}</M>. To share an amount <M>T</M> in the ratio <M>{"a : b"}</M>, cut it into{" "}
          <M>{"a + b"}</M> equal parts and give <M>a</M> parts to one side and <M>b</M> to the other.
        </p>
      </Definition>

      <Example>
        <p>
          A recipe uses rice and water in the ratio <M>{"2 : 3"}</M>. For 5 cups of rice you need <M>w</M> cups of water
          with <M>{"2 : 3 = 5 : w"}</M>, so <M>{"2w = 15"}</M> and <M>{"w = \\tfrac{15}{2} = 7\\tfrac{1}{2}"}</M>.
        </p>
      </Example>

      <Definition title="percentages">
        <p>
          A <strong>percentage</strong> is a fraction with denominator 100: <M>{"p\\%"}</M> means <M>{"\\tfrac{p}{100}"}</M>.
          So <M>{"p\\%"}</M> of an amount <M>A</M> is <M>{"\\tfrac{p}{100} \\times A"}</M>. To <strong>increase</strong>{" "}
          <M>A</M> by <M>{"p\\%"}</M> is to multiply it by <M>{"1 + \\tfrac{p}{100}"}</M>, and to <strong>decrease</strong> it
          by <M>{"p\\%"}</M> is to multiply it by <M>{"1 - \\tfrac{p}{100}"}</M>.
        </p>
      </Definition>

      <p>
        Thinking of a percentage change as a multiplication, rather than as something added or taken away, settles the
        second puzzle at once. Up 20% is <M>{"\\times 1.2"}</M>; down 20% is <M>{"\\times 0.8"}</M>. Together they
        multiply the price by <M>{"1.2 \\times 0.8 = 0.96"}</M>, so it ends 4% lower than it started. The two 20%s are
        percentages of <em>different</em> amounts, which is why they do not cancel.
      </p>

      <Example title="undoing a change">
        <p>
          A price after an 18% tax is &#8377;590. The price before tax is not <M>{"590 - 0.18 \\times 590"}</M>. The tax
          multiplied the old price by 1.18, so undo it by dividing: <M>{"590 \\div 1.18 = 500"}</M>. Taking 18% of the{" "}
          <em>new</em> amount is the same mistake as in the shop puzzle.
        </p>
      </Example>

      <Theorem title="the rationals are dense">
        <p>Between any two different rational numbers there is another rational number.</p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"p < q"}</M> be rational. Their average <M>{"m = \\tfrac{p + q}{2}"}</M> is rational, being built from
          rationals by adding and dividing by 2. And <M>{"m - p = \\tfrac{q - p}{2} > 0"}</M> and{" "}
          <M>{"q - m = \\tfrac{q - p}{2} > 0"}</M>, so <M>{"p < m < q"}</M>.
        </p>
      </Proof>
      <p>
        Applying the theorem again and again, there are infinitely many rationals between any two. Unlike the integers,
        no rational number has a &ldquo;next&rdquo; one. Yet, as the next lesson shows, the rationals still leave gaps.
      </p>
    </>
  ),

  practice: [
    {
      key: "add",
      rung: "check",
      prompt: <p>Compute <M>{"\\tfrac{2}{3} + \\tfrac{3}{4}"}</M>. Give your answer as a fraction.</p>,
      answer: { kind: "numeric", value: 17 / 12 },
    },
    {
      key: "equal",
      rung: "check",
      prompt: <p>Select every fraction equal to <M>{"\\tfrac{6}{8}"}</M>.</p>,
      answer: { kind: "choice", options: ["3/4", "12/16", "6/16", "9/12"], correct: [0, 1, 3] },
    },
    {
      key: "divide",
      rung: "apply",
      prompt: <p>Compute <M>{"\\tfrac{3}{5} \\div \\tfrac{9}{10}"}</M> in lowest terms.</p>,
      answer: { kind: "numeric", value: 2 / 3 },
    },
    {
      key: "share",
      rung: "apply",
      prompt: <p>Share &#8377;3,500 between two people in the ratio <M>{"3 : 4"}</M>. How many rupees does the larger share contain?</p>,
      answer: { kind: "numeric", value: 2000 },
    },
    {
      key: "between",
      rung: "apply",
      prompt: <p>What rational number lies exactly halfway between <M>{"\\tfrac{1}{3}"}</M> and <M>{"\\tfrac{1}{2}"}</M>?</p>,
      answer: { kind: "numeric", value: 5 / 12 },
    },
    {
      key: "compare",
      rung: "apply",
      prompt: <p>Which is larger, <M>{"\\tfrac{7}{9}"}</M> or <M>{"\\tfrac{11}{14}"}</M>?</p>,
      answer: { kind: "choice", options: ["7/9", "11/14", "They are equal."], correct: [1] },
    },
    {
      key: "percent",
      rung: "apply",
      prompt: (
        <p>
          A town of 50,000 people grows by 10% one year and shrinks by 10% the next. How many people live there at the
          end?
        </p>
      ),
      answer: { kind: "numeric", value: 49500 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction
print(Fraction(1, 3) + Fraction(1, 6))`}</Code>
          <p>Fractions add over a common denominator, then reduce. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1/2", "2/9", "3/6", "1/9"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction
x = Fraction(1, 3) + Fraction(1, 6)
y = x * 4 - Fraction(1, 2)
print(x, y)`}</Code>
          <p>Fraction keeps exact rational numbers in lowest terms. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1/2 3/2", "3/6 3/2", "1/2 1.5", "0.5 1.5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>add(a, b, c, d)</C>, which returns a/b + c/d in lowest terms as a tuple (numerator, denominator) with a positive denominator. Use <C>math.gcd</C> and not the <C>fractions</C> module.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def add(a, b, c, d):
    return (a + c, b + d)
`,
        solution: `import math

def add(a, b, c, d):
    n, m = a * d + c * b, b * d
    g = math.gcd(n, m)
    n, m = n // g, m // g
    if m < 0:
        n, m = -n, -m
    return (n, m)
`,
        tests: [
          { name: "halves", code: `assert add(1, 2, 1, 3) == (5, 6), '1/2 + 1/3 = 3/6 + 2/6 = 5/6.'` },
          { name: "reduce", code: `assert add(1, 3, 1, 6) == (1, 2), 'Reduce by the greatest common divisor.'` },
          { name: "signs", code: `assert add(1, -4, 0, 1) == (-1, 4), 'Keep the denominator positive.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>egyptian(p, q)</C>, which writes a fraction 0 &lt; p/q &lt; 1 as a sum of distinct unit fractions by the greedy rule: repeatedly take the largest 1/n not exceeding what is left, and subtract it. Return the list of denominators in increasing order. Work with integers only.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def egyptian(p, q):
    return [q]
`,
        solution: `def egyptian(p, q):
    out = []
    while p > 0:
        n = -(-q // p)
        out.append(n)
        p, q = p * n - q, q * n
    return out
`,
        tests: [
          { name: "simple", code: `assert egyptian(1, 7) == [7] and egyptian(2, 3) == [2, 6] and egyptian(3, 4) == [2, 4], '2/3 = 1/2 + 1/6.'` },
          { name: "classic", code: `assert egyptian(4, 13) == [4, 18, 468] and egyptian(5, 6) == [2, 3], 'The largest 1/n not above p/q has n = ⌈q/p⌉.'` },
          { name: "exact", code: `from fractions import Fraction
for p, q in [(7, 15), (5, 121), (11, 12), (3, 7)]:
    ds = egyptian(p, q)
    assert sum(Fraction(1, d) for d in ds) == Fraction(p, q) and len(set(ds)) == len(ds) and ds == sorted(ds), (p, q)` },
          { name: "long", code: `ds = egyptian(5, 121)
assert ds[:3] == [25, 757, 763309] and len(ds) == 5, 'Integer arithmetic keeps the huge denominators exact.'` },
        ],
      },
    },
    {
      key: "test",
      rung: "prove",
      prompt: (
        <p>
          Using the equality test, prove that if <M>{"\\tfrac{a}{b} = \\tfrac{c}{d}"}</M> and <M>{"\\tfrac{c}{d} = \\tfrac{e}{f}"}</M>{" "}
          (with <M>b</M>, <M>d</M>, <M>f</M> nonzero), then <M>{"\\tfrac{a}{b} = \\tfrac{e}{f}"}</M>. Explain where you use
          the fact that <M>d</M> is not zero.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Translates both hypotheses with the test: ad = bc and cf = de.",
          "Combines them to get adf = bcf = bde, or an equivalent chain.",
          "Cancels d, explicitly using that d is not zero, to reach af = be.",
          "Concludes a/b = e/f by the test.",
        ],
      },
    },
    {
      key: "telescope",
      rung: "stretch",
      prompt: (
        <p>
          Compute <M>{"\\tfrac{1}{1 \\cdot 2} + \\tfrac{1}{2 \\cdot 3} + \\tfrac{1}{3 \\cdot 4} + \\cdots + \\tfrac{1}{9 \\cdot 10}"}</M>.
          Try the first two or three partial sums before attempting the whole thing.
        </p>
      ),
      answer: { kind: "numeric", value: 9 / 10 },
    },
  ],

  teachBack:
    "Explain to someone who finds fractions confusing why you need a common denominator to add them, but not to multiply them, and why a 20% rise followed by a 20% fall does not return a price to where it started. Use pizzas, bars or anything you can picture.",

  glimpse: (
    <p>
      The equality test <M>{"ad = bc"}</M> is another equivalence relation, like the pairs that built the integers, and
      it returns in Proof and Logic. The laws you have now, with division added, are exactly the field axioms that open
      Calculus. Uniqueness of lowest terms waits for the fundamental theorem of arithmetic in Discrete Mathematics, and
      percentage changes as repeated multiplication return as compound growth in the chapter on exponentials. Next: are
      fractions enough to measure every length?
    </p>
  ),
};
