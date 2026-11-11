import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { VennLogicViz } from "@/components/viz/VennLogicViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.1.3",
  minutes: 65,
  links: {
    revisits: ["m0.2.6"],
    foreshadows: ["m1.2.3", "m1.4.3"],
  },

  puzzle: (
    <>
      <p>
        A teacher says: &ldquo;It is not true that you did the homework and revised for the test.&rdquo; Her student replies,
        &ldquo;So I did neither?&rdquo;
      </p>
      <p>
        Is the student right? What exactly does &ldquo;not (A and B)&rdquo; tell you? And when do two differently worded
        statements say exactly the same thing?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        &ldquo;Not both&rdquo; is not &ldquo;neither&rdquo;. The teacher has only told the student that at least one of the
        two was skipped. In symbols, <M>{"\\neg(H \\wedge R)"}</M> says the same as <M>{"\\neg H \\vee \\neg R"}</M>, not{" "}
        <M>{"\\neg H \\wedge \\neg R"}</M>.
      </p>
      <p>
        &ldquo;Says the same&rdquo; has a precise meaning: true in exactly the same cases. Picture the four cases for two
        letters as the four regions of a Venn diagram, and shade the regions where a formula is true. Two formulas are
        equivalent when their shadings match.
      </p>
      <VennLogicViz />
    </>
  ),

  theory: (
    <>
      <Definition title="logical equivalence">
        <p>
          Formulas <M>A</M> and <M>B</M> are <strong>logically equivalent</strong>, written <M>{"A \\equiv B"}</M>, if they
          have the same truth value in every row of the truth table; equivalently, if <M>{"A \\leftrightarrow B"}</M> is a
          tautology. Equivalent formulas can replace one another inside any larger formula without changing its truth value.
        </p>
      </Definition>

      <Theorem title="the standard equivalences">
        <MD>{"\\begin{aligned}\n\\neg\\neg P &\\equiv P && \\text{double negation} \\\\\n\\neg(P \\wedge Q) &\\equiv \\neg P \\vee \\neg Q && \\text{De Morgan} \\\\\n\\neg(P \\vee Q) &\\equiv \\neg P \\wedge \\neg Q && \\text{De Morgan} \\\\\nP \\wedge (Q \\vee R) &\\equiv (P \\wedge Q) \\vee (P \\wedge R) && \\text{distributive} \\\\\nP \\vee (Q \\wedge R) &\\equiv (P \\vee Q) \\wedge (P \\vee R) && \\text{distributive} \\\\\nP \\to Q &\\equiv \\neg P \\vee Q && \\text{the conditional} \\\\\nP \\leftrightarrow Q &\\equiv (P \\to Q) \\wedge (Q \\to P) && \\text{the biconditional}\n\\end{aligned}"}</MD>
        <p>Also, <M>{"\\wedge"}</M> and <M>{"\\vee"}</M> are each commutative and associative.</p>
      </Theorem>
      <Proof>
        <p>
          Each is checked by a truth table. For the first De Morgan law: <M>{"\\neg(P \\wedge Q)"}</M> is false only in the
          row where P and Q are both true, and so is <M>{"\\neg P \\vee \\neg Q"}</M>, since both disjuncts are false only
          there. The others are left as practice; the picture above checks three of them.
        </p>
      </Proof>

      <Example title="simplifying by algebra">
        <p>Once the laws are proved, they can be used like the laws of algebra, without tables:</p>
        <MD>{"\\neg(P \\to Q) \\equiv \\neg(\\neg P \\vee Q) \\equiv \\neg\\neg P \\wedge \\neg Q \\equiv P \\wedge \\neg Q."}</MD>
        <p>
          So the negation of &ldquo;if P then Q&rdquo; is &ldquo;P and not Q&rdquo;, not &ldquo;if P then not Q&rdquo;. To
          refute &ldquo;if a number is prime, it is odd&rdquo;, exhibit a prime that is even: 2.
        </p>
      </Example>

      <Remark title="how few connectives do we need?">
        <p>
          Since <M>{"P \\to Q \\equiv \\neg P \\vee Q"}</M> and <M>{"P \\wedge Q \\equiv \\neg(\\neg P \\vee \\neg Q)"}</M>,
          every formula can be rewritten using only <M>{"\\neg"}</M> and <M>{"\\vee"}</M>. Remarkably, a single connective
          suffices: &ldquo;not both&rdquo;, written <M>{"P \\uparrow Q"}</M>, since <M>{"\\neg P \\equiv P \\uparrow P"}</M>. Henry
          Sheffer published this in 1913, and Charles Sanders Peirce had noticed it some thirty years before. Computer chips
          are often built from this one gate, called NAND.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "de-morgan",
      rung: "check",
      prompt: <p>Which formula is equivalent to <M>{"\\neg(P \\vee Q)"}</M>?</p>,
      answer: { kind: "choice", options: ["¬P ∨ ¬Q", "¬P ∧ ¬Q", "P ∧ Q", "¬P → Q"], correct: [1] },
    },
    {
      key: "homework",
      rung: "check",
      prompt: <p>&ldquo;It is not true that you did the homework and revised.&rdquo; Which follows?</p>,
      answer: {
        kind: "choice",
        options: ["You did neither.", "You skipped at least one of them.", "You did exactly one of them.", "You did the homework but did not revise."],
        correct: [1],
      },
    },
    {
      key: "negate-conditional",
      rung: "apply",
      prompt: <p>Which is the negation of &ldquo;If it rains, the match is cancelled&rdquo;?</p>,
      answer: {
        kind: "choice",
        options: ["If it rains, the match is not cancelled.", "It rains and the match is not cancelled.", "If it does not rain, the match is cancelled.", "It does not rain and the match is cancelled."],
        correct: [1],
      },
    },
    {
      key: "equivalent-pairs",
      rung: "apply",
      prompt: <p>Select every pair of equivalent formulas.</p>,
      answer: {
        kind: "choice",
        options: ["P → Q and ¬Q → ¬P", "P → Q and Q → P", "P → (Q → R) and (P ∧ Q) → R", "¬(P ↔ Q) and P ↔ ¬Q"],
        correct: [0, 2, 3],
      },
    },
    {
      key: "simplify",
      rung: "apply",
      prompt: <p>Which simpler formula is equivalent to <M>{"(P \\wedge Q) \\vee (P \\wedge \\neg Q)"}</M>?</p>,
      answer: { kind: "choice", options: ["P", "Q", "P ∧ Q", "P ∨ Q"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product
print(all((not (p and q)) == ((not p) or (not q)) for p, q in product([True, False], repeat=2)))`}</Code>
          <p>This checks one of De Morgan's laws on every row. What does it print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>equivalent(f, g, n)</C>, which returns <C>True</C> when the Boolean functions f and g of n variables agree on every row of the truth table.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import product

def equivalent(f, g, n):
    return True
`,
        solution: `from itertools import product

def equivalent(f, g, n):
    return all(f(*r) == g(*r) for r in product([True, False], repeat=n))
`,
        tests: [
          { name: "De Morgan", code: `assert equivalent(lambda p, q: not (p or q), lambda p, q: (not p) and (not q), 2), 'De Morgan: ¬(p ∨ q) ≡ ¬p ∧ ¬q.'` },
          { name: "not equivalent", code: `assert not equivalent(lambda p, q: (not p) or q, lambda p, q: p or (not q), 2), 'p → q and its converse are not equivalent.'` },
        ],
      },
    },
    {
      key: "distributive",
      rung: "prove",
      prompt: <p>Prove that <M>{"P \\wedge (Q \\vee R) \\equiv (P \\wedge Q) \\vee (P \\wedge R)"}</M>, by a truth table or by an argument in cases.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Considers all eight rows, or splits into the cases P true and P false.",
          "If P is false, shows both sides are false.",
          "If P is true, shows both sides reduce to Q ∨ R.",
          "Concludes the two formulas agree in every row.",
        ],
      },
    },
    {
      key: "nand",
      rung: "stretch",
      prompt: (
        <p>
          Write <M>{"P \\uparrow Q"}</M> for <M>{"\\neg(P \\wedge Q)"}</M>. Which formula built only from <M>{"\\uparrow"}</M> is
          equivalent to <M>{"P \\wedge Q"}</M>?
        </p>
      ),
      answer: {
        kind: "choice",
        options: ["(P ↑ Q) ↑ (P ↑ Q)", "(P ↑ P) ↑ (Q ↑ Q)", "P ↑ (Q ↑ Q)", "(P ↑ Q) ↑ P"],
        correct: [0],
      },
    },
  ],

  teachBack:
    "Explain to a friend why 'not (A and B)' means 'not A or not B', using the four cases for A and B.",

  glimpse: (
    <p>
      Next, conditionals in more depth: converses, contrapositives and how proofs use them. De Morgan&rsquo;s laws return twice in this course: to negate statements with &ldquo;for all&rdquo; and &ldquo;there exists&rdquo;, and as laws about unions and intersections of sets.
    </p>
  ),
};
