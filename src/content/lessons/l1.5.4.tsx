import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SearchViz } from "@/components/viz/SearchViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.5.4",
  minutes: 45,
  links: {
    requires: ["l1.5.2"],
    revisits: ["l1.5.3", "l1.2.4"],
    parallels: ["m4.1.1", "m4.6.2"],
    foreshadows: ["l3.6.3"],
  },

  puzzle: (
    <>
      <p>
        You can afford nine training runs to tune two settings, a learning rate and a second setting. You suspect, but do not
        know, that only the learning rate really matters.
      </p>
      <p>
        A neat 3 by 3 grid covers the square evenly. Nine random points look messy. Which tests more learning rates? Which
        would you choose?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The grid tests only three learning rates, each three times, with the unimportant setting varying. Nine random points
        almost surely test nine different learning rates. When only some settings matter, which is the usual case, random
        search explores the ones that matter far more thoroughly for the same cost.
      </p>
      <SearchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="hyperparameters">
        <p>
          <strong>Parameters</strong> are learned from training data, like the weights of a model. <strong>Hyperparameters</strong>{" "}
          are chosen before training and control it: <M>k</M> in nearest neighbours, the depth of a tree, the penalty{" "}
          <M>{"\\lambda"}</M>, the learning rate. They are chosen by validation or cross-validation.
        </p>
      </Definition>

      <Definition title="grid and random search">
        <p>
          <strong>Grid search</strong> tries every combination of a few values per hyperparameter. With <M>m</M> values for each
          of <M>h</M> hyperparameters it costs <M>{"m^h"}</M> runs, which grows exponentially in <M>h</M>.{" "}
          <strong>Random search</strong> draws each trial&rsquo;s settings independently from chosen distributions, for as many
          trials as the budget allows.
        </p>
      </Definition>

      <Theorem title="how many random trials">
        <p>
          If each random trial independently lands in the best fraction <M>q</M> of the search space with probability{" "}
          <M>q</M>, then <M>N</M> trials include at least one such trial with probability
        </p>
        <MD>{"1 - (1 - q)^N ."}</MD>
      </Theorem>
      <Proof>
        <p>
          A single trial misses with probability <M>{"1 - q"}</M>. By independence, all <M>N</M> miss with probability{" "}
          <M>{"(1 - q)^N"}</M>, and the complement is the claim.
        </p>
      </Proof>

      <Example title="sixty trials">
        <p>
          With <M>{"q = 0.05"}</M>, 20 trials succeed with probability <M>{"1 - 0.95^{20} \\approx 0.64"}</M>. To reach 0.95 we
          need <M>{"0.95^N \\le 0.05"}</M>, that is <M>{"N \\ge \\ln 0.05 / \\ln 0.95 \\approx 58.4"}</M>, so 59 trials. The
          count does not depend on how many hyperparameters there are.
        </p>
      </Example>

      <Remark title="search on the right scale">
        <p>
          A learning rate of 0.001 differs from 0.01 as much as 0.01 differs from 0.1. So sample such settings{" "}
          <strong>log-uniformly</strong>: draw the exponent uniformly. Sampling uniformly between 0.00001 and 0.1 would put
          about 90% of trials above 0.01.
        </p>
      </Remark>

      <Remark title="spending the budget wisely">
        <p>
          Many bad settings reveal themselves early. <strong>Successive halving</strong> starts many trials with a small budget,
          keeps the best fraction, and gives the survivors more. <strong>Bayesian optimisation</strong> fits a model of the
          score as a function of the settings and chooses the next trial where improvement looks likely. Whatever the method,
          the more settings you try, the more the best validation score flatters the winner, so the final test set stays
          untouched.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hyper",
      rung: "check",
      prompt: <p>Which of these are hyperparameters? Select all that apply.</p>,
      answer: { kind: "choice", options: ["The learning rate", "The depth limit of a decision tree", "The fitted weights of a linear model"], correct: [0, 1] },
    },
    {
      key: "why",
      rung: "check",
      prompt: <p>Why does random search tend to beat grid search for the same number of trials?</p>,
      answer: { kind: "choice", options: ["It tests more distinct values of each hyperparameter, which matters when only a few hyperparameters are important", "Random numbers are better than evenly spaced ones in every problem", "It needs no validation set"], correct: [0] },
    },
    {
      key: "grid",
      rung: "apply",
      prompt: <p>A grid uses 5 values for each of 4 hyperparameters. How many runs is that?</p>,
      answer: { kind: "numeric", value: 625 },
    },
    {
      key: "p20",
      rung: "apply",
      prompt: <p>What is the probability that at least one of 20 random trials lands in the best 5% of the space? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.642, tolerance: 0.0006 },
    },
    {
      key: "n95",
      rung: "apply",
      prompt: <p>What is the smallest number of random trials that gives at least a 95% chance of hitting the best 5%?</p>,
      answer: { kind: "numeric", value: 59 },
    },
    {
      key: "argue",
      rung: "prove",
      prompt: (
        <p>
          Suppose a score depends on hyperparameter <M>a</M> only, and you have a budget of <M>{"m^2"}</M> runs over two
          hyperparameters <M>{"a, b"}</M>. Compare how many distinct values of <M>a</M> an <M>{"m \\times m"}</M> grid and{" "}
          <M>{"m^2"}</M> uniform random trials test, and use the theorem above to explain what this means for finding a good{" "}
          <M>a</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes the grid tests only m distinct values of a, each repeated m times.",
          "Notes that m² independent uniform draws are distinct with probability 1, so random search tests m² values of a.",
          "Applies the theorem: the chance of a value in the best fraction q is 1 − (1 − q)^(m²) for random search, while the grid succeeds only if one of its m fixed values happens to lie in the good region.",
          "Concludes that random search wastes none of its budget on the irrelevant hyperparameter.",
        ],
      },
    },
    {
      key: "halving",
      rung: "stretch",
      prompt: <p>Successive halving starts 81 configurations and keeps the best third after each round until one remains. Counting a configuration once in each round it takes part in, how many runs is that in total?</p>,
      answer: { kind: "numeric", value: 121 },
    },
  ],

  teachBack:
    "Explain to a friend why random search usually beats grid search, why learning rates are searched on a log scale, and why tuning hard can fool you.",

  glimpse: (
    <p>
      Next, learning without labels, starting with k-means. Neural Networks from Scratch tunes learning rates and their schedules
      in earnest, and at frontier scale labs tune on small models and extrapolate, because a single large run is too expensive
      to repeat.
    </p>
  ),
};
