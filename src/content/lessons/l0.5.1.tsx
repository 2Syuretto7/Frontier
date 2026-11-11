import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { LabLoopViz } from "@/components/viz/LabLoopViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.5.1",
  minutes: 40,
  links: {
    revisits: ["l0.4.4"],
    foreshadows: ["l8.1.1", "l10.1.1", "l14.1.1", "e13.1.1"],
  },

  puzzle: (
    <>
      <p>
        A frontier AI lab employs a few thousand people, and its main product is a single trained model, essentially a very
        large file of numbers, that is replaced by a better one every year or so.
      </p>
      <p>
        What do you imagine all those people do? Make a list of the jobs you think are needed to produce and release one such
        model, and keep it. You will compare it with the lesson at the end.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <strong>frontier lab</strong> is an organisation that trains the most capable AI models of its time. A handful of
        companies around the world fit the description. Their work is a loop, turned again and again, each turn producing a
        larger and more capable model. Click round it.
      </p>
      <LabLoopViz />
      <p>
        Every stage needs different people. Researchers design and run the small experiments. Engineers build the software
        and keep tens of thousands of chips working together for months. Others collect and clean data, design evaluations,
        study what goes on inside models, test for dangerous behaviour, build products, and decide when a model is ready.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the main kinds of work">
        <ul>
          <li><strong>Research:</strong> new ideas for architectures, training methods and data, tested in small, cheap experiments.</li>
          <li><strong>Pretraining:</strong> planning and running the giant training run, using scaling laws to choose its size.</li>
          <li><strong>Infrastructure:</strong> the software and hardware that let thousands of accelerators train one model, recover from failures, and serve it to users.</li>
          <li><strong>Data:</strong> gathering, filtering and deduplicating trillions of words, code and images, and creating high-quality examples for later training.</li>
          <li><strong>Post-training:</strong> turning the pretrained model into a helpful, honest and harmless assistant.</li>
          <li><strong>Evaluation:</strong> measuring capabilities, and testing for dangerous ones before release.</li>
          <li><strong>Safety and alignment research:</strong> making sure models do what their developers and users intend, and understanding how they work inside.</li>
        </ul>
      </Definition>

      <p>
        The three tracks of this curriculum map onto this list. The mathematics track underlies the research and evaluation.
        The machine learning track covers pretraining, post-training, evaluation and alignment. The engineering track covers
        infrastructure: making models train and run fast and reliably at enormous scale.
      </p>

      <Example title="the cost of one turn of the loop">
        <p>
          A frontier training run uses on the order of <em>10<sup>25</sup></em> or more arithmetic operations. A single
          modern accelerator chip does very roughly <em>10<sup>15</sup></em> useful operations a second, so the run needs about{" "}
          <em>10<sup>10</sup></em> chip-seconds: about ten thousand chips working for twelve days, or four thousand for a month. Most of the lab&rsquo;s budget goes
          on compute like this, for training, for experiments, and for serving the model to users.
        </p>
      </Example>

      <Remark title="why the stakes are high">
        <p>
          A model that can write code, analyse documents and reason through problems can be put to good and bad uses. Frontier
          labs publish policies saying which capabilities they test for before release and what safeguards they require. They
          are also studied and questioned by governments, academics and the public. Understanding the technology well is the
          first requirement for taking part in those decisions, from inside a lab or outside it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "match",
      rung: "check",
      prompt: <p>Keeping ten thousand accelerators working together on one training run for months is mainly whose job?</p>,
      answer: { kind: "choice", options: ["Infrastructure engineering", "Evaluation", "Data collection"], correct: [0] },
    },
    {
      key: "small",
      rung: "check",
      prompt: <p>Why do researchers test new ideas on small models first?</p>,
      answer: {
        kind: "choice",
        options: ["Small runs are cheap, and scaling laws let results be extrapolated", "Small models are always more capable", "Large models cannot be trained"],
        correct: [0],
      },
    },
    {
      key: "chips",
      rung: "apply",
      prompt: (
        <p>
          A run needs <em>3 &times; 10<sup>24</sup></em> operations. Each chip does <em>10<sup>15</sup></em> operations a
          second, and 1,000 chips are used. How many days does the run take, to the nearest day? (A day has 86,400 seconds.)
        </p>
      ),
      answer: { kind: "numeric", value: 35, tolerance: 0.02 },
    },
    {
      key: "track",
      rung: "apply",
      prompt: <p>Making a trained model answer users faster and more cheaply belongs mostly to which track of this curriculum?</p>,
      answer: { kind: "choice", options: ["Mathematics", "Machine learning", "ML engineering"], correct: [2] },
    },
    {
      key: "loop",
      rung: "apply",
      prompt: <p>Put these in the order of the lab loop: evaluate, research, deploy, scale. Which comes second?</p>,
      answer: { kind: "choice", options: ["Evaluate", "Research", "Deploy", "Scale"], correct: [3] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`params, tokens = 7e9, 2e12
print(f"{6 * params * tokens:.1e}")`}</Code>
          <p>Training compute is about 6 × parameters × tokens FLOPs. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["8.4e+22", "8.4e+21", "1.4e+22", "8.4e+23"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>train_days(params, tokens, gpus, flops_per_gpu, utilisation)</C>, the number of days to train using compute ≈ 6 × params × tokens, given each GPU&rsquo;s peak FLOP/s and the fraction of it actually used.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def train_days(params, tokens, gpus, flops_per_gpu, utilisation):
    return 6 * params * tokens / (gpus * flops_per_gpu)
`,
        solution: `def train_days(params, tokens, gpus, flops_per_gpu, utilisation):
    seconds = 6 * params * tokens / (gpus * flops_per_gpu * utilisation)
    return seconds / 86400
`,
        tests: [
          { name: "estimate", code: `d = train_days(7e9, 2e12, 1024, 1e15, 0.4)
assert abs(d - 6 * 7e9 * 2e12 / (1024 * 1e15 * 0.4) / 86400) < 1e-6 and 2 < d < 3, 'Divide by the effective FLOP/s, then convert seconds to days.'` },
        ],
      },
    },
    {
      key: "why-eval",
      rung: "prove",
      prompt: (
        <p>
          Explain why a lab evaluates a model for dangerous capabilities <em>before</em> deploying it rather than waiting to
          see how it is used, and why evaluations alone cannot guarantee safety.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that once a model is deployed to many users, harm can occur quickly and access is hard to withdraw.",
          "Explains that evaluations let the lab decide on safeguards or delay release in advance.",
          "Notes that evaluations only test what someone thought to test, and real users find new uses and failures.",
          "Concludes that evaluation must be combined with monitoring and the ability to respond after deployment.",
        ],
      },
    },
    {
      key: "power",
      rung: "stretch",
      prompt: (
        <p>
          Ten thousand chips each draw about 1,000 watts for 30 days. How much energy is that, in gigawatt-hours? (Energy in
          watt-hours is power in watts times hours.)
        </p>
      ),
      answer: { kind: "numeric", value: 7.2 },
    },
  ],

  teachBack:
    "Explain to a friend what a frontier AI lab does, walking through the loop from research to deployment and naming the kinds of people each stage needs.",

  glimpse: (
    <p>
      Next, a closer look at the three stages a model passes through: pretraining, post-training and deployment. The
      engineering of giant runs is the subject of Distributed Training and Large-Scale Training Operations; evaluation has a
      course of its own, Evaluation and the Science of Deep Learning; and AI Safety and Alignment Research covers the work of
      making models do what we intend.
    </p>
  ),
};
