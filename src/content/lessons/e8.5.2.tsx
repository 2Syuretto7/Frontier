import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ContainerLayersViz } from "@/components/viz/ContainerLayersViz";
import type { LessonContent } from "@/lib/types";

const IMAGES = `def build_cache(steps, cache):
    rebuilt = []
    for i in range(len(steps)):
        key = tuple(steps[:i + 1])
        rebuilt.append(key not in cache)
        cache.add(key)
    return rebuilt

def overlay(layers):
    fs = {}
    for layer in layers:
        for path, content in layer.items():
            if content is None:
                fs.pop(path, None)
            else:
                fs[path] = content
    return fs

def pull_bytes(image, sizes, local):
    return sum(sizes[layer] for layer in set(image) if layer not in local)`;

const CGROUPS = `import math

def cpu_share(weights, cores):
    return [cores * w / sum(weights) for w in weights]

def wall_time(work, quota, period):
    periods = math.ceil(work / quota)
    return (periods - 1) * period + (work - (periods - 1) * quota)

def oom_step(usages, limit):
    for i, u in enumerate(usages):
        if u > limit:
            return i
    return None`;

export const lesson: LessonContent = {
  id: "e8.5.2",
  minutes: 45,
  links: {
    requires: ["e8.5.1"],
    revisits: ["e3.4.1", "e3.4.3"],
    foreshadows: ["e8.5.3"],
  },

  puzzle: (
    <>
      <p>
        A training script works on a researcher&apos;s workstation and crashes on the cluster: a different CUDA library, a
        different version of a Python package, a missing system tool. Installing everything by hand on a thousand nodes, and
        keeping them identical, is hopeless. And two jobs sharing a node must not be able to read each other&apos;s files or
        starve each other of memory. How can a program be shipped together with its whole environment, and fenced off from
        its neighbours, without the cost of a full virtual machine?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A container is an ordinary process (e3.4.1) that the kernel shows a private view of the machine: its own file tree, its
        own process numbers, its own network, and fixed limits on CPU and memory. The file tree comes from an <em>image</em>, a
        stack of read-only layers, each recording the files changed by one build step. Layers are identified by their content,
        so nodes download each one once and images that share a base share its layers. Because a layer depends on everything
        beneath it, the order of build steps decides how much must be rebuilt and shipped after each change.
      </p>
      <ContainerLayersViz />
    </>
  ),

  theory: (
    <>
      <Definition title="containers">
        <p>
          Linux builds containers from two kernel features. <em>Namespaces</em> give a process its own view of process ids, mount
          points, network interfaces, host name and user ids. <em>Control groups</em> (cgroups) limit and account for its CPU
          time, memory and I/O. Unlike a virtual machine, a container shares the host&apos;s kernel, so it starts in milliseconds
          and costs almost nothing to run, but it can only run programs for that kernel.
        </p>
      </Definition>

      <Definition title="images and layers">
        <p>
          An image is a list of layers, each an archive of the files added, changed or deleted by one build step, named by the
          hash of its content. At run time an overlay file system stacks them: a path takes its content from the highest layer
          that mentions it, and a deletion is recorded as a <em>whiteout</em> that hides the path from lower layers (<C>overlay</C>,
          with <C>None</C> as the whiteout). Writes go to a thin private layer on top. A node pulls only the layers it does not
          already hold (<C>pull_bytes</C>), and a builder reuses a cached layer when the step and everything before it are
          unchanged (<C>build_cache</C>).
        </p>
        <Code>{IMAGES}</Code>
      </Definition>

      <Theorem title="what a change rebuilds">
        <p>
          If step i of an n-step build changes, the build cache reuses layers 1 to i − 1 and rebuilds layers i to n. So the steps
          should be ordered from the least to the most frequently changed.
        </p>
      </Theorem>
      <Proof>
        <p>
          A layer&apos;s cache key is its step together with the key of the layer beneath it, so in effect the whole prefix of
          steps up to it. Prefixes of length less than i are unchanged and hit the cache; every prefix of length i or more
          contains the changed step, so none of them has been built before. The expected work per build is the sum, over steps
          j, of the probability that some step at or below j changes times the cost of layer j, which is smallest when rarely
          changed, expensive steps come first.
        </p>
      </Proof>

      <Definition title="resource limits">
        <p>
          Under contention, cgroups divide CPU time in proportion to each group&apos;s weight (<C>cpu_share</C>). A{" "}
          <em>quota</em> caps a group at q milliseconds of CPU in every period of p milliseconds; a single-threaded task that
          needs w milliseconds of CPU with q ≤ p then runs for <C>wall_time</C>, sitting throttled for the rest of each period. A
          memory limit is enforced by the kernel&apos;s out-of-memory killer, which kills the process at the first moment its
          usage exceeds the limit (<C>oom_step</C>).
        </p>
        <Code>{CGROUPS}</Code>
      </Definition>

      <Remark title="containers for GPUs">
        <p>
          A GPU container includes the CUDA user-space libraries, while the kernel driver stays on the host; the NVIDIA
          Container Toolkit mounts the driver and the GPU devices into the container, and the image&apos;s CUDA version must be one
          that the host driver supports. Clusters refer to images by digest rather than by a mutable tag, so that every node runs
          bit-identical software. On shared supercomputers, where users may not run the Docker daemon, tools such as Apptainer
          and Enroot run the same images without special privileges; in Kubernetes, one or more containers form a pod, the unit
          that the scheduler of e8.5.1 places on a node.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "share",
      rung: "check",
      prompt: <p>Three busy containers with CPU weights 2048, 1024 and 1024 share a 16-core node. How many cores does the first receive?</p>,
      answer: { kind: "numeric", value: 8, tolerance: 0.0001 },
    },
    {
      key: "quota",
      rung: "check",
      prompt: <p>A single-threaded task needs 90 ms of CPU, under a quota of 25 ms per 100 ms period. How many milliseconds of wall time does it take?</p>,
      answer: { kind: "numeric", value: 315, tolerance: 0.0001 },
    },
    {
      key: "order",
      rung: "apply",
      prompt: <p>Why should a Dockerfile install dependencies before copying in the training code?</p>,
      answer: {
        kind: "choice",
        options: [
          "Code changes often, and every layer above a changed step is rebuilt, so putting it last keeps the large dependency layers cached",
          "Dependencies cannot be installed after files are copied",
          "Layers are compressed better in that order",
          "The container would otherwise not be able to see the code",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def build_cache(steps, cache):
    rebuilt = []
    for i in range(len(steps)):
        key = tuple(steps[:i + 1])
        rebuilt.append(key not in cache)
        cache.add(key)
    return rebuilt

def overlay(layers):
    fs = {}
    for layer in layers:
        for path, content in layer.items():
            if content is None:
                fs.pop(path, None)
            else:
                fs[path] = content
    return fs

def pull_bytes(image, sizes, local):
    return sum(sizes[layer] for layer in set(image) if layer not in local)

cache = set(); print(build_cache(['FROM base', 'RUN pip', 'COPY app'], cache), build_cache(['FROM base', 'RUN pip', 'COPY app2'], cache), len(cache))
print(overlay([{'a': 1, 'b': 2}, {'b': None, 'c': 3}, {'a': 4}]), pull_bytes(['l1', 'l2', 'l3'], {'l1': 80, 'l2': 300, 'l3': 5}, {'l1'}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[True, True, True] [False, False, True] 4\n{'a': 4, 'c': 3} 305",
          "[True, True, True] [False, False, True] 3\n{'a': 4, 'c': 3} 305",
          "[True, True, True] [True, True, True] 6\n{'a': 4, 'c': 3} 305",
          "[True, True, True] [False, False, True] 4\n{'a': 4, 'b': 2, 'c': 3} 385",
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

def cpu_share(weights, cores):
    return [cores * w / sum(weights) for w in weights]

def wall_time(work, quota, period):
    periods = math.ceil(work / quota)
    return (periods - 1) * period + (work - (periods - 1) * quota)

def oom_step(usages, limit):
    for i, u in enumerate(usages):
        if u > limit:
            return i
    return None

print(cpu_share([1024, 512, 512], 8), wall_time(250, 50, 100), wall_time(40, 50, 100))
print(oom_step([100, 300, 520, 480], 512), oom_step([1, 2], 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4.0, 2.0, 2.0] 450 40\n2 None",
          "[4.0, 2.0, 2.0] 500 40\n2 None",
          "[4.0, 2.0, 2.0] 450 100\n2 None",
          "[2.6666666666666665, 2.6666666666666665, 2.6666666666666665] 450 40\n3 None",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>build_cache(steps, cache)</C>, returning for each step whether its layer had to be rebuilt and adding every
          prefix to the set <C>cache</C>; <C>overlay(layers)</C>, the merged file system from bottom to top with <C>None</C> as a
          whiteout; and <C>pull_bytes(image, sizes, local)</C>, the bytes of distinct layers not already held locally.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def build_cache(steps, cache):
    return [True] * len(steps)

def overlay(layers):
    return {}

def pull_bytes(image, sizes, local):
    return sum(sizes[layer] for layer in image)
`,
        solution: IMAGES,
        tests: [
          { name: "cache", code: `c = set()
assert build_cache([], c) == [] and build_cache(['a', 'b'], c) == [True, True] and build_cache(['a', 'c', 'b'], c) == [False, True, True]
assert build_cache(['a', 'b', 'd'], c) == [False, False, True] and len(c) == 5 and ('a', 'c') in c` },
          { name: "layers", code: `assert overlay([]) == {} and overlay([{'x': 1}, {'x': None}, {'x': 2, 'y': None}]) == {'x': 2}
assert overlay([{'p': 'a'}, {'q': 'b'}, {'p': None}]) == {'q': 'b'}
assert pull_bytes(['a', 'a', 'b'], {'a': 3, 'b': 4}, set()) == 7 and pull_bytes(['a'], {'a': 3}, {'a'}) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cpu_share(weights, cores)</C>, <C>wall_time(work, quota, period)</C> for a single-threaded task with quota at
          most the period, and <C>oom_step(usages, limit)</C>, the index of the first usage above the limit or <C>None</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def cpu_share(weights, cores):
    return [cores / len(weights)] * len(weights)

def wall_time(work, quota, period):
    return work

def oom_step(usages, limit):
    return None
`,
        solution: CGROUPS,
        tests: [
          { name: "cpu", code: `assert cpu_share([1], 3) == [3.0] and cpu_share([3, 1], 2) == [1.5, 0.5]
assert wall_time(60, 30, 100) == 130 and wall_time(30, 30, 100) == 30 and wall_time(90, 25, 100) == 315` },
          { name: "memory", code: `assert oom_step([], 1) is None and oom_step([5, 6], 5) == 1 and oom_step([7], 5) == 0` },
        ],
      },
    },
    {
      key: "throttle",
      rung: "stretch",
      prompt: (
        <p>
          A single-threaded data loader needs 1234 ms of CPU, and its container has a quota of 30 ms per 100 ms period. How many
          milliseconds of wall time does it take?
        </p>
      ),
      answer: { kind: "numeric", value: 4104, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        With jobs scheduled and packaged, one question remains: is the cluster doing what it should? The last lesson of the
        course is about observability, the metrics, logs and traces that let engineers see inside a running distributed system
        and a training run.
      </p>
    </>
  ),
};
