import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InodeViz } from "@/components/viz/InodeViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.4.3",
  minutes: 60,
  links: {
    requires: ["e3.4.1"],
    revisits: ["e3.3.3", "e2.4.4"],
    foreshadows: ["e3.5.3", "e4.3.3", "e4.5.1"],
  },

  puzzle: (
    <>
      <p>
        Training on a million small image files can leave a GPU idle half the time, while the same images packed into a few
        large shards keep it busy. Reading a file the second time is often a hundred times faster than the first. A program
        that writes a checkpoint and then crashes can leave a file that is half old and half new, unless it writes the file in
        one particular way. What is a file, underneath, and what happens between <C>f.write</C> and the disk?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A disk is a long array of fixed-size <strong>blocks</strong>. A file system turns it into named files. Each file has
        an <strong>inode</strong> recording its size, owner, permissions and where its blocks are; a{" "}
        <strong>directory</strong> is just a file mapping names to inode numbers. Small files point straight at their blocks;
        large ones go through blocks full of pointers. Slide the file size below to see how the inode grows.
      </p>
      <InodeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="files, names and descriptors">
        <p>
          Opening <C>/data/train/a.jpg</C> resolves the path one component at a time: read the root directory, find{" "}
          <C>data</C> and its inode, read that directory, and so on. A <strong>hard link</strong> is a second directory entry
          for the same inode; the inode counts its links and is freed when the count reaches zero and no process has it
          open. A <strong>symbolic link</strong> is a small file containing a path. <C>open</C> returns a{" "}
          <strong>file descriptor</strong>, a small integer indexing the process&rsquo;s table of open files, each with its
          own current offset that <C>read</C>, <C>write</C> and <C>lseek</C> use and move.
        </p>
      </Definition>

      <Theorem title="indexed allocation">
        <p>
          With blocks of B bytes, pointers of P bytes (so B/P pointers per block), d direct pointers, one single indirect
          and one double indirect pointer, the largest file holds{" "}
          <M>{"\\left(d + \\frac{B}{P} + \\left(\\frac{B}{P}\\right)^2\\right) B"}</M> bytes, and any byte can be found with
          at most three block reads after the inode.
        </p>
      </Theorem>
      <Proof>
        <p>
          The direct pointers name d blocks. The single indirect pointer names a block holding B/P pointers, each naming a
          data block. The double indirect pointer names a block of B/P pointers, each to a block of B/P pointers to data:{" "}
          <M>{"(B/P)^2"}</M> data blocks. Summing and multiplying by B gives the size. For block index i, compare i with d,
          then d + B/P: a direct block needs one read, a singly indirect block two (pointer block, data), a doubly indirect
          block three. With 4 KiB blocks and 4-byte pointers the maximum is about 4 GiB; real file systems add a triple
          indirect level or, like ext4, describe runs of consecutive blocks as <em>extents</em>.
        </p>
      </Proof>

      <Example title="buffering and the page cache">
        <p>
          A Python <C>write</C> first fills a buffer in your process; a full buffer, <C>flush</C> or <C>close</C> hands it to
          the kernel with a system call. The kernel copies it into the <strong>page cache</strong>, memory holding recently
          used file pages, and writes it to the device later. Reads are served from the page cache when possible, which is
          why the second read of a file is fast. Only <C>os.fsync(fd)</C> waits until the data is on the device. A hard disk
          spends several milliseconds moving its head for each random access but streams hundreds of MB/s; an SSD has no
          head but still reads far faster in large sequential chunks.
        </p>
      </Example>

      <Example title="crash consistency">
        <p>
          Creating one file updates several blocks: the inode, a bitmap of free blocks, the directory and the data. A crash
          between them leaves the file system inconsistent. <strong>Journaling</strong> file systems first write the intended
          changes to a log, then a commit record, and only then the real locations; after a crash they replay committed
          entries and discard the rest. For applications, <C>os.replace(tmp, path)</C> renames atomically, so writing a
          temporary file, fsyncing it and renaming it over the old one replaces a checkpoint all at once.
        </p>
      </Example>

      <Remark title="I/O for training data">
        <p>
          Each small file costs a path lookup, an open, an inode read and probably a seek or a network round trip; a million
          of them can take longer than the data takes to stream. That is why datasets are packed into large sequential shards
          (TFRecord, WebDataset tar files, Arrow or Parquet files), read with several workers and prefetching, and why
          checkpoints of large models are written by many processes in parallel to fast shared storage.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "blocks",
      rung: "check",
      prompt: <p>With 4 KiB (4096-byte) blocks, how many data blocks does a 10,000-byte file occupy?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "maxsize",
      rung: "apply",
      prompt: <p>A file system uses 1 KiB blocks, 4-byte block pointers, 12 direct pointers, one single indirect and one double indirect pointer. What is the largest file, in KiB?</p>,
      answer: { kind: "numeric", value: 65804 },
    },
    {
      key: "smallfiles",
      rung: "apply",
      prompt: <p>A disk needs 5 ms of seeking before each file and then streams at 500 MB/s. How many seconds does it take to read 1,000,000 files of 100 KB each (1 KB = 1000 bytes, 1 MB = 10⁶ bytes)?</p>,
      answer: { kind: "numeric", value: 5200 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import os
import tempfile

d = tempfile.mkdtemp()
p = os.path.join(d, 'f.txt')
with open(p, 'w') as f:
    f.write('hello world')
with open(p, 'r+') as f:
    f.seek(6)
    f.write('there')
    f.seek(0)
    s = f.read()
os.link(p, p + '.2')       # a second name for the same inode
os.remove(p)
st = os.stat(p + '.2')
print(s, st.st_size, st.st_nlink, os.path.exists(p))`}</Code>
          <p>Offsets and hard links. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["hello there 11 1 False", "hello there 11 2 False", "there 5 1 False", "hello world 11 1 False"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`B, P, D = 4096, 4, 12            # block size, pointer size, direct pointers
per = B // P
limits = [D, D + per, D + per + per * per]

def where(block):
    if block < limits[0]:
        return 'direct'
    if block < limits[1]:
        return 'single'
    if block < limits[2]:
        return 'double'
    return 'too big'

size = 5 * 2**20
n = -(-size // B)
print(per, where(11), where(12), where(1036), where(n), (limits[2] * B) >> 30)`}</Code>
          <p>Where does each block live? What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1024 direct single double double 4", "1024 direct direct single double 4", "1024 direct single single double 4", "4096 direct single double double 16"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            For the inode layout in the theory, with parameters <C>block=4096, ptr=4, direct=12</C>, write{" "}
            <C>max_file_size(...)</C>; <C>locate(index, ...)</C>, which says where data block number index is found:{" "}
            <C>(&apos;direct&apos;, i)</C>, <C>(&apos;single&apos;, i)</C> or <C>(&apos;double&apos;, i, j)</C> (slot i of the
            double indirect block, then slot j), with <C>ValueError</C> for an impossible index; and{" "}
            <C>blocks_needed(size, ...)</C>, returning <C>(data_blocks, pointer_blocks)</C> for a file of size bytes, with{" "}
            <C>ValueError</C> if it is too large.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def max_file_size(block=4096, ptr=4, direct=12):
    return direct * block


def locate(index, block=4096, ptr=4, direct=12):
    return ('direct', index)


def blocks_needed(size, block=4096, ptr=4, direct=12):
    return size // block, 0
`,
        solution: `def max_file_size(block=4096, ptr=4, direct=12):
    per = block // ptr
    return (direct + per + per * per) * block


def locate(index, block=4096, ptr=4, direct=12):
    per = block // ptr
    if index < 0:
        raise ValueError('negative block index')
    if index < direct:
        return ('direct', index)
    index -= direct
    if index < per:
        return ('single', index)
    index -= per
    if index < per * per:
        return ('double', index // per, index % per)
    raise ValueError('beyond the largest file')


def blocks_needed(size, block=4096, ptr=4, direct=12):
    if size > max_file_size(block, ptr, direct):
        raise ValueError('file too large')
    per = block // ptr
    data = -(-size // block)
    meta = 0
    rest = data - direct
    if rest > 0:
        meta += 1                              # the single indirect block
        rest -= per
    if rest > 0:
        meta += 1 + -(-rest // per)            # the double indirect block and its children
    return data, meta
`,
        tests: [
          { name: "sizes and counts", code: `assert max_file_size() == (12 + 1024 + 1024 ** 2) * 4096
assert max_file_size(1024, 4, 12) == (12 + 256 + 256 ** 2) * 1024
assert max_file_size(4096, 8, 10) == (10 + 512 + 512 ** 2) * 4096, 'Eight-byte pointers halve the fan-out.'
assert blocks_needed(0) == (0, 0)
assert blocks_needed(1) == (1, 0), 'One byte still takes a whole block.'
assert blocks_needed(12 * 4096) == (12, 0)
assert blocks_needed(12 * 4096 + 1) == (13, 1), 'Block 13 needs the single indirect block.'
assert blocks_needed((12 + 1024) * 4096) == (1036, 1)
assert blocks_needed((12 + 1024) * 4096 + 1) == (1037, 3), 'Double indirect: its own block plus one child.'
assert blocks_needed(5 * 2 ** 20) == (1280, 3)
assert blocks_needed(2 ** 30) == (262144, 1 + 1 + 255), 'A 1 GiB file: 262132 blocks beyond the direct ones, 1024 via the single indirect block, the rest in 255 second-level blocks.'
assert blocks_needed(max_file_size()) == (12 + 1024 + 1024 ** 2, 1 + 1 + 1024)
try:
    blocks_needed(max_file_size() + 1)
    assert False, 'Too large: ValueError.'
except ValueError:
    pass` },
          { name: "locating blocks", code: `assert locate(0) == ('direct', 0) and locate(11) == ('direct', 11)
assert locate(12) == ('single', 0) and locate(1035) == ('single', 1023)
assert locate(1036) == ('double', 0, 0)
assert locate(1036 + 1024) == ('double', 1, 0)
assert locate(1036 + 5 * 1024 + 7) == ('double', 5, 7)
assert locate(12 + 1024 + 1024 ** 2 - 1) == ('double', 1023, 1023)
assert locate(20, 1024, 4, 10) == ('single', 10)
assert locate(10 + 256 + 300, 1024, 4, 10) == ('double', 1, 44)
for bad in [-1, 12 + 1024 + 1024 ** 2]:
    try:
        locate(bad)
        assert False, f'{bad} is not a valid block index.'
    except ValueError:
        pass` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            An in-memory file system with inodes. The starter gives <C>FS</C>, whose <C>inodes</C> map each inode number to a
            dict (a directory, from name to inode number) or to bytes (a file), and whose <C>links</C> count the names of each
            inode; <C>lookup(fs, path)</C>, the inode number at a path; <C>parent(fs, path)</C>, the directory holding the last
            name and that name; and <C>mkdir(fs, path)</C>. Write <C>write(fs, path, data)</C>, which creates a file or replaces
            its contents; <C>link(fs, src, dst)</C>, a hard link: a second name for the same file inode; and{" "}
            <C>unlink(fs, path)</C>, which removes a file&rsquo;s name and frees its inode when no names remain. Raise{" "}
            <C>FileExistsError</C> or <C>IsADirectoryError</C> as the operating system would.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class FS:
    def __init__(self):
        self.inodes = {0: {}}            # inode number -> dict (directory) or bytes (file)
        self.links = {0: 1}              # inode number -> how many names it has
        self.next = 1

def lookup(fs, path):
    # The inode number at an absolute path.
    ino = 0
    for name in [p for p in path.split('/') if p]:
        node = fs.inodes[ino]
        if not isinstance(node, dict):
            raise NotADirectoryError(name)
        if name not in node:
            raise FileNotFoundError(name)
        ino = node[name]
    return ino

def parent(fs, path):
    # The directory (a dict) that holds the last name in path, and that name.
    *dirs, name = [p for p in path.split('/') if p]
    d = fs.inodes[lookup(fs, '/' + '/'.join(dirs))]
    if not isinstance(d, dict):
        raise NotADirectoryError(path)
    return d, name

def mkdir(fs, path):
    d, name = parent(fs, path)
    if name in d:
        raise FileExistsError(path)
    d[name] = fs.next
    fs.inodes[fs.next], fs.links[fs.next] = {}, 1
    fs.next += 1

def write(fs, path, data):
    pass

def link(fs, src, dst):
    pass

def unlink(fs, path):
    pass
`,
        solution: `class FS:
    def __init__(self):
        self.inodes = {0: {}}            # inode number -> dict (directory) or bytes (file)
        self.links = {0: 1}              # inode number -> how many names it has
        self.next = 1

def lookup(fs, path):
    # The inode number at an absolute path.
    ino = 0
    for name in [p for p in path.split('/') if p]:
        node = fs.inodes[ino]
        if not isinstance(node, dict):
            raise NotADirectoryError(name)
        if name not in node:
            raise FileNotFoundError(name)
        ino = node[name]
    return ino

def parent(fs, path):
    # The directory (a dict) that holds the last name in path, and that name.
    *dirs, name = [p for p in path.split('/') if p]
    d = fs.inodes[lookup(fs, '/' + '/'.join(dirs))]
    if not isinstance(d, dict):
        raise NotADirectoryError(path)
    return d, name

def mkdir(fs, path):
    d, name = parent(fs, path)
    if name in d:
        raise FileExistsError(path)
    d[name] = fs.next
    fs.inodes[fs.next], fs.links[fs.next] = {}, 1
    fs.next += 1

def write(fs, path, data):
    d, name = parent(fs, path)
    if name in d:
        if isinstance(fs.inodes[d[name]], dict):
            raise IsADirectoryError(path)
        fs.inodes[d[name]] = bytes(data)
    else:
        d[name] = fs.next
        fs.inodes[fs.next], fs.links[fs.next] = bytes(data), 1
        fs.next += 1

def link(fs, src, dst):
    ino = lookup(fs, src)
    if isinstance(fs.inodes[ino], dict):
        raise IsADirectoryError(src)
    d, name = parent(fs, dst)
    if name in d:
        raise FileExistsError(dst)
    d[name] = ino
    fs.links[ino] += 1

def unlink(fs, path):
    d, name = parent(fs, path)
    if name not in d:
        raise FileNotFoundError(path)
    ino = d[name]
    if isinstance(fs.inodes[ino], dict):
        raise IsADirectoryError(path)
    del d[name]
    fs.links[ino] -= 1
    if fs.links[ino] == 0:
        del fs.inodes[ino], fs.links[ino]
`,
        tests: [
          { name: "write", code: `fs = FS()
mkdir(fs, '/data')
write(fs, '/data/a.bin', b'abc')
write(fs, '/data/readme', b'hi')
assert fs.inodes[lookup(fs, '/data/a.bin')] == b'abc' and sorted(fs.inodes[lookup(fs, '/data')]) == ['a.bin', 'readme']
n = len(fs.inodes)
write(fs, '//data///readme', b'hello')
assert fs.inodes[lookup(fs, '/data/readme')] == b'hello' and len(fs.inodes) == n, 'Writing an existing file replaces its contents in the same inode.'
for f, err in [(lambda: write(fs, '/data', b''), IsADirectoryError), (lambda: write(fs, '/data/readme/x', b''), NotADirectoryError), (lambda: write(fs, '/nope/x', b''), FileNotFoundError)]:
    try:
        f()
        assert False, f'Expected {err.__name__}.'
    except err:
        pass` },
          { name: "hard links", code: `fs = FS()
mkdir(fs, '/a')
write(fs, '/a/x', b'one')
n = len(fs.inodes)
link(fs, '/a/x', '/y')
assert len(fs.inodes) == n, 'A hard link is a new name, not a new inode.'
assert lookup(fs, '/y') == lookup(fs, '/a/x') and fs.links[lookup(fs, '/y')] == 2
write(fs, '/y', b'two')
assert fs.inodes[lookup(fs, '/a/x')] == b'two', 'Both names reach the same data.'
unlink(fs, '/a/x')
assert fs.inodes[lookup(fs, '/a')] == {} and fs.inodes[lookup(fs, '/y')] == b'two', 'The data lives on while a name remains.'
assert fs.links[lookup(fs, '/y')] == 1
unlink(fs, '/y')
assert len(fs.inodes) == n - 1, 'Removing the last name frees the inode.'
write(fs, '/p', b'')
write(fs, '/q', b'')
for f, err in [(lambda: unlink(fs, '/y'), FileNotFoundError), (lambda: link(fs, '/a', '/b'), IsADirectoryError), (lambda: unlink(fs, '/a'), IsADirectoryError), (lambda: link(fs, '/p', '/q'), FileExistsError)]:
    try:
        f()
        assert False, f'Expected {err.__name__}.'
    except err:
        pass` },
        ],
      },
    },
    {
      key: "atomic",
      rung: "prove",
      prompt: <p>A program saves a checkpoint by writing it to <C>ckpt.tmp</C>, calling fsync on it, and then <C>os.replace(&apos;ckpt.tmp&apos;, &apos;ckpt&apos;)</C>. Assuming rename is atomic and fsync guarantees the data is on disk, prove that after a crash at any moment, <C>ckpt</C> holds either the complete old checkpoint or the complete new one.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Before the rename, the name ckpt still refers to the old inode, which was never modified, so a crash leaves the old checkpoint intact.",
          "Atomicity of rename means there is no moment at which ckpt names a partial mixture: it names the old inode or the new one.",
          "The fsync before the rename ensures that when ckpt names the new inode, all its data blocks are already on disk.",
          "Notes that without the fsync, a crash could leave ckpt naming a new inode whose data was never written, e.g. zero-length; strictly the directory should also be fsynced to make the rename durable.",
        ],
      },
    },
    {
      key: "journal",
      rung: "stretch",
      prompt: <p>A journaling file system writes (1) the new inode, bitmap and directory blocks to the journal, (2) a commit record, then (3) the blocks to their real locations, and finally (4) frees the journal entry. For a crash after each step, say what recovery does and why the file system ends consistent. Why must step 2 not start until step 1 is on disk?</p>,
      answer: {
        kind: "written",
        rubric: [
          "Crash during or after step 1 but before the commit: the entry is incomplete, recovery discards it, and the file system is in its old consistent state.",
          "Crash after step 2: the committed entry is replayed, writing every block to its real location (replay is idempotent), giving the new consistent state.",
          "Crash during step 3 or 4: same as after step 2; replaying again is harmless.",
          "If the commit record could reach disk before the journal blocks, a crash could leave a commit pointing at garbage, which recovery would copy into the file system: hence a write barrier or flush between steps 1 and 2.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what an inode is and why deleting a file that another name still links to does not delete its data.",

  glimpse: (
    <p>
      Chapter 4 showed one processor shared among many programs. Next chapter: many threads inside one program, sharing the
      same memory, and the locks that keep them from corrupting it.
    </p>
  ),
};
