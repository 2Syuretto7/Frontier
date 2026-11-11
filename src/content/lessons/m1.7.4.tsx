import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { PreimageViz } from "@/components/viz/PreimageViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.7.4",
  minutes: 60,
  links: {
    revisits: ["m1.4.3", "m0.3.2"],
    foreshadows: ["m18.1.4", "m8.5.1"],
  },

  puzzle: (
    <>
      <p>
        The function <M>{"f(x) = x^2"}</M> has no inverse on the real numbers, since 9 comes from both 3 and{" "}
        <M>{"-3"}</M>. Yet the question &ldquo;which inputs give an output between 4 and 9?&rdquo; still has a perfectly good
        answer: those x with <M>{"2 \\le |x| \\le 3"}</M>.
      </p>
      <p>
        So some kind of backwards question always makes sense, even when a function cannot be undone. What is it, and how
        does it differ from a true inverse?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Apply a function to a whole set of inputs at once and you get the set of outputs it reaches: the <strong>image</strong>.
        Ask which inputs land in a chosen set of outputs and you get the <strong>preimage</strong>. The preimage never needs
        an inverse; it simply collects every input whose arrow lands in the chosen set.
      </p>
      <p>
        Below, <M>{"f(x) = x^2"}</M> maps <M>{"\\{-2, \\dots, 2\\}"}</M> into <M>{"\\{0, \\dots, 5\\}"}</M>. Choose a set,
        then go there and back again. Do you always return to where you started?
      </p>
      <PreimageViz />
    </>
  ),

  theory: (
    <>
      <Definition title="image and preimage">
        <p>Let <M>{"f : A \\to B"}</M>, <M>{"S \\subseteq A"}</M> and <M>{"T \\subseteq B"}</M>.</p>
        <MD>{"f(S) = \\{\\, f(s) : s \\in S \\,\\} \\subseteq B, \\qquad f^{-1}(T) = \\{\\, a \\in A : f(a) \\in T \\,\\} \\subseteq A."}</MD>
        <p>
          <M>{"f(S)"}</M> is the <strong>image</strong> of S and <M>{"f^{-1}(T)"}</M> the <strong>preimage</strong> (or inverse
          image) of T. The image of the whole domain, <M>{"f(A)"}</M>, is called the image or range of f.
        </p>
      </Definition>

      <Remark title="a warning about notation">
        <p>
          The symbol <M>{"f^{-1}(T)"}</M> is defined for every function, invertible or not, and it is always a set. When f does
          happen to be a bijection, <M>{"f^{-1}(\\{b\\})"}</M> is the one-element set <M>{"\\{f^{-1}(b)\\}"}</M>, so the two
          uses agree. For <M>{"f(x) = x^2"}</M> on <M>{"\\mathbb{R}"}</M>,{" "}
          <M>{"f^{-1}(\\{9\\}) = \\{-3, 3\\}"}</M> and <M>{"f^{-1}(\\{-1\\}) = \\varnothing"}</M>.
        </p>
      </Remark>

      <Theorem title="preimages respect set operations">
        <p>For any <M>{"f : A \\to B"}</M> and <M>{"T_1, T_2 \\subseteq B"}</M>,</p>
        <MD>{"f^{-1}(T_1 \\cup T_2) = f^{-1}(T_1) \\cup f^{-1}(T_2), \\qquad f^{-1}(T_1 \\cap T_2) = f^{-1}(T_1) \\cap f^{-1}(T_2),"}</MD>
        <p>and <M>{"f^{-1}(B \\setminus T_1) = A \\setminus f^{-1}(T_1)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          For the intersection: <M>{"a \\in f^{-1}(T_1 \\cap T_2)"}</M> if and only if <M>{"f(a) \\in T_1"}</M> and{" "}
          <M>{"f(a) \\in T_2"}</M>, if and only if <M>{"a \\in f^{-1}(T_1)"}</M> and <M>{"a \\in f^{-1}(T_2)"}</M>. The other
          two are proved the same way, with &ldquo;or&rdquo; and &ldquo;not&rdquo;.
        </p>
      </Proof>

      <Example title="images are less well behaved">
        <p>
          Images respect unions, <M>{"f(S_1 \\cup S_2) = f(S_1) \\cup f(S_2)"}</M>, but not intersections. With{" "}
          <M>{"f(x) = x^2"}</M>, <M>{"S_1 = \\{-1\\}"}</M> and <M>{"S_2 = \\{1\\}"}</M>:
        </p>
        <MD>{"f(S_1 \\cap S_2) = f(\\varnothing) = \\varnothing, \\quad \\text{but} \\quad f(S_1) \\cap f(S_2) = \\{1\\}."}</MD>
        <p>In general only <M>{"f(S_1 \\cap S_2) \\subseteq f(S_1) \\cap f(S_2)"}</M> holds, with equality for all sets exactly when f is injective.</p>
      </Example>

      <Theorem title="there and back again">
        <p>For every <M>{"S \\subseteq A"}</M> and <M>{"T \\subseteq B"}</M>,</p>
        <MD>{"S \\subseteq f^{-1}(f(S)) \\qquad \\text{and} \\qquad f(f^{-1}(T)) \\subseteq T."}</MD>
        <p>The first is always an equality when f is injective, and the second when f is surjective.</p>
      </Theorem>

      <Remark title="why preimages matter">
        <p>
          Because preimages behave so well, many advanced definitions are phrased with them. In topology, a function is
          continuous when the preimage of every open set is open; in measure theory, a function is measurable when the preimage
          of every interval is measurable. Both definitions begin here.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "image",
      rung: "check",
      prompt: <p>For <M>{"f(x) = x^2"}</M> on the integers, how many elements does <M>{"f(\\{-3, -1, 0, 1, 3\\})"}</M> have?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "preimage",
      rung: "check",
      prompt: <p>For <M>{"f(x) = x^2"}</M> on the integers, how many elements does <M>{"f^{-1}(\\{0, 1, 2, 3, 4\\})"}</M> have?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "mod",
      rung: "apply",
      prompt: (
        <p>
          Let <M>{"g : \\{1, 2, \\dots, 20\\} \\to \\{0, 1, 2\\}"}</M> send n to its remainder on division by 3. How many
          elements does <M>{"g^{-1}(\\{0\\})"}</M> have?
        </p>
      ),
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "round-trip",
      rung: "apply",
      prompt: <p>For <M>{"f(x) = x^2"}</M> on <M>{"\\mathbb{R}"}</M> and <M>{"S = [1, 2]"}</M>, what is <M>{"f^{-1}(f(S))"}</M>?</p>,
      answer: { kind: "choice", options: ["[1, 2]", "[1, 4]", "[−2, −1] ∪ [1, 2]", "[−2, 2]"], correct: [2] },
    },
    {
      key: "empty",
      rung: "apply",
      prompt: <p>Which statements are true for every function <M>{"f : A \\to B"}</M>?</p>,
      answer: {
        kind: "choice",
        options: ["f⁻¹(B) = A", "f(A) = B", "f⁻¹(∅) = ∅", "f(f⁻¹(T)) = T for every T ⊆ B"],
        correct: [0, 2],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`f = lambda x: x * x
image = {f(x) for x in range(-3, 4)}
preimage = {x for x in range(-3, 4) if f(x) in {4, 5}}
print(len(image), sorted(preimage))`}</Code>
          <p>f(x) = x² on {"{−3, …, 3}"}. How many elements does the image have?</p>
        </>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`f = lambda x: x * x
img = lambda X: {f(x) for x in X}
S, T = {-2, -1, 0}, {0, 1, 2}
print(sorted(img(S & T)), sorted(img(S) & img(T)), img(S) == img(T))`}</Code>
          <p>Is the image of an intersection the intersection of the images? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0] [0, 1, 4] True", "[0, 1, 4] [0, 1, 4] True", "[0] [0] False", "[0] [0, 1, 4] False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>image(f, S)</C> and <C>preimage(f, A, T)</C>, where A is the domain. Then check that image(f, preimage(f, A, T)) is always a subset of T.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def image(f, S):
    return set(S)

