import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { FrequencyViz } from "@/components/viz/FrequencyViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.8.3",
  minutes: 65,
  links: {
    revisits: ["m0.7.4", "m0.8.2"],
    foreshadows: ["m7.1.1", "m7.1.2", "m7.7.1"],
  },

  puzzle: (
    <>
      <p>
        A fair coin has landed heads five times in a row. Many people feel that tails is now &ldquo;due&rdquo;, so the
        sixth toss is more likely to be tails. Others feel the coin is &ldquo;on a streak&rdquo;, so heads is more likely.
      </p>
      <p>
        Who is right? And if a fair coin is equally likely to land either way, why does it so rarely give exactly 50 heads
        in 100 tosses?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Neither is right. The coin has no memory: whatever happened before, the next toss is still a fair coin. What,
        then, does &ldquo;a probability of one half&rdquo; actually mean, if it does not mean the coin evens things up?
      </p>
      <p>
        It means something about the long run. Toss the coin many times and keep track of the <em>proportion</em> of heads
        so far. Early on that proportion jumps about: after one toss it is 0 or 1. As tosses pile up, each new one changes
        the proportion less and less, and it settles down towards one half. Run it below several times.
      </p>
      <FrequencyViz />
      <p>
        Notice what settles and what does not. The <em>proportion</em> of heads closes in on one half. The{" "}
        <em>number</em> of heads minus the number of tails does not settle at all; it typically grows. Exactly 50 heads in
        100 tosses has a chance of only about 8%. The coin never catches up; the early streak is simply swamped.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="experiments, outcomes and events">
        <p>
          A <strong>random experiment</strong> is a process with an uncertain result, such as tossing a coin or rolling a
          die. Its possible results are the <strong>outcomes</strong>, and the set of all of them is the{" "}
          <strong>sample space</strong>. An <strong>event</strong> is a set of outcomes: for a die, &ldquo;even&rdquo; is
          the event <M>{"\\{2, 4, 6\\}"}</M>.
        </p>
      </Definition>

      <Definition title="probability as long-run frequency">
        <p>
          Repeat an experiment <M>n</M> times independently, and let <M>{"n_A"}</M> be the number of times event{" "}
          <M>A</M> happens. The <strong>relative frequency</strong> of <M>A</M> is <M>{"\\tfrac{n_A}{n}"}</M>. The{" "}
          <strong>probability</strong> of <M>A</M>, written <M>{"P(A)"}</M>, is the number this relative frequency settles
          down to as <M>n</M> grows.
        </p>
      </Definition>

      <p>
        This is a description, not yet a mathematical definition: what does &ldquo;settles down&rdquo; mean, for a sequence
        that is random? Making it precise takes the whole of a Probability course, which turns it into a theorem, the law
        of large numbers. For now the description is enough to tell us which rules a probability must obey, because
        relative frequencies obey them.
      </p>

      <Proposition title="the basic rules">
        <p>For any events <M>A</M> and <M>B</M>:</p>
        <ol>
          <li><M>{"0 \\le P(A) \\le 1"}</M>, and the sample space has probability 1.</li>
          <li>The complement rule: <M>{"P(\\text{not } A) = 1 - P(A)"}</M>.</li>
          <li>If <M>A</M> and <M>B</M> cannot both happen, <M>{"P(A \\text{ or } B) = P(A) + P(B)"}</M>.</li>
        </ol>
      </Proposition>
      <Proof>
        <p>
          Each holds for relative frequencies, for every <M>n</M>. A count <M>{"n_A"}</M> lies between 0 and <M>n</M>, and
          some outcome happens every time. Every trial is either in <M>A</M> or not, so{" "}
          <M>{"n_{\\text{not } A} = n - n_A"}</M>. If <M>A</M> and <M>B</M> never happen together, the trials where one of
          them happens are counted exactly once, so <M>{"n_{A \\text{ or } B} = n_A + n_B"}</M>. Divide by <M>n</M>, and
          each rule passes to the numbers the frequencies settle to.
        </p>
      </Proof>

      <Definition title="equally likely outcomes">
        <p>
          When a sample space has finitely many outcomes and symmetry gives us no reason to prefer one over another, we
          take them to be equally likely. Then, by the addition rule,
        </p>
        <MD>{"P(A) = \\frac{\\text{number of outcomes in } A}{\\text{number of outcomes in the sample space}}."}</MD>
      </Definition>

      <Example title="two dice">
        <p>
          Roll two dice. The 36 ordered outcomes <M>{"(1,1), (1,2), \\ldots, (6,6)"}</M> are equally likely. The total is 7
          for six of them, so <M>{"P(7) = \\tfrac{6}{36} = \\tfrac16"}</M>. The chance of at least one six is easiest by the
          complement: no six means both dice show 1 to 5, which is <M>{"5 \\times 5 = 25"}</M> outcomes, so the answer is{" "}
          <M>{"1 - \\tfrac{25}{36} = \\tfrac{11}{36}"}</M>. Counting principles from the last chapter do the work.
        </p>
      </Example>

      <Proposition title="independent events multiply">
        <p>
          If two experiments do not influence each other, the chance that <M>A</M> happens in the first and <M>B</M> in the
          second is <M>{"P(A) \\times P(B)"}</M>.
        </p>
      </Proposition>
      <p>
        In the long run, a proportion <M>{"P(A)"}</M> of all trials of the first experiment give <M>A</M>; among those,
        since the second experiment pays no attention to the first, a proportion <M>{"P(B)"}</M> give <M>B</M>. So five
        heads in a row has probability <M>{"\\left(\\tfrac12\\right)^5 = \\tfrac{1}{32}"}</M>: rare, but in a long run of
        tosses it will happen often. And the sixth toss, being independent, is still heads with probability{" "}
        <M>{"\\tfrac12"}</M>.
      </p>

      <Remark title="the gambler's fallacy">
        <p>
          On 18 August 1913, at the casino in Monte Carlo, the roulette ball fell on black 26 times in a row. Gamblers lost
          millions betting on red, sure that red was overdue. The belief that independent events balance themselves out in
          the short run is now called the <em>gambler&rsquo;s fallacy</em>. The long-run frequency is not enforced by
          correction; it emerges because the early results become a smaller and smaller part of the whole.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "die",
      rung: "check",
      prompt: <p>A fair die is rolled. What is the probability of a number greater than 4?</p>,
      answer: { kind: "numeric", value: 1 / 3 },
    },
    {
      key: "complement",
      rung: "check",
      prompt: <p>The probability of rain tomorrow is 0.35. What is the probability that it does not rain?</p>,
      answer: { kind: "numeric", value: 0.65 },
    },
    {
      key: "two-dice",
      rung: "apply",
      prompt: <p>Two fair dice are rolled. What is the probability that the total is 9?</p>,
      answer: { kind: "numeric", value: 1 / 9 },
    },
    {
      key: "at-least-one",
      rung: "apply",
      prompt: <p>A fair coin is tossed 4 times. What is the probability of at least one head?</p>,
      answer: { kind: "numeric", value: 15 / 16 },
    },
    {
      key: "fallacy",
      rung: "apply",
      prompt: <p>A fair coin has landed tails 8 times running. Select every true statement.</p>,
      answer: {
        kind: "choice",
        options: [
          "The next toss is heads with probability 1/2.",
          "Heads is now more likely, to even things out.",
          "Over many more tosses, the proportion of heads will still tend to 1/2.",
          "Eight tails in a row is impossible for a fair coin.",
        ],
        correct: [0, 2],
      },
    },
    {
      key: "union",
      rung: "prove",
      prompt: (
        <p>
          Events <M>A</M> and <M>B</M> may happen together. Using relative frequencies, explain why{" "}
          <M>{"P(A \\text{ or } B) = P(A) + P(B) - P(A \\text{ and } B)"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that adding n_A and n_B counts the trials where both happen twice.",
          "Writes n_(A or B) = n_A + n_B − n_(A and B).",
          "Divides by n and passes to the long-run values to get the formula.",
        ],
      },
    },
    {
      key: "birthday",
      rung: "stretch",
      prompt: (
        <p>
          Ignoring leap years and assuming all 365 birthdays are equally likely, what is the probability that among 23
          people at least two share a birthday? Give a decimal to two places. (Find the complement first.)
        </p>
      ),
      answer: { kind: "numeric", value: 0.51, tolerance: 0.02 },
    },
  ],

  teachBack:
    "Explain to a friend what it means for a coin to have probability one half of heads, and why a run of five heads does not make tails more likely next.",

  glimpse: (
    <p>
      Next, expected value, the long-run average of a number that depends on chance. In Probability, these rules become
      the axioms of probability, and the long-run description becomes a theorem, the law of large numbers. Counting
      equally likely outcomes is the first chapter of that course, and independence returns in every model you will ever
      train, whenever data are assumed to be drawn independently.
    </p>
  ),
};
