import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { RelationViz } from "@/components/viz/RelationViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.6.1",
  minutes: 60,
  links: {
    revisits: ["m1.4.5", "m1.2.1"],
    foreshadows: ["m4.3.1"],
  },

  puzzle: (
    <>
      <p>
        &ldquo;Is less than&rdquo;, &ldquo;divides&rdquo;, &ldquo;is a sibling of&rdquo;, &ldquo;is the same age as&rdquo;,
        &ldquo;is parallel to&rdquo;. Each is a way that two things can be linked. Some of these links can go both ways, some
        cannot. Some pass along a chain: if a is less than b and b is less than c, then a is less than c.
      </p>
      <p>
        Is &ldquo;is a sibling of&rdquo; like that? If Asha is Ravi&rsquo;s sibling and Ravi is Asha&rsquo;s sibling, does it
        follow that Asha is her own sibling? What, exactly, is a relation?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A relation on a set is completely described by listing which ordered pairs are linked. So mathematics simply{" "}
        <em>defines</em> a relation to be that list: a set of ordered pairs. All the meaning of &ldquo;divides&rdquo; on a
        small set is captured by which pairs <M>{"(a, b)"}</M> it contains.
      </p>
      <p>
        Below, a relation on <M>{"\\{1, 2, 3, 4, 6\\}"}</M> is drawn as a grid: a shaded square in row a and column b means a
        is related to b. Four properties are checked, each with a counterexample when it fails. Pick a relation, or click
        squares to build your own and try to make all four properties hold at once.
      </p>
      <RelationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="relation">
        <p>
          A <strong>relation</strong> from a set A to a set B is a subset R of the Cartesian product <M>{"A \\times B"}</M>. We
          write <M>{"a \\mathrel{R} b"}</M> for <M>{"(a, b) \\in R"}</M>. A relation from A to A is called a relation{" "}
          <strong>on</strong> A.
        </p>
      </Definition>

      <Definition title="four properties">
        <p>A relation R on a set A is</p>
        <ul>
          <li><strong>reflexive</strong> if <M>{"a \\mathrel{R} a"}</M> for every <M>{"a \\in A"}</M>;</li>
          <li><strong>symmetric</strong> if <M>{"a \\mathrel{R} b"}</M> implies <M>{"b \\mathrel{R} a"}</M>;</li>
          <li><strong>antisymmetric</strong> if <M>{"a \\mathrel{R} b"}</M> and <M>{"b \\mathrel{R} a"}</M> together imply <M>{"a = b"}</M>;</li>
          <li><strong>transitive</strong> if <M>{"a \\mathrel{R} b"}</M> and <M>{"b \\mathrel{R} c"}</M> together imply <M>{"a \\mathrel{R} c"}</M>.</li>
        </ul>
        <p>Each is a universally quantified statement, so a single counterexample shows it fails.</p>
      </Definition>

      <Example title="the sibling puzzle">
        <p>
          Take &ldquo;is a sibling of&rdquo; to mean &ldquo;is a different person with the same parents&rdquo;. It is
          symmetric. It is not reflexive: nobody is their own sibling. And it is not transitive: Asha is Ravi&rsquo;s sibling
          and Ravi is Asha&rsquo;s, but Asha is not Asha&rsquo;s. The tempting argument
        </p>
        <MD>{"a \\mathrel{R} b \\text{ and } b \\mathrel{R} a \\implies a \\mathrel{R} a"}</MD>
        <p>
          uses transitivity with <M>{"c = a"}</M>, so it only shows that a symmetric, transitive relation is reflexive at
          every a that is related to <em>something</em>. That is not the same as reflexive.
        </p>
      </Example>

      <Remark title="symmetric and antisymmetric are not opposites">
        <p>
          Equality on any set is both symmetric and antisymmetric. The relation <M>{"\\{(1, 2), (2, 1), (2, 3)\\}"}</M> on{" "}
          <M>{"\\{1, 2, 3\\}"}</M> is neither. Antisymmetric does not mean &ldquo;not symmetric&rdquo;: it says that two{" "}
          <em>different</em> elements are never related both ways.
        </p>
      </Remark>

      <Example title="the properties of familiar relations">
        <p>
          On the positive integers: <M>{"\\le"}</M> is reflexive, antisymmetric and transitive. <M>{"<"}</M> is antisymmetric
          (vacuously, since <M>{"a < b"}</M> and <M>{"b < a"}</M> never both hold) and transitive, but not reflexive. Divides is
          reflexive, antisymmetric and transitive. &ldquo;Has the same parity as&rdquo; is reflexive, symmetric and
          transitive. These two patterns are the subjects of the next two lessons.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>How many different relations are there on a set with 3 elements?</p>,
      answer: { kind: "numeric", value: 512 },
    },
    {
      key: "lt",
      rung: "check",
      prompt: <p>Which properties does <M>{"<"}</M> on the integers have?</p>,
      answer: { kind: "choice", options: ["reflexive", "symmetric", "antisymmetric", "transitive"], correct: [2, 3] },
    },
    {
      key: "pairs",
      rung: "apply",
      prompt: <p>How many ordered pairs are in the relation &ldquo;a divides b&rdquo; on <M>{"\\{1, 2, 3, 4, 6\\}"}</M>?</p>,
      answer: { kind: "numeric", value: 12 },
    },
    {
      key: "differ",
      rung: "apply",
      prompt: <p>On the integers, let a R b mean <M>{"|a - b| \\le 1"}</M>. Which properties does R have?</p>,
      answer: { kind: "choice", options: ["reflexive", "symmetric", "antisymmetric", "transitive"], correct: [0, 1] },
    },
    {
      key: "reflexive-count",
      rung: "apply",
      prompt: <p>How many relations on a set with 3 elements are reflexive?</p>,
      answer: { kind: "numeric", value: 64 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`A = range(1, 5)
R = {(a, b) for a in A for b in A if b % a == 0}
print(all((a, a) in R for a in A), any((a, b) in R and (b, a) in R and a != b for a in A for b in A))`}</Code>
          <p>R is 'a divides b' on {"{1, 2, 3, 4}"}. Is it reflexive, and does it have a symmetric pair of distinct elements?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True False", "True True", "False False", "False True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>properties(R, A)</C> for a relation R (a set of pairs) on a finite set A, returning a dict with Boolean values for <C>"reflexive"</C>, <C>"symmetric"</C>, <C>"antisymmetric"</C> and <C>"transitive"</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def properties(R, A):
    return {'reflexive': False, 'symmetric': False, 'antisymmetric': False, 'transitive': False}
`,
        solution: `def properties(R, A):
    return {
        'reflexive': all((a, a) in R for a in A),
        'symmetric': all((b, a) in R for (a, b) in R),
        'antisymmetric': all(a == b for (a, b) in R if (b, a) in R),
        'transitive': all((a, d) in R for (a, b) in R for (c, d) in R if b == c),
    }
`,
        tests: [
          { name: "divides", code: `A = range(1, 7)
R = {(a, b) for a in A for b in A if b % a == 0}
assert properties(R, A) == {'reflexive': True, 'symmetric': False, 'antisymmetric': True, 'transitive': True}, 'Divisibility is a partial order on positive integers.'` },
          { name: "same parity", code: `A = range(6)
R = {(a, b) for a in A for b in A if (a - b) % 2 == 0}
assert properties(R, A) == {'reflexive': True, 'symmetric': True, 'antisymmetric': False, 'transitive': True}, 'Same parity is an equivalence relation.'` },
          { name: "less than", code: `A = range(4)
R = {(a, b) for a in A for b in A if a < b}
assert properties(R, A)['reflexive'] is False and properties(R, A)['transitive'] is True, '< is not reflexive but is transitive.'` },
        ],
      },
    },
    {
      key: "sym-trans",
      rung: "prove",
      prompt: (
        <p>
          Let R be a symmetric and transitive relation on A, and suppose every element of A is related to at least one
          element. Prove that R is reflexive.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Takes an arbitrary a in A and some b with a R b.",
          "Uses symmetry to get b R a.",
          "Uses transitivity on a R b and b R a to get a R a.",
          "Concludes that R is reflexive, noting where the extra hypothesis was used.",
        ],
      },
    },
    {
      key: "count-sym",
      rung: "stretch",
      prompt: (
        <p>
          Show that a set with n elements has <M>{"2^{n(n+1)/2}"}</M> symmetric relations. Explain your counting carefully.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that a symmetric relation is fixed by deciding the pairs (a, a) and each unordered pair {a, b} with a ≠ b.",
          "Counts n diagonal pairs and n(n − 1)/2 unordered pairs of distinct elements.",
          "Adds these to get n(n + 1)/2 independent yes-or-no choices.",
          "Concludes there are 2^(n(n+1)/2) symmetric relations.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what it means to say a relation is just a set of ordered pairs, and why 'is a sibling of' is symmetric but not transitive.",

  glimpse: (
    <p>
      Relations that are reflexive, symmetric and transitive behave like &ldquo;is the same as, in some respect&rdquo;, and they cut a set into pieces: that is the next lesson. Relations are the edges of graphs in Discrete Mathematics, and the graphs of Data Structures and Algorithms are relations stored in a computer.
    </p>
  ),
};
