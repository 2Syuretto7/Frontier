import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AutoscaleViz } from "@/components/viz/AutoscaleViz";
import type { LessonContent } from "@/lib/types";

const ROUTE = `def least_loaded(loads):
    return min(range(len(loads)), key=lambda i: (loads[i], i))

def power_of_two(loads, i, j):
    return i if loads[i] <= loads[j] else j          # the caller samples i and j at random

def affinity_route(key, loads, slack):
    home = key % len(loads)                          # the same prefix goes to the same replica, whose cache holds it
    if loads[home] < slack * (sum(loads) + 1) / len(loads):
        return home
    return least_loaded(loads)                       # home is overloaded: give up the cache hit`;

const SCALE = `import math

def replicas_for(rate, per_replica, util):
    return math.ceil(rate / (per_replica * util))    # keep each replica at the target utilisation

def ready_series(desired, startup):
    # replicas are removed at once but take \`startup\` steps to start
    return [min(desired[max(t - startup, 0):t + 1]) for t in range(len(desired))]

def shortfall(rates, ready, per_replica):
    return sum(max(r - n * per_replica, 0) for r, n in zip(rates, ready))`;

export const lesson: LessonContent = {
  id: "e12.5.3",
  minutes: 50,
  links: {
    requires: ["e12.5.2", "e12.5.1"],
    revisits: ["e12.2.3", "e12.2.1"],
    foreshadows: ["e12.6.1"],
  },

  puzzle: (
    <>
      <p>
        A chat service runs many replicas behind a router that sends each request to a replica chosen at random. Every request starts
        with the same long system prompt, and prefix caching (e12.2.3) should make it nearly free, yet each replica keeps recomputing
        it. Switching to routing by a hash of the prompt fixes that, but then one replica, serving a popular prompt, is overwhelmed
        while others idle. During a morning burst the autoscaler adds replicas, but users see errors for several minutes anyway. What
        should the router and autoscaler do?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Load balancing for language models differs from that for web servers in two ways. Requests vary greatly in cost, so counting
        requests is a poor measure of load; replicas report queued tokens or cache usage instead. And replicas hold state, the prefix
        cache, so where a request goes affects how much work it needs. A good router sends a request to the replica that already has its
        prefix, unless that replica is much busier than average, in which case it gives up the cache hit. Autoscaling adds and removes
        replicas as demand changes, but a new replica must be scheduled on a GPU, load tens or hundreds of gigabytes of weights and warm
        up before it serves, so capacity lags demand. Headroom, the gap between target and full utilisation, absorbs bursts while new
        replicas start.
      </p>
      <AutoscaleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="routing">
        <p>
          <C>loads</C> lists each replica&apos;s current load. <C>least_loaded</C> picks the least loaded replica, breaking ties by
          index. <C>power_of_two</C> compares two replicas sampled at random and picks the less loaded, which needs only two load
          reports. <C>affinity_route</C> sends a request whose prefix hashes to <C>key</C> to replica <C>key % n</C>, unless that
          replica&apos;s load is at least <C>slack</C> times the mean load after this request arrives, in which case it falls back to the
          least loaded.
        </p>
        <Code>{ROUTE}</Code>
      </Definition>

      <Theorem title="bounded load with affinity">
        <p>
          Start with all loads zero and route m requests with <C>affinity_route</C>, slack <M>{"s \\ge 1"}</M>, over n replicas, with
          no request finishing. Then no replica&apos;s load exceeds <M>{"s\\,m/n + 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Consider the request that brings the total to j. If it goes to its home replica, that replica&apos;s load before was below{" "}
          <M>{"s\\,j/n"}</M>, so afterwards it is below <M>{"s\\,j/n + 1"}</M>. Otherwise it goes to the least loaded replica, whose load
          before was at most the mean <M>{"(j-1)/n"}</M>, so afterwards it is at most <M>{"j/n + 1 \\le s\\,j/n + 1"}</M>. Since{" "}
          <M>{"j \\le m"}</M> and loads change only when a request arrives, every load stays within <M>{"s\\,m/n + 1"}</M>. With s near
          1 the load is nearly even but prefixes often move; a larger s keeps more cache hits at the price of less even load.
        </p>
      </Proof>

      <Definition title="autoscaling">
        <p>
          <C>replicas_for</C> is the number of replicas that serve <C>rate</C> requests per second at utilisation <C>util</C> when each
          can serve <C>per_replica</C>. Given the replicas desired at each step, <C>ready_series</C> gives those ready to serve when
          removal is immediate and a new replica takes <C>startup</C> steps to start, assuming the initial fleet is ready.{" "}
          <C>shortfall</C> adds up the requests beyond the capacity of the ready replicas.
        </p>
        <Code>{SCALE}</Code>
      </Definition>

      <Theorem title="ready capacity is a sliding minimum">
        <p>
          If replicas are numbered in order of creation, the newest are removed first, and a replica requested at step u serves from
          step <M>{"u + d"}</M>, then the number ready at step t is <M>{"\\min_{t-d \\le u \\le t} D(u)"}</M>, where D is the number
          desired.
        </p>
      </Theorem>
      <Proof>
        <p>
          Replica k exists exactly while the desired number is at least k, since it is the k-th created and removing the newest first
          keeps replicas 1 to <M>{"D(u)"}</M>. So replica k is ready at t when it has existed continuously since step <M>{"t - d"}</M> or
          earlier, that is when <M>{"D(u) \\ge k"}</M> for every u from <M>{"t-d"}</M> to t. The largest such k is the minimum of D over
          that window. A fall in demand reduces capacity at once, but a rise takes d steps to appear, and a dip within any d steps delays
          capacity further, which is why autoscalers wait before scaling down.
        </p>
      </Proof>

      <Remark title="routing and scaling in practice">
        <p>
          Routers for language model fleets balance on queue length or KV cache usage reported by each engine, and cache-aware routers
          keep a tree of prefixes per replica, as in SGLang&apos;s router and similar systems. Autoscalers react to queue depth or latency
          rather than CPU use, and scale down slowly to avoid oscillation. Start-up is shortened by keeping weights on local disk or in
          host memory, streaming them in parallel, and keeping warm spare replicas; scaling to zero saves money only where minutes of cold
          start are acceptable.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Random routing spread each prompt across all replicas, so every cache missed. Hash routing kept hits but ignored load. Routing
          by prefix with a bound on load keeps most hits while no replica exceeds a fixed multiple of the mean. The errors in the burst
          came from start-up delay: capacity follows demand only after new replicas load their weights, so the fleet needs headroom, or
          faster start-up, to cover the gap.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "fleet",
      rung: "check",
      prompt: (
        <p>
          Traffic is 1,200 requests per second, each replica can serve 50 per second, and the target utilisation is 0.75. How many
          replicas does <C>replicas_for</C> ask for?
        </p>
      ),
      answer: { kind: "numeric", value: 32, tolerance: 0.001 },
    },
    {
      key: "window",
      rung: "check",
      prompt: (
        <p>
          The replicas desired over six steps are 2, 6, 6, 6, 3, 8, and start-up takes 2 steps. Summed over the six steps, how many
          replica-steps are ready?
        </p>
      ),
      answer: { kind: "numeric", value: 18, tolerance: 0.001 },
    },
    {
      key: "load_measure",
      rung: "apply",
      prompt: <p>Why do routers for language model servers measure load by queued tokens or cache usage rather than open requests?</p>,
      answer: {
        kind: "choice",
        options: [
          "Requests differ widely in prompt and output length, so equal request counts can mean very unequal work and memory",
          "Open requests cannot be counted while streaming",
          "Tokens are cheaper to send over the network than requests",
          "Cache usage is always proportional to the number of requests",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def least_loaded(loads):
    return min(range(len(loads)), key=lambda i: (loads[i], i))

def power_of_two(loads, i, j):
    return i if loads[i] <= loads[j] else j          # the caller samples i and j at random

def affinity_route(key, loads, slack):
    home = key % len(loads)                          # the same prefix goes to the same replica, whose cache holds it
    if loads[home] < slack * (sum(loads) + 1) / len(loads):
        return home
    return least_loaded(loads)                       # home is overloaded: give up the cache hit

loads = [3, 1, 4, 1]
print(least_loaded(loads), power_of_two(loads, 0, 2), affinity_route(6, loads, 1.25), affinity_route(7, loads, 1.25))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1 0 1 3", "1 2 2 3", "3 0 1 3", "1 0 2 1"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def replicas_for(rate, per_replica, util):
    return math.ceil(rate / (per_replica * util))    # keep each replica at the target utilisation

def ready_series(desired, startup):
    # replicas are removed at once but take \`startup\` steps to start
    return [min(desired[max(t - startup, 0):t + 1]) for t in range(len(desired))]

def shortfall(rates, ready, per_replica):
    return sum(max(r - n * per_replica, 0) for r, n in zip(rates, ready))

d = [replicas_for(r, 10, 0.8) for r in [30, 70, 20, 90, 90]]
print(d, ready_series(d, 1), shortfall([30, 70, 20, 90, 90], ready_series(d, 1), 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4, 9, 3, 12, 12] [4, 4, 3, 3, 12] 90",
          "[4, 9, 3, 12, 12] [4, 9, 3, 12, 12] 0",
          "[3, 8, 2, 11, 11] [3, 3, 2, 2, 11] 90",
          "[4, 9, 3, 12, 12] [4, 4, 9, 3, 12] 30",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>least_loaded(loads)</C>, <C>power_of_two(loads, i, j)</C>, preferring i on a tie, and{" "}
          <C>affinity_route(key, loads, slack)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def least_loaded(loads):
    return 0

def power_of_two(loads, i, j):
    return i

def affinity_route(key, loads, slack):
    return key % len(loads)
`,
        solution: ROUTE,
        tests: [
          { name: "pick", code: `assert least_loaded([5, 2, 7, 2]) == 1 and power_of_two([5, 2, 7], 0, 1) == 1 and power_of_two([5, 5], 1, 0) == 1` },
          { name: "affinity", code: `assert affinity_route(3, [9, 0, 0], 1.5) == 1 and affinity_route(5, [1, 2, 3], 1.5) == 2 and affinity_route(3, [0, 0, 0], 1.0) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>replicas_for(rate, per_replica, util)</C>, <C>ready_series(desired, startup)</C> and{" "}
          <C>shortfall(rates, ready, per_replica)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def replicas_for(rate, per_replica, util):
    return math.ceil(rate / per_replica)

def ready_series(desired, startup):
    return list(desired)

def shortfall(rates, ready, per_replica):
    return 0
`,
        solution: SCALE,
        tests: [
          { name: "fleet", code: `assert replicas_for(100, 10, 0.5) == 20 and replicas_for(1, 10, 0.5) == 1` },
          { name: "ready", code: `assert ready_series([1, 5, 5, 2, 4], 1) == [1, 1, 5, 2, 2] and ready_series([3, 1], 0) == [3, 1]\nassert shortfall([25, 5], [2, 0], 10) == 10` },
        ],
      },
    },
    {
      key: "burst",
      rung: "stretch",
      prompt: (
        <p>
          Traffic jumps at once from 400 to 1,000 requests per second and stays there. Each replica serves 50 per second, the target
          utilisation is 0.8, the autoscaler reacts every minute, and a new replica takes 3 minutes to start. How many requests arrive
          beyond capacity before the new replicas are ready?
        </p>
      ),
      answer: { kind: "numeric", value: 90000, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Serving fleets answer users, but reinforcement learning makes its own demand: a trainer needs millions of sampled responses to
        learn from. The final chapter turns the inference engine into a generator inside a training loop, starting with how rollouts are
        produced at scale.
      </p>
    </>
  ),
};
