import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ComputeLedgerViz } from "@/components/viz/ComputeLedgerViz";
import type { LessonContent } from "@/lib/types";

const REPRO = `import hashlib, json

def config_hash(cfg):
    s = json.dumps(cfg, sort_keys=True)                    # key order must not change the hash
    return hashlib.sha256(s.encode()).hexdigest()[:12]

def diff_configs(a, b):
    return sorted(k for k in set(a) | set(b) if a.get(k, None) != b.get(k, None))

def manifest(runs):
    return {name: config_hash(cfg) for name, cfg in sorted(runs.items())}`;

const LEDGER = `def gpu_hours(runs):
    return sum(r["gpus"] * r["hours"] for r in runs)

def share_by_stage(runs):
    total, out = gpu_hours(runs), {}
    for r in runs:
        out[r["stage"]] = out.get(r["stage"], 0) + r["gpus"] * r["hours"] / total
    return out

def overhead(runs):
    return gpu_hours([r for r in runs if not r["kept"]]) / gpu_hours(runs)   # compute not in the final model's lineage`;

export const lesson: LessonContent = {
  id: "e15.5.4",
  minutes: 45,
  links: {
    requires: ["e15.5.3"],
    revisits: ["e15.1.1", "e13.6.1", "e13.6.2", "e11.8.4"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        The model exists, served and measured. Six months from now, someone, perhaps you, will want to know exactly which
        data it saw, which configuration produced it, what it cost, what it is good and bad at, and whether a result in
        the report can be reproduced. Most of that will be forgotten unless it is written down now, in a form others can
        check. What belongs in the technical report, and how can its claims be made verifiable?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The report is the design document of e15.1.1, completed. It states what was planned, what was done, and where
        they differ. Every run is identified by a hash of its full configuration, so a reader can tell which runs share a
        recipe and what changed between them. The compute ledger counts every GPU-hour, including the ladder, the
        ablations and the failures. Results come with the intervals of the evaluation report, and limitations are stated
        as plainly as the strengths.
      </p>
      <ComputeLedgerViz />
    </>
  ),

  theory: (
    <>
      <Definition title="configuration identity">
        <p>
          A configuration is serialised canonically, with keys sorted, and hashed; the first twelve hexadecimal digits
          name it (<C>config_hash</C>). Two runs differ in exactly the keys whose values differ, a missing key counting as
          None (<C>diff_configs</C>). The report&apos;s manifest maps each run name to its hash (<C>manifest</C>), and the
          code, data and tokeniser versions are part of each configuration, so the hash identifies everything that
          determined the run except hardware nondeterminism.
        </p>
        <Code>{REPRO}</Code>
      </Definition>

      <Theorem title="short hashes are safe for a project">
        <p>
          If a hash function behaves like a uniformly random function onto b-bit values, the probability that any two of
          n distinct configurations share a hash is at most <M>{"n(n-1)/2^{b+1}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each of the <M>{"n(n-1)/2"}</M> pairs of distinct configurations collides with probability <M>{"2^{-b}"}</M>,
          and by the union bound the probability that some pair collides is at most{" "}
          <M>{"n(n-1)/2 \\cdot 2^{-b} = n(n-1)/2^{b+1}"}</M>. Twelve hexadecimal digits give b = 48; for a thousand
          configurations the bound is about <M>{"10^6/(5.6 \\times 10^{14}) \\approx 2 \\times 10^{-9}"}</M>. A whole
          laboratory&apos;s millions of runs would need more digits, since the bound grows with the square of n.
        </p>
      </Proof>

      <Definition title="the compute ledger">
        <p>
          Each run records its stage, the number of GPUs, the hours and whether it is in the final model&apos;s lineage.
          The total is the sum of GPUs times hours (<C>gpu_hours</C>), broken down by stage (<C>share_by_stage</C>), and the
          overhead is the share spent on runs outside the lineage (<C>overhead</C>). Stating the overhead tells readers what
          reproducing the project from scratch would cost, which is more than reproducing the final run.
        </p>
        <Code>{LEDGER}</Code>
      </Definition>

      <Example title="the capstone report outline">
        <p>
          Summary with the headline results and their intervals. Design: goals, constraints and the final architecture.
          Data: sources, pipeline counts and the data card of e11.8.4. Tokeniser. Pretraining: the ladder&apos;s fit and
          prediction against the main run&apos;s loss, the schedule, incidents with their postmortems in the form of e13.6.1,
          and mid-training. Post-training: each stage&apos;s data and gains. Serving: measured throughput and cost.
          Evaluation: the tables and pre-registered comparisons. Interpretability findings. Limitations and risks. The
          manifest and the compute ledger. Like the public run logs studied in e13.6.2, it is most useful where it records
          what went wrong.
        </p>
      </Example>

      <Remark title="the end of the sequence">
        <p>
          This lesson closes the engineering track. A model in miniature has passed through every stage that a frontier
          model does: a plan with a budget and an evaluation plan, a corpus and tokeniser, a ladder and a main run,
          fine-tuning, preferences and reinforcement learning, serving, evaluation, interpretation and a report. The
          numbers at frontier scale are larger by many orders of magnitude, but the decisions, and the habits of measuring
          and writing them down, are the same.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "total",
      rung: "check",
      prompt: (
        <p>
          A project ran a ladder of 15 single-GPU hours, a main run of 8 GPUs for 11.5 hours, an earlier main run that
          crashed after 8 GPUs for 3 hours, mid-training on 8 GPUs for 2.5 hours, post-training on 4 GPUs for 6 hours, and
          evaluation on 2 GPUs for 3 hours. How many GPU-hours did it use in total?
        </p>
      ),
      answer: { kind: "numeric", value: 181, tolerance: 0 },
    },
    {
      key: "overhead",
      rung: "check",
      prompt: (
        <p>
          In that project, the ladder and the crashed run are outside the final model&apos;s lineage. What share of the
          compute do they account for? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.2155, tolerance: 0.0001 },
    },
    {
      key: "hash",
      rung: "apply",
      prompt: <p>Why is the configuration serialised with sorted keys before hashing?</p>,
      answer: {
        kind: "choice",
        options: [
          "So that the same configuration always gets the same hash, whatever order its keys were written in",
          "So that the hash is shorter",
          "Because unsorted JSON cannot be hashed",
          "So that different configurations get the same hash",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import hashlib, json

def config_hash(cfg):
    s = json.dumps(cfg, sort_keys=True)                    # key order must not change the hash
    return hashlib.sha256(s.encode()).hexdigest()[:12]

def diff_configs(a, b):
    return sorted(k for k in set(a) | set(b) if a.get(k, None) != b.get(k, None))

def manifest(runs):
    return {name: config_hash(cfg) for name, cfg in sorted(runs.items())}

print(config_hash({"a": 1, "b": 2}) == config_hash({"b": 2, "a": 1}), len(config_hash({})), diff_configs({"lr": 1, "bs": 8}, {"lr": 2, "wd": 0}))
print(list(manifest({"z": {}, "a": {"x": 1}})), diff_configs({"x": None}, {}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True 12 ['bs', 'lr', 'wd']\n['a', 'z'] []",
          "False 12 ['bs', 'lr', 'wd']\n['a', 'z'] []",
          "True 12 ['lr']\n['a', 'z'] []",
          "True 12 ['bs', 'lr', 'wd']\n['z', 'a'] ['x']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def gpu_hours(runs):
    return sum(r["gpus"] * r["hours"] for r in runs)

def share_by_stage(runs):
    total, out = gpu_hours(runs), {}
    for r in runs:
        out[r["stage"]] = out.get(r["stage"], 0) + r["gpus"] * r["hours"] / total
    return out

def overhead(runs):
    return gpu_hours([r for r in runs if not r["kept"]]) / gpu_hours(runs)   # compute not in the final model's lineage

runs = [{"stage": "pre", "gpus": 4, "hours": 2, "kept": True}, {"stage": "pre", "gpus": 4, "hours": 1, "kept": False}, {"stage": "post", "gpus": 2, "hours": 2, "kept": True}]
print(gpu_hours(runs), share_by_stage(runs), overhead(runs))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "16 {'pre': 0.75, 'post': 0.25} 0.25",
          "16 {'pre': 0.75, 'post': 0.25} 0.75",
          "12 {'pre': 0.75, 'post': 0.25} 0.25",
          "16 {'pre': 12, 'post': 4} 0.25",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>config_hash(cfg)</C>, the first 12 hexadecimal digits of the SHA-256 of the JSON with sorted keys;{" "}
          <C>diff_configs(a, b)</C>, the sorted keys whose values differ, a missing key counting as None; and{" "}
          <C>manifest(runs)</C>, a dict from run name to hash with names in sorted order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import hashlib, json

def config_hash(cfg):
    return str(len(cfg))

def diff_configs(a, b):
    return []

def manifest(runs):
    return {}
`,
        solution: REPRO,
        tests: [
          { name: "hash", code: `assert config_hash({"k": [1, 2]}) == hashlib.sha256(b'{"k": [1, 2]}').hexdigest()[:12] and config_hash({"a": 1, "b": 2}) == config_hash({"b": 2, "a": 1})` },
          { name: "diff", code: `assert diff_configs({"a": 1, "c": 3}, {"a": 1, "b": 2, "c": 4}) == ["b", "c"] and list(manifest({"y": {}, "x": {}})) == ["x", "y"] and manifest({"y": {}})["y"] == config_hash({})` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gpu_hours(runs)</C>, <C>share_by_stage(runs)</C> and <C>overhead(runs)</C> for runs given as dicts with
          keys stage, gpus, hours and kept.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def gpu_hours(runs):
    return sum(r["hours"] for r in runs)

def share_by_stage(runs):
    return {}

def overhead(runs):
    return 0.0
`,
        solution: LEDGER,
        tests: [
          { name: "hours", code: `rs = [{"stage": "a", "gpus": 2, "hours": 3, "kept": False}, {"stage": "b", "gpus": 1, "hours": 2, "kept": True}]; assert gpu_hours(rs) == 8 and gpu_hours([]) == 0` },
          { name: "shares", code: `rs = [{"stage": "a", "gpus": 2, "hours": 3, "kept": False}, {"stage": "b", "gpus": 1, "hours": 2, "kept": True}]; assert share_by_stage(rs) == {"a": 0.75, "b": 0.25} and overhead(rs) == 0.75` },
        ],
      },
    },
    {
      key: "energy",
      rung: "stretch",
      prompt: (
        <p>
          The report also states energy. If each GPU draws 0.7 kW on average and the data centre&apos;s power usage
          effectiveness is 1.2, how many kilowatt-hours did the project of the first check use? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 152.04, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        This is the last lesson of the engineering track. The research track&apos;s thesis course runs in parallel, and
        the habits built here, of planning, measuring and reporting honestly, carry over directly.
      </p>
    </>
  ),
};
