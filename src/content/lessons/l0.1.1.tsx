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
          <Code>{`temp = 37.5
rule = temp >= 38.0      # a hand-written rule: fever at 38 °C or more
label = True             # the doctor's diagnosis for this patient
print(rule, rule == label)`}</Code>
          <p>A hand-written rule checked against one labelled example. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["False False", "True True", "False True", "True False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`healthy = 36.8    # a patient without fever
sick = 38.6       # a patient with fever
t = (healthy + sick) / 2    # a threshold learned from the two examples
print(t, 37.5 >= t)`}</Code>
          <p>Instead of writing the rule, take it from examples: put the threshold halfway between them. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["37.7 False", "37.7 True", "38.0 False", "37.5 True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Instead of writing a rule, learn one from examples. Write <C>learn_threshold(no, yes)</C>, the threshold halfway between a negative example <C>no</C> and a positive example <C>yes</C>, and <C>predict(x, t)</C>, which returns True when x ≥ t. For example, <C>learn_threshold(2, 8)</C> is 5.0 and <C>predict(6, 5.0)</C> is True.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def learn_threshold(no, yes):
    return yes

def predict(x, t):
    return False
`,
        solution: `def learn_threshold(no, yes):
    return (no + yes) / 2

def predict(x, t):
    return x >= t
`,
        tests: [
          { name: "learn", code: `assert learn_threshold(2, 8) == 5.0 and learn_threshold(36.5, 38.5) == 37.5, 'Halfway between the two examples is their average.'` },
          { name: "predict", code: `assert predict(6, 5.0) is True and predict(5.0, 5.0) is True and predict(4.9, 5.0) is False, 'Predict yes when x is at least the threshold.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            A learned rule is judged by its mistakes on labelled examples. Write <C>mistakes(t, x1, y1, x2, y2, x3, y3)</C>, the number of the three examples (xᵢ, yᵢ), with yᵢ True or False, on which the rule &ldquo;predict True when x ≥ t&rdquo; is wrong, and <C>accuracy(t, x1, y1, x2, y2, x3, y3)</C>, the fraction it gets right. <C>int(True)</C> is 1 and <C>int(False)</C> is 0. For example, with t = 5 and examples (2, False), (6, True), (7, False), the rule makes 1 mistake.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def mistakes(t, x1, y1, x2, y2, x3, y3):
    return 0

def accuracy(t, x1, y1, x2, y2, x3, y3):
    return 1.0
`,
        solution: `def mistakes(t, x1, y1, x2, y2, x3, y3):
    return int((x1 >= t) != y1) + int((x2 >= t) != y2) + int((x3 >= t) != y3)

def accuracy(t, x1, y1, x2, y2, x3, y3):
    return 1 - mistakes(t, x1, y1, x2, y2, x3, y3) / 3
`,
        tests: [
          { name: "mistakes", code: `assert mistakes(5, 2, False, 6, True, 7, False) == 1 and mistakes(5, 2, False, 6, True, 9, True) == 0 and mistakes(10, 2, True, 6, True, 7, True) == 3, 'Count the examples where (x >= t) differs from the label.'` },
          { name: "accuracy", code: `assert abs(accuracy(5, 2, False, 6, True, 7, False) - 2 / 3) < 1e-12 and accuracy(5, 2, False, 6, True, 9, True) == 1.0, 'Accuracy is the fraction right: 1 minus mistakes over 3.'` },
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
