import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CantorStagesViz } from "@/components/viz/CantorStagesViz";
import type { LessonContent } from "@/lib/types";

const CANTOR = `from fractions import Fraction

def cantor_intervals(n):
    iv = [(Fraction(0), Fraction(1))]
    for _ in range(n):
        iv = [p for a, b in iv for p in ((a, a + (b - a) / 3), (b - (b - a) / 3, b))]
    return iv

def total_length(iv):
    return sum(b - a for a, b in iv)

def in_cantor_stage(x, n):
    for _ in range(n):
        x = 3 * x
        d = int(x) if x < 3 else 2
        if d == 1 and x != 1:
            return False
        x -= d
    return True`;

const FAT = `from fractions import Fraction

def fat_cantor(n, base):
    iv = [(Fraction(0), Fraction(1))]
    for k in range(1, n + 1):
        g = Fraction(1, base ** k)
        iv = [p for a, b in iv for p in ((a, (a + b - g) / 2), ((a + b + g) / 2, b))]
    return iv

def removed_length(n, base):
    return sum(Fraction(2 ** (k - 1), base ** k) for k in range(1, n + 1))

def affine_image(iv, c, t):
    return sorted((min(c * a + t, c * b + t), max(c * a + t, c * b + t)) for a, b in iv)`;

