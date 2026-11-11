import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { BanditViz } from "@/components/viz/BanditViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.2.5",
  minutes: 50,
  links: {
    parallels: ["m0.8.4"],
    foreshadows: ["l6.1.1", "l9.1.1"],
  },

  puzzle: (
    <>
      <p>
        You have just moved to a new town with three restaurants. You eat out once a week for a year. The first meal at
        each was fine, and the one at the corner café was best.
      </p>
      <p>
        Should you eat at the café every week from now on? If not, how often should you try the other two, and when should
        you stop trying?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        One good meal could be luck. If you always return to the café you may never find out that the place down the road is
        usually better. But every week spent trying the others is a week you might have eaten at the best place. This
        tension, between <em>exploiting</em> what you know and <em>exploring</em> to learn more, appears whenever you must
        act and learn at the same time.
      </p>
      <p>
        Below are three machines, each paying a coin with its own hidden chance. Play twenty times yourself, then let a simple
        strategy play: mostly choose the best machine so far, but sometimes choose at random.
      </p>
      <BanditViz />
      <p>
        Never exploring does surprisingly badly: whichever machine happened to pay first can trap you. Always exploring is
        no better than guessing. A little exploration, about one play in ten, collects the most.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="decision-making from experience">
        <p>
          In <strong>reinforcement learning</strong>, an <strong>agent</strong> repeatedly observes a situation, takes an{" "}
          <strong>action</strong>, and receives a <strong>reward</strong>, a number saying how good the outcome was. Nobody
          tells it the right action. It must learn, from rewards alone, a way of choosing actions that collects as much reward
          as possible over time.
        </p>
      </Definition>

      <p>
        This differs from classification and regression in two ways. The agent&rsquo;s own choices decide which data it
        sees: if it never plays machine A, it never learns about A. And rewards can arrive late: a chess move is good or bad
        because of a win or loss forty moves later.
      </p>

      <Definition title="the exploration and exploitation trade-off">
        <p>
          <strong>Exploiting</strong> means choosing the action that currently looks best. <strong>Exploring</strong> means
          choosing another, to improve the estimates. The strategy in the visualisation, explore with a small probability
          and exploit otherwise, is called <strong>epsilon-greedy</strong>, after the Greek letter usually used for that
          probability.
        </p>
      </Definition>

      <Example title="where it is used">
        <p>
          Programs that learned to play Go, chess and Atari games better than people; systems that cool data centres; and,
          most importantly for this course, the final stage of training an AI assistant, where the &ldquo;action&rdquo; is a
          whole reply and the &ldquo;reward&rdquo; comes from a judgement of how good that reply was.
        </p>
      </Example>

      <Remark title="getting what you reward">
        <p>
          An agent maximises the reward you wrote down, not the goal you had in mind. A program rewarded for points in a
          boat-racing game learned to circle forever collecting bonus items instead of finishing the race. This gap between
          the reward and the intention, often called <em>reward hacking</em>, is one of the core problems of AI safety.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "parts",
      rung: "check",
      prompt: <p>A thermostat that learns when to heat a house gets a reward for comfort and a penalty for energy used. What is the action?</p>,
      answer: { kind: "choice", options: ["The temperature reading", "Turning the heating on or off", "The comfort score"], correct: [1] },
    },
    {
      key: "explore",
      rung: "check",
      prompt: <p>With epsilon equal to 0.1, on what fraction of plays does the strategy choose a machine at random?</p>,
      answer: { kind: "numeric", value: 0.1 },
    },
    {
      key: "estimate",
      rung: "apply",
      prompt: <p>Machine B has paid 7 coins in 20 plays. What is your current estimate of its chance of paying?</p>,
      answer: { kind: "numeric", value: 0.35 },
    },
    {
      key: "expected",
      rung: "apply",
      prompt: (
        <p>
          The hidden chances are 0.35, 0.5 and 0.65. A strategy explores 10% of the time (choosing each machine equally
          often) and otherwise always plays the best machine, which it has already identified. What is its expected number of
          coins per play? Give a decimal to three places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.635 },
    },
    {
      key: "greedy",
      rung: "apply",
      prompt: <p>A greedy player tries each machine once. A pays, B and C do not. If it now never explores, which machine will it play for ever?</p>,
      answer: { kind: "choice", options: ["A", "B", "C", "It cannot be predicted"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`values = {"left": 0.2, "right": 0.7, "stay": 0.5}
eps_greedy = lambda explore: "stay" if explore else max(values, key=values.get)
print(eps_greedy(False), eps_greedy(True))`}</Code>
          <p>A decision-making agent mostly exploits, sometimes explores. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["right stay", "stay right", "right right", "left stay"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>bandit(probs, steps, eps, seed)</C>, an ε-greedy agent for a multi-armed bandit. Seed <C>random</C> with <C>seed</C>. Each step, with probability eps pick a random arm, otherwise the arm with the highest average reward so far (untried arms count as average 0, ties to the lowest index); pull it, getting reward 1 with probability <C>probs[arm]</C>. Return the list of pull counts per arm.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def bandit(probs, steps, eps, seed):
    return [steps] + [0] * (len(probs) - 1)
`,
        solution: `import random

def bandit(probs, steps, eps, seed):
    random.seed(seed)
    k = len(probs)
    pulls, wins = [0] * k, [0] * k
    for _ in range(steps):
        if random.random() < eps:
            a = random.randrange(k)
        else:
            avg = [wins[i] / pulls[i] if pulls[i] else 0 for i in range(k)]
            a = max(range(k), key=lambda i: (avg[i], -i))
        pulls[a] += 1
        wins[a] += random.random() < probs[a]
    return pulls
`,
        tests: [
          { name: "finds the best arm", code: `pulls = bandit([0.2, 0.5, 0.8], 3000, 0.1, 0)
assert sum(pulls) == 3000 and pulls.index(max(pulls)) == 2, 'Exploring lets the agent discover that arm 2 pays best.'` },
          { name: "explores", code: `pulls = bandit([0.2, 0.5, 0.8], 3000, 0.1, 0)
assert min(pulls) > 0, 'With eps > 0 every arm gets tried.'` },
        ],
      },
    },
    {
      key: "different",
      rung: "prove",
      prompt: (
        <p>
          Explain two ways in which learning from rewards differs from learning from labelled examples, using a game such as
          chess as your example.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that no one supplies the correct move: the agent sees only a reward such as winning or losing.",
          "Notes that rewards are delayed: a move's value shows up only at the end of the game, so credit must be assigned back to earlier moves.",
          "Or notes that the agent's own choices determine which positions, and so which data, it ever sees.",
        ],
      },
    },
    {
      key: "regret",
      rung: "stretch",
      prompt: (
        <p>
          The <em>regret</em> of a strategy is how many fewer coins it expects than always playing the best machine. For the
          strategy in the apply question, what is its regret over 1,000 plays?
        </p>
      ),
      answer: { kind: "numeric", value: 15 },
    },
  ],

  teachBack:
    "Explain to a friend the trade-off between exploring and exploiting, using restaurants in a new town, and why an agent trained on rewards can end up doing something you did not intend.",

  glimpse: (
    <p>
      This completes the tour of tasks. Next, learning by hand: you will be the learning algorithm, starting with fitting a
      line by eye. In Reinforcement Learning you will meet agents that plan over many steps, and in Post-Training and
      Alignment you will see reinforcement learning used to shape the behaviour of language models.
    </p>
  ),
};