def preimage(f, A, T):
    return set(T)
`,
        solution: `def image(f, S):
    return {f(x) for x in S}

def preimage(f, A, T):
    return {x for x in A if f(x) in T}
`,
        tests: [
          { name: "square", code: `f = lambda x: x * x
assert image(f, {-2, 1, 2}) == {1, 4} and preimage(f, range(-3, 4), {4, 5}) == {-2, 2}, 'Image collects outputs; preimage collects inputs that land in T.'` },
          { name: "inclusion", code: `f = lambda x: x % 4
A = range(20); T = {1, 7}
assert image(f, preimage(f, A, T)) <= T and image(f, preimage(f, A, T)) != T, 'f(f⁻¹(T)) can be smaller than T when f misses part of T.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            With functions given as Python callables on a finite domain A and codomain B, write <C>is_injective(f, A)</C>, <C>is_surjective(f, A, B)</C> and <C>inverse(f, A, B)</C>. The last returns the inverse as a dict from B to A when f is a bijection from A to B, and <C>None</C> otherwise. Assume every f(a) lies in B.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def is_injective(f, A):
    return True

def is_surjective(f, A, B):
    return len(A) >= len(B)

def inverse(f, A, B):
    return {f(a): a for a in A}
`,
        solution: `def is_injective(f, A):
    seen = set()
    for a in A:
        y = f(a)
        if y in seen:
            return False
        seen.add(y)
    return True