export const lesson: LessonContent = {
  id: "m18.1.3",
  minutes: 45,
  links: {
    requires: ["m18.1.2", "m8.1.3"],
    revisits: ["m8.4.1", "m8.4.2"],
    foreshadows: ["m18.1.4", "m18.4.1"],
  },

  puzzle: (
    <>
      <p>
        Take [0, 1], remove the open middle third, then the middle third of each remaining piece, and so on for ever. The
        pieces removed have total length 1/3 + 2/9 + 4/27 + ⋯ = 1, so what is left should be negligible. Yet it contains
        uncountably many points, as many as [0, 1] itself. How can a set be as large as the interval in one sense and of
        size zero in another?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Cardinality counts points; measure weighs them by how they spread out. A set can have many points packed into
        pieces whose total length shrinks to nothing. Conversely, by removing smaller pieces you can build a set that
        contains no interval at all yet keeps half the length. Lebesgue measure handles all of these, agrees with length on
        intervals, and does not care where a set sits on the line.
      </p>
      <CantorStagesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Lebesgue measure">
        <p>
          The Lebesgue measurable sets 𝓛 are the sets measurable in Carathéodory&apos;s sense for the outer measure{" "}
          <M>{"\\lambda^*"}</M> of m18.1.2, and Lebesgue measure is <M>{"\\lambda = \\lambda^*|_{\\mathcal L}"}</M>. Every set of outer measure 0 is
          in 𝓛, and so are all its subsets.
        </p>
      </Definition>

      <Theorem title="Borel sets are measurable">
        <p><M>{"\\mathcal B(\\mathbb R) \\subseteq \\mathcal L"}</M>, and <M>{"\\lambda((a, b]) = b - a"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Since 𝓛 is a σ-algebra and the half-lines generate the Borel sets (m18.1.1), it suffices to show that{" "}
          <M>{"H = (-\\infty, a]"}</M> splits every E additively. Given a cover of E by intervals <M>{"I_n"}</M>, the pieces{" "}
          <M>{"I_n \\cap H"}</M> and <M>{"I_n \\cap H^c"}</M> are intervals whose lengths add to <M>{"|I_n|"}</M>; they cover E ∩ H and{" "}
          <M>{"E \\cap H^c"}</M>. So <M>{"\\lambda^*(E \\cap H) + \\lambda^*(E \\cap H^c) \\le \\sum |I_n|"}</M>, and taking the infimum over covers gives the
          splitting condition. The value on intervals is the theorem of m18.1.2.
        </p>
      </Proof>

      <Theorem title="invariance and uniqueness">
        <p>
          For A ∈ 𝓛, c ≠ 0 and t ∈ ℝ, <M>{"cA + t \\in \\mathcal L"}</M> and <M>{"\\lambda(cA + t) = |c|\\,\\lambda(A)"}</M>. Any measure on{" "}
          <M>{"\\mathcal B(\\mathbb R)"}</M> that gives every bounded interval its length equals λ there.
        </p>
      </Theorem>
      <Proof>
        <p>
          The map x ↦ cx + t sends intervals to intervals and multiplies lengths by |c| (<C>affine_image</C>), so it does the same
          to <M>{"\\lambda^*"}</M> and preserves the splitting condition. For uniqueness, let ν be such a measure. On [−n, n] the sets
          where ν and λ agree form a λ-system containing the π-system of subintervals, so by Dynkin&apos;s theorem (m18.1.1) they
          contain all Borel subsets; let n → ∞ by continuity from below.
        </p>
      </Proof>

      <Theorem title="regularity">
        <p>For every A ∈ 𝓛,</p>
        <MD>{"\\lambda(A) = \\inf\\{\\lambda(U) : U \\supseteq A \\text{ open}\\} = \\sup\\{\\lambda(K) : K \\subseteq A \\text{ compact}\\}."}</MD>
      </Theorem>
      <Proof>
        <p>
          For the first, take a cover with <M>{"\\sum |I_n| < \\lambda(A) + \\varepsilon"}</M> and enlarge each interval to an open one, adding{" "}
          <M>{"\\varepsilon 2^{-n}"}</M>; the union U is open (m8.4.1) and <M>{"\\lambda(U) < \\lambda(A) + 2\\varepsilon"}</M>. For the second, for bounded A apply the
          first to the complement of A inside a closed interval, which gives a closed set inside A of nearly full measure;
          closed and bounded means compact (m8.4.2). Unbounded A is the increasing union of its bounded pieces.
        </p>
      </Proof>

      <Example title="the Cantor set">
        <p>
          The Cantor set <M>{"\\mathcal C = \\bigcap_n C_n"}</M>, where <M>{"C_n"}</M> is the union of the <M>{"2^n"}</M> intervals of length{" "}
          <M>{"3^{-n}"}</M> left at stage n (<C>cantor_intervals</C>), has <M>{"\\lambda(\\mathcal C) \\le (2/3)^n"}</M> for every n, so{" "}
          <M>{"\\lambda(\\mathcal C) = 0"}</M> (<C>total_length</C>). Its points are exactly those with a ternary expansion using only the
          digits 0 and 2 (<C>in_cantor_stage</C>), and mapping each digit 2 to 1 gives a surjection onto the binary expansions
          of [0, 1]. So 𝒞 is uncountable (m8.1.3). Every one of its <M>{"2^{\\mathfrak c}"}</M> subsets has measure zero and is in 𝓛,
          while there are only 𝔠 Borel sets: 𝓛 is strictly larger than <M>{"\\mathcal B(\\mathbb R)"}</M>.
        </p>
        <Code>{CANTOR}</Code>
      </Example>

      <Example title="a fat Cantor set">
        <p>
          At stage k remove from each of the <M>{"2^{k-1}"}</M> remaining intervals a centred open interval of length{" "}
          <M>{"4^{-k}"}</M> (<C>fat_cantor</C>). The total removed is <M>{"\\sum_k 2^{k-1}4^{-k} = 1/2"}</M> (<C>removed_length</C>), so the limit
          set has measure 1/2. It is closed, and contains no interval because the remaining pieces have lengths tending to 0.
          Being nowhere dense and being negligible are different notions.
        </p>
        <Code>{FAT}</Code>
      </Example>

      <Remark title="what measure zero means">
        <p>
          A set has measure zero when it can be covered by intervals of arbitrarily small total length. Countable sets
          always do; the Cantor set shows that uncountable ones can too. In probability, an event of probability zero is not
          impossible: a uniform point lands in the Cantor set with probability 0, though the set is far from empty. That
          distinction is the reason for the phrase &quot;almost surely&quot;.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "stage",
      rung: "check",
      prompt: <p>What is the total length of the intervals left at stage 8 of the middle-thirds construction? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.039, tolerance: 0.0001 },
    },
    {
      key: "scale",
      rung: "check",
      prompt: <p>A Lebesgue measurable set A has λ(A) = 0.4. What is λ(−3A + 2)?</p>,
      answer: { kind: "numeric", value: 1.2, tolerance: 0.0001 },
    },
    {
      key: "cantor",
      rung: "apply",
      prompt: <p>Which statement about the middle-thirds Cantor set is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is uncountable and has Lebesgue measure zero",
          "It is countable, which is why its measure is zero",
          "It has measure 1/2 because half of each stage survives",
          "It contains an open interval",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction

def cantor_intervals(n):
    iv = [(Fraction(0), Fraction(1))]
    for _ in range(n):
        iv = [p for a, b in iv for p in ((a, a + (b - a) / 3), (b - (b - a) / 3, b))]
    return iv

def total_length(iv):
    return sum(b - a for a, b in iv)

def in_cantor_stage(x, n):
    for _ in range(n):
        x = 3 * x
        d = int(x) if x < 3 else 2
        if d == 1 and x != 1:
            return False
        x -= d
    return True

iv = cantor_intervals(2); print([(str(a), str(b)) for a, b in iv[:2]], len(iv), total_length(iv))
print(in_cantor_stage(Fraction(1, 4), 6), in_cantor_stage(Fraction(1, 2), 1), in_cantor_stage(Fraction(1, 3), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[('0', '1/9'), ('2/9', '1/3')] 4 4/9\nTrue False True",
          "[('0', '1/9'), ('2/9', '1/3')] 4 4/9\nFalse False True",
          "[('0', '1/3'), ('2/3', '1')] 2 2/3\nTrue False True",
          "[('0', '1/9'), ('2/9', '1/3')] 4 4/9\nTrue False False",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction

def fat_cantor(n, base):
    iv = [(Fraction(0), Fraction(1))]
    for k in range(1, n + 1):
        g = Fraction(1, base ** k)
        iv = [p for a, b in iv for p in ((a, (a + b - g) / 2), ((a + b + g) / 2, b))]
    return iv

def removed_length(n, base):
    return sum(Fraction(2 ** (k - 1), base ** k) for k in range(1, n + 1))

def affine_image(iv, c, t):
    return sorted((min(c * a + t, c * b + t), max(c * a + t, c * b + t)) for a, b in iv)

print([(str(a), str(b)) for a, b in fat_cantor(1, 4)], removed_length(2, 4), removed_length(3, 5))
print([(str(a), str(b)) for a, b in affine_image([(Fraction(0), Fraction(1, 2))], -2, 1)], total_length(affine_image(cantor_intervals(1), 3, 5)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[('0', '3/8'), ('5/8', '1')] 3/8 39/125\n[('0', '1')] 2",
          "[('0', '3/8'), ('5/8', '1')] 1/4 39/125\n[('0', '1')] 2",
          "[('0', '1/3'), ('2/3', '1')] 3/8 39/125\n[('0', '1')] 2",
          "[('0', '3/8'), ('5/8', '1')] 3/8 1/3\n[('-1', '0')] 3",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using exact fractions, write <C>cantor_intervals(n)</C> returning the <M>{"2^n"}</M> intervals of stage n in order,{" "}
          <C>total_length(iv)</C>, and <C>in_cantor_stage(x, n)</C>, which decides whether a fraction x in [0, 1] lies in stage n
          by reading n ternary digits and allowing the digit 1 only when the rest of the expansion can be written with 2s
          (that is, when 3x equals exactly 1 at that step).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def cantor_intervals(n):
    return [(Fraction(0), Fraction(1))]

def total_length(iv):
    return Fraction(1)

def in_cantor_stage(x, n):
    return True
`,
        solution: CANTOR,
        tests: [
          { name: "intervals", code: `iv = cantor_intervals(3)
assert len(iv) == 8 and iv[1] == (Fraction(2, 27), Fraction(1, 9)) and iv[-1] == (Fraction(26, 27), Fraction(1)) and total_length(iv) == Fraction(8, 27) and total_length(cantor_intervals(0)) == 1` },
          { name: "membership", code: `assert in_cantor_stage(Fraction(3, 4), 8) and not in_cantor_stage(Fraction(4, 9), 2) and in_cantor_stage(Fraction(2, 3), 5) and in_cantor_stage(Fraction(1), 4) and not in_cantor_stage(Fraction(1, 5), 3)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fat_cantor(n, base)</C>, removing at stage k a centred open interval of length <M>{"\\text{base}^{-k}"}</M> from
          each remaining interval, <C>removed_length(n, base)</C>, and <C>affine_image(iv, c, t)</C>, returning the sorted images of
          the intervals under x ↦ cx + t with left end first.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def fat_cantor(n, base):
    return [(Fraction(0), Fraction(1))]

def removed_length(n, base):
    return Fraction(0)

def affine_image(iv, c, t):
    return iv
`,
        solution: FAT,
        tests: [
          { name: "fat", code: `iv = fat_cantor(2, 4)
assert len(iv) == 4 and iv[0] == (Fraction(0), Fraction(5, 32)) and sum(b - a for a, b in iv) == 1 - removed_length(2, 4) and removed_length(4, 4) == Fraction(15, 32)` },
          { name: "affine", code: `assert affine_image([(Fraction(1), Fraction(2)), (Fraction(3), Fraction(4))], -1, 0) == [(Fraction(-4), Fraction(-3)), (Fraction(-2), Fraction(-1))] and affine_image([(Fraction(0), Fraction(1))], Fraction(1, 2), 3) == [(Fraction(3), Fraction(7, 2))]` },
        ],
      },
    },
    {
      key: "fifths",
      rung: "stretch",
      prompt: (
        <p>
          At stage k, remove a centred open interval of length <M>{"5^{-k}"}</M> from each of the <M>{"2^{k-1}"}</M> remaining intervals,
          starting from [0, 1]. What is the Lebesgue measure of the set that remains for ever? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Measures size sets; to integrate we need functions whose level sets can be measured. The next lesson defines
        measurable functions and shows they survive limits, the property the Riemann integral lacks.
      </p>
    </>
  ),
};
