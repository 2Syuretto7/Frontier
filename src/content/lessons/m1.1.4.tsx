import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { WasonViz } from "@/components/viz/WasonViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.1.4",
  minutes: 65,
  links: {
    revisits: ["m0.7.3", "m1.1.2"],
    foreshadows: ["m1.3.1", "m1.3.2"],
  },

  puzzle: (
    <>
      <p>
        Four cards lie on a table. Each has a letter on one side and a number on the other. You see <strong>E</strong>,{" "}
        <strong>K</strong>, <strong>4</strong> and <strong>7</strong>. Someone claims: &ldquo;If a card has a vowel on one
        side, then it has an even number on the other.&rdquo;
      </p>
      <p>
        Which cards must you turn over to check whether the claim is true? Decide before reading on. This is among the most
        studied puzzles in psychology, and most clever adults get it wrong.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The rule &ldquo;vowel <M>{"\\to"}</M> even&rdquo; can only be broken by a card with a vowel and an odd number. So turn
        the vowel, E, in case there is an odd number behind it, and turn the odd number, 7, in case there is a vowel behind
        it. The 4 tempts nearly everyone, but a consonant behind it would break nothing: the rule never said even numbers have
        vowels. Turning the 4 tests the <strong>converse</strong>, a different statement.
      </p>
      <p>
        Checking the 7 is the <strong>contrapositive</strong> at work: &ldquo;if odd, then not a vowel&rdquo; says the same as
        the rule. Try both versions below; the second has exactly the same logic.
      </p>
      <WasonViz />
    </>
  ),

  theory: (
    <>
      <Definition title="converse, inverse and contrapositive">
        <p>For the conditional <M>{"P \\to Q"}</M>:</p>
        <ul>
          <li>its <strong>converse</strong> is <M>{"Q \\to P"}</M>;</li>
          <li>its <strong>inverse</strong> is <M>{"\\neg P \\to \\neg Q"}</M>;</li>
          <li>its <strong>contrapositive</strong> is <M>{"\\neg Q \\to \\neg P"}</M>.</li>
        </ul>
        <p>In <M>{"P \\to Q"}</M>, P is the <strong>hypothesis</strong> or antecedent and Q the <strong>conclusion</strong> or consequent.</p>
      </Definition>

      <Proposition title="the contrapositive is equivalent">
        <p>
          <M>{"P \\to Q \\equiv \\neg Q \\to \\neg P"}</M>. The converse and the inverse are equivalent to each other, but
          not to the original.
        </p>
      </Proposition>
      <Proof>
        <p>
          <M>{"\\neg Q \\to \\neg P \\equiv \\neg\\neg Q \\vee \\neg P \\equiv Q \\vee \\neg P \\equiv \\neg P \\vee Q \\equiv P \\to Q"}</M>.
          The inverse is the contrapositive of the converse, so those two are equivalent. And the row with P false and Q true
          makes <M>{"P \\to Q"}</M> true but <M>{"Q \\to P"}</M> false.
        </p>
      </Proof>

      <Definition title="necessary and sufficient">
        <p>
          In <M>{"P \\to Q"}</M>, P is a <strong>sufficient condition</strong> for Q, and Q is a{" "}
          <strong>necessary condition</strong> for P. All of these say the same:
        </p>
        <MD>{"\\text{if } P \\text{ then } Q; \\quad P \\text{ only if } Q; \\quad Q \\text{ if } P; \\quad Q \\text{ whenever } P; \\quad P \\text{ is sufficient for } Q; \\quad Q \\text{ is necessary for } P."}</MD>
        <p>
          &ldquo;P if and only if Q&rdquo;, often written &ldquo;P iff Q&rdquo;, says each is necessary and sufficient for
          the other.
        </p>
      </Definition>

      <Example title="converses in mathematics">
        <p>
          &ldquo;If a number is divisible by 4, it is even&rdquo; is true; its converse, &ldquo;if a number is even, it is
          divisible by 4&rdquo;, is false (try 6). Pythagoras says: if a triangle has a right angle at C, then{" "}
          <M>{"a^2 + b^2 = c^2"}</M>. Its converse happens to be true as well, but that needs its own proof (by the law of
          cosines, for instance). A true converse is a separate theorem, never a free gift.
        </p>
      </Example>

      <Remark title="two classic mistakes">
        <p>
          <strong>Affirming the consequent:</strong> &ldquo;if P then Q; Q; so P&rdquo;. If it rained, the road is wet; the
          road is wet; so it rained? Perhaps a tanker spilled water. <strong>Denying the antecedent:</strong> &ldquo;if P then
          Q; not P; so not Q&rdquo;. Both confuse a conditional with its converse. Their valid cousins are{" "}
          <em>modus ponens</em> (P → Q, P; so Q) and <em>modus tollens</em> (P → Q, not Q; so not P), the second of which is
          the contrapositive in action, and the logic behind the 7 card.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "converse",
      rung: "check",
      prompt: <p>What is the converse of &ldquo;If it is a square, then it is a rectangle&rdquo;?</p>,
      answer: {
        kind: "choice",
        options: ["If it is a rectangle, then it is a square.", "If it is not a square, then it is not a rectangle.", "If it is not a rectangle, then it is not a square.", "It is a square and a rectangle."],
        correct: [0],
      },
    },
    {
      key: "contrapositive",
      rung: "check",
      prompt: <p>Which statement is equivalent to &ldquo;If n² is even, then n is even&rdquo;?</p>,
      answer: {
        kind: "choice",
        options: ["If n is even, then n² is even.", "If n is odd, then n² is odd.", "If n² is odd, then n is odd.", "If n is odd, then n² is even."],
        correct: [1],
      },
    },
    {
      key: "necessary",
      rung: "apply",
      prompt: <p>&ldquo;Passing the exam is necessary for graduating.&rdquo; With E for passing and G for graduating, which symbolisation is right?</p>,
      answer: { kind: "choice", options: ["E → G", "G → E", "E ↔ G", "¬G → ¬E"], correct: [1] },
    },
    {
      key: "fallacy",
      rung: "apply",
      prompt: <p>&ldquo;If the alarm was set, it rang. It rang. So it was set.&rdquo; What is wrong?</p>,
      answer: {
        kind: "choice",
        options: ["Nothing: it is modus ponens.", "It affirms the consequent.", "It denies the antecedent.", "It is modus tollens."],
        correct: [1],
      },
    },
    {
      key: "cards",
      rung: "apply",
      prompt: (
        <p>
          Rule: &ldquo;If a card shows a circle on one side, it is red on the other.&rdquo; You see a circle, a triangle, a red
          side and a blue side. Which cards must you turn?
        </p>
      ),
      answer: { kind: "choice", options: ["circle", "triangle", "red", "blue"], correct: [0, 3] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`imp = lambda p, q: (not p) or q
from itertools import product
print(sum(imp(p, q) != imp(not q, not p) for p, q in product([True, False], repeat=2)))`}</Code>
          <p>On how many rows does p → q differ from its contrapositive?</p>
        </>
      ),
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`n = 15
p = n % 6 == 0
q = n % 3 == 0
print(not p or q, not q or p, p or not q)`}</Code>
          <p>With p = '6 divides n' and q = '3 divides n', the code prints p → q, its converse q → p, and its inverse ¬p → ¬q. What does it print for n = 15?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True False False", "True True True", "False False True", "True False True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>related(p, q)</C>, which returns a dict with the truth values of <C>"converse"</C> (q → p), <C>"inverse"</C> (¬p → ¬q) and <C>"contrapositive"</C> (¬q → ¬p).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def related(p, q):
    return {}
