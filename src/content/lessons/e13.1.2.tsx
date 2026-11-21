import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HierAllReduceViz } from "@/components/viz/HierAllReduceViz";
import type { LessonContent } from "@/lib/types";

const COLLECTIVE = `def ring_allreduce_time(n, size, bw, lat):
    return 2 * (n - 1) / n * size / bw + 2 * (n - 1) * lat   # reduce-scatter then all-gather

def hierarchical_allreduce(nodes, per_node, size, bw_intra, bw_inter, lat):
    inside = 2 * (per_node - 1) / per_node * size / bw_intra + 2 * (per_node - 1) * lat
    across = ring_allreduce_time(nodes, size / per_node, bw_inter, lat)  # each GPU's shard on its own NIC
    return inside + across

def best_allreduce(nodes, per_node, size, bw_intra, bw_inter, lat):
    flat = ring_allreduce_time(nodes * per_node, size, bw_inter, lat)  # a flat ring is limited by its slowest link
    hier = hierarchical_allreduce(nodes, per_node, size, bw_intra, bw_inter, lat)
    return "hierarchical" if hier < flat else "flat"`;

const FABRIC = `def fat_tree_hosts(k):
    return k ** 3 // 4                                     # k pods of k/2 edge switches with k/2 hosts each

def oversubscription(down_ports, up_ports):
    return down_ports / up_ports

def bisection_bw(hosts, link_bw, oversub):
    return hosts / 2 * link_bw / oversub                   # half the hosts sending to the other half`;

