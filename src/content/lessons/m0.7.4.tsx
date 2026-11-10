import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { ChooseViz } from "@/components/viz/ChooseViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.7.4",
  minutes: 70,
  links: {
    revisits: ["m0.1.1", "m0.7.2"],
    foreshadows: ["m4.1.1", "m4.1.4", "m7.1.2"],
  },

  puzzle: (
    <>
      <p>
        A cricket captain must choose a batting order for eleven players. How many different orders are there? Now suppose
        the selectors only need to pick 11 players from a squad of 15, and the order does not matter. How many different
        teams are possible?
      </p>
      <p>Guess first. Most people guess far too low for the first and far too high for the second.</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Counting by listing fails quickly. Counting by <em>structure</em> does not. For a batting order there are 11 choices
        for opener, then 10 for the next place, then 9, and so on: <M>{"11 \\times 10 \\times \\cdots \\times 1"}</M>, nearly
        forty million orders. For the team, every team of 11 can be listed in many orders, so the count of ordered lists
        overcounts each team by the same factor, which we can divide out. Watch it below with small numbers.
      </p>
      <ChooseViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the addition and multiplication principles">
        <ul>
          <li>
            <strong>Addition:</strong> if a choice can be made in one of two ways that do not overlap, with <M>a</M> options
            the first way and <M>b</M> the second, there are <M>{"a + b"}</M> options in all.
          </li>
          <li>
            <strong>Multiplication:</strong> if a task is done in two stages, with <M>a</M> options for the first and, for
            each of these, <M>b</M> options for the second, there are <M>{"a \\times b"}</M> ways to do it.
          </li>
        </ul>
      </Theorem>
      <p>
        The multiplication principle is clearest as a tree: <M>a</M> branches, each splitting into <M>b</M>, gives{" "}
        <M>{"ab"}</M> leaves. Both extend to any number of stages or cases.
      </p>

      <Definition title="factorials and arrangements">
        <p>
          For a whole number <M>n</M>, <M>{"n! = n \\times (n-1) \\times \\cdots \\times 2 \\times 1"}</M>, read
          &ldquo;<M>n</M> factorial&rdquo;, with <M>{"0! = 1"}</M>. By the multiplication principle, <M>n</M> different
          objects can be put in order in <M>{"n!"}</M> ways, and an ordered list of <M>r</M> of them can be made in
        </p>
        <MD>{"n(n-1)\\cdots(n - r + 1) = \\frac{n!}{(n-r)!}"}</MD>
        <p>ways.</p>
      </Definition>

      <Theorem title="combinations">
        <p>
          The number of ways to choose <M>r</M> objects from <M>n</M> different objects, when order does not matter, is
        </p>
        <MD>{"\\binom{n}{r} = \\frac{n!}{r!\\,(n-r)!},"}</MD>
        <p>read &ldquo;<M>n</M> choose <M>r</M>&rdquo;.</p>
      </Theorem>
      <Proof>
        <p>
          Count the ordered lists of <M>r</M> objects in two ways. Directly, there are <M>{"\\tfrac{n!}{(n-r)!}"}</M>. Or:
          first choose which <M>r</M> objects, in <M>{"\\binom{n}{r}"}</M> ways, then put them in order, in <M>{"r!"}</M> ways.
          So <M>{"\\binom{n}{r}\\, r! = \\tfrac{n!}{(n-r)!}"}</M>. Counting one thing in two ways is among the most useful
          tricks in combinatorics.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          A batting order is <M>{"11! = 39\\,916\\,800"}</M> arrangements. A team from 15 is{" "}
          <M>{"\\binom{15}{11} = \\binom{15}{4} = \\tfrac{15 \\times 14 \\times 13 \\times 12}{24} = 1365"}</M>: choosing the 11
          who play is the same as choosing the 4 who do not.
        </p>
      </Example>

      <Proposition title="the pigeonhole principle">
        <p>If more than <M>n</M> objects are put into <M>n</M> boxes, some box contains at least two.</p>
      </Proposition>
      <Proof>
        <p>If every box had at most one object, there would be at most <M>n</M> objects.</p>
      </Proof>
      <p>
        Simple as it is, it proves surprising things. Among any 13 people, two share a birth month. In Mumbai, with well over
        a million people with hair and fewer than a million hairs on any human head, two people have exactly the same number
        of hairs.
      </p>

      <Remark title="counting syllables">
        <p>
          Some of the oldest counting problems come from Indian prosody. Pingala&rsquo;s <em>Chandaḥśāstra</em>, from the last
          centuries BCE, asks how many metres can be built from a given number of short and long syllables, and how many have
          exactly <M>r</M> long ones. The general formula for <M>{"\\binom{n}{r}"}</M> is stated in Mahavira&rsquo;s{" "}
          <em>Gaṇitasārasaṅgraha</em> of about 850 CE, centuries before it appears in Europe.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "outfits",
      rung: "check",
      prompt: <p>You have 4 shirts, 3 pairs of trousers and 2 pairs of shoes. How many different outfits can you wear?</p>,
      answer: { kind: "numeric", value: 24 },
    },
    {
      key: "books",
      rung: "check",
      prompt: <p>In how many orders can 5 different books stand on a shelf?</p>,
      answer: { kind: "numeric", value: 120 },
    },
    {
      key: "committee",
      rung: "apply",
      prompt: <p>How many ways are there to choose a committee of 4 from 9 people?</p>,
      answer: { kind: "numeric", value: 126 },
    },
    {
      key: "pin",
      rung: "apply",
      prompt: <p>How many 4-digit PINs, using digits 0 to 9, have no digit repeated?</p>,
      answer: { kind: "numeric", value: 5040 },
    },
    {
      key: "pigeonhole",
      rung: "apply",
      prompt: <p>What is the smallest group of people in which two must have birthdays in the same month?</p>,
      answer: { kind: "numeric", value: 13 },
    },
    {
      key: "symmetry",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"\\binom{n}{r} = \\binom{n}{n-r}"}</M>, first from the formula and then by a counting argument that
          uses no algebra.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Substitutes n − r for r in the formula and notes the two factorials in the bottom simply swap.",
          "For the counting argument, observes that choosing r objects to take is the same as choosing n − r to leave.",
          "Explains that this pairs the two kinds of choice one to one.",
          "Concludes the two counts are equal.",
        ],
      },
    },
    {
      key: "banana",
      rung: "stretch",
      prompt: <p>How many different arrangements are there of the letters of the word BANANA?</p>,
      answer: { kind: "numeric", value: 60 },
    },
  ],

  teachBack:
    "Explain to a friend why choosing r things from n gives n! divided by r! and (n − r)!, using the idea of counting ordered lists in two ways.",

  glimpse: (
    <p>
      Next, the binomial theorem, where these same numbers appear as the coefficients of <M>{"(1 + x)^n"}</M>. Counting is
      the first chapter of Discrete Mathematics, which adds inclusion and exclusion and generating functions. And probability
      with equally likely outcomes is counting divided by counting, the starting point of the Probability course.
    </p>
  ),
};
