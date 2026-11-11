import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { JectionViz } from "@/components/viz/JectionViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.7.2",
  minutes: 65,
  links: {
    revisits: ["m0.7.4", "m1.3.2"],
    foreshadows: ["m4.1.4", "m3.3.3"],
  },

  puzzle: (
    <>
      <p>
        A cinema hall has 200 seats, and a crowd is filing in. Nobody is counting. When everyone is seated, every seat is
        taken and nobody is standing or sharing. How many people came?
      </p>
      <p>
        You know without counting: 200. The seating pairs people with seats perfectly. What precisely is this perfect
        pairing, and what can each half of it tell you on its own?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        &ldquo;Nobody shares a seat&rdquo; says that different people go to different seats. &ldquo;Every seat is
        taken&rdquo; says that each seat receives someone. The first alone tells you there are no more people than seats; the
        second alone, no more seats than people. Together they give equality.
      </p>
      <p>
        In the diagrams below, red arrows mark two inputs landing on one output, and shaded outputs are the ones that are hit.
        Change the sizes of A and B and see which kinds of function become impossible.
      </p>
      <JectionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="injective, surjective, bijective">
        <p>A function <M>{"f : A \\to B"}</M> is</p>
        <ul>
          <li>
            <strong>injective</strong> (one-to-one) if <M>{"f(a_1) = f(a_2)"}</M> implies <M>{"a_1 = a_2"}</M>: different
            inputs give different outputs;
          </li>
          <li>
            <strong>surjective</strong> (onto) if for every <M>{"b \\in B"}</M> there is an <M>{"a \\in A"}</M> with{" "}
            <M>{"f(a) = b"}</M>: every element of B is hit;
          </li>
          <li><strong>bijective</strong> if it is both. A bijection is also called a one-to-one correspondence.</li>
        </ul>
      </Definition>

      <Example title="the same rule, four answers">
        <p>
          Whether a function is injective or surjective depends on its domain and codomain, not just its rule. Consider{" "}
          <M>{"x \\mapsto x^2"}</M>:
        </p>
        <ul>
          <li>from <M>{"\\mathbb{R}"}</M> to <M>{"\\mathbb{R}"}</M>: neither, since <M>{"(-1)^2 = 1^2"}</M> and nothing maps to <M>{"-1"}</M>;</li>
          <li>from <M>{"[0, \\infty)"}</M> to <M>{"\\mathbb{R}"}</M>: injective, not surjective;</li>
          <li>from <M>{"\\mathbb{R}"}</M> to <M>{"[0, \\infty)"}</M>: surjective, not injective;</li>
          <li>from <M>{"[0, \\infty)"}</M> to <M>{"[0, \\infty)"}</M>: bijective.</li>
        </ul>
      </Example>

      <Theorem title="proving injectivity">
        <p>The function <M>{"f : \\mathbb{R} \\to \\mathbb{R}"}</M>, <M>{"f(x) = 3x + 7"}</M>, is a bijection.</p>
      </Theorem>
      <Proof>
        <p>
          <em>Injective.</em> Suppose <M>{"f(a_1) = f(a_2)"}</M>. Then <M>{"3a_1 + 7 = 3a_2 + 7"}</M>, so{" "}
          <M>{"a_1 = a_2"}</M>.
        </p>
        <p>
          <em>Surjective.</em> Let <M>{"b \\in \\mathbb{R}"}</M>. We need a with <M>{"3a + 7 = b"}</M>; solving gives{" "}
          <M>{"a = (b - 7)/3"}</M>, which is a real number, and indeed <M>{"f(a) = b"}</M>.
        </p>
      </Proof>
      <p>
        This is the standard pattern. For injectivity, assume two outputs are equal and deduce that the inputs are: this proves the contrapositive of
        &ldquo;different inputs give different outputs&rdquo;, which is usually easier. For
        surjectivity, take an arbitrary output and construct an input that reaches it, then check.
      </p>

      <Theorem title="sizes of finite sets">
        <p>Let A and B be finite, and <M>{"f : A \\to B"}</M>.</p>
        <ul>
          <li>If f is injective, then <M>{"|A| \\le |B|"}</M>.</li>
          <li>If f is surjective, then <M>{"|A| \\ge |B|"}</M>.</li>
          <li>If f is a bijection, then <M>{"|A| = |B|"}</M>.</li>
        </ul>
      </Theorem>
      <Remark title="the pigeonhole principle">
        <p>
          The first statement, turned around, is the <strong>pigeonhole principle</strong>: if more than n pigeons fly into n
          holes, some hole holds two pigeons. For example, among any 13 people, two were born in the same month. This simple
          fact has surprisingly deep uses.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "classify",
      rung: "check",
      prompt: <p>The function <M>{"f : \\mathbb{Z} \\to \\mathbb{Z}"}</M>, <M>{"f(n) = 2n"}</M>, is&hellip;</p>,
      answer: { kind: "choice", options: ["injective but not surjective", "surjective but not injective", "bijective", "neither"], correct: [0] },
    },
    {
      key: "abs",
      rung: "check",
      prompt: <p>The function <M>{"f : \\mathbb{Z} \\to \\mathbb{N}"}</M>, <M>{"f(n) = |n|"}</M>, is&hellip;</p>,
      answer: { kind: "choice", options: ["injective but not surjective", "surjective but not injective", "bijective", "neither"], correct: [1] },
    },
    {
      key: "count-inj",
      rung: "apply",
      prompt: <p>How many injective functions are there from a 3-element set to a 5-element set?</p>,
      answer: { kind: "numeric", value: 60 },
    },
    {
      key: "count-bij",
      rung: "apply",
      prompt: <p>How many bijections are there from a 5-element set to itself?</p>,
      answer: { kind: "numeric", value: 120 },
    },
    {
      key: "socks",
      rung: "apply",
      prompt: (
        <p>
          A drawer holds socks of 4 colours. How many socks must you take out, in the dark, to be sure of having two of the
          same colour?
        </p>
      ),
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`A = range(6)
f = {a: (2 * a) % 6 for a in A}
print(len(set(f.values())))`}</Code>
          <p>How many distinct values does x ↦ 2x mod 6 take on {"{0, …, 5}"}?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>kind(f, A, B)</C> for a function given as a dict from A to B, returning one of <C>"bijection"</C>, <C>"injection"</C>, <C>"surjection"</C> or <C>"neither"</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def kind(f, A, B):
    return 'neither'
