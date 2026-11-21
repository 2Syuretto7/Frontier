import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CommitteeAgreementViz } from "@/components/viz/CommitteeAgreementViz";
import type { LessonContent } from "@/lib/types";

const SCORES = `def mean_score(reviews):
    by = {}
    for _, paper, s in reviews:
        by.setdefault(paper, []).append(s)
    return {p: sum(v) / len(v) for p, v in by.items()}

def calibrated(reviews):
    mine = {}
    for r, _, s in reviews:
        mine.setdefault(r, []).append(s)
    offset = {r: sum(v) / len(v) for r, v in mine.items()}  # each reviewer's own average
    return mean_score([(r, p, s - offset[r]) for r, p, s in reviews])

def ranking(reviews):
    c = calibrated(reviews)
    return sorted(c, key=lambda p: (-c[p], p))`;

const AGREE = `def accept_set(scores, k):
    return sorted(sorted(scores, key=lambda p: (-scores[p], p))[:k])

def agreement(a, b, k):
    sa, sb = set(accept_set(a, k)), set(accept_set(b, k))
    return len(sa & sb) / k                                # share of one committee's accepts the other also accepts

def kappa(x, y):
    n = len(x)
    po = sum(u == v for u, v in zip(x, y)) / n
    p1, p2 = sum(x) / n, sum(y) / n
    pe = p1 * p2 + (1 - p1) * (1 - p2)                     # agreement expected by chance
    return (po - pe) / (1 - pe)`;

