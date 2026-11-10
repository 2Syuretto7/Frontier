import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { PipelineViz } from "@/components/viz/PipelineViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.5.2",
  minutes: 50,
  links: {
    revisits: ["l0.2.4", "l0.2.5"],
    foreshadows: ["l8.1.1", "l9.1.1", "e12.1.1"],
  },

  puzzle: (
    <>
      <p>
        A model has read a large share of all the text on the public internet and can predict the next word of almost any
        document remarkably well. You type to it: &ldquo;How do I make my bread rise more?&rdquo;
      </p>
      <p>
        Predict what it writes back. Is it likely to answer you? What kind of document on the internet starts with a
        question like that, and what usually comes next?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A model trained only to continue text treats your message as the start of a document. On the web, a question is
        often followed by more questions, or by the start of an article, or by a forum thread. So the raw model continues the
        document; it does not reply. Turning a text predictor into an assistant takes more training.
      </p>
      <p>
        Below, the same prompt is answered at three stages of training. The replies are written to illustrate each stage.
      </p>
      <PipelineViz />
      <p>
        The base model already &ldquo;knows&rdquo; a great deal about bread. The later stages do not add much knowledge; they
        change what the model does with it: answer the question, be specific, ask when unsure, decline when it should.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="pretraining">
        <p>
          <strong>Pretraining</strong> trains a large network to predict the next piece of text, called a{" "}
          <strong>token</strong> (a word or part of a word), over trillions of tokens of web pages, books, code and other
          data. It uses the overwhelming majority of the compute and produces a <strong>base model</strong> with broad
          knowledge and skill, but no particular wish to help.
        </p>
      </Definition>

      <Definition title="post-training">
        <p>
          <strong>Post-training</strong> shapes the base model into an assistant. It typically includes:
        </p>
        <ul>
          <li>
            <strong>Supervised fine-tuning:</strong> further training on example conversations showing good assistant
            behaviour.
          </li>
          <li>
            <strong>Reinforcement learning from feedback:</strong> the model writes several replies, the replies are compared
            by people or by models following written principles, and the model is trained to produce replies like the
            preferred ones.
          </li>
        </ul>
      </Definition>

      <Definition title="deployment">
        <p>
          <strong>Deployment</strong> makes the model available to users, through apps and through an API that other
          programs call. Serving millions of users quickly and cheaply is a large engineering problem in itself, and
          deployment also includes monitoring how the model is used and guarding against misuse.
        </p>
      </Definition>

      <Example title="where the compute goes">
        <p>
          Pretraining a frontier model can take months on thousands of chips. Post-training is far smaller in compute but
          very large in care: the data must be designed, and the feedback must reward what we actually want. Deployment
          costs grow with every user, and across a model&rsquo;s life, serving it can cost as much as training it.
        </p>
      </Example>

      <Remark title="the reward is a proxy">
        <p>
          Reinforcement learning from feedback optimises what graders prefer, which is only a proxy for what is good. If graders
          tend to like confident, agreeable answers, the model can learn to sound confident and agree with the user even when
          the user is wrong. This tendency, called <em>sycophancy</em>, is a real and studied failure. Designing feedback that
          rewards honesty rather than its appearance is one of the main problems of alignment.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "stage",
      rung: "check",
      prompt: <p>Which stage uses by far the most compute?</p>,
      answer: { kind: "choice", options: ["Pretraining", "Supervised fine-tuning", "Reinforcement learning from feedback"], correct: [0] },
    },
    {
      key: "base",
      rung: "check",
      prompt: <p>A base model is trained to do what?</p>,
      answer: { kind: "choice", options: ["Predict the next token of text", "Follow instructions", "Refuse harmful requests"], correct: [0] },
    },
    {
      key: "tokens",
      rung: "apply",
      prompt: (
        <p>
          A tokeniser splits English text into about 1.3 tokens per word. Roughly how many tokens is a 90,000-word book? Give
          the answer in thousands.
        </p>
      ),
      answer: { kind: "numeric", value: 117 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Select every activity that belongs to post-training.</p>,
      answer: {
        kind: "choice",
        options: ["Training on example assistant conversations", "Filtering a web crawl for the main training run", "Training on comparisons between pairs of replies", "Building servers to answer users quickly"],
        correct: [0, 2],
      },
    },
    {
      key: "serve",
      rung: "apply",
      prompt: (
        <p>
          A model costs &#8377;400 crore to train. Serving it costs &#8377;0.02 per reply, and it answers 50 crore replies a
          day. After how many days does the total serving cost equal the training cost?
        </p>
      ),
      answer: { kind: "numeric", value: 400 },
    },
    {
      key: "sycophancy",
      rung: "prove",
      prompt: (
        <p>
          Explain how training on human preferences could make a model agree with users who are wrong, and suggest one
          change to the feedback process that would reduce this.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that graders may prefer replies that agree with them or flatter them, even when those replies are less accurate.",
          "Explains that reinforcement learning increases whatever graders reward, so agreement gets reinforced over correctness.",
          "Suggests a concrete change, such as checking facts before rating, rating against written principles that value honesty, or including test cases where the user is deliberately wrong.",
        ],
      },
    },
    {
      key: "days",
      rung: "stretch",
      prompt: (
        <p>
          Pretraining processes 15 trillion tokens at a rate of 10 million tokens per second across the whole cluster. How many
          days does it take, to the nearest day?
        </p>
      ),
      answer: { kind: "numeric", value: 17, tolerance: 0.03 },
    },
  ],

  teachBack:
    "Explain to a friend the three stages that turn a text predictor into a deployed assistant, what each stage changes, and one way the feedback stage can go wrong.",

  glimpse: (
    <p>
      Next, the last lesson of this course: how to read claims about AI carefully. Pretraining Large Language Models,
      Post-Training and Alignment, and Inference, Serving and RL Infrastructure each take one of these three stages and
      teach it in full.
    </p>
  ),
};
