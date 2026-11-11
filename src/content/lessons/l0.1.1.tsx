import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { SpamRulesViz } from "@/components/viz/SpamRulesViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.1.1",
  minutes: 45,
  links: {
    foreshadows: ["l0.4.1", "l1.1.1"],
  },

  puzzle: (
    <>
      <p>
        Write down a set of rules that a computer could follow to decide whether a photograph shows a cat. Be precise: the
        computer sees only a grid of numbers, one per pixel, giving the colour at each point.
      </p>
      <p>
        Try for a few minutes. Does &ldquo;has pointed ears&rdquo; survive a cat seen from behind, a cartoon cat, a cat
        curled into a ball, a fox? How many rules would you need before you trusted the program?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Almost everyone gives up. A three-year-old recognises cats without effort, yet nobody can write down how. The
        knowledge is real but it is not in the form of rules we can state.
      </p>
      <p>
        Here is a smaller version of the same problem: deciding which text messages are spam. Switch rules on and off and
        see how many of the ten messages you can classify correctly.
      </p>
      <SpamRulesViz />
      <p>
        Each rule helps a little and hurts a little. Real people write &ldquo;FREE&rdquo; and send links too. With these
        five rules, the best you can do is nine out of ten. You could keep adding rules and exceptions to rules, but with
        millions of messages the list would never end.
      </p>
      <p>
        Machine learning turns the problem round. Instead of writing the rules, we collect <em>examples</em>: thousands
        of messages already labelled spam or not. Then a program searches for a rule that agrees with the examples. The
        programmer writes the search, not the rule.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="machine learning">
        <p>
          A program <strong>learns</strong> from experience when its performance at some task improves as it gets more
          experience. In machine learning, the experience is usually a set of <strong>examples</strong>, and the program
          is a procedure that turns examples into a rule, called a <strong>model</strong>.
        </p>
      </Definition>

      <p>
        This definition, close to one given by Tom Mitchell in 1997, has three parts, and a learning problem is only
        well posed when all three are pinned down: the <em>task</em> (decide whether a message is spam), the{" "}
        <em>experience</em> (a collection of labelled messages), and the <em>performance measure</em> (the percentage of
        new messages classified correctly).
      </p>

      <Definition title="two ways to build a program">
        <ul>
          <li>
            <strong>Rules:</strong> a person understands the task, writes the rules as code, and the program applies them.
            Input plus rules gives output.
          </li>
          <li>
            <strong>Learning:</strong> a person collects examples of inputs with the outputs they should give, and a
            learning algorithm produces the rules. Inputs plus outputs give the rules.
          </li>
        </ul>
      </Definition>

      <Example title="when rules win">
        <p>
          Calculating income tax, sorting a list of names, adding two numbers: here the rules are known exactly, short to
          state and must be followed exactly. Learning them from examples would be slower, less reliable and harder to
          check. Use learning when the rules are unknown, too many to write, or keep changing.
        </p>
      </Example>

      <Example title="when learning wins">
        <p>
          Recognising speech, translating between languages, spotting a tumour in a scan, predicting tomorrow&rsquo;s
          electricity demand. In each, people can supply examples far more easily than rules, and the examples keep
          arriving.
        </p>
      </Example>

      <Remark title="what is given up">
        <p>
          A hand-written rule can be read and checked; you know exactly why the program did what it did. A learned model
          is often a large table of numbers that nobody wrote, and it is much harder to say why it decided as it did, or
          what it will do on an input unlike its examples. Learning trades understanding for performance. Getting some of
          that understanding back is a research field of its own, which you will meet much later.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "which",
      rung: "check",
      prompt: <p>Select every task where learning from examples is likely to beat hand-written rules.</p>,
      answer: {
        kind: "choice",
        options: [
          "Recognising handwritten postcodes on envelopes",
          "Converting temperatures from Celsius to Fahrenheit",
          "Recommending films a user might enjoy",
          "Checking that a password has at least 12 characters",
        ],
        correct: [0, 2],
      },
    },
    {
      key: "parts",
      rung: "check",
      prompt: <p>In the spam filter, which of these is the performance measure?</p>,
      answer: {
        kind: "choice",
        options: ["The collection of labelled messages", "The share of new messages classified correctly", "Deciding whether a message is spam"],
        correct: [1],
      },
    },
    {
      key: "best",
      rung: "apply",
      prompt: <p>In the visualisation, what is the largest number of the ten messages that any combination of the five rules classifies correctly?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "frame",
      rung: "apply",
      prompt: (
        <p>
          A hospital wants to predict which patients will be readmitted within a month. Select every statement that
          correctly identifies part of the learning problem.
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Task: predict, for a patient leaving hospital, whether they will return within 30 days.",
          "Experience: records of past patients, with whether each one returned.",
          "Performance: how quickly the program runs.",
          "Performance: how often its predictions for new patients turn out right.",
        ],
        correct: [0, 1, 3],
      },
    },
    {
      key: "changing",
      rung: "apply",
      prompt: <p>Spammers change their wording every few weeks. Which approach copes better, and why?</p>,
      answer: {
        kind: "choice",
        options: [
          "Rules, because a person can read them.",
          "Learning, because the model can be retrained on new labelled messages without anyone rewriting rules.",
          "Neither can cope at all.",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def rule(word):
    return word.endswith("ing")
examples = {"running": True, "king": False, "sing": False, "eating": True}
print(sum(rule(w) == y for w, y in examples.items()))`}</Code>
          <p>A hand-written rule for 'is a verb in -ing form', tested on labelled examples. How many does it get right?</p>
        </>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`emails = [("win money now", 1), ("meeting at noon", 0), ("win a prize", 1), ("lunch money", 0)]
rule = lambda t: "win" in t or "money" in t
print(sum(rule(t) == bool(y) for t, y in emails), [t for t, y in emails if rule(t) != bool(y)])`}</Code>
          <p>A hand-written spam rule checked against labelled emails. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 ['lunch money']", "4 []", "3 ['meeting at noon']", "2 ['lunch money', 'win a prize']"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Instead of writing a rule, learn one from examples. Write <C>learn_threshold(xs, ys)</C>, which takes numbers and 0/1 labels and returns the threshold t, chosen from the values in xs, for which the rule &ldquo;predict 1 when x ≥ t&rdquo; makes the fewest mistakes. Break ties by the smallest t.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def learn_threshold(xs, ys):
    return sum(xs) / len(xs)
`,
        solution: `def learn_threshold(xs, ys):
    def errors(t):
        return sum((x >= t) != bool(y) for x, y in zip(xs, ys))
    return min(sorted(set(xs)), key=errors)
`,
        tests: [
          { name: "separable", code: `assert learn_threshold([1, 2, 3, 8, 9, 10], [0, 0, 0, 1, 1, 1]) == 8, 'The rule x ≥ 8 makes no mistakes.'` },
          { name: "noisy", code: `assert learn_threshold([1, 2, 3, 4, 5, 6], [0, 0, 1, 0, 1, 1]) == 3, 'x ≥ 3 makes one mistake, and so does x ≥ 5; take the smaller.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Learn the spam rule from examples instead. Write <C>learn_keywords(emails, k)</C> for a list of (text, label) pairs with label 1 for spam: split each text into lower-case words, count each word once per email, score each word by (spam emails containing it) − (normal emails containing it), and return the k highest-scoring words, breaking ties alphabetically. Then write <C>classify(text, words)</C>, which returns 1 if any word of the text is in <C>words</C>, else 0, and <C>accuracy(emails, words)</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def learn_keywords(emails, k):
    return []

def classify(text, words):
    return 0

def accuracy(emails, words):
    return 0.0
`,
        solution: `def learn_keywords(emails, k):
    score = {}
    for text, y in emails:
        for w in set(text.lower().split()):
            score[w] = score.get(w, 0) + (1 if y == 1 else -1)
    return sorted(score, key=lambda w: (-score[w], w))[:k]

def classify(text, words):
    return int(any(w in words for w in text.lower().split()))

def accuracy(emails, words):
    return sum(classify(t, words) == y for t, y in emails) / len(emails)
`,
        tests: [
          { name: "learn", code: `emails = [("Win money now", 1), ("meeting at noon", 0), ("win a prize", 1), ("lunch money", 0), ("free prize inside", 1)]
assert learn_keywords(emails, 2) == ['prize', 'win'], 'prize and win each score 2; ties go alphabetically.'` },
          { name: "once per email", code: `assert learn_keywords([("buy buy buy", 1), ("buy now", 0), ("cheap", 1)], 1) == ['cheap'], 'buy scores 1 − 1 = 0 because repeats in one email count once.'` },
          { name: "classify", code: `assert classify("WIN big", ["win"]) == 1 and classify("winner", ["win"]) == 0 and classify("", ["win"]) == 0, 'Match whole lower-case words.'` },
          { name: "accuracy", code: `emails = [("Win money now", 1), ("meeting at noon", 0), ("win a prize", 1), ("lunch money", 0), ("free prize inside", 1)]
assert accuracy(emails, learn_keywords(emails, 2)) == 1.0 and accuracy(emails, ['money']) == 0.4, 'The learned words separate this data.'` },
        ],
      },
    },
    {
      key: "argue",
      rung: "prove",
      prompt: (
        <p>
          Argue for or against this claim: &ldquo;A learned spam filter is always better than a hand-written one.&rdquo;
          Give at least one consideration on each side, and say what would decide the question for a particular email
          provider.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Gives an advantage of learning, such as handling many weak signals, adapting as spam changes, or scaling to millions of messages.",
          "Gives an advantage of rules, such as being readable, checkable, needing no labelled data, or behaving predictably.",
          "Notes that 'always' is too strong: it depends on the amount of labelled data, how fast spam changes, and the cost of mistakes.",
          "Names a concrete way to decide, such as measuring both on new messages the provider cares about.",
        ],
      },
    },
    {
      key: "rule-count",
      rung: "stretch",
      prompt: (
        <p>
          Suppose each message is described only by whether it contains each of 20 particular words. How many different
          messages can then be told apart? (Each word is either present or absent.)
        </p>
      ),
      answer: { kind: "numeric", value: 1048576 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between writing rules and learning from examples, using a task of your own choosing, and say when you would pick each.",

  glimpse: (
    <p>
      Next, the three ingredients every learning method shares: data, a model, and a loss that measures how wrong the model
      is. Hand-written rules were the dominant idea in artificial intelligence for thirty years, and the history chapter
      tells how they lost to learning. In Introduction to Machine Learning, the task, experience and performance of this
      lesson become the precise setting of supervised learning.
    </p>
  ),
};
