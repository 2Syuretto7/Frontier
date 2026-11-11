import { M, MD } from "@/components/Math";
import { Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { NegationViz } from "@/components/viz/NegationViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.2.3",
  minutes: 60,
  links: {
    revisits: ["m1.1.3", "m1.2.1"],
    foreshadows: ["m1.3.3", "m2.2.2", "m8.2.4"],
  },

  puzzle: (
    <>
      <p>A teacher claims: &ldquo;Every student in this class has read a book by Tagore.&rdquo; You think the teacher is wrong.</p>
      <p>
        What exactly must you show? That no student has read a book by Tagore? That every student has failed to? Something
        else? Write down the precise opposite of the teacher&rsquo;s claim before reading on.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        To refute &ldquo;every student has read a book by Tagore&rdquo;, you need only one student who has read none. The
        opposite of &ldquo;every&rdquo; is not &ldquo;none&rdquo;; it is &ldquo;at least one does not&rdquo;. In the same
        way, the opposite of &ldquo;some student has read Tagore&rdquo; is &ldquo;every student has failed to&rdquo;.
      </p>
      <p>
        So when a &ldquo;not&rdquo; passes a quantifier, the quantifier flips: <M>{"\\forall"}</M> becomes{" "}
        <M>{"\\exists"}</M> and <M>{"\\exists"}</M> becomes <M>{"\\forall"}</M>. Step through some examples below; the last
        one passes two quantifiers.
      </p>
      <NegationViz />
    </>
  ),

  theory: (
    <>
      <Proposition title="De Morgan's laws for quantifiers">
        <p>For any predicate P over any domain,</p>
        <MD>{"\\neg\\, \\forall x\\, P(x) \\equiv \\exists x\\, \\neg P(x) \\qquad \\text{and} \\qquad \\neg\\, \\exists x\\, P(x) \\equiv \\forall x\\, \\neg P(x)."}</MD>
      </Proposition>
      <Proof>
        <p>
          <M>{"\\forall x\\, P(x)"}</M> is false exactly when the truth set of P misses some element of the domain, that is,
          exactly when some x makes <M>{"\\neg P(x)"}</M> true. That is the first law. For the second, apply the first to the
          predicate <M>{"\\neg P"}</M>: <M>{"\\neg \\forall x\\, \\neg P(x) \\equiv \\exists x\\, P(x)"}</M>. Negate both sides
          and cancel the double negation.
        </p>
      </Proof>

      <Remark title="why De Morgan's name">
        <p>
          On a finite domain <M>{"\\{a_1, \\dots, a_n\\}"}</M>, &ldquo;for all&rdquo; is a long &ldquo;and&rdquo; and
          &ldquo;there exists&rdquo; a long &ldquo;or&rdquo;:
        </p>
        <MD>{"\\forall x\\, P(x) \\equiv P(a_1) \\wedge \\cdots \\wedge P(a_n), \\qquad \\exists x\\, P(x) \\equiv P(a_1) \\vee \\cdots \\vee P(a_n)."}</MD>
        <p>The quantifier laws are then exactly De Morgan&rsquo;s laws from propositional logic, stretched to many terms.</p>
      </Remark>

      <Proposition title="the working rule">
        <p>
          To negate a statement, move the <M>{"\\neg"}</M> from left to right, flipping each quantifier it passes, until it
          sits on the predicate; then simplify the inside with the propositional laws, especially
        </p>
        <MD>{"\\neg (A \\to B) \\equiv A \\wedge \\neg B."}</MD>
        <p>In particular, <M>{"\\neg \\forall x\\,(P(x) \\to Q(x)) \\equiv \\exists x\\,(P(x) \\wedge \\neg Q(x))"}</M>: to deny that every P is Q, find a P that is not Q.</p>
      </Proposition>

      <Example title="unbounded, precisely">
        <p>
          A function f is <strong>bounded</strong> if some number M caps its size everywhere:{" "}
          <M>{"\\exists M\\, \\forall x\\ |f(x)| \\le M"}</M>. Negating mechanically,
        </p>
        <MD>{"\\neg\\, \\exists M\\, \\forall x\\ |f(x)| \\le M \\;\\equiv\\; \\forall M\\, \\exists x\\ |f(x)| > M."}</MD>
        <p>
          So f is unbounded when, whatever cap M you propose, some x breaks it. For <M>{"f(x) = x^2"}</M> on the reals, given
          M take <M>{"x = M + 1"}</M>; then <M>{"x^2 \\ge x > M"}</M> when <M>{"M \\ge 0"}</M>, and any x at all breaks a
          negative M. Analysis is full of such negations, and doing them by rule saves much confusion.
        </p>
      </Example>

      <Remark title="all that glisters">
        <p>
          In <cite>The Merchant of Venice</cite> a scroll reads &ldquo;All that glisters is not gold&rdquo;. Read literally
          this is <M>{"\\forall x\\,(G(x) \\to \\neg O(x))"}</M>: nothing that glisters is gold, which is false of gold
          itself. What is meant is <M>{"\\neg \\forall x\\,(G(x) \\to O(x))"}</M>: not all that glisters is gold. Where a
          &ldquo;not&rdquo; sits relative to &ldquo;all&rdquo; changes the meaning, and English is careless about it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "flip",
      rung: "check",
      prompt: <p>Which is equivalent to <M>{"\\neg\\, \\forall x\\, P(x)"}</M>?</p>,
      answer: { kind: "choice", options: ["∀x ¬P(x)", "∃x ¬P(x)", "¬∃x P(x)", "∃x P(x)"], correct: [1] },
    },
    {
      key: "swans",
      rung: "check",
      prompt: <p>What is the negation of &ldquo;Some swans are black&rdquo;?</p>,
      answer: { kind: "choice", options: ["No swans are black.", "All swans are black.", "Some swans are not black.", "Some black things are not swans."], correct: [0] },
    },
    {
      key: "conditional",
      rung: "apply",
      prompt: <p>Which is equivalent to <M>{"\\neg\\, \\forall x\\,(P(x) \\to Q(x))"}</M>?</p>,
      answer: { kind: "choice", options: ["∀x (P(x) ∧ ¬Q(x))", "∃x (P(x) → ¬Q(x))", "∃x (P(x) ∧ ¬Q(x))", "∃x (¬P(x) ∧ Q(x))"], correct: [2] },
    },
    {
      key: "goldbach",
      rung: "apply",
      prompt: <p>Negate Goldbach&rsquo;s conjecture: &ldquo;Every even number greater than 2 is a sum of two primes.&rdquo;</p>,
      answer: {
        kind: "choice",
        options: [
          "No even number greater than 2 is a sum of two primes.",
          "There is an even number greater than 2 that is not a sum of two primes.",
          "Every even number greater than 2 is not a sum of two primes.",
          "There is an odd number that is a sum of two primes.",
        ],
        correct: [1],
      },
    },
    {
      key: "bounded",
      rung: "apply",
      prompt: <p>A sequence is bounded above if <M>{"\\exists M\\, \\forall n\\ a_n \\le M"}</M>. Which says it is not bounded above?</p>,
      answer: { kind: "choice", options: ["∀M ∀n aₙ > M", "∃M ∃n aₙ > M", "∀M ∃n aₙ > M", "∃n ∀M aₙ > M"], correct: [2] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`D = range(-3, 4)
P = lambda x: x * x >= x
print(not all(P(x) for x in D) == any(not P(x) for x in D))`}</Code>
          <p>Careful with precedence: == binds before not. This line is the negation of a true identity. What does it print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["False", "True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>counterexample(P, D)</C>, which returns the first x in D with P(x) false, or <C>None</C> when ∀x P(x) holds. This is ¬∀x P(x) ≡ ∃x ¬P(x) made concrete.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def counterexample(P, D):
    return None
`,
        solution: `def counterexample(P, D):
    for x in D:
        if not P(x):
            return x
    return None
`,
        tests: [
          { name: "Euler", code: `assert counterexample(lambda n: all((n * n + n + 41) % d for d in range(2, n * n + n + 41)), range(50)) == 40, 'n² + n + 41 is prime for n = 0, …, 39 but not 40.'` },
          { name: "none", code: `assert counterexample(lambda n: n * n >= 0, range(-5, 5)) is None, 'Return None when there is no counterexample.'` },
        ],
      },
    },
    {
      key: "second-law",
      rung: "prove",
      prompt: (
        <p>
          Taking the law <M>{"\\neg \\forall x\\, P(x) \\equiv \\exists x\\, \\neg P(x)"}</M> as known for every predicate,
          prove that <M>{"\\neg \\exists x\\, P(x) \\equiv \\forall x\\, \\neg P(x)"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Applies the known law to the predicate ¬P, getting ¬∀x ¬P(x) ≡ ∃x ¬¬P(x).",
          "Uses double negation to simplify ¬¬P(x) to P(x).",
          "Negates both sides and cancels the double negation to reach ¬∃x P(x) ≡ ∀x ¬P(x).",
        ],
      },
    },
    {
      key: "limit",
      rung: "stretch",
      prompt: (
        <p>
          A sequence <M>{"a_n"}</M> converges to L when{" "}
          <M>{"\\forall \\varepsilon > 0\\ \\exists N\\ \\forall n \\ge N\\ |a_n - L| < \\varepsilon"}</M>. Which statement
          says it does not converge to L?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "∀ε > 0 ∃N ∀n ≥ N |aₙ − L| ≥ ε",
          "∃ε > 0 ∀N ∃n ≥ N |aₙ − L| ≥ ε",
          "∃ε > 0 ∃N ∃n ≥ N |aₙ − L| ≥ ε",
          "∀ε > 0 ∀N ∀n ≥ N |aₙ − L| ≥ ε",
        ],
        correct: [1],
      },
    },
  ],

  teachBack:
    "Explain to a friend how to negate 'every student has read a book by Tagore', and why the answer is not 'no student has read a book by Tagore'.",

  glimpse: (
    <p>
      The stretch exercise used three quantifiers in a row, and the next lesson is about exactly that: statements with
      several quantifiers, where the order of &ldquo;for all&rdquo; and &ldquo;there exists&rdquo; matters. Negation is the
      heart of proof by contradiction, and the convergence definition returns in Calculus and in Real Analysis.
    </p>
  ),
};