export const lesson: LessonContent = {
  id: "e13.1.2",
  minutes: 45,
  links: {
    requires: ["e13.1.1", "e10.7.2"],
    revisits: ["e10.2.1", "e10.4.1"],
    foreshadows: ["e13.1.3", "e13.4.1"],
  },

  puzzle: (
    <>
      <p>
        A cluster has eight GPUs per node joined by links carrying hundreds of gigabytes per second, and nodes joined by
        a network where each GPU gets about fifty. Two teams measure the time to all-reduce the same gradients across 128
        GPUs and get answers that differ by a factor of four. Both used a correct algorithm. What did the faster team
        know about the cluster that the slower one ignored?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A training cluster is a hierarchy of links: very fast inside a node, slower between nodes in the same rack or
        network pod, and slowest across the whole building if the network is oversubscribed. A collective is only as
        fast as the slowest link it must cross with all its data. Algorithms that respect the hierarchy do the heavy
        reduction over the fast links and send only small shards across the slow ones, and parallelism layouts follow the
        same rule: tensor parallelism inside a node, data parallelism across nodes, as in e10.7.2.
      </p>
      <HierAllReduceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the parts of a cluster">
        <p>
          Inside a node, GPUs connect through NVLink and NVSwitch at hundreds of gigabytes per second each. Each GPU
          usually has its own network card, at 400 gigabits (50 gigabytes) per second for current InfiniBand or RoCE, and
          in a rail-optimised design the card of GPU i in every node connects to the same leaf switch, so GPUs with the
          same index talk in one hop. Leaf switches connect through spine switches in a fat tree. If each leaf has more
          downlinks than uplinks, the network is oversubscribed by their ratio (<C>oversubscription</C>), and traffic
          that crosses the spine gets a fraction of full speed.
        </p>
      </Definition>

      <Theorem title="fat trees and bisection bandwidth">
        <p>
          A three-level fat tree built from k-port switches connects <M>{"k^3/4"}</M> hosts (<C>fat_tree_hosts</C>) with
          full bisection bandwidth: any half of the hosts can send to the other half at full link rate. With
          oversubscription s, the bisection bandwidth of h hosts with links of rate b is <M>{"hb/(2s)"}</M>{" "}
          (<C>bisection_bw</C>).
        </p>
        <Code>{FABRIC}</Code>
      </Theorem>
      <Proof>
        <p>
          The tree has k pods. Each pod has k/2 edge switches, each using k/2 ports for hosts and k/2 for uplinks to the
          pod&apos;s k/2 aggregation switches, so a pod holds <M>{"(k/2)^2"}</M> hosts and the network{" "}
          <M>{"k \\cdot k^2/4 = k^3/4"}</M>. Every switch has as many uplinks as downlinks, and the <M>{"(k/2)^2"}</M>{" "}
          core switches give each pod <M>{"(k/2)^2"}</M> links upwards, one per host, so any cut between two halves
          of the hosts is crossed by at least as many links as hosts on one side, which is full bisection bandwidth
          (Al-Fares and colleagues, 2008). Oversubscription s means only 1/s as many links cross the cut.
        </p>
      </Proof>

      <Theorem title="hierarchical all-reduce">
        <p>
          A ring all-reduce of B bytes over n GPUs with per-link bandwidth β and per-step latency α takes{" "}
          <M>{"2\\frac{n-1}{n}\\frac{B}{\\beta} + 2(n-1)\\alpha"}</M> (<C>ring_allreduce_time</C>), and a flat ring over m
          nodes of g GPUs is limited by the network bandwidth. Reducing inside each node first, then all-reducing each
          GPU&apos;s shard of size B/g across nodes on its own network card, then gathering inside the node, takes
        </p>
        <MD>{"2\\frac{g-1}{g}\\frac{B}{\\beta_{\\text{node}}} + 2\\frac{m-1}{m}\\frac{B/g}{\\beta_{\\text{net}}}"}</MD>
        <p>
          plus latency (<C>hierarchical_allreduce</C>), so the network part shrinks by about a factor of g{" "}
          (<C>best_allreduce</C>).
        </p>
        <Code>{COLLECTIVE}</Code>
      </Theorem>
      <Proof>
        <p>
          In the ring, each of the n − 1 reduce-scatter steps and n − 1 all-gather steps sends a chunk of B/n bytes
          over every link at once, giving <M>{"2(n-1)B/(n\\beta)"}</M> and 2(n − 1) latencies; a flat ring over nodes has
          some links on the network, and every step waits for them. In the hierarchical scheme the intra-node
          reduce-scatter and all-gather are rings of g over fast links, together <M>{"2\\frac{g-1}{g}B/\\beta_{node}"}</M>.
          After the reduce-scatter each GPU holds a distinct shard of B/g bytes, and the g shards are all-reduced across
          nodes in parallel on g separate cards, each a ring of m with time{" "}
          <M>{"2\\frac{m-1}{m}\\frac{B/g}{\\beta_{net}}"}</M>. Libraries such as NCCL choose between rings, trees and such
          hierarchies from the measured topology.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          With sixteen nodes of eight GPUs, 20 GB of gradients, 450 GB/s inside nodes and 50 GB/s per network card, a flat
          ring takes about 0.79 s, all at network speed, while the hierarchical scheme takes about 0.17 s, as the viz
          shows: the slower team treated the cluster as flat.
        </p>
      </Example>

      <Remark title="topology in the plan">
        <p>
          Record in the run plan the node size, the intra-node and per-GPU network bandwidth, the oversubscription, and
          which GPUs share a leaf switch. Place tensor and expert parallelism, which communicate every layer, inside nodes;
          pipeline stages, which send activations, along rails; and data parallelism, which communicates once per step and
          can overlap with compute as in e10.2.2, across the widest span. A job scheduler that scatters a job across racks
          can silently cost a large share of the planned MFU, and so can one bad cable, a failure mode e13.4.1 returns to.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ring",
      rung: "check",
      prompt: (
        <p>
          How long does a ring all-reduce of 10 GB take across 64 GPUs over 50 GB/s links, ignoring latency? Give four
          decimals in seconds.
        </p>
      ),
      answer: { kind: "numeric", value: 0.3938, tolerance: 0.0005 },
    },
    {
      key: "bisect",
      rung: "check",
      prompt: (
        <p>
          A fabric connects 1024 hosts with 50 GB/s links and 2:1 oversubscription. What is its bisection bandwidth in
          GB/s?
        </p>
      ),
      answer: { kind: "numeric", value: 12800, tolerance: 0.5 },
    },
    {
      key: "place",
      rung: "apply",
      prompt: <p>Which parallelism should normally be placed within a node?</p>,
      answer: {
        kind: "choice",
        options: [
          "Tensor parallelism, which communicates in every layer",
          "Data parallelism, which communicates once per step",
          "Pipeline parallelism across many stages",
          "None; placement does not affect speed",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ring_allreduce_time(n, size, bw, lat):
    return 2 * (n - 1) / n * size / bw + 2 * (n - 1) * lat   # reduce-scatter then all-gather

def hierarchical_allreduce(nodes, per_node, size, bw_intra, bw_inter, lat):
    inside = 2 * (per_node - 1) / per_node * size / bw_intra + 2 * (per_node - 1) * lat
    across = ring_allreduce_time(nodes, size / per_node, bw_inter, lat)  # each GPU's shard on its own NIC
    return inside + across

def best_allreduce(nodes, per_node, size, bw_intra, bw_inter, lat):
    flat = ring_allreduce_time(nodes * per_node, size, bw_inter, lat)  # a flat ring is limited by its slowest link
    hier = hierarchical_allreduce(nodes, per_node, size, bw_intra, bw_inter, lat)
    return "hierarchical" if hier < flat else "flat"

print(round(ring_allreduce_time(4, 8, 2, 0), 3), round(ring_allreduce_time(4, 8, 2, 0.5), 3))
print(round(hierarchical_allreduce(2, 4, 8, 8, 2, 0), 3), best_allreduce(2, 4, 8, 8, 2, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["6.0 9.0\n2.5 hierarchical", "6.0 7.5\n2.5 hierarchical", "6.0 9.0\n7.0 flat", "8.0 11.0\n2.5 hierarchical"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def fat_tree_hosts(k):
    return k ** 3 // 4                                     # k pods of k/2 edge switches with k/2 hosts each

def oversubscription(down_ports, up_ports):
    return down_ports / up_ports

def bisection_bw(hosts, link_bw, oversub):
    return hosts / 2 * link_bw / oversub                   # half the hosts sending to the other half

print(fat_tree_hosts(4), fat_tree_hosts(48), oversubscription(32, 16))
print(bisection_bw(16, 100, 1), bisection_bw(16, 100, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "16 27648 2.0\n800.0 400.0",
          "16 27648 0.5\n800.0 1600.0",
          "64 110592 2.0\n800.0 400.0",
          "16 27648 2.0\n1600.0 800.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ring_allreduce_time(n, size, bw, lat)</C>;{" "}
          <C>hierarchical_allreduce(nodes, per_node, size, bw_intra, bw_inter, lat)</C>, with a ring of per_node GPUs
          inside nodes for the reduce-scatter and all-gather and a ring of nodes on shards of size/per_node; and{" "}
          <C>best_allreduce(...)</C>, returning &quot;hierarchical&quot; if it beats a flat ring of all GPUs at the
          inter-node bandwidth, else &quot;flat&quot;.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ring_allreduce_time(n, size, bw, lat):
    return size / bw

def hierarchical_allreduce(nodes, per_node, size, bw_intra, bw_inter, lat):
    return size / bw_intra

def best_allreduce(nodes, per_node, size, bw_intra, bw_inter, lat):
    return "flat"
`,
        solution: COLLECTIVE,
        tests: [
          { name: "ring", code: `assert abs(ring_allreduce_time(2, 4, 2, 0) - 2) < 1e-12 and abs(ring_allreduce_time(5, 10, 1, 0.1) - 16.8) < 1e-12 and ring_allreduce_time(1, 9, 1, 1) == 0` },
          { name: "hier", code: `assert abs(hierarchical_allreduce(4, 2, 16, 4, 1, 0) - 16) < 1e-12 and best_allreduce(4, 2, 16, 4, 1, 0) == "hierarchical" and best_allreduce(4, 2, 16, 1, 100, 0) == "flat"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fat_tree_hosts(k)</C>, <C>oversubscription(down_ports, up_ports)</C> and{" "}
          <C>bisection_bw(hosts, link_bw, oversub)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def fat_tree_hosts(k):
    return k * k

def oversubscription(down_ports, up_ports):
    return up_ports / down_ports

def bisection_bw(hosts, link_bw, oversub):
    return hosts * link_bw
`,
        solution: FABRIC,
        tests: [
          { name: "tree", code: `assert fat_tree_hosts(8) == 128 and fat_tree_hosts(64) == 65536 and oversubscription(48, 16) == 3` },
          { name: "bisect", code: `assert bisection_bw(100, 10, 1) == 500 and bisection_bw(100, 10, 4) == 125` },
        ],
      },
    },
    {
      key: "hier",
      rung: "stretch",
      prompt: (
        <p>
          Eight nodes of eight GPUs all-reduce 10 GB with 900 GB/s inside nodes and 25 GB/s per network card. How long
          does the hierarchical scheme take, ignoring latency? Give four decimals in seconds.
        </p>
      ),
      answer: { kind: "numeric", value: 0.1069, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Bandwidth figures on a datasheet are not what a job will see. The next lesson is about proxy runs: short,
        cheap runs that measure throughput, memory and stability on the real cluster before the main run begins.
      </p>
    </>
  ),
};