`,
        solution: `def related(p, q):
    imp = lambda a, b: (not a) or b
    return {'converse': imp(q, p), 'inverse': imp(not p, not q), 'contrapositive': imp(not q, not p)}
`,
        tests: [
          { name: "true false", code: `assert related(True, False) == {'converse': True, 'inverse': True, 'contrapositive': False}, 'With p true and q false, only the contrapositive (like p → q itself) is false.'` },
          { name: "false true", code: `assert related(False, True) == {'converse': False, 'inverse': False, 'contrapositive': True}, 'With p false and q true, the converse and inverse fail.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>audit(P, Q, D)</C> for predicates P and Q on a finite domain D. It returns a dict with four keys, <C>"implication"</C> (∀x P(x) → Q(x)), <C>"converse"</C>, <C>"inverse"</C> and <C>"contrapositive"</C>, each mapping to <C>None</C> if that statement holds on all of D, or else to the first counterexample in D.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def audit(P, Q, D):
    return {'implication': None, 'converse': None, 'inverse': None, 'contrapositive': None}
`,
        solution: `def first_fail(A, B, D):
    for x in D:
        if A(x) and not B(x):
            return x
    return None

def audit(P, Q, D):
    nP = lambda x: not P(x)
    nQ = lambda x: not Q(x)
    return {'implication': first_fail(P, Q, D), 'converse': first_fail(Q, P, D), 'inverse': first_fail(nP, nQ, D), 'contrapositive': first_fail(nQ, nP, D)}
