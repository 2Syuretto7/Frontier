import { M, MD } from "@/components/Math";
import { Definition, Example, Proposition, Proof, Remark } from "@/components/lesson/Blocks";
import { PredicateViz } from "@/components/viz/PredicateViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.2.1",
  minutes: 55,
  links: {
    revisits: ["m0.3.1", "m1.1.1"],
    foreshadows: ["m1.4.1", "m1.6.1"],
  },

  puzzle: (
    <>
      <p>Is the sentence &ldquo;x is greater than 3&rdquo; true or false?</p>
      <p>
        Propositional logic insists that every statement is one or the other. Yet this sentence seems to be neither, and
        mathematics is full of sentences like it: &ldquo;n is prime&rdquo;, &ldquo;the triangle is right-angled&rdquo;,
        &ldquo;f is continuous&rdquo;. What kind of thing are they, and how do they become true or false?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        &ldquo;x is greater than 3&rdquo; is a statement with a hole in it. Fill the hole with 5 and you get a true statement;
        fill it with 2 and you get a false one. Such a sentence is a <strong>predicate</strong>. It behaves like a machine:
        feed it an object, and out comes a truth value.
      </p>
      <p>
        A predicate therefore sorts the objects it talks about into two piles: those that make it true and those that make it
        false. Pick a predicate below and watch it sort the numbers 1 to 20. Click any number to fill the hole with it.
      </p>
      <PredicateViz />
    </>
  ),

  theory: (
    <>
      <Definition title="predicate, domain, truth set">
        <p>
          A <strong>predicate</strong> <M>{"P(x)"}</M> is a sentence containing a variable x that becomes a statement whenever
          x is replaced by an object from a fixed collection D, the <strong>domain</strong> (or domain of discourse). Its{" "}
          <strong>truth set</strong> is the collection of objects that make it true:
        </p>
        <MD>{"\\{\\, x \\in D : P(x) \\,\\}."}</MD>
        <p>
          While x stands unreplaced it is a <strong>free variable</strong>, and <M>{"P(x)"}</M> has no truth value.
        </p>
      </Definition>

      <Example title="the domain matters">
        <p>
          Let <M>{"P(x)"}</M> be &ldquo;<M>{"x^2 = 2"}</M>&rdquo;. Over the whole numbers its truth set is empty. Over the
          real numbers it is <M>{"\\{-\\sqrt 2, \\sqrt 2\\}"}</M>. The sentence is the same; the domain changes what it says.
        </p>
      </Example>

      <Definition title="predicates of several variables">
        <p>
          A predicate may have more than one hole. &ldquo;<M>{"x < y"}</M>&rdquo; is a two-place predicate{" "}
          <M>{"R(x, y)"}</M>; it becomes a statement once both x and y are filled. &ldquo;x lies between y and z&rdquo; has
          three places. A two-place predicate is also called a <strong>relation</strong>.
        </p>
      </Definition>

      <Proposition title="connectives act on truth sets">
        <p>Over a domain D, with truth sets <M>A</M> for P and <M>B</M> for Q:</p>
        <ul>
          <li><M>{"P(x) \\wedge Q(x)"}</M> has truth set the overlap of A and B (the elements in both);</li>
          <li><M>{"P(x) \\vee Q(x)"}</M> has truth set the combination of A and B (the elements in either);</li>
          <li><M>{"\\neg P(x)"}</M> has truth set the elements of D outside A.</li>
        </ul>
      </Proposition>
      <Proof>
        <p>
          An element d makes <M>{"P(d) \\wedge Q(d)"}</M> true exactly when it makes both true, that is, exactly when d is in
          both A and B. The other two cases are the same reasoning with &ldquo;either&rdquo; and &ldquo;not&rdquo;.
        </p>
      </Proof>

      <Example title="a famous predicate">
        <p>
          Let <M>{"G(n)"}</M> be &ldquo;n is a sum of two primes&rdquo;. Then <M>{"G(28)"}</M> is true, as{" "}
          <M>{"28 = 5 + 23 = 11 + 17"}</M>, and <M>{"G(11)"}</M> is false (try it). Goldbach&rsquo;s conjecture of 1742
          says that every even number greater than 2 is in the truth set of G. Nobody has proved it, and nobody has found an
          even number that fails.
        </p>
      </Example>

      <Remark title="Frege's insight">
        <p>
          In 1891, in &ldquo;Function and Concept&rdquo;, Gottlob Frege proposed that a predicate is literally a function, of
          the kind you met in school, whose outputs are always one of two values: the True and the False. This one idea,
          treating &ldquo;is prime&rdquo; like &ldquo;squared&rdquo;, made modern logic possible.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "statement",
      rung: "check",
      prompt: <p>Which of these is a statement, true or false as it stands?</p>,
      answer: { kind: "choice", options: ["x + 1 = 5", "7 + 1 = 5", "x is prime", "y > x"], correct: [1] },
    },
    {
      key: "squares",
      rung: "check",
      prompt: <p>Over the domain of whole numbers 1 to 10, how many elements does the truth set of <M>{"x^2 < 10"}</M> have?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "divisors",
      rung: "apply",
      prompt: <p>Over the domain 1 to 12, how many elements are in the truth set of &ldquo;x divides 12&rdquo;?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "even-prime",
      rung: "apply",
      prompt: (
        <p>
          Over the domain 1 to 20, let P(x) be &ldquo;x is prime&rdquo; and Q(x) be &ldquo;x is odd&rdquo;. How many elements
          are in the truth set of <M>{"P(x) \\wedge \\neg Q(x)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "pairs",
      rung: "apply",
      prompt: <p>Over the domain {"{1, 2, 3}"}, how many ordered pairs (x, y) make <M>{"x < y"}</M> true?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`is_prime = lambda n: n > 1 and all(n % d for d in range(2, int(n ** 0.5) + 1))
print([n for n in range(10, 20) if is_prime(n)])`}</Code>
          <p>A predicate becomes a statement for each n. How many n between 10 and 19 make it true?</p>
        </>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>truth_set(P, domain)</C>, which returns the set of elements of the domain for which the predicate P is true.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def truth_set(P, domain):
    return set(domain)
`,
        solution: `def truth_set(P, domain):
    return {x for x in domain if P(x)}
`,
        tests: [
          { name: "even", code: `assert truth_set(lambda n: n % 2 == 0, range(10)) == {0, 2, 4, 6, 8}, 'Keep only the elements where P holds.'` },
          { name: "empty", code: `assert truth_set(lambda n: n * n < 0, range(5)) == set(), 'No integer has a negative square.'` },
        ],
      },
    },
    {
      key: "conditional-set",
      rung: "prove",
      prompt: (
        <p>
          Over a domain D, with truth sets A for P and B for Q, describe the truth set of <M>{"P(x) \\to Q(x)"}</M> and prove
          your description.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Says the truth set is the elements outside A together with the elements in B (equivalently, everything except the elements in A but not in B).",
          "Uses that P → Q is false exactly when P is true and Q is false.",
          "Concludes that an element fails only if it lies in A and outside B.",
        ],
      },
    },
    {
      key: "goldbach",
      rung: "stretch",
      prompt: <p>In how many ways can 30 be written as a sum of two primes, if order does not matter (so 7 + 23 and 23 + 7 count once)?</p>,
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend why 'x is prime' is neither true nor false, and describe one way to turn it into a statement that is.",

  glimpse: (
    <p>
      Filling the hole with a particular object is one way to turn a predicate into a statement. The next lesson shows the
      other, more powerful way: saying that the predicate holds for <em>every</em> object, or for <em>some</em>. Later in
      this course, truth sets become sets in their own right, and two-place predicates become relations.
    </p>
  ),
};
