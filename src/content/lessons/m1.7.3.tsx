import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ComposeViz } from "@/components/viz/ComposeViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.7.3",
  minutes: 65,
  links: {
    revisits: ["m0.3.4", "m0.4.3"],
    foreshadows: ["m3.3.3", "m2.4.5"],
  },

  puzzle: (
    <>
      <p>
        In the morning you put on socks, then shoes. In the evening, to undo this, you take off the shoes first, then the
        socks. Undoing reverses the order.
      </p>
      <p>
        Now an arithmetic version: a machine doubles a number and then adds 3. What machine undoes it? And when can a
        function be undone at all? Squaring sends both 3 and <M>{"-3"}</M> to 9; given only the 9, can you say where it came
        from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Doing one function and then another gives a new function, their <strong>composite</strong>. Undoing a function means
        following its arrows backwards. That works only if every output came from exactly one input: no output is missed, and
        no output is shared. In other words, only a bijection can be reversed.
      </p>
      <p>
        Below, f goes from A to B and g from B to C. The lower diagram shows the composite, found by following an arrow of f and
        then one of g. Click elements to change f and g, then try to reverse f.
      </p>
      <ComposeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="composition">
        <p>
          Given <M>{"f : A \\to B"}</M> and <M>{"g : B \\to C"}</M>, the <strong>composite</strong>{" "}
          <M>{"g \\circ f : A \\to C"}</M> is defined by
        </p>
        <MD>{"(g \\circ f)(a) = g(f(a)) \\quad \\text{for } a \\in A."}</MD>
        <p>
          It is read &ldquo;g after f&rdquo;: f acts first, although it is written on the right. Composition is{" "}
          <strong>associative</strong>, <M>{"h \\circ (g \\circ f) = (h \\circ g) \\circ f"}</M>, since both send a to{" "}
          <M>{"h(g(f(a)))"}</M>. It is usually not commutative: with <M>{"f(x) = x + 1"}</M> and <M>{"g(x) = x^2"}</M>,{" "}
          <M>{"(g \\circ f)(x) = (x + 1)^2"}</M> but <M>{"(f \\circ g)(x) = x^2 + 1"}</M>.
        </p>
      </Definition>

      <Definition title="identity and inverse">
        <p>
          The <strong>identity</strong> on A is <M>{"\\mathrm{id}_A : A \\to A"}</M>, <M>{"\\mathrm{id}_A(a) = a"}</M>. A function{" "}
          <M>{"g : B \\to A"}</M> is an <strong>inverse</strong> of <M>{"f : A \\to B"}</M> if
        </p>
        <MD>{"g \\circ f = \\mathrm{id}_A \\quad \\text{and} \\quad f \\circ g = \\mathrm{id}_B."}</MD>
        <p>An inverse, if it exists, is unique, and is written <M>{"f^{-1}"}</M>.</p>
      </Definition>

      <Theorem title="invertible means bijective">
        <p>A function <M>{"f : A \\to B"}</M> has an inverse if and only if it is a bijection.</p>
      </Theorem>
      <Proof>
        <p>
          Suppose f has an inverse g. If <M>{"f(a_1) = f(a_2)"}</M>, apply g to get <M>{"a_1 = a_2"}</M>, so f is injective.
          Any <M>{"b \\in B"}</M> equals <M>{"f(g(b))"}</M>, so f is surjective.
        </p>
        <p>
          Conversely, suppose f is a bijection. For each <M>{"b \\in B"}</M> there is an a with <M>{"f(a) = b"}</M>, by
          surjectivity, and only one, by injectivity. Define <M>{"g(b)"}</M> to be that a. Then <M>{"f(g(b)) = b"}</M> by
          construction, and <M>{"g(f(a)) = a"}</M> because a is the unique element sent to <M>{"f(a)"}</M>.
        </p>
      </Proof>

      <Example title="undoing a machine">
        <p>
          Let <M>{"f(x) = 2x + 3"}</M> on <M>{"\\mathbb{R}"}</M>. Solving <M>{"y = 2x + 3"}</M> for x gives{" "}
          <M>{"f^{-1}(y) = (y - 3)/2"}</M>: subtract 3, then halve. The inverse undoes the steps in reverse order, like the
          shoes and socks. In general, if f and g are bijections,
        </p>
        <MD>{"(g \\circ f)^{-1} = f^{-1} \\circ g^{-1}."}</MD>
      </Example>

      <Remark title="partial undoing">
        <p>
          An injective function can be undone on its image, and a surjective one can be undone on one side: if f is surjective,
          choosing one preimage for each output gives g with <M>{"f \\circ g = \\mathrm{id}_B"}</M>. For infinite sets, making
          all those choices at once is exactly what the axiom of choice permits. This is why the square root function picks the
          non-negative root: it is an inverse of squaring restricted to <M>{"[0, \\infty)"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "compose",
      rung: "check",
      prompt: <p>If <M>{"f(x) = x + 2"}</M> and <M>{"g(x) = 3x"}</M>, what is <M>{"(g \\circ f)(4)"}</M>?</p>,
      answer: { kind: "numeric", value: 18 },
    },
    {
      key: "compose-other",
      rung: "check",
      prompt: <p>With the same f and g, what is <M>{"(f \\circ g)(4)"}</M>?</p>,
      answer: { kind: "numeric", value: 14 },
    },
    {
      key: "inverse",
      rung: "apply",
      prompt: <p>Find the inverse of <M>{"f(x) = 5x - 2"}</M> on <M>{"\\mathbb{R}"}</M>, as an expression in x.</p>,
      answer: { kind: "expression", value: "(x+2)/5", variables: ["x"] },
    },
    {
      key: "cube",
      rung: "apply",
      prompt: <p>With <M>{"h(x) = (x - 1)^3"}</M> on <M>{"\\mathbb{R}"}</M>, what is <M>{"h^{-1}(8)"}</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "which-invertible",
      rung: "apply",
      prompt: <p>Which of these functions from <M>{"\\mathbb{R}"}</M> to <M>{"\\mathbb{R}"}</M> have inverses?</p>,
      answer: { kind: "choice", options: ["x ↦ x³", "x ↦ x²", "x ↦ eˣ", "x ↦ 7 − x"], correct: [0, 3] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`f = lambda x: 3 * x + 1
g = lambda x: x * x
print(f(g(2)), g(f(2)))`}</Code>
          <p>Composition is not commutative. What is (f ∘ g)(2) − (g ∘ f)(2)?</p>
        </>
      ),
      answer: { kind: "numeric", value: -36 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>compose(f, g)</C> returning f ∘ g, and <C>inverse(f, A)</C> returning the inverse of a bijection given as a dict on A, as a dict.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def compose(f, g):
    return lambda x: g(f(x))

def inverse(f, A):
    return dict(f)
`,
        solution: `def compose(f, g):
    return lambda x: f(g(x))

def inverse(f, A):
    return {f[a]: a for a in A}
`,
        tests: [
          { name: "order", code: `assert compose(lambda x: 3 * x + 1, lambda x: x * x)(2) == 13, '(f ∘ g)(x) = f(g(x)): apply g first.'` },
          { name: "inverse", code: `f = {a: (5 * a) % 6 for a in range(6)}
g = inverse(f, range(6))
assert all(g[f[a]] == a for a in range(6)), 'The inverse undoes f.'` },
        ],
      },
    },
    {
      key: "comp-inj",
      rung: "prove",
      prompt: <p>Prove that if <M>{"f : A \\to B"}</M> and <M>{"g : B \\to C"}</M> are both injective, then <M>{"g \\circ f"}</M> is injective.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Assumes g(f(a₁)) = g(f(a₂)).",
          "Uses injectivity of g to get f(a₁) = f(a₂).",
          "Uses injectivity of f to get a₁ = a₂.",
          "Concludes that g ∘ f is injective.",
        ],
      },
    },
    {
      key: "gf-inj",
      rung: "stretch",
      prompt: (
        <p>
          Prove that if <M>{"g \\circ f"}</M> is injective then f must be injective, but g need not be. Give an explicit
          example for the second part.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Assumes f(a₁) = f(a₂), applies g, and uses injectivity of g ∘ f to get a₁ = a₂.",
          "Gives an example where g ∘ f is injective but g is not, such as A = {1}, B = {1, 2}, C = {1}.",
          "Checks the example carefully.",
          "Explains that g only needs to be injective on the image of f.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why taking off shoes and socks happens in the reverse order to putting them on, and why only a bijection can be undone.",

  glimpse: (
    <p>
      The last lesson on functions asks what a function does to whole sets of inputs, and which inputs land in a given set of outputs. Inverse matrices in Linear Algebra I and inverse functions in Calculus are this lesson put to work, and the generative models of later courses are built from invertible maps that can be run in both directions.
    </p>
  ),
};