`,
        tests: [
          { name: "divisibility", code: `a = audit(lambda n: n % 6 == 0, lambda n: n % 3 == 0, range(1, 50))
assert a == {'implication': None, 'converse': 3, 'inverse': 3, 'contrapositive': None}, 'The converse fails at 3.'` },
          { name: "pairs", code: `a = audit(lambda n: n > 10, lambda n: n > 5, range(0, 20))
assert a['implication'] is None and a['contrapositive'] is None and a['converse'] == 6 and a['inverse'] == 6, 'An implication and its contrapositive stand or fall together.'` },
          { name: "both fail", code: `a = audit(lambda n: n % 2 == 0, lambda n: n % 4 == 0, range(1, 30))
assert a['implication'] == 2 and a['contrapositive'] == 2 and a['converse'] is None and a['inverse'] is None, 'Here only the converse holds.'` },
        ],
      },
    },
    {
      key: "contra-proof",
      rung: "prove",
      prompt: <p>Prove that a conditional and its converse are not equivalent, and that the converse and inverse are equivalent.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Exhibits a row, P false and Q true, where P → Q is true but Q → P is false.",
          "Writes the inverse ¬P → ¬Q and identifies it as the contrapositive of the converse Q → P.",
          "Uses the equivalence of a conditional with its contrapositive, or a truth table, to show the inverse and converse agree.",
        ],
      },
    },
    {
      key: "iff",
      rung: "stretch",
      prompt: (
        <p>
          A whole number <M>n</M> is divisible by 6 if and only if it is divisible by both 2 and 3. Which pair of
          conditionals must be proved to establish this?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "If 6 divides n then 2 and 3 divide n; and if 2 and 3 divide n then 6 divides n.",
          "If 6 divides n then 2 divides n; and if 6 divides n then 3 divides n.",
          "If 2 divides n then 6 divides n; and if 3 divides n then 6 divides n.",
          "If 6 does not divide n then 2 does not divide n.",
        ],
        correct: [0],
      },
    },
  ],

  teachBack:
    "Explain to a friend why, in the card puzzle, you must turn the 7 but not the 4, using the words converse and contrapositive.",

  glimpse: (
    <p>
      This completes propositional logic. Next come quantifiers, &ldquo;for all&rdquo; and &ldquo;there exists&rdquo;, which most mathematical statements need. In the chapter on proof, the contrapositive becomes a proof technique of its own: to prove &ldquo;if P then Q&rdquo;, assume Q fails and show P fails. Confusing a conditional with its converse is also behind many misread results, the subject of the last lesson of How Machines Learn.
    </p>
  ),
};