`,
        solution: `def kind(f, A, B):
    inj = len(set(f[a] for a in A)) == len(A)
    sur = set(f[a] for a in A) == set(B)
    if inj and sur:
        return 'bijection'
    if inj:
        return 'injection'
    if sur:
        return 'surjection'
    return 'neither'
`,
        tests: [
          { name: "multiply by 5", code: `assert kind({a: (5 * a) % 6 for a in range(6)}, range(6), range(6)) == 'bijection', '5 is invertible mod 6.'` },
          { name: "multiply by 2", code: `assert kind({a: (2 * a) % 6 for a in range(6)}, range(6), range(6)) == 'neither', '2x mod 6 repeats values and misses odd numbers.'` },
          { name: "embedding", code: `assert kind({a: a for a in range(3)}, range(3), range(5)) == 'injection', 'Including {0, 1, 2} in {0, …, 4} is injective, not surjective.'` },
          { name: "halving", code: `assert kind({a: a // 2 for a in range(6)}, range(6), range(3)) == 'surjection', 'a ↦ ⌊a/2⌋ hits every value twice.'` },
        ],
      },
    },
    {
      key: "bij-proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"f : \\mathbb{R} \\setminus \\{1\\} \\to \\mathbb{R} \\setminus \\{1\\}"}</M>,{" "}
          <M>{"f(x) = \\dfrac{x + 1}{x - 1}"}</M>, is a bijection.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Checks that f(x) is never 1, so f really maps into ℝ ∖ {1}.",
          "Proves injectivity: from f(a) = f(b), cross-multiplies and simplifies to a = b.",
          "Proves surjectivity: solves y = (x + 1)/(x − 1) to get x = (y + 1)/(y − 1), and checks x ≠ 1.",
          "Concludes that f is a bijection.",
        ],
      },
    },
    {
      key: "same-size",
      rung: "stretch",
      prompt: (
        <p>
          Let A and B be finite sets with <M>{"|A| = |B|"}</M>, and <M>{"f : A \\to B"}</M>. Prove that f is injective if and
          only if it is surjective. Show by an example that this fails for <M>{"f : \\mathbb{N} \\to \\mathbb{N}"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "If f is injective, its image has |A| = |B| elements, so it is all of B.",
          "If f is surjective but not injective, the image has fewer than |A| elements, contradicting that it is all of B.",
          "Gives an infinite counterexample, such as n ↦ n + 1 (injective, not surjective).",
          "Comments that this difference between finite and infinite sets is the theme of the cardinality chapter.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend the difference between injective and surjective using a cinema hall, and why a perfect seating proves there are as many people as seats.",

  glimpse: (
    <p>
      A bijection can be run backwards. The next lesson combines functions by doing one after another, and undoes them with inverses. Counting injections and bijections is central to Discrete Mathematics, and the bijections of a set to itself are the symmetries studied in Geometry and Symmetry in Deep Learning.
    </p>
  ),
};
