import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SimpleApproxViz } from "@/components/viz/SimpleApproxViz";
import type { LessonContent } from "@/lib/types";

const FINITE = `def preimage(f, B):
    return {w for w, v in f.items() if v in B}

def is_measurable(f, atoms):
    return all(len({f[w] for w in a}) == 1 for a in atoms)

def level_atoms(f):
    groups = {}
    for w, v in f.items():
        groups.setdefault(v, set()).add(w)
    return sorted(sorted(g) for g in groups.values())`;

const SIMPLE = `import math

def phi(y, n):
    return min(n, math.floor(2 ** n * y) / 2 ** n)

def simple_values(n):
    return [k / 2 ** n for k in range(n * 2 ** n + 1)]

def max_gap(ys, n):
    return max(y - phi(y, n) for y in ys)`;

export const lesson: LessonContent = {
  id: "m18.1.4",
  minutes: 40,
  links: {
    requires: ["m18.1.3", "m8.5.1"],
    revisits: ["m8.2.5", "m7.2.1"],
    foreshadows: ["m18.2.1", "m18.3.1"],
  },

  puzzle: (
    <>
      <p>
        Enumerate the rationals in [0, 1] and let <M>{"f_n"}</M> be 1 at the first n of them and 0 elsewhere. Each{" "}
        <M>{"f_n"}</M> is Riemann integrable with integral 0, yet their pointwise limit, the indicator of the rationals, has no
        Riemann integral at all. A good theory of integration should be closed under limits. Which class of functions is,
        and what property defines it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Riemann slices the domain into intervals; Lebesgue slices the range into levels. To integrate f by slicing its
        range you need to measure the set where f lies between two levels. Functions for which every such set is
        measurable are exactly the ones you can integrate this way, and taking limits, suprema or sums never takes you out
        of the class. Every non-negative one is a rising limit of staircases with finitely many steps.
      </p>
      <SimpleApproxViz />
    </>
  ),

  theory: (
    <>
      <Definition title="measurable function">
        <p>
          A function f: Ω → ℝ on a measurable space (Ω, 𝓕) is measurable if <M>{"f^{-1}(B) \\in \\mathcal F"}</M> for every Borel set B.
          Functions with values in <M>{"[-\\infty, \\infty]"}</M> are treated the same way. The σ-algebra{" "}
          <M>{"\\sigma(f) = \\{f^{-1}(B) : B \\in \\mathcal B\\}"}</M> is the information carried by f.
        </p>
      </Definition>

      <Theorem title="half-lines suffice">
        <p>f is measurable as soon as <M>{"\\{f \\le a\\} \\in \\mathcal F"}</M> for every real a.</p>
      </Theorem>
      <Proof>
        <p>
          The sets B with <M>{"f^{-1}(B) \\in \\mathcal F"}</M> form a σ-algebra, because preimages commute with complements and unions.
          It contains every half-line <M>{"(-\\infty, a]"}</M>, which generate the Borel sets (m18.1.1), so it contains them all. On a
          finite space with atoms, f is measurable exactly when it is constant on each atom, and the atoms of σ(f) are its
          level sets (<C>preimage</C>, <C>is_measurable</C>, <C>level_atoms</C>).
        </p>
        <Code>{FINITE}</Code>
      </Proof>

      <Theorem title="closure properties">
        <p>
          Continuous functions of measurable functions are measurable; in particular f + g, fg and max(f, g) are. If{" "}
          <M>{"f_1, f_2, \\ldots"}</M> are measurable, so are <M>{"\\sup_n f_n"}</M>, <M>{"\\inf_n f_n"}</M>, <M>{"\\limsup_n f_n"}</M>,{" "}
          <M>{"\\liminf_n f_n"}</M>, and the pointwise limit wherever it exists.
        </p>
      </Theorem>
      <Proof>
        <p>
          If h is continuous, <M>{"h^{-1}"}</M> of an open set is open, so <M>{"(h \\circ F)^{-1}"}</M> of an open set is{" "}
          <M>{"F^{-1}"}</M> of an open set; for F = (f, g) into ℝ², the open sets are countable unions of rectangles, whose preimages{" "}
          <M>{"\\{f \\in I\\} \\cap \\{g \\in J\\}"}</M> are measurable. For the supremum,{" "}
          <M>{"\\{\\sup_n f_n \\le a\\} = \\bigcap_n \\{f_n \\le a\\}"}</M>, a countable intersection; infima are similar. Then{" "}
          <M>{"\\limsup_n f_n = \\inf_n \\sup_{k \\ge n} f_k"}</M> (m8.2.5), and a limit equals the limsup where it exists. The indicator of
          the rationals in the puzzle is measurable: it is the limit of measurable functions.
        </p>
      </Proof>

      <Theorem title="simple approximation">
        <p>
          A simple function takes finitely many values, each on a measurable set. Every measurable f ≥ 0 is the pointwise
          limit of the increasing sequence
        </p>
        <MD>{"\\varphi_n = \\min\\big(n,\\ 2^{-n}\\lfloor 2^n f \\rfloor\\big),"}</MD>
        <p>and the convergence is uniform on any set where f is bounded.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\varphi_n"}</M> takes the <M>{"n2^n + 1"}</M> values <M>{"k2^{-n}"}</M> (<C>simple_values</C>), on the measurable sets{" "}
          <M>{"\\{k2^{-n} \\le f < (k+1)2^{-n}\\}"}</M> and <M>{"\\{f \\ge n\\}"}</M>. Rounding down to a finer dyadic grid never decreases the
          value, and raising the cap never does either, so <M>{"\\varphi_n \\le \\varphi_{n+1} \\le f"}</M> (<C>phi</C>). Once n is at least f(ω), the gap
          is less than <M>{"2^{-n}"}</M> (<C>max_gap</C>); if f ≤ M on a set, this holds there for all n ≥ M at once.
        </p>
        <Code>{SIMPLE}</Code>
      </Proof>

      <Theorem title="Doob–Dynkin">
        <p>
          A function g: Ω → ℝ is σ(f)-measurable if and only if g = h ∘ f for some Borel function h.
        </p>
      </Theorem>
      <Proof>
        <p>
          If g = h ∘ f, then <M>{"g^{-1}(B) = f^{-1}(h^{-1}(B)) \\in \\sigma(f)"}</M>. Conversely, for an indicator <M>{"g = \\mathbb 1_A"}</M> with{" "}
          <M>{"A = f^{-1}(B)"}</M>, take <M>{"h = \\mathbb 1_B"}</M>. Linear combinations give simple g, and the simple approximation passes
          to general g by taking <M>{"h = \\limsup_n h_n"}</M>. So a quantity is determined by f exactly when it is a function of f,
          which is how &quot;known given f&quot; will be formalised in conditional expectation.
        </p>
      </Proof>

      <Remark title="random variables">
        <p>
          On a probability space a measurable function is called a random variable (m7.2.1), and events like{" "}
          <M>{"\\{X \\le a\\}"}</M> are exactly what measurability makes legitimate. The lesson after next studies them in this
          language; first the integral, which will be the expectation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "round",
      rung: "check",
      prompt: <p>What is φ₄(ω) when f(ω) = 2.7?</p>,
      answer: { kind: "numeric", value: 2.6875, tolerance: 0.00001 },
    },
    {
      key: "cap",
      rung: "check",
      prompt: <p>The function f is bounded by 10. From which n onwards is f − φₙ guaranteed to be less than 2⁻ⁿ everywhere? Give the smallest such n.</p>,
      answer: { kind: "numeric", value: 10, tolerance: 0 },
    },
    {
      key: "limits",
      rung: "apply",
      prompt: <p>Which operation preserves measurability of functions but can destroy Riemann integrability?</p>,
      answer: {
        kind: "choice",
        options: [
          "Taking the pointwise limit of a sequence",
          "Adding two functions",
          "Multiplying by a constant",
          "Restricting to a subinterval",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def preimage(f, B):
    return {w for w, v in f.items() if v in B}

def is_measurable(f, atoms):
    return all(len({f[w] for w in a}) == 1 for a in atoms)

def level_atoms(f):
    groups = {}
    for w, v in f.items():
        groups.setdefault(v, set()).add(w)
    return sorted(sorted(g) for g in groups.values())

f = {1: 0, 2: 5, 3: 0, 4: 7}; print(sorted(preimage(f, {0, 7})), is_measurable(f, [{1, 3}, {2}, {4}]), is_measurable(f, [{1, 2}, {3, 4}]))
print(level_atoms(f), level_atoms({'a': 1, 'b': 1}), sorted(preimage(f, set())))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 3, 4] True False\n[[1, 3], [2], [4]] [['a', 'b']] []",
          "[1, 3, 4] True True\n[[1, 3], [2], [4]] [['a', 'b']] []",
          "[4] True False\n[[1, 3], [2], [4]] [['a', 'b']] []",
          "[1, 3, 4] False False\n[[1], [2], [3], [4]] [['a'], ['b']] []",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def phi(y, n):
    return min(n, math.floor(2 ** n * y) / 2 ** n)

def simple_values(n):
    return [k / 2 ** n for k in range(n * 2 ** n + 1)]

def max_gap(ys, n):
    return max(y - phi(y, n) for y in ys)

print(phi(2.7, 3), phi(5.3, 2), phi(0.4, 1), len(simple_values(3)))
print(simple_values(1), round(max_gap([0.3, 0.9], 2), 4), max_gap([3.0], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.625 2 0.0 25\n[0.0, 0.5, 1.0] 0.15 1.0",
          "2.625 5.25 0.0 25\n[0.0, 0.5, 1.0] 0.15 1.0",
          "2.625 2 0.0 24\n[0.0, 0.5] 0.15 1.0",
          "2.75 2 0.5 25\n[0.0, 0.5, 1.0] 0.15 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A function on a finite set is a dict from points to values. Write <C>preimage(f, B)</C>, <C>is_measurable(f, atoms)</C>{" "}
          for a σ-algebra given by its atoms, and <C>level_atoms(f)</C>, the atoms of σ(f) as a sorted list of sorted lists.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def preimage(f, B):
    return set()

def is_measurable(f, atoms):
    return True

def level_atoms(f):
    return [sorted(f)]
`,
        solution: FINITE,
        tests: [
          { name: "preimage", code: `f = {'x': 2, 'y': 3, 'z': 2, 'w': 9}
assert preimage(f, {2}) == {'x', 'z'} and preimage(f, {1, 9}) == {'w'} and level_atoms(f) == [['w'], ['x', 'z'], ['y']]` },
          { name: "measurable", code: `f = {1: 0, 2: 0, 3: 1, 4: 1}
assert is_measurable(f, [{1, 2}, {3, 4}]) and is_measurable(f, [{1}, {2}, {3}, {4}]) and not is_measurable(f, [{1, 3}, {2, 4}]) and not is_measurable(f, [{1, 2, 3, 4}])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>phi(y, n)</C> = min(n, ⌊2ⁿy⌋/2ⁿ), <C>simple_values(n)</C> listing every value φₙ can take in increasing order,
          and <C>max_gap(ys, n)</C>, the largest y − φₙ(y) over a list of non-negative values.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def phi(y, n):
    return y

def simple_values(n):
    return [0.0]

def max_gap(ys, n):
    return 0.0
`,
        solution: SIMPLE,
        tests: [
          { name: "phi", code: `assert phi(1.3, 1) == 1 and phi(0.8, 1) == 0.5 and phi(0.8, 3) == 0.75 and phi(100.0, 4) == 4 and phi(0.0, 2) == 0` },
          { name: "values and gaps", code: `assert simple_values(2) == [0.0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0] and abs(max_gap([0.1, 0.7, 0.2], 2) - 0.2) < 1e-12 and max_gap([5.0], 3) == 2.0` },
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: <p>How many distinct values can the simple function φ₅ take?</p>,
      answer: { kind: "numeric", value: 161, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Simple functions are easy to integrate: add up value times measure. The next lesson defines the Lebesgue integral of
        any non-negative measurable function as the supremum of these sums, and checks that it does what an integral should.
      </p>
    </>
  ),
};
