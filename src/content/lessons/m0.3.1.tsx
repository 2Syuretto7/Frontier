import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { MappingViz } from "@/components/viz/MappingViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.3.1",
  minutes: 60,
  links: {
    revisits: ["m0.2.1"],
    foreshadows: ["m0.3.4", "m1.4.5", "m1.7.1", "m1.7.2", "m2.2.1"],
  },

  puzzle: (
    <>
      <p>
        Every person has exactly one biological mother. Some people have no children, and some have several. So
        &ldquo;the mother of&rdquo; turns any person into a definite person, while &ldquo;the child of&rdquo; does not.
      </p>
      <p>
        What exactly is the difference? And is &ldquo;the square of&rdquo; more like the first rule or the second? What
        about &ldquo;a number whose square is&rdquo;?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A rule like &ldquo;the mother of&rdquo; is reliable: give it any input from the agreed collection, and it hands back
        one output, never none and never two. That reliability is what lets us write <M>{"\\text{mother}(x)"}</M> and treat
        it as a thing. &ldquo;The child of&rdquo; fails twice: some inputs have no output and some have several.
      </p>
      <p>
        &ldquo;The square of&rdquo; is reliable: <M>{"3 \\mapsto 9"}</M>, <M>{"-3 \\mapsto 9"}</M>. Two inputs may share an
        output; that is allowed. &ldquo;A number whose square is&rdquo; is not: 9 would have to go to both 3 and{" "}
        <M>{"-3"}</M>, and <M>{"-1"}</M> would go nowhere. Draw the rule as arrows from inputs to outputs and the test is
        visible: a function is exactly when every input has one arrow leaving it. Try it.
      </p>
      <MappingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="function">
        <p>
          Let <M>A</M> and <M>B</M> be sets. A <strong>function</strong> <M>{"f : A \\to B"}</M> assigns to each element{" "}
          <M>x</M> of <M>A</M> exactly one element <M>{"f(x)"}</M> of <M>B</M>. The set <M>A</M> is the{" "}
          <strong>domain</strong>, <M>B</M> the <strong>codomain</strong>, and <M>{"f(x)"}</M> the <strong>value</strong>{" "}
          of <M>f</M> at <M>x</M>. We also write <M>{"x \\mapsto f(x)"}</M>, read &ldquo;<M>x</M> maps to{" "}
          <M>{"f(x)"}</M>&rdquo;.
        </p>
        <p>
          The <strong>range</strong> (or <strong>image</strong>) of <M>f</M> is the set of values it actually takes:
        </p>
        <MD>{"f(A) = \\{\\, f(x) : x \\in A \\,\\}."}</MD>
      </Definition>

      <p>
        Two conditions are packed into &ldquo;exactly one&rdquo;. <em>At least one</em>: every input has an output, so the
        rule is defined on the whole domain. <em>At most one</em>: no input has two outputs. The range may be smaller than
        the codomain; the codomain says where values are allowed to land, the range where they do land.
      </p>

      <Example title="functions and non-functions">
        <ul>
          <li>
            <M>{"s : \\mathbb{R} \\to \\mathbb{R}"}</M>, <M>{"s(x) = x^2"}</M>, is a function. Its range is{" "}
            <M>{"[0, \\infty)"}</M>, the non-negative reals, smaller than its codomain.
          </li>
          <li>
            The <strong>floor</strong> <M>{"\\lfloor x \\rfloor"}</M>, the greatest integer not exceeding <M>x</M>, is a
            function <M>{"\\mathbb{R} \\to \\mathbb{Z}"}</M>: <M>{"\\lfloor 2.7 \\rfloor = 2"}</M>,{" "}
            <M>{"\\lfloor -2.7 \\rfloor = -3"}</M>.
          </li>
          <li>
            &ldquo;Your birthday&rdquo;, from people to dates of the year, is a function. Many people share an output.
          </li>
          <li>
            <M>{"x \\mapsto \\tfrac1x"}</M> is not a function <M>{"\\mathbb{R} \\to \\mathbb{R}"}</M>, since 0 has no
            output. It is a function from the non-zero reals.
          </li>
          <li>
            &ldquo;<M>y</M> with <M>{"y^2 = x"}</M>&rdquo; is not a function of <M>x</M> on any domain containing a positive
            number, since such an <M>x</M> has two square roots. Choosing one of them, the non-negative one, gives the
            function <M>{"\\sqrt{x}"}</M>.
          </li>
        </ul>
      </Example>

      <Definition title="natural domain">
        <p>
          When a function is given by a formula and no domain is stated, its <strong>natural domain</strong> is the set of
          all real numbers for which the formula makes sense. For <M>{"\\tfrac{1}{x - 2}"}</M> it is every real except 2;
          for <M>{"\\sqrt{x + 3}"}</M> it is <M>{"x \\ge -3"}</M>.
        </p>
      </Definition>

      <Definition title="equal functions">
        <p>
          Functions <M>f</M> and <M>g</M> are <strong>equal</strong> when they have the same domain and codomain and{" "}
          <M>{"f(x) = g(x)"}</M> for every <M>x</M> in the domain. How a function is written does not matter, only what it
          does: <M>{"x \\mapsto (x + 1)^2"}</M> and <M>{"x \\mapsto x^2 + 2x + 1"}</M> are the same function.
        </p>
      </Definition>

      <Proposition title="a formula is not a function">
        <p>
          The functions <M>{"f(x) = \\dfrac{x^2 - 1}{x - 1}"}</M> and <M>{"g(x) = x + 1"}</M>, each on its natural domain,
          are not equal, although <M>{"f(x) = g(x)"}</M> wherever both are defined.
        </p>
      </Proposition>
      <Proof>
        <p>
          For <M>{"x \\neq 1"}</M>, <M>{"x^2 - 1 = (x - 1)(x + 1)"}</M>, so <M>{"f(x) = x + 1 = g(x)"}</M>. But{" "}
          <M>{"f(1)"}</M> would require dividing by zero, so 1 is not in the domain of <M>f</M>, while{" "}
          <M>{"g(1) = 2"}</M>. The domains differ, so the functions differ.
        </p>
      </Proof>

      <Example title="working with function notation">
        <p>
          Let <M>{"f(x) = x^2 - 3x"}</M>. The letter <M>x</M> is only a placeholder for the input, so to find{" "}
          <M>{"f(a + 1)"}</M>, replace every <M>x</M> by <M>{"(a + 1)"}</M>, brackets and all:
        </p>
        <MD>{"f(a + 1) = (a + 1)^2 - 3(a + 1) = a^2 - a - 2."}</MD>
        <p>
          Note that <M>{"f(a + 1) \\neq f(a) + 1"}</M> in general: <M>{"f(a) + 1 = a^2 - 3a + 1"}</M>.
        </p>
      </Example>

      <Remark title="what a function really is">
        <p>
          We have said a function &ldquo;assigns&rdquo; outputs, which suggests a machine or a rule you can compute. Not
          every function has a formula: assign 1 to every rational number and 0 to every irrational one, and you have a
          perfectly good function that no simple formula describes. In Proof and Logic, a function <em>is</em> its set of
          input-output pairs <M>{"(x, f(x))"}</M>, a special kind of relation, with no rule required. That set of pairs is
          also its graph, the subject of the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "evaluate",
      rung: "check",
      prompt: <p>If <M>{"f(x) = 3x - 2"}</M>, what is <M>{"f(4)"}</M>?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "which",
      rung: "check",
      prompt: <p>Select every rule that is a function from people to people.</p>,
      answer: {
        kind: "choice",
        options: ["the biological mother of", "a child of", "a friend of", "the biological father of"],
        correct: [0, 3],
      },
    },
    {
      key: "range",
      rung: "apply",
      prompt: <p>What is the range of <M>{"x \\mapsto x^2 + 1"}</M>, as a function from the reals to the reals?</p>,
      answer: {
        kind: "choice",
        options: ["all real numbers", "all real numbers at least 1", "all real numbers at least 0", "all positive integers"],
        correct: [1],
      },
    },
    {
      key: "domain",
      rung: "apply",
      prompt: <p>What is the smallest number in the natural domain of <M>{"\\sqrt{2x - 6}"}</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "substitute",
      rung: "apply",
      prompt: <p>If <M>{"f(x) = x^2 + 1"}</M>, write <M>{"f(a + 1)"}</M> in terms of <M>a</M>.</p>,
      answer: { kind: "expression", value: "a^2 + 2a + 2", variables: ["a"] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`f = {1: 'a', 2: 'b', 3: 'a'}
print(len(f), len(set(f.values())))`}</Code>
          <p>A dictionary is a function from its keys to its values. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 2", "3 3", "2 3", "2 2"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            A rule pairs inputs with outputs. Write <C>is_function(pairs)</C>, which takes a list of (input, output) pairs and says whether no input is paired with two different outputs.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def is_function(pairs):
    return True
`,
        solution: `def is_function(pairs):
    seen = {}
    for x, y in pairs:
        if x in seen and seen[x] != y:
            return False
        seen[x] = y
    return True
`,
        tests: [
          { name: "function", code: `assert is_function([(1, 2), (2, 4), (3, 6), (1, 2)]), 'Repeating the same pair is fine.'` },
          { name: "not a function", code: `assert not is_function([(1, 1), (1, -1)]), 'The input 1 cannot have two outputs, as in y² = x.'` },
        ],
      },
    },
    {
      key: "range-proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that the range of <M>{"f(x) = x^2 + 2x"}</M>, as a function from the reals to the reals, is the set of
          reals at least <M>{"-1"}</M>. You must show two things: no value is below <M>{"-1"}</M>, and every value{" "}
          <M>{"y \\ge -1"}</M> is taken.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Rewrites f(x) as (x + 1)² − 1, or equivalent.",
          "Concludes f(x) ≥ −1 for every x because a square is never negative.",
          "For a given y ≥ −1, exhibits an input such as x = −1 + √(y + 1).",
          "Checks that this input gives f(x) = y.",
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: (
        <p>
          How many different functions are there from <M>{"\\{1, 2, 3\\}"}</M> to <M>{"\\{a, b\\}"}</M>? (Use the
          definition: each input needs exactly one output.)
        </p>
      ),
      answer: { kind: "numeric", value: 8 },
    },
  ],

  teachBack:
    "Explain to a friend what makes a rule a function, using one everyday example that is a function and one that is not. Say why two inputs sharing an output is fine but one input with two outputs is not.",

  glimpse: (
    <p>
      Next, graphs: drawing a function as a picture in the plane, and reading the two conditions of the definition off
      that picture. Composition and inverses come three lessons later. In Proof and Logic, functions are rebuilt from sets as
      relations, and the one-arrow-out condition is joined by its mirror image, which defines injections, surjections and
      bijections. In Calculus, the question becomes how a function&rsquo;s outputs behave as its inputs approach a point.
    </p>
  ),
};