export const lesson: LessonContent = {
  id: "l15.3.3",
  minutes: 45,
  links: {
    requires: ["l15.3.2", "l9.6.3"],
    revisits: ["l15.1.1", "l9.8.2"],
    foreshadows: ["l15.4.4"],
  },

  puzzle: (
    <>
      <p>
        In 2014 the NeurIPS conference sent a tenth of its submissions to two independent programme committees. About
        half of the papers one committee accepted, the other rejected. If acceptance is that noisy, what does a
        rejection tell you, how should you read your own reviews, and how can you get a hard, useful review of your
        draft before submitting it, for instance by asking Parton to act as the referee?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A review score is a noisy measurement of a paper&apos;s quality, made by a reviewer with their own scale and
        tastes. Averaging reviewers helps, and so does removing each reviewer&apos;s personal offset, but when papers near
        the acceptance line differ by less than the noise, the decision is close to a coin flip. That makes the content
        of reviews more useful than the scores: the specific weaknesses a careful reader found. A model asked to review
        can find many of those weaknesses early, provided you ask it to attack the paper and not to praise it.
      </p>
      <CommitteeAgreementViz />
    </>
  ),

  theory: (
    <>
      <Definition title="what a review contains">
        <p>
          A review summarises the paper in the reviewer&apos;s own words, lists strengths and weaknesses, asks questions
          whose answers could change the assessment, comments on limitations and broader impact, and gives a score with a
          confidence. A good weakness is specific and checkable (&quot;the baseline in Table 2 uses the default learning
          rate while the new method was tuned&quot;), not a matter of taste. The authors&apos; rebuttal answers each point,
          with new evidence where possible. The questions of the second pass in l15.1.1 are the reviewer&apos;s questions.
        </p>
      </Definition>

      <Theorem title="removing reviewer offsets">
        <p>
          Suppose reviewer r gives paper p the score <M>{"q_p + b_r + \\varepsilon_{rp}"}</M>, with a personal offset{" "}
          <M>{"b_r"}</M>. Subtracting each reviewer&apos;s mean score removes <M>{"b_r"}</M> exactly, leaving{" "}
          <M>{"q_p - \\bar q_r + \\varepsilon_{rp} - \\bar\\varepsilon_r"}</M>, where <M>{"\\bar q_r"}</M> is the mean
          quality of the papers r reviewed (<C>calibrated</C>, compared with raw means in <C>mean_score</C>, and used to
          order papers in <C>ranking</C>).
        </p>
        <Code>{SCORES}</Code>
      </Theorem>
      <Proof>
        <p>
          The mean of reviewer r&apos;s scores is <M>{"\\bar q_r + b_r + \\bar\\varepsilon_r"}</M>, and subtracting it
          from each of their scores cancels <M>{"b_r"}</M>. The remaining term <M>{"\\bar q_r"}</M> is the price: a
          reviewer who happened to get strong papers has them pulled down. With random assignment of many papers per
          reviewer, <M>{"\\bar q_r"}</M> is close to the overall mean and the correction is nearly unbiased; with few
          papers per reviewer it trades offset error for assignment error, which is why conferences combine such
          adjustments with discussion.
        </p>
      </Proof>

      <Theorem title="how often two committees agree">
        <p>
          Model each committee&apos;s score as <M>{"q + \\varepsilon_i"}</M>, with quality q and independent noise
          normally distributed with variances <M>{"\\sigma_q^2"}</M> and <M>{"\\sigma_\\varepsilon^2"}</M>. The two scores
          have correlation <M>{"\\rho = \\sigma_q^2/(\\sigma_q^2 + \\sigma_\\varepsilon^2)"}</M>, and when each committee
          accepts half the papers, the probability that the second accepts a paper the first accepted is
        </p>
        <MD>{"\\frac12 + \\frac{\\arcsin \\rho}{\\pi}."}</MD>
        <p>
          Agreement on a set of decisions is summarised by top-k overlap (<C>accept_set</C>, <C>agreement</C>) and by
          Cohen&apos;s κ, which discounts the agreement expected by chance (<C>kappa</C>).
        </p>
        <Code>{AGREE}</Code>
      </Theorem>
      <Proof>
        <p>
          The covariance of the scores is <M>{"\\mathrm{Var}(q) = \\sigma_q^2"}</M> and each variance is{" "}
          <M>{"\\sigma_q^2 + \\sigma_\\varepsilon^2"}</M>, giving ρ. Standardise, and write the scores as X = U and{" "}
          <M>{"Y = \\rho U + \\sqrt{1-\\rho^2}\\,V"}</M> with U and V independent standard normals. Accepting half the
          papers means thresholds at 0. The event X &gt; 0, Y &gt; 0 is the intersection of two half-planes through the
          origin whose normals, (1, 0) and <M>{"(\\rho, \\sqrt{1-\\rho^2})"}</M>, are at angle <M>{"\\arccos\\rho"}</M>;
          it is a wedge of angle <M>{"\\pi - \\arccos\\rho"}</M>. Since (U, V) is rotationally symmetric, the
          probability is the angle over <M>{"2\\pi"}</M>, which is{" "}
          <M>{"\\tfrac14 + \\tfrac{\\arcsin\\rho}{2\\pi}"}</M> (Sheppard&apos;s formula). Dividing by P(X &gt; 0) = 1/2
          gives the result. With lower acceptance rates there is no closed form, but agreement falls further, as the viz
          computes numerically.
        </p>
      </Proof>

      <Example title="the NeurIPS experiments">
        <p>
          Cortes and Lawrence&apos;s analysis of the 2014 experiment found that roughly half the papers accepted by one
          committee would have been rejected by the other, and the 2021 NeurIPS experiment found much the same. In the
          model, an acceptance rate of about a quarter and that level of disagreement correspond to a correlation between
          committees of only about one half, meaning noise contributes as much variance as quality. Reviews agree well
          on the clearly strong and the clearly weak papers and are close to random in between.
        </p>
      </Example>

      <Remark title="Parton as referee">
        <p>
          Before submitting, give Parton the draft and the venue&apos;s review form, and ask for a review from a sceptical
          expert: a summary, the three most serious weaknesses with the experiment that would expose each, and the
          questions most likely to lower the score. Ask it to argue for rejection, since language models tend towards
          agreement, as l9.8.2 described, and their reviews drift towards generic praise. Treat each point as a
          hypothesis to check, not a verdict; l9.6.3 showed how model judges can be biased. Then write the rebuttal you
          would send, and if a point cannot be answered, fix the paper instead.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sheppard",
      rung: "check",
      prompt: (
        <p>
          Two committees each accept half the papers, and their scores have correlation 0.6. What share of the first
          committee&apos;s accepted papers does the second also accept? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.7048, tolerance: 0.0005 },
    },
    {
      key: "kappa",
      rung: "check",
      prompt: (
        <p>
          Of 100 papers, both committees accept 10, only the first accepts 12, only the second accepts 13, and both
          reject 65. What is Cohen&apos;s κ? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.2833, tolerance: 0.0005 },
    },
    {
      key: "weak",
      rung: "apply",
      prompt: <p>Which is the most useful weakness to raise in a review?</p>,
      answer: {
        kind: "choice",
        options: [
          "The baseline was run with default hyperparameters while the proposed method was tuned, so the gap may come from tuning",
          "The paper is not very exciting",
          "The method could probably be improved",
          "I would have chosen a different problem",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def mean_score(reviews):
    by = {}
    for _, paper, s in reviews:
        by.setdefault(paper, []).append(s)
    return {p: sum(v) / len(v) for p, v in by.items()}

def calibrated(reviews):
    mine = {}
    for r, _, s in reviews:
        mine.setdefault(r, []).append(s)
    offset = {r: sum(v) / len(v) for r, v in mine.items()}  # each reviewer's own average
    return mean_score([(r, p, s - offset[r]) for r, p, s in reviews])

def ranking(reviews):
    c = calibrated(reviews)
    return sorted(c, key=lambda p: (-c[p], p))

reviews = [("r1", "p", 6), ("r1", "q", 4), ("r2", "p", 9), ("r2", "r", 7), ("r3", "q", 5), ("r3", "r", 3)]
print(mean_score(reviews), calibrated(reviews), ranking(reviews))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'p': 7.5, 'q': 4.5, 'r': 5.0} {'p': 1.0, 'q': 0.0, 'r': -1.0} ['p', 'q', 'r']",
          "{'p': 7.5, 'q': 4.5, 'r': 5.0} {'p': 1.0, 'q': 0.0, 'r': -1.0} ['p', 'r', 'q']",
          "{'p': 7.5, 'q': 4.5, 'r': 5.0} {'p': 1.0, 'q': -1.0, 'r': 0.0} ['p', 'r', 'q']",
          "{'p': 15, 'q': 9, 'r': 10} {'p': 1.0, 'q': 0.0, 'r': -1.0} ['p', 'q', 'r']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def accept_set(scores, k):
    return sorted(sorted(scores, key=lambda p: (-scores[p], p))[:k])

def agreement(a, b, k):
    sa, sb = set(accept_set(a, k)), set(accept_set(b, k))
    return len(sa & sb) / k                                # share of one committee's accepts the other also accepts

def kappa(x, y):
    n = len(x)
    po = sum(u == v for u, v in zip(x, y)) / n
    p1, p2 = sum(x) / n, sum(y) / n
    pe = p1 * p2 + (1 - p1) * (1 - p2)                     # agreement expected by chance
    return (po - pe) / (1 - pe)

a = {"p": 9, "q": 7, "r": 5, "s": 3}; b = {"p": 4, "q": 8, "r": 6, "s": 2}
print(accept_set(a, 2), agreement(a, b, 2), round(kappa([1, 1, 0, 0], [1, 0, 1, 0]), 3), round(kappa([1, 1, 0, 0], [1, 1, 0, 0]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['p', 'q'] 0.5 0.0 1.0",
          "['p', 'q'] 0.5 0.5 1.0",
          "['q', 'r'] 0.5 0.0 1.0",
          "['p', 'q'] 1.0 0.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Reviews are (reviewer, paper, score) triples. Write <C>mean_score(reviews)</C>, each paper&apos;s mean score;{" "}
          <C>calibrated(reviews)</C>, the same after subtracting each reviewer&apos;s mean from their scores; and{" "}
          <C>ranking(reviews)</C>, papers by calibrated score, highest first, ties by name.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def mean_score(reviews):
    return {p: s for _, p, s in reviews}

def calibrated(reviews):
    return mean_score(reviews)

def ranking(reviews):
    c = mean_score(reviews)
    return sorted(c, key=lambda p: -c[p])
`,
        solution: SCORES,
        tests: [
          { name: "mean", code: `R = [("a", "x", 2), ("b", "x", 4), ("a", "y", 6)]\nassert mean_score(R) == {"x": 3.0, "y": 6.0} and calibrated(R) == {"x": -1.0, "y": 2.0}` },
          { name: "rank", code: `R = [("a", "x", 9), ("a", "y", 7), ("b", "z", 4), ("b", "w", 2)]\nassert ranking(R) == ["x", "z", "w", "y"] and ranking([("a", "u", 1), ("a", "t", 1)]) == ["t", "u"]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>accept_set(scores, k)</C>, the k highest-scoring papers (ties by name) returned in alphabetical order;{" "}
          <C>agreement(a, b, k)</C>, the share of the first committee&apos;s k accepts that the second also accepts; and{" "}
          <C>kappa(x, y)</C> for two lists of 0/1 decisions.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def accept_set(scores, k):
    return list(scores)[:k]

def agreement(a, b, k):
    return 1.0

def kappa(x, y):
    return sum(u == v for u, v in zip(x, y)) / len(x)
`,
        solution: AGREE,
        tests: [
          { name: "accept", code: `s = {"d": 5, "a": 1, "c": 5, "b": 3}\nassert accept_set(s, 2) == ["c", "d"] and accept_set(s, 3) == ["b", "c", "d"] and agreement(s, {"a": 9, "b": 8, "c": 1, "d": 0}, 2) == 0` },
          { name: "kappa", code: `assert abs(kappa([1, 0, 0, 0], [1, 0, 0, 1]) - 0.5) < 1e-12 and abs(kappa([1, 1, 0, 0], [0, 0, 1, 1]) + 1) < 1e-12` },
        ],
      },
    },
    {
      key: "rho",
      rung: "stretch",
      prompt: (
        <p>
          With each committee accepting half the papers, what correlation between committees would make the second accept
          80% of the papers the first accepts? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.809, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Reading, doing and writing research come together in a thesis. The final chapter puts them into practice,
        starting with a proposal that states the question, the plan and the tests of success.
      </p>
    </>
  ),
};
