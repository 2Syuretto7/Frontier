import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { CountingGridViz } from "@/components/viz/CountingGridViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.1.1",
  minutes: 50,
  links: {
    requires: ["m1.4.5", "m1.8.1"],
    foreshadows: ["m4.1.2", "m4.2.1", "m7.1.2"],
  },

  puzzle: (
    <>
      <p>
        A password is 8 characters long, each a lower-case letter or a digit. An attacker can test a billion passwords a second.
        How long does trying every possible password take?
      </p>
      <p>
        You cannot list the passwords to count them. You need rules that count a set from the way it is built.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Almost every counting argument is built from two moves. When a choice is made in stages, and each stage has the same
        number of options whatever happened before, the counts <em>multiply</em>. When a set splits into pieces that do not
        overlap, the counts <em>add</em>. Switch between &ldquo;and&rdquo; and &ldquo;or&rdquo; below and see the grid turn
        into a row.
      </p>
      <CountingGridViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the sum rule">
        <p>
          If a finite set S is the union of disjoint sets <M>{"A_1, \\dots, A_k"}</M>, then{" "}
          <M>{"|S| = |A_1| + \\dots + |A_k|"}</M>.
        </p>
      </Theorem>
      <Theorem title="the product rule">
        <p>
          If each element of S is built by a sequence of k choices, where the first choice can be made in{" "}
          <M>{"n_1"}</M> ways, and whatever was chosen so far the next can be made in <M>{"n_2"}</M> ways, and so on, and
          different sequences give different elements, then <M>{"|S| = n_1 n_2 \\cdots n_k"}</M>. In particular{" "}
          <M>{"|A \\times B| = |A|\\,|B|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The sum rule is the definition of counting applied piece by piece: a bijection from S to{" "}
          <M>{"\\{1, \\dots, |S|\\}"}</M> can be built by numbering <M>{"A_1"}</M> first, then continuing with{" "}
          <M>{"A_2"}</M>, and so on. For the product rule with two stages, group the elements of S by their first choice. There
          are <M>{"n_1"}</M> groups, disjoint, each of size <M>{"n_2"}</M>, so the sum rule gives{" "}
          <M>{"n_2 + \\dots + n_2 = n_1 n_2"}</M>. Induction on the number of stages handles k stages.
        </p>
      </Proof>

      <Example title="the password">
        <p>
          Each of the 8 positions has 26 + 10 = 36 options (sum rule), and the positions are chosen independently, so there are{" "}
          <M>{"36^8 \\approx 2.8 \\times 10^{12}"}</M> passwords (product rule). At <M>{"10^9"}</M> a second that is about 47
          minutes. Allowing upper case too gives <M>{"62^8 \\approx 2.2 \\times 10^{14}"}</M>, about 2.5 days; 12 characters
          give <M>{"62^{12} \\approx 3.2 \\times 10^{21}"}</M>, about 100 000 years.
        </p>
      </Example>

      <Definition title="counting functions and subsets">
        <p>
          A function from an m-element set to an n-element set chooses one of n values for each of m inputs:{" "}
          <M>{"n^m"}</M> functions. A subset of an n-element set chooses in or out for each element:{" "}
          <M>{"2^n"}</M> subsets. Strings of length m over an alphabet of size n are the same thing as functions, so there are{" "}
          <M>{"n^m"}</M> of them.
        </p>
      </Definition>

      <Example title="when the options depend on earlier choices">
        <p>
          How many 4-digit numbers have no repeated digit? The first digit has 9 options (not 0). The second has 9 (any digit
          but the first), the third 8, the fourth 7. The <em>set</em> of options changes, but its <em>size</em> does not
          depend on what was chosen, so the product rule applies: <M>{"9 \\cdot 9 \\cdot 8 \\cdot 7 = 4536"}</M>.
        </p>
      </Example>

      <Theorem title="the subtraction rule">
        <p>
          <M>{"|A \\cup B| = |A| + |B| - |A \\cap B|"}</M>, and the number of elements of S without a property is{" "}
          <M>{"|S|"}</M> minus the number with it.
        </p>
      </Theorem>
      <Example title="counting the complement">
        <p>
          Of the <M>{"10^4"}</M> four-digit PINs (leading zeros allowed), how many have at least one repeated digit? Counting
          those with no repeat is easy: <M>{"10 \\cdot 9 \\cdot 8 \\cdot 7 = 5040"}</M>. So{" "}
          <M>{"10000 - 5040 = 4960"}</M> have a repeat.
        </p>
      </Example>

      <Remark title="the commonest mistake">
        <p>
          The product rule counts <em>sequences</em>. If different sequences can produce the same object, the product
          overcounts. Choosing two people from five &ldquo;first one, then another&rdquo; gives 5 · 4 = 20 sequences, but each
          pair appears twice, so there are 10 pairs. The next lesson makes this division systematic.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "menu",
      rung: "check",
      prompt: <p>A canteen offers 4 starters, 6 mains and 3 desserts. How many three-course meals are there?</p>,
      answer: { kind: "numeric", value: 72 },
    },
    {
      key: "either",
      rung: "check",
      prompt: <p>A student chooses one elective: 7 from mathematics or 5 from computing, with no course in both lists. How many choices?</p>,
      answer: { kind: "numeric", value: 12 },
    },
    {
      key: "plates",
      rung: "apply",
      prompt: <p>A number plate is two letters followed by four digits. How many plates are there?</p>,
      answer: { kind: "numeric", value: 6760000 },
    },
    {
      key: "norepeat",
      rung: "apply",
      prompt: <p>How many 3-letter strings over the 26-letter alphabet have at least one repeated letter?</p>,
      answer: { kind: "numeric", value: 1976 },
    },
    {
      key: "functions",
      rung: "apply",
      prompt: <p>How many functions are there from a 3-element set to a 5-element set?</p>,
      answer: { kind: "numeric", value: 125 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product
letters, digits = "AB", "123"
print(len(list(product(letters, digits))), len(letters) + len(digits))`}</Code>
          <p>The product rule and the sum rule. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["6 5", "5 6", "6 6", "9 5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>count_passwords(length, alphabets)</C>, the number of passwords of the given length where each character comes from the union of the disjoint alphabets in the list <C>alphabets</C> (strings), and <C>count_with_digit(length, letters, digits)</C>, the number that contain at least one digit, using the complement.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def count_passwords(length, alphabets):
    return length * sum(len(a) for a in alphabets)

def count_with_digit(length, letters, digits):
    return len(digits) ** length
`,
        solution: `def count_passwords(length, alphabets):
    return sum(len(a) for a in alphabets) ** length

def count_with_digit(length, letters, digits):
    return (len(letters) + len(digits)) ** length - len(letters) ** length
`,
        tests: [
          { name: "all", code: `import string
assert count_passwords(8, [string.ascii_lowercase, string.digits]) == 36 ** 8, 'Sum rule for one character, product rule across positions.'` },
          { name: "complement", code: `import string
from itertools import product
L, D = 'ab', '01'
brute = sum(1 for s in product(L + D, repeat=3) if any(c in D for c in s))
assert count_with_digit(3, L, D) == brute and count_with_digit(8, string.ascii_lowercase, string.digits) == 36 ** 8 - 26 ** 8, 'Count all passwords, then subtract those with no digit.'` },
        ],
      },
    },
    {
      key: "product",
      rung: "prove",
      prompt: (
        <p>
          Prove the product rule for two stages from the sum rule, and then prove by induction that a set with n elements has
          <M>{"2^n"}</M> subsets.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Groups the outcomes by the first choice into n₁ disjoint classes, each of size n₂, and applies the sum rule.",
          "Base case: the empty set has exactly one subset.",
          "Step: subsets of S ∪ {x} split into those without x and those with x, each in bijection with subsets of S, giving 2 · 2ⁿ.",
        ],
      },
    },
    {
      key: "divisors",
      rung: "stretch",
      prompt: <p>How many positive divisors does 720 = 2⁴ · 3² · 5 have?</p>,
      answer: { kind: "numeric", value: 30 },
    },
  ],

  teachBack:
    "Explain to a friend when counts add and when they multiply, using a password or a menu, and why the product rule needs each stage to have the same number of options whatever was chosen before.",

  glimpse: (
    <p>
      Next, permutations and combinations: the product rule, followed by dividing out the orders that do not matter.
      Probability counts favourable outcomes the same way, and in Data Structures and Algorithms these rules measure how many
      steps a brute-force search would take.
    </p>
  ),
};
