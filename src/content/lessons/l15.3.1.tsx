import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReaderDropoffViz } from "@/components/viz/ReaderDropoffViz";
import type { LessonContent } from "@/lib/types";

const ORDERING = `def survival(dropout):
    s = [1.0]
    for d in dropout:
        s.append(s[-1] * (1 - d))                          # share of readers who reach each position
    return s

def expected_value(order, values, surv):
    return sum(values[name] * surv[i] for i, name in enumerate(order))

def best_arrangement(values):
    return sorted(values, key=lambda n: (-values[n], n))   # most valuable first`;

const READABILITY = `import re

def count_syllables(word):
    w = re.sub(r"[^a-z]", "", word.lower())
    n = len(re.findall(r"[aeiouy]+", w))                   # vowel groups
    if w.endswith("e") and not w.endswith("le") and n > 1:
        n -= 1                                             # silent final e
    return max(1, n)

def sentence_stats(text):
    sents = [s for s in re.split(r"[.!?]+", text) if s.strip()]
    words = re.findall(r"[A-Za-z]+", text)
    return len(sents), len(words), sum(count_syllables(w) for w in words)

def flesch(text):
    s, w, syl = sentence_stats(text)
    return 206.835 - 1.015 * w / s - 84.6 * syl / w`;

export const lesson: LessonContent = {
  id: "l15.3.1",
  minutes: 45,
  links: {
    requires: ["l15.2.3", "l15.1.1"],
    revisits: ["l15.2.1"],
    foreshadows: ["l15.3.2", "l15.3.3", "l15.4.4"],
  },

  puzzle: (
    <>
      <p>
        You have a result. The natural way to write it up is the order in which you did the work: background, setup,
        the experiments you tried, and finally what worked. Most readers of a paper read the title, many read the
        abstract, some read the introduction and look at the first figure, and few read to the end. If your main result
        is on page seven, who will ever see it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A paper is not a diary of the work but an argument for a claim, written for readers who will stop early. So the
        main claim and the evidence for it come first, in the title, abstract, introduction and first figure, and the
        rest of the paper supports and qualifies them. Write sentences that a tired reader can follow: one idea each,
        concrete subjects, the key term defined before it is used. Readability formulas are crude, but they catch the
        long, abstract sentences that hide results.
      </p>
      <ReaderDropoffViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the structure of a paper">
        <p>
          The abstract states the problem, the approach, the main result with a number, and why it matters, in a few
          sentences. The introduction expands this and ends with a list of contributions stated as claims a reader could
          check, a practice Simon Peyton Jones recommends in &quot;How to Write a Great Research Paper&quot;, along with
          writing the paper early, to find out what you do not yet know. The method section gives enough detail to
          reproduce the work; the experiments answer, one by one, the questions a sceptical reader would ask; related
          work explains how the paper differs from what exists; and a limitations section, now asked for by the NeurIPS
          checklist, says where the claims stop.
        </p>
      </Definition>

      <Theorem title="put the most valuable content first">
        <p>
          Let the share of readers who reach position i be <M>{"s_1 \\ge s_2 \\ge \\dots \\ge s_k"}</M>, with each
          section losing a fraction of the readers left (<C>survival</C>), and let item j have value <M>{"v_j"}</M>. The
          expected value delivered by placing item <M>{"\\pi(i)"}</M> at position i is{" "}
          <M>{"\\sum_i s_i v_{\\pi(i)}"}</M> (<C>expected_value</C>), and it is maximised by placing the items in
          decreasing order of value (<C>best_arrangement</C>).
        </p>
        <Code>{ORDERING}</Code>
      </Theorem>
      <Proof>
        <p>
          Suppose positions i &lt; j hold items with values a &lt; b. Swapping them changes the total by{" "}
          <M>{"(s_i b + s_j a) - (s_i a + s_j b) = (s_i - s_j)(b - a) \\ge 0"}</M>. So any arrangement that is not
          decreasing can be improved or left equal by swapping an inverted pair, and a finite sequence of such swaps
          reaches the decreasing order, which is therefore optimal. This is the rearrangement inequality. Real readers
          also return for details, which is why the method section still matters, but the inequality says where the
          claim must live.
        </p>
      </Proof>

      <Definition title="readability">
        <p>
          The Flesch reading-ease score, from 1948, is
        </p>
        <MD>{"206.835 - 1.015\\,\\frac{\\text{words}}{\\text{sentences}} - 84.6\\,\\frac{\\text{syllables}}{\\text{words}}"}</MD>
        <p>
          (<C>flesch</C>), higher meaning easier; scientific prose typically scores below 30. Computing it needs sentence,
          word and syllable counts (<C>sentence_stats</C>); syllables can be estimated by counting groups of vowels and
          discounting a silent final e (<C>count_syllables</C>). The score cannot tell good writing from bad, but a
          paragraph that scores far lower than its neighbours is usually one where long sentences or stacked abstract
          nouns hide the point.
        </p>
        <Code>{READABILITY}</Code>
      </Definition>

      <Example title="rewriting a sentence">
        <p>
          &quot;The utilisation of the proposed regularisation methodology results in a substantial improvement in
          generalisation performance across the evaluated benchmark configurations&quot; has 20 words in one sentence and
          long nouns throughout. &quot;Our regulariser cuts test error by a third on all five benchmarks. Table 2 gives
          the numbers.&quot; says more, with a number, in two short sentences, and scores far higher.
        </p>
      </Example>

      <Remark title="a process that works">
        <p>
          Write the abstract and the contribution list first, before the experiments are finished, and let them decide
          which experiments are still needed. Draft the first figure early, since many readers will understand the paper
          from it alone; the next lesson is about figures. Give a draft to someone outside the project and ask them to
          tell you the main claim after reading only the first page. Then read the paper as a hostile reviewer would, the
          subject of l15.3.3.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "order",
      rung: "check",
      prompt: (
        <p>
          Four parts of a paper have values 5, 3, 8 and 1, and the shares of readers reaching the four positions are 1,
          0.5, 0.3 and 0.1. What is the largest expected value any arrangement can deliver?
        </p>
      ),
      answer: { kind: "numeric", value: 11.5, tolerance: 0.001 },
    },
    {
      key: "flesch",
      rung: "check",
      prompt: (
        <p>
          A passage has 3 sentences, 60 words and 90 syllables. What is its Flesch reading-ease score? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 59.635, tolerance: 0.01 },
    },
    {
      key: "contrib",
      rung: "apply",
      prompt: <p>How should the contributions of a paper be stated in its introduction?</p>,
      answer: {
        kind: "choice",
        options: [
          "As specific claims that a reader could check against the rest of the paper",
          "As a history of the experiments in the order they were run",
          "As a list of all related papers",
          "As vague statements, so that reviewers cannot disagree",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def survival(dropout):
    s = [1.0]
    for d in dropout:
        s.append(s[-1] * (1 - d))                          # share of readers who reach each position
    return s

def expected_value(order, values, surv):
    return sum(values[name] * surv[i] for i, name in enumerate(order))

def best_arrangement(values):
    return sorted(values, key=lambda n: (-values[n], n))   # most valuable first

vals = {"a": 1, "b": 4, "c": 2}; surv = survival([0.5, 0.5])
print(surv, expected_value(["a", "b", "c"], vals, surv), best_arrangement(vals), expected_value(best_arrangement(vals), vals, surv))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.5, 0.25] 3.5 ['b', 'c', 'a'] 5.25",
          "[0.5, 0.25] 3.5 ['b', 'c', 'a'] 5.25",
          "[1.0, 0.5, 0.25] 3.5 ['a', 'c', 'b'] 3.5",
          "[1.0, 0.5, 0.25] 7 ['b', 'c', 'a'] 5.25",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import re

def count_syllables(word):
    w = re.sub(r"[^a-z]", "", word.lower())
    n = len(re.findall(r"[aeiouy]+", w))                   # vowel groups
    if w.endswith("e") and not w.endswith("le") and n > 1:
        n -= 1                                             # silent final e
    return max(1, n)

def sentence_stats(text):
    sents = [s for s in re.split(r"[.!?]+", text) if s.strip()]
    words = re.findall(r"[A-Za-z]+", text)
    return len(sents), len(words), sum(count_syllables(w) for w in words)

def flesch(text):
    s, w, syl = sentence_stats(text)
    return 206.835 - 1.015 * w / s - 84.6 * syl / w

print(count_syllables("model"), count_syllables("make"), count_syllables("the"), count_syllables("training"))
print(sentence_stats("We train a model. It works!"), round(flesch("We train a model. It works!"), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2 1 1 2\n(2, 6, 7) 105.1",
          "2 2 1 2\n(2, 6, 8) 92.3",
          "2 1 1 3\n(2, 6, 7) 105.1",
          "2 1 1 2\n(1, 6, 7) 102.1",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>survival(dropout)</C>, starting at 1.0 and multiplying by 1 − d for each section in turn;{" "}
          <C>expected_value(order, values, surv)</C>; and <C>best_arrangement(values)</C>, by decreasing value with ties
          by name.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def survival(dropout):
    return [1 - d for d in dropout]

def expected_value(order, values, surv):
    return sum(values.values())

def best_arrangement(values):
    return sorted(values)
`,
        solution: ORDERING,
        tests: [
          { name: "surv", code: `assert survival([]) == [1.0] and survival([0.5, 0.2]) == [1.0, 0.5, 0.4] and expected_value(["x", "y"], {"x": 2, "y": 4}, [1, 0.5]) == 4` },
          { name: "best", code: `v = {"p": 1, "q": 3, "r": 3, "s": 2}\nassert best_arrangement(v) == ["q", "r", "s", "p"] and abs(expected_value(best_arrangement(v), v, survival([0.5, 0.5, 0.5])) - 5.125) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>count_syllables(word)</C>: lower-case, keep letters, count groups of the vowels aeiouy, subtract one
          for a final e that is not part of a final &quot;le&quot; when the count exceeds one, and return at least 1;{" "}
          <C>sentence_stats(text)</C>, the numbers of sentences (non-empty pieces split on . ! ?), words (runs of
          letters) and syllables; and <C>flesch(text)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import re

def count_syllables(word):
    return 1

def sentence_stats(text):
    return 1, len(text.split()), len(text.split())

def flesch(text):
    return 0.0
`,
        solution: READABILITY,
        tests: [
          { name: "syl", code: `assert [count_syllables(w) for w in ["simple", "queue", "rhythm", "Data,", "evaluate", "nlp"]] == [2, 1, 1, 2, 3, 1]` },
          { name: "stats", code: `assert sentence_stats("Cats sit. Dogs run fast!") == (2, 5, 5) and abs(flesch("Cats sit. Dogs run fast!") - (206.835 - 1.015 * 2.5 - 84.6)) < 1e-9` },
        ],
      },
    },
    {
      key: "dropout",
      rung: "stretch",
      prompt: (
        <p>
          A paper has four parts with values 2, 9, 4 and 7. The first section loses 60% of readers, and each of the next
          two loses half of those remaining. What is the largest expected value any arrangement delivers? Give one
          decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 12.8, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Many readers will understand a paper from its first figure alone. The next lesson is about making figures that
        carry an argument rather than decorate one.
      </p>
    </>
  ),
};
