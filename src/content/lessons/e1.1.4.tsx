import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SshViz } from "@/components/viz/SshViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.1.4",
  minutes: 50,
  links: {
    requires: ["e1.1.3"],
    revisits: ["e1.1.2"],
    parallels: ["m4.4.3"],
    foreshadows: ["e1.2.3"],
  },

  puzzle: (
    <>
      <p>
        You want to log in to a rented GPU machine from a café&rsquo;s Wi-Fi. Anyone on that network can read the traffic
        passing by.
      </p>
      <p>
        How can the machine be sure it is you, without you sending a password an eavesdropper could copy? And how can you be
        sure you are talking to your machine, and not to an impostor in the middle?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        <strong>SSH</strong>, the secure shell, solves both problems with pairs of keys. A key pair has a{" "}
        <strong>private</strong> half, which never leaves its owner, and a <strong>public</strong> half, which can be shared
        freely. The private key can sign data; the public key can check those signatures but cannot make them.
      </p>
      <p>
        The server proves who it is by signing with its host key, which your laptop remembers. You prove who you are by signing
        with your private key, whose public half you placed on the server. Step through a login, then see what happens when the
        server&rsquo;s key does not match.
      </p>
      <SshViz />
    </>
  ),

  theory: (
    <>
      <Definition title="setting up key login">
        <Code>{`ssh-keygen -t ed25519            # once, on your laptop: makes ~/.ssh/id_ed25519 and id_ed25519.pub
ssh-copy-id asha@203.0.113.7     # appends your public key to the server's ~/.ssh/authorized_keys
ssh asha@203.0.113.7             # log in; no password needed now`}</Code>
        <p>
          Protect the private key with a passphrase when <C>ssh-keygen</C> asks, and keep its permissions at 600. Never copy the
          private key to another machine or paste it anywhere; generate a separate pair per laptop instead.
        </p>
      </Definition>

      <Definition title="known hosts">
        <p>
          The first time you connect, SSH shows the server&rsquo;s host key fingerprint and asks whether to trust it. If you say
          yes, it is saved in <C>~/.ssh/known_hosts</C>. If it ever changes, SSH refuses to connect and prints a loud warning,
          because that is exactly what an attacker in the middle would look like. Sometimes the cause is innocent, such as a
          reinstalled machine; find out before you remove the old key.
        </p>
      </Definition>

      <Example title="a config file saves typing">
        <Code>{`# ~/.ssh/config
Host gpu
    HostName 203.0.113.7
    User asha
    IdentityFile ~/.ssh/id_ed25519`}</Code>
        <p>Now <C>ssh gpu</C> is enough, and every tool that uses SSH, including Git, understands the name.</p>
      </Example>

      <Definition title="moving files and ports">
        <ul>
          <li><C>scp results.csv gpu:~/runs/</C> copies a file to the server; swap the arguments to copy back.</li>
          <li><C>rsync -av data/ gpu:~/data/</C> copies a directory and, next time, sends only what changed.</li>
          <li>
            <C>ssh -L 8888:localhost:8888 gpu</C> forwards a port: opening <C>localhost:8888</C> in your laptop&rsquo;s browser
            reaches port 8888 on the server, through the encrypted connection. This is how you view a remote notebook or
            dashboard.
          </li>
        </ul>
      </Definition>

      <Remark title="surviving a dropped connection">
        <p>
          When an SSH connection drops, the processes it started are normally stopped with it. Start long jobs inside{" "}
          <C>tmux</C>: run <C>tmux new -s train</C>, start the job, detach with <strong>Ctrl-B</strong> then <strong>D</strong>,
          and later reconnect with <C>tmux attach -t train</C>. The job never noticed you left.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "share",
      rung: "check",
      prompt: <p>Which half of your key pair is safe to put on a server?</p>,
      answer: { kind: "choice", options: ["The public key", "The private key", "Both", "Neither"], correct: [0] },
    },
    {
      key: "where",
      rung: "check",
      prompt: <p>On the server, which file lists the public keys allowed to log in to your account?</p>,
      answer: { kind: "choice", options: ["~/.ssh/authorized_keys", "~/.ssh/known_hosts", "~/.ssh/config", "~/.ssh/id_ed25519"], correct: [0] },
    },
    {
      key: "changed",
      rung: "apply",
      prompt: <p>SSH warns that the remote host identification has changed. What should you do first?</p>,
      answer: { kind: "choice", options: ["Find out why, for example from the server's administrator, before trusting the new key", "Delete known_hosts and reconnect at once", "Use a password instead"], correct: [0] },
    },
    {
      key: "forward",
      rung: "apply",
      prompt: <p>After <C>ssh -L 6006:localhost:6006 gpu</C>, which address in your laptop&rsquo;s browser shows the dashboard running on the server&rsquo;s port 6006?</p>,
      answer: { kind: "choice", options: ["localhost:6006", "gpu:22", "203.0.113.7:8888"], correct: [0] },
    },
    {
      key: "transfer",
      rung: "apply",
      prompt: <p>You copy a 50 GB dataset at a steady 100 MB per second, with 1 GB = 1,000 MB. How many seconds does it take?</p>,
      answer: { kind: "numeric", value: 500 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`line = "Host gpu\\n  HostName 10.0.0.7\\n  User arnav\\n  Port 2222"
cfg = dict(l.split() for l in line.splitlines()[1:])
print(f"ssh -p {cfg['Port']} {cfg['User']}@{cfg['HostName']}")`}</Code>
          <p>An ~/.ssh/config entry expanded into a full command. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["ssh -p 2222 arnav@10.0.0.7", "ssh -p 22 arnav@gpu", "ssh arnav@10.0.0.7:2222", "ssh -p 2222 gpu@10.0.0.7"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>parse_target(s)</C>, which splits an SSH or scp target such as <C>"arnav@box:/data/x.csv"</C> into a dict with keys <C>"user"</C>, <C>"host"</C> and <C>"path"</C>. The user defaults to <C>None</C> and the path to <C>""</C> when they are missing.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def parse_target(s):
    user, rest = s.split('@')
    host, path = rest.split(':')
    return {'user': user, 'host': host, 'path': path}
`,
        solution: `def parse_target(s):
    user = None
    if '@' in s:
        user, s = s.split('@', 1)
    host, _, path = s.partition(':')
    return {'user': user, 'host': host, 'path': path}
`,
        tests: [
          { name: "full", code: `assert parse_target('arnav@box:/data/x.csv') == {'user': 'arnav', 'host': 'box', 'path': '/data/x.csv'}, 'Split at @ and then at the first colon.'` },
          { name: "host only", code: `assert parse_target('box') == {'user': None, 'host': 'box', 'path': ''}, 'User and path are optional.'` },
        ],
      },
    },
    {
      key: "why",
      rung: "prove",
      prompt: (
        <p>
          Explain why logging in with a key is safer than typing a password, even over an encrypted connection, and why SSH
          checks the server&rsquo;s host key before you authenticate.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that the private key never leaves the laptop; only a signature over this session's data is sent, which cannot be reused for another session.",
          "Notes that a password is sent to the server, so a fake or compromised server learns it, and passwords can be guessed or reused.",
          "Explains that checking the host key first ensures you are talking to the real server, not an attacker in the middle.",
          "Concludes that without the host check, an impostor could accept your login and capture what you type.",
        ],
      },
    },
    {
      key: "tmux",
      rung: "stretch",
      prompt: <p>You start a ten-hour training run directly in an SSH session, without tmux, and your Wi-Fi drops after an hour. What usually happens to the run?</p>,
      answer: { kind: "choice", options: ["It is stopped along with the session", "It carries on and you can reattach", "It pauses until you reconnect"], correct: [0] },
    },
  ],

  teachBack:
    "Explain to a friend how SSH key login works, what known_hosts protects against, and how to keep a long job running after you disconnect.",

  glimpse: (
    <p>
      Next, Git, which records every change to your code and moves it between your laptop, GitHub and the GPU machine, over the
      same SSH keys.
    </p>
  ),
};
