import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ThinningViz } from "@/components/viz/ThinningViz";
import type { LessonContent } from "@/lib/types";

const PP = `import numpy as np

def arrivals_gaps(rng, rate, T):
    t, out = 0.0, []
    while True:
        t += rng.exponential(1 / rate)
        if t > T:
            return np.array(out)
        out.append(t)

def arrivals_uniform(rng, rate, T):
    return np.sort(rng.uniform(0, T, size=rng.poisson(rate * T)))

def counts(times, edges):
    return np.histogram(times, bins=edges)[0]`;

const TH = `import numpy as np

def thinning(rng, lam, lam_max, T):
    t = np.sort(rng.uniform(0, T, size=rng.poisson(lam_max * T)))
    return t[rng.uniform(0, lam_max, size=len(t)) < lam(t)]

def covering_gap(times, s):
    k = np.searchsorted(times, s)
    return float(times[k] - times[k - 1]) if 0 < k < len(times) else None`;

export const lesson: LessonContent = {
  id: "m13.5.1",
  minutes: 55,
  links: {
    requires: ["m7.2.2"],
    revisits: ["m13.2.2", "m7.3.2"],
    foreshadows: ["m13.5.2"],
  },

  puzzle: (
    <>
      <p>
        Buses arrive at random, on average every ten minutes. You turn up at a random time. How long should you expect to
        wait? Five minutes seems obvious, half the average gap. Yet if the arrivals are truly random the answer is ten, and the
        gap you land in averages twenty. Nothing is wrong with the arithmetic; the question is which gap you are averaging
        over.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The Poisson process is the model of events that happen completely at random in time: emails, radioactive decays,
        customers, spikes from a neuron. It can be described three ways that turn out to be the same: independent Poisson
        counts in disjoint intervals, independent exponential gaps, or a Poisson number of points scattered uniformly. Each
        description makes a different calculation easy. Because points never interact, Poisson processes can be added
        together, randomly thinned, and given a time-varying rate, and they remain Poisson.
      </p>
      <ThinningViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Poisson process">
        <p>
          A counting process N(t) is a Poisson process with rate λ if N(0) = 0, the increments over disjoint intervals are
          independent, and <M>{"N(t) - N(s) \\sim \\mathrm{Poisson}(\\lambda(t - s))"}</M> for s &lt; t. Write{" "}
          <M>{"S_1 < S_2 < \\dots"}</M> for the arrival times.
        </p>
      </Definition>

      <Theorem title="exponential gaps">
        <p>
          The gaps <M>{"S_1, S_2 - S_1, S_3 - S_2, \\dots"}</M> are independent Exponential(λ) random variables. Conversely,
          partial sums of independent Exponential(λ) gaps form a Poisson process.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"P(S_1 > t) = P(N(t) = 0) = e^{-\\lambda t}"}</M>, so <M>{"S_1"}</M> is exponential. Given{" "}
          <M>{"S_1 = s"}</M>, the process after s depends only on increments after s, which are independent of what happened
          before and have the same law as the original process; so the next gap is again exponential and independent. (Making
          this conditioning rigorous is the strong Markov property.) The converse follows by computing the joint law of counts
          from the gaps; the memorylessness of the exponential is what makes the counts in disjoint intervals independent.
        </p>
      </Proof>

      <Theorem title="uniform scattering">
        <p>
          Conditional on N(T) = n, the arrival times in [0, T] are distributed as the order statistics of n independent
          Uniform(0, T) variables.
        </p>
      </Theorem>
      <Proof>
        <p>
          For <M>{"0 < t_1 < \\dots < t_n < T"}</M>, the probability of one arrival in each{" "}
          <M>{"[t_i, t_i + dt_i]"}</M> and none elsewhere is, by the exponential gaps,{" "}
          <M>{"\\lambda^n e^{-\\lambda T}dt_1\\cdots dt_n"}</M>. Dividing by{" "}
          <M>{"P(N(T) = n) = e^{-\\lambda T}(\\lambda T)^n/n!"}</M> gives the constant density <M>{"n!/T^n"}</M> on the ordered
          region, which is the density of sorted uniforms. So one can simulate by drawing a Poisson count and scattering
          uniformly, as the code does.
        </p>
        <Code>{PP}</Code>
      </Proof>

      <Theorem title="superposition, thinning and varying rates">
        <p>
          The sum of independent Poisson processes with rates <M>{"\\lambda_1, \\lambda_2"}</M> is Poisson with rate{" "}
          <M>{"\\lambda_1 + \\lambda_2"}</M>. Keeping each point of a rate-<M>{"\\lambda^*"}</M> process at time t independently
          with probability <M>{"\\lambda(t)/\\lambda^*"}</M> gives an inhomogeneous Poisson process: counts in disjoint intervals
          are independent and <M>{"N(I) \\sim \\mathrm{Poisson}(\\int_I \\lambda(t)\\,dt)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Superposition: independent increments are preserved, and a sum of independent Poisson counts is Poisson with the
          summed mean. Thinning: given that an interval I holds n candidates, they are uniform on I and each is kept with
          probability <M>{"p = \\int_I\\lambda/(\\lambda^*|I|)"}</M>, so the kept count is a Poisson(<M>{"\\lambda^*|I|"}</M>)
          mixture of Binomial(n, p), which is Poisson(<M>{"\\lambda^*|I|p"}</M>). This is rejection sampling from the earlier
          lesson, applied to a whole process at once.
        </p>
        <Code>{TH}</Code>
      </Proof>

      <Example title="the inspection paradox">
        <p>
          Fix a time s far from 0. Looking backwards from s, the time since the last arrival is Exponential(λ), by the same
          argument as for the forward wait, which is also Exponential(λ). So the gap containing s has mean 2/λ, twice the
          typical gap. Long gaps cover more of the time axis, so a random time is more likely to fall in one: the covering gap
          has the size-biased density <M>{"\\lambda^2xe^{-\\lambda x}"}</M>, proportional to x times the gap density. The bus
          rider waits ten minutes, not five.
        </p>
      </Example>

      <Remark title="where Poisson processes appear">
        <p>
          A continuous-time Markov chain holds in each state for an exponential time, and simulating one by racing exponential
          clocks is the Gillespie algorithm. Spatial Poisson processes model scattered points in the plane, and the Poisson
          limit of rare events from the earlier lesson is the reason the model fits so many count phenomena. When events excite
          further events, as with earthquakes, retweets or neural spikes, the rate depends on the past and one moves to Hawkes
          and other point processes.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "none",
      rung: "check",
      prompt: <p>Calls arrive as a Poisson process at 3 per hour. What is the probability of no calls in a given half hour?</p>,
      answer: { kind: "numeric", value: 0.2231, tolerance: 0.0005 },
    },
    {
      key: "cond",
      rung: "check",
      prompt: <p>Given exactly 4 arrivals in [0, 10], what is the expected number in [0, 2.5]?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "bus",
      rung: "apply",
      prompt: <p>Buses form a Poisson process with 6 per hour. You arrive at a random time. What is your expected wait?</p>,
      answer: {
        kind: "choice",
        options: [
          "10 minutes, because the remaining wait is exponential with mean 1/λ whatever has happened before",
          "5 minutes, half the mean gap",
          "20 minutes, the mean of the gap you land in",
          "It depends on when the last bus came",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def arrivals_gaps(rng, rate, T):
    t, out = 0.0, []
    while True:
        t += rng.exponential(1 / rate)
        if t > T:
            return np.array(out)
        out.append(t)

def arrivals_uniform(rng, rate, T):
    return np.sort(rng.uniform(0, T, size=rng.poisson(rate * T)))

def counts(times, edges):
    return np.histogram(times, bins=edges)[0]

rng = np.random.default_rng(0); n = [len(arrivals_gaps(rng, 2.0, 5.0)) for _ in range(20000)]; m = [len(arrivals_uniform(rng, 2.0, 5.0)) for _ in range(20000)]
print(abs(np.mean(n) - 10) < 0.15, abs(np.var(m) - 10) < 0.5)
print(counts(np.array([0.2, 0.7, 1.1, 2.9, 3.0]), [0, 1, 2, 3]).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True True\n[2, 1, 2]", "True True\n[2, 1, 1]", "True False\n[2, 1, 2]", "True True\n[2, 1, 1, 1]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def thinning(rng, lam, lam_max, T):
    t = np.sort(rng.uniform(0, T, size=rng.poisson(lam_max * T)))
    return t[rng.uniform(0, lam_max, size=len(t)) < lam(t)]

def covering_gap(times, s):
    k = np.searchsorted(times, s)
    return float(times[k] - times[k - 1]) if 0 < k < len(times) else None

t = np.array([1.0, 2.0, 6.0, 7.0]); print(covering_gap(t, 4.5), covering_gap(t, 1.5), covering_gap(t, 8.0))
lam = lambda t: 2 + 1.5 * np.sin(2 * np.pi * t / 5); x = [len(thinning(np.random.default_rng(s), lam, 3.5, 10.0)) for s in range(4000)]; print(abs(np.mean(x) - 20) < 0.3)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["4.0 1.0 None\nTrue", "4.0 1.0 1.0\nTrue", "2.0 1.0 None\nTrue", "4.0 1.0 None\nFalse"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>arrivals_gaps(rng, rate, T)</C>, building arrival times in [0, T] from exponential gaps;{" "}
          <C>arrivals_uniform(rng, rate, T)</C>, using a Poisson count and sorted uniforms; and <C>counts(times, edges)</C>,
          the number of arrivals in each bin.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def arrivals_gaps(rng, rate, T):
    return np.array([])

def arrivals_uniform(rng, rate, T):
    return np.array([])

def counts(times, edges):
    return np.zeros(len(edges) - 1, dtype=int)
`,
        solution: PP,
        tests: [
          { name: "gaps", code: `rng = np.random.default_rng(5); L = [arrivals_gaps(rng, 2.0, 5.0) for _ in range(4000)]; n = [len(x) for x in L]
assert abs(np.mean(n) - 10) < 0.3 and abs(np.mean([len(x) == 0 or x[0] > 0.5 for x in L]) - np.exp(-1)) < 0.03 and all(np.all(np.diff(x) > 0) and (len(x) == 0 or x[-1] <= 5) for x in L)` },
          { name: "uniform", code: `rng = np.random.default_rng(6); n = [len(arrivals_uniform(rng, 2.0, 5.0)) for _ in range(4000)]
assert abs(np.mean(n) - 10) < 0.3 and abs(np.var(n) - 10) < 1.0 and counts(np.array([0.2, 0.7, 1.1, 2.9, 3.0]), [0, 1, 2, 3]).tolist() == [2, 1, 2]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>thinning(rng, lam, lam_max, T)</C>, returning sorted arrival times of a Poisson process with rate function{" "}
          <C>lam</C> bounded by <C>lam_max</C>, and <C>covering_gap(times, s)</C>, the length of the gap between arrivals that
          contains s, or None if s is before the first or after the last arrival.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def thinning(rng, lam, lam_max, T):
    return np.array([])

def covering_gap(times, s):
    return None
`,
        solution: TH,
        tests: [
          { name: "thin", code: `m = [len(thinning(np.random.default_rng(s), lambda t: t, 4.0, 4.0)) for s in range(3000)]; y = thinning(np.random.default_rng(1), lambda t: t, 4.0, 4.0)
assert abs(np.mean(m) - 8) < 0.25 and np.all(np.diff(y) > 0) and y.min() >= 0 and y.max() <= 4` },
          { name: "gap", code: `t = np.array([0.5, 3.0, 3.5, 9.0]); assert covering_gap(t, 1.0) == 2.5 and covering_gap(t, 5.0) == 5.5 and covering_gap(t, 0.1) is None` },
        ],
      },
    },
    {
      key: "area",
      rung: "stretch",
      prompt: <p>For the rate λ(t) = 2 + 1.5 sin(2πt/5), what is the expected number of arrivals in [0, 1.25]?</p>,
      answer: { kind: "numeric", value: 3.6937, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        A Poisson process jumps by one at random times. Let the jumps become small and frequent, with random signs, and in the
        limit the path becomes continuous yet nowhere smooth: Brownian motion, the subject of the next lesson.
      </p>
    </>
  ),
};