def is_surjective(f, A, B):
    return {f(a) for a in A} >= set(B)

def inverse(f, A, B):
    if not (is_injective(f, A) and is_surjective(f, A, B)):
        return None
    return {f(a): a for a in A}
`,
        tests: [
          { name: "injective", code: `assert is_injective(lambda x: 2 * x, range(10)) and not is_injective(lambda x: x * x, range(-3, 4)) and is_injective(lambda x: x * x, range(0, 4)), 'Squaring is injective only on one side of 0.'` },
          { name: "surjective", code: `assert is_surjective(lambda x: x % 3, range(10), {0, 1, 2}) and not is_surjective(lambda x: x % 3, range(2), {0, 1, 2}) and not is_surjective(lambda x: 0, [0, 1, 2], [0, 1]), 'Every element of B must be hit.'` },
          { name: "inverse", code: `g = inverse(lambda x: (3 * x) % 7, range(7), range(7))
assert g is not None and all((3 * g[y]) % 7 == y for y in range(7)) and g[1] == 5
assert inverse(lambda x: (2 * x) % 6, range(6), range(6)) is None, 'Doubling mod 6 is not a bijection.'
assert inverse(lambda x: x, range(3), range(4)) is None, 'Injective but not onto is not invertible.'` },
        ],
      },
    },
    {
      key: "union",
      rung: "prove",
      prompt: <p>Prove that <M>{"f(S_1 \\cup S_2) = f(S_1) \\cup f(S_2)"}</M> for any function f and subsets <M>{"S_1, S_2"}</M> of its domain.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows f(S₁ ∪ S₂) ⊆ f(S₁) ∪ f(S₂): an output f(s) with s in S₁ or S₂ lies in f(S₁) or f(S₂).",
          "Shows the reverse inclusion similarly.",
          "Concludes equality by double inclusion.",
        ],
      },
    },
    {
      key: "inj-iff",
      rung: "stretch",
      prompt: (
        <p>
          Prove that f is injective if and only if <M>{"f(S_1 \\cap S_2) = f(S_1) \\cap f(S_2)"}</M> for all subsets{" "}
          <M>{"S_1, S_2"}</M> of the domain.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that f(S₁ ∩ S₂) ⊆ f(S₁) ∩ f(S₂) always holds.",
          "If f is injective, takes b = f(s₁) = f(s₂) with sᵢ ∈ Sᵢ, deduces s₁ = s₂ ∈ S₁ ∩ S₂.",
          "If f is not injective, with f(a₁) = f(a₂) and a₁ ≠ a₂, takes S₁ = {a₁} and S₂ = {a₂} to break the equality.",
          "Concludes both directions.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend the difference between f⁻¹ as an inverse function and f⁻¹(T) as a preimage, using f(x) = x² and the set {9}.",

  glimpse: (
    <p>
      This completes the chapter on functions. The last chapter of the course uses bijections to compare the sizes of infinite sets, with startling results. Continuity in Real Analysis and measurability in Measure-Theoretic Probability are both defined through preimages.
    </p>
  ),
};
