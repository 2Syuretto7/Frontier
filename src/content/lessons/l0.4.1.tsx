import { Definition, Example, Quote, Remark } from "@/components/lesson/Blocks";
import { ExpertSystemViz } from "@/components/viz/ExpertSystemViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.4.1",
  minutes: 45,
  links: {
    revisits: ["l0.1.1"],
    foreshadows: ["m1.1.1", "l13.1.1"],
  },

  puzzle: (
    <>
      <p>
        In 1956 a group of researchers predicted that the main problems of making machines intelligent could be solved by a
        small team in a single summer. Their plan was to describe intelligence precisely, as rules and logic, and program it
        directly.
      </p>
      <p>
        Seventy years later, the most capable AI systems are built almost entirely from learning, with very few hand-written
        rules. What do you think went wrong with the first plan? Or did it partly succeed?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The plan was not foolish. Much of what we call intelligent, such as proving theorems, planning a route or diagnosing
        a disease, can be described as following rules to draw conclusions from facts. Early programs did exactly that, and
        some did it very well.
      </p>
      <p>
        Below is a tiny <strong>expert system</strong> for identifying animals. Tick the facts you observe, and the rules fire
        in turn, each new conclusion feeding the next, until nothing more follows.
      </p>
      <ExpertSystemViz />
      <p>
        Notice its strengths: every conclusion comes with a reason you can read. And its weaknesses: it knows nothing outside
        its rules, it cannot handle an observation it has no rule for, and it does not notice when its conclusions contradict
        each other. Real expert systems had thousands of rules, and these weaknesses grew with them.
      </p>
    </>
  ),

  theory: (
    <>
      <Quote source="Proposal for the Dartmouth Summer Research Project on Artificial Intelligence, 1955">
        <p>
          The study is to proceed on the basis of the conjecture that every aspect of learning or any other feature of
          intelligence can in principle be so precisely described that a machine can be made to simulate it.
        </p>
      </Quote>

      <Definition title="symbolic AI">
        <p>
          <strong>Symbolic AI</strong> represents knowledge as symbols, such as words, facts and logical rules, and produces
          intelligent behaviour by manipulating them: searching through possibilities, applying rules, and drawing logical
          conclusions. The knowledge is written by people.
        </p>
      </Definition>

      <Example title="successes">
        <p>
          The Logic Theorist of Allen Newell and Herbert Simon (1956) proved theorems from <em>Principia Mathematica</em>.
          MYCIN, built at Stanford in the 1970s, recommended treatments for blood infections using a few hundred rules and in
          tests did about as well as specialists. XCON, from the late 1970s, configured computer orders for the Digital
          Equipment Corporation and saved it millions of dollars a year. In 1997, IBM&rsquo;s Deep Blue beat the world chess
          champion Garry Kasparov using fast search and an evaluation function tuned by experts.
        </p>
      </Example>

      <Definition title="the knowledge bottleneck">
        <p>
          Every rule had to be extracted from a human expert and written down by hand. Experts often cannot say how they
          know what they know, rules interact in unexpected ways, and the world contains endlessly many special cases. This
          difficulty of getting knowledge into the machine is called the <strong>knowledge acquisition bottleneck</strong>.
        </p>
      </Definition>

      <p>
        The systems were also <em>brittle</em>: excellent inside their narrow domain, and helpless just outside it. Describe a rusty
        car to a medical expert system in the terms it understands, and it will happily diagnose an illness: it has no rule
        that says it is out of its depth. When the high expectations of the
        1980s went unmet, funding collapsed in the late 1980s, a period now called the second <strong>AI winter</strong>.
      </p>

      <Remark title="what survived">
        <p>
          Symbolic AI did not vanish. Search algorithms route every satellite navigation system; logic underlies the tools
          that check computer chips and software for errors; and today&rsquo;s language models are increasingly given symbolic
          tools, such as calculators, code interpreters and proof checkers, to call when exact reasoning matters. The modern
          picture is less &ldquo;learning instead of rules&rdquo; than &ldquo;learning, with rules where they belong&rdquo;.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "year",
      rung: "check",
      prompt: <p>In what year was the Dartmouth workshop, often taken as the birth of AI as a field, held?</p>,
      answer: { kind: "numeric", value: 1956 },
    },
    {
      key: "symbolic",
      rung: "check",
      prompt: <p>In symbolic AI, where does the system&rsquo;s knowledge come from?</p>,
      answer: { kind: "choice", options: ["It is written by people as rules and facts", "It is learned from millions of examples", "It is copied from the internet"], correct: [0] },
    },
    {
      key: "chain",
      rung: "apply",
      prompt: <p>In the visualisation, with only &ldquo;gives milk&rdquo; and &ldquo;eats meat&rdquo; ticked, how many rules fire?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "brittle",
      rung: "apply",
      prompt: <p>Select every weakness that made expert systems hard to scale.</p>,
      answer: {
        kind: "choice",
        options: ["Experts could not always state the rules they used", "Every conclusion came with a readable reason", "Rules interacted in unexpected ways as their number grew", "They failed badly on cases just outside their domain"],
        correct: [0, 2, 3],
      },
    },
    {
      key: "fit",
      rung: "apply",
      prompt: <p>Which of these tasks is still best done with hand-written rules and search rather than learning?</p>,
      answer: {
        kind: "choice",
        options: ["Finding the shortest driving route on a known road map", "Recognising faces in photographs", "Transcribing speech"],
        correct: [0],
      },
    },
    {
      key: "bottleneck",
      rung: "prove",
      prompt: (
        <p>
          Explain the knowledge acquisition bottleneck with an example of your own, and explain how learning from examples
          sidesteps it. What new problem does learning bring in exchange?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Describes an expert task where the expert cannot fully state their rules, such as recognising a ripe mango or a fake signature.",
          "Explains that symbolic AI needs those rules written down, which is slow, incomplete and error-prone.",
          "Explains that learning needs only labelled examples, which experts can supply without stating rules.",
          "Names a cost of learning, such as needing much data, or producing a model whose reasoning cannot easily be read or checked.",
        ],
      },
    },
    {
      key: "rules",
      rung: "stretch",
      prompt: (
        <p>
          An expert system has 2,000 rules, and an engineer must check every pair of rules for conflicts. How many pairs is
          that? (Each pair counted once.)
        </p>
      ),
      answer: { kind: "numeric", value: 1999000 },
    },
  ],

  teachBack:
    "Explain to a friend what symbolic AI tried to do, one of its real successes, and why it ran into trouble as systems grew.",

  glimpse: (
    <p>
      Next, the other tradition, running alongside symbolic AI from the start: machines that learn, beginning with the
      perceptron. The logic behind expert systems is the subject of Proof and Logic, and in Reasoning, Agents and Tool Use
      you will see language models that call symbolic tools when they need exact answers.
    </p>
  ),
};
