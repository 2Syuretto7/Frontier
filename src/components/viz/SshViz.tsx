"use client";

import { useState } from "react";

type Step = { from: "you" | "server"; msg: string; note: string; you?: string[]; server?: string[]; alarm?: boolean };

const KEY_STEPS: Step[] = [
  { from: "you", msg: "Connect to gpu-box, port 22", note: "Your laptop opens a network connection to the server and asks to start an SSH session.", you: ["private key  ~/.ssh/id_ed25519", "public key   ~/.ssh/id_ed25519.pub", "known_hosts  (gpu-box's key, saved last time)"], server: ["host private key", "authorized_keys  (your public key)"] },
  { from: "server", msg: "Here is my host public key, and a signature proving I hold its private half", note: "The server proves its identity first, so that you never send anything to an impostor." },
  { from: "you", msg: "Host key matches known_hosts: trusted", note: "Your laptop compares the key with the one saved the first time you connected. If an attacker were in the middle, the key would differ and SSH would refuse loudly." },
  { from: "you", msg: "Agree a fresh session key (Diffie-Hellman)", note: "Both sides combine random secrets to agree a key that was never sent over the network. Everything from now on is encrypted with it." },
  { from: "you", msg: "I am asha; I can prove I hold this public key", note: "You offer your public key. Sharing it is harmless: it can only check signatures, not make them." },
  { from: "server", msg: "That key is in authorized_keys. Sign this session's data", note: "The server finds your public key in ~/.ssh/authorized_keys and asks you to sign data unique to this session." },
  { from: "you", msg: "Signature made with my private key", note: "Your laptop signs with the private key, which never leaves the laptop. A recorded signature is useless for any other session." },
  { from: "server", msg: "Signature checks out. Welcome, asha", note: "The server verifies the signature with your public key. You are in, and no password crossed the network." },
];

const MITM: Step[] = [
  KEY_STEPS[0],
  { from: "server", msg: "Here is my host public key (a DIFFERENT one)", note: "Someone on the network is pretending to be gpu-box, or the server was reinstalled. The host key it presents is not the one you saved." },
  { from: "you", msg: "WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!", note: "SSH stops before sending anything. Find out why the key changed, from the server's administrator, before you ever accept the new one.", alarm: true },
];

/** The steps of an SSH login with keys, and what happens when the server's identity does not match. */
export function SshViz() {
  const [mitm, setMitm] = useState(false);
  const [i, setI] = useState(0);
  const steps = mitm ? MITM : KEY_STEPS;
  const s = steps[Math.min(i, steps.length - 1)];
  const first = KEY_STEPS[0];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Scenario">
          <button type="button" className="seg" aria-pressed={!mitm} onClick={() => { setMitm(false); setI(0); }}>Normal login</button>
          <button type="button" className="seg" aria-pressed={mitm} onClick={() => { setMitm(true); setI(0); }}>Host key changed</button>
        </div>
      </div>
      <div className="ssh-grid">
        <div className="ssh-party"><h4>Your laptop</h4><ul>{first.you!.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div className="ssh-party"><h4>gpu-box</h4><ul>{first.server!.map((x) => <li key={x}>{x}</li>)}</ul></div>
      </div>
      <ol className="ssh-msgs">
        {steps.slice(0, i + 1).map((m, k) => (
          <li key={k} className={`ssh-msg ${m.from === "you" ? "is-you" : "is-server"}${m.alarm ? " is-alarm" : ""}${k === i ? " is-on" : ""}`}>
            <span className="ssh-who">{m.from === "you" ? "laptop" : "gpu-box"}</span>{m.msg}
          </li>
        ))}
      </ol>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setI(i + 1)} disabled={i >= steps.length - 1}>Next step</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">Step {i + 1} of {steps.length}. {s.note}</figcaption>
    </figure>
  );
}
