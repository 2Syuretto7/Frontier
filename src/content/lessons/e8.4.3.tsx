import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ObjectStoreViz } from "@/components/viz/ObjectStoreViz";
import type { LessonContent } from "@/lib/types";

const LAYOUT = `def parts_for(size, part_size):
    return [(off, min(part_size, size - off)) for off in range(0, size, part_size)]

def aligned_range(offset, length, block):
    start = offset - offset % block
    end = -(-(offset + length) // block) * block
    return start, end

def shard(sizes, target):
    shards, cur, total = [], [], 0
    for i, s in enumerate(sizes):
        if cur and total + s > target:
            shards.append(cur)
            cur, total = [], 0
        cur.append(i)
        total += s
    if cur:
        shards.append(cur)
    return shards`;

const THROUGHPUT = `import math

def fetch_time(size, latency, bandwidth):
    return latency + size / bandwidth

def aggregate_throughput(object_size, streams, latency, bandwidth, nic):
    return min(streams * object_size / fetch_time(object_size, latency, bandwidth), nic)

def streams_needed(target, object_size, latency, bandwidth):
    return math.ceil(target * fetch_time(object_size, latency, bandwidth) / object_size)`;

export const lesson: LessonContent = {
  id: "e8.4.3",
  minutes: 45,
  links: {
    requires: ["e8.3.3", "e8.2.5"],
    revisits: ["e3.6.3", "e3.4.3"],
    foreshadows: ["e8.5.1"],
  },

  puzzle: (
    <>
      <p>
        An image dataset of a billion pictures, each about 100 KB, sits in cloud storage that can deliver many gigabytes per
        second. Yet a training job reading the pictures one by one gets a few megabytes per second and starves its GPUs. Copy
        the same pictures into files of a gigabyte each and the job reads them at full speed. Where does the time go, and why
        does the size of each object matter so much?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An object store is a giant key–value store reached over HTTP (e3.6.3). Each request crosses a network and a storage
        service, so it pays tens of milliseconds before any data flows, and then streams at a modest rate per connection. A
        small object is all latency; a large one is all bandwidth. The cure is the one the α–β model (e8.2.5) suggests: make
        each request large, by packing many samples into each object, and make many requests at once, so that aggregate
        throughput is limited only by the network.
      </p>
      <ObjectStoreViz />
    </>
  ),

  theory: (
    <>
      <Definition title="object stores">
        <p>
          An object store such as Amazon S3 or Google Cloud Storage holds immutable <em>objects</em>, byte strings with a little
          metadata, under keys in a flat namespace of <em>buckets</em>. The operations are PUT (create or replace a whole
          object), GET (read it, optionally only a byte range), DELETE and LIST (keys with a given prefix). There is no append,
          no in-place update and no rename: a &quot;directory&quot; is only a shared key prefix, so renaming one copies every
          object. In exchange the store scales to exabytes, keeps data durable with erasure coding (e8.3.3), and since 2020 S3
          gives strong read-after-write consistency for each key.
        </p>
      </Definition>

      <Definition title="layout">
        <p>
          A large object is uploaded in parts, sent in parallel and committed atomically at the end (S3 allows up to 10,000
          parts of 5 MB to 5 GB); <C>parts_for</C> lists their offsets and lengths. Readers often fetch aligned blocks so that
          they can be cached; <C>aligned_range</C> widens a byte range to block boundaries. Small samples are packed in order
          into shards of a target size (<C>shard</C>), as tar files in formats such as WebDataset.
        </p>
        <Code>{LAYOUT}</Code>
      </Definition>

      <Theorem title="how many requests to keep in flight">
        <p>
          If each GET of an object of s bytes takes <M>{"L + s/b"}</M> for latency L and per-request bandwidth b, then n
          concurrent request streams deliver <M>{"\\min\\left(\\frac{ns}{L + s/b}, B\\right)"}</M> bytes per second, where B is the
          client&apos;s network limit, and reaching a throughput T &lt; B needs{" "}
          <M>{"n \\ge T(L + s/b)/s"}</M> streams.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each stream completes one object every <M>{"L + s/b"}</M> seconds and so delivers <M>{"s/(L + s/b)"}</M> bytes per
          second; n independent streams deliver n times as much until the network link saturates at B. Solving{" "}
          <M>{"ns/(L + s/b) \\ge T"}</M> for n gives the bound. For small s the per-stream rate is about s/L, so the number of
          streams needed grows as 1/s: halving the object size doubles the requests needed for the same throughput.
        </p>
        <Code>{THROUGHPUT}</Code>
      </Proof>

      <Remark title="training data and checkpoints">
        <p>
          Data loaders for large runs therefore read shards of hundreds of megabytes with many requests in flight, and shuffle
          by visiting shards in random order and mixing samples in a buffer, since random access to single samples is too slow.
          Checkpoints follow a commit pattern suited to immutable objects: every rank writes its own shard as a separate object,
          and a small manifest listing them is written last, so that a checkpoint exists only once it is complete. Request
          rates are limited per key prefix and every request is billed, two more reasons to prefer few large objects to many
          small ones.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "parts",
      rung: "check",
      prompt: <p>An object of 10⁹ bytes is uploaded in parts of 64 × 10⁶ bytes. How many parts are there?</p>,
      answer: { kind: "numeric", value: 16, tolerance: 0 },
    },
    {
      key: "rate",
      rung: "check",
      prompt: <p>With 20 ms latency per request and 100 MB/s per request, what throughput in MB/s does one stream reading 4 MB objects achieve? Give two decimals.</p>,
      answer: { kind: "numeric", value: 66.67, tolerance: 0.005 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why are small training samples packed into shards of hundreds of megabytes before being stored in an object store?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each request pays a fixed latency, so large objects spend almost all of their time transferring data rather than waiting",
          "Object stores cannot hold objects smaller than a megabyte",
          "Packing compresses the samples",
          "Shards allow samples to be modified in place",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def parts_for(size, part_size):
    return [(off, min(part_size, size - off)) for off in range(0, size, part_size)]

def aligned_range(offset, length, block):
    start = offset - offset % block
    end = -(-(offset + length) // block) * block
    return start, end

def shard(sizes, target):
    shards, cur, total = [], [], 0
    for i, s in enumerate(sizes):
        if cur and total + s > target:
            shards.append(cur)
            cur, total = [], 0
        cur.append(i)
        total += s
    if cur:
        shards.append(cur)
    return shards

print(parts_for(25, 10), parts_for(20, 10), parts_for(0, 10))
print(shard([30, 50, 40, 90, 10, 120], 100), aligned_range(130, 100, 64), aligned_range(0, 64, 64))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0, 10), (10, 10), (20, 5)] [(0, 10), (10, 10)] []\n[[0, 1], [2], [3, 4], [5]] (128, 256) (0, 64)",
          "[(0, 10), (10, 10), (20, 10)] [(0, 10), (10, 10)] []\n[[0, 1], [2], [3, 4], [5]] (128, 256) (0, 64)",
          "[(0, 10), (10, 10), (20, 5)] [(0, 10), (10, 10)] []\n[[0, 1], [2, 3], [4], [5]] (128, 256) (0, 64)",
          "[(0, 10), (10, 10), (20, 5)] [(0, 10), (10, 10)] []\n[[0, 1], [2], [3, 4], [5]] (128, 230) (0, 128)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def fetch_time(size, latency, bandwidth):
    return latency + size / bandwidth

def aggregate_throughput(object_size, streams, latency, bandwidth, nic):
    return min(streams * object_size / fetch_time(object_size, latency, bandwidth), nic)

def streams_needed(target, object_size, latency, bandwidth):
    return math.ceil(target * fetch_time(object_size, latency, bandwidth) / object_size)

print(fetch_time(1000, 2, 100), aggregate_throughput(1000, 4, 2, 100, 1000), aggregate_throughput(1000, 4, 8, 1000, 1000))
print(streams_needed(1000, 1000, 2, 100), streams_needed(1000, 10, 2, 100))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "12.0 333.3333333333333 444.44444444444446\n12 210",
          "12.0 333.3333333333333 1000\n12 210",
          "12.0 83.33333333333333 444.44444444444446\n12 210",
          "12.0 333.3333333333333 444.44444444444446\n10 200",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>parts_for(size, part_size)</C>, the <C>(offset, length)</C> of each part; <C>aligned_range(offset, length, block)</C>,
          the smallest block-aligned <C>(start, end)</C> covering the bytes from offset to offset + length; and{" "}
          <C>shard(sizes, target)</C>, packing samples in order into lists of indices, starting a new shard whenever the next
          sample would push a non-empty shard over the target.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def parts_for(size, part_size):
    return [(0, size)]

def aligned_range(offset, length, block):
    return offset, offset + length

def shard(sizes, target):
    return [list(range(len(sizes)))]
`,
        solution: LAYOUT,
        tests: [
          { name: "parts", code: `assert parts_for(7, 7) == [(0, 7)] and parts_for(8, 3) == [(0, 3), (3, 3), (6, 2)] and parts_for(0, 4) == []
assert aligned_range(5, 1, 4) == (4, 8) and aligned_range(8, 8, 4) == (8, 16) and aligned_range(1000, 1, 512) == (512, 1024)` },
          { name: "shard", code: `assert shard([], 5) == [] and shard([7], 5) == [[0]] and shard([1, 1, 1, 1], 2) == [[0, 1], [2, 3]] and shard([3, 3, 3], 6) == [[0, 1], [2]]
assert shard([9, 1, 1], 5) == [[0], [1, 2]]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fetch_time(size, latency, bandwidth)</C>, <C>aggregate_throughput(object_size, streams, latency, bandwidth, nic)</C>{" "}
          and <C>streams_needed(target, object_size, latency, bandwidth)</C>, the smallest whole number of streams reaching the
          target.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def fetch_time(size, latency, bandwidth):
    return latency

def aggregate_throughput(object_size, streams, latency, bandwidth, nic):
    return nic

def streams_needed(target, object_size, latency, bandwidth):
    return 1
`,
        solution: THROUGHPUT,
        tests: [
          { name: "throughput", code: `assert fetch_time(0, 3, 1) == 3 and abs(fetch_time(50, 1, 10) - 6) < 1e-12
assert abs(aggregate_throughput(10, 1, 1, 10, 99) - 5) < 1e-12 and aggregate_throughput(10, 100, 1, 10, 99) == 99` },
          { name: "streams", code: `assert streams_needed(50, 10, 1, 10) == 10 and streams_needed(10, 10, 0, 10) == 1 and streams_needed(51, 10, 1, 10) == 11` },
        ],
      },
    },
    {
      key: "need",
      rung: "stretch",
      prompt: (
        <p>
          A data loader must read 5 GB/s (5 × 10⁹ bytes per second) from shards of 8 MB (8 × 10⁶ bytes), with 20 ms latency and
          100 MB/s per request. How many concurrent request streams does it need?
        </p>
      ),
      answer: { kind: "numeric", value: 63, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Storage, data and computation all run on a cluster shared by many jobs. The last part turns to the cluster itself:
        how a scheduler decides which job gets which machines, beginning with the schedulers of the next lesson.
      </p>
    </>
  ),
};
