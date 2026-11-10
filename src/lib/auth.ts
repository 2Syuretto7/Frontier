import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hash, verify } from "@node-rs/argon2";
import { query } from "./db";
import { SESSION_COOKIE, SESSION_DAYS, readSession, signSession } from "./session";
import { checkStrength, normalisePassphrase } from "./passphrase";

const MAX_FAILURES = 5;
const LOCK_MINUTES = 15;

// OWASP-recommended Argon2id parameters (19 MiB, 2 iterations).
const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

type Account = { passphrase_hash: string; session_version: number };

async function getAccount(): Promise<Account | null> {
  const rows = await query<Account>("SELECT passphrase_hash, session_version FROM account WHERE id = 1");
  return rows[0] ?? null;
}

export async function hasAccount(): Promise<boolean> {
  return (await getAccount()) !== null;
}

async function startSession(sessionVersion: number) {
  const token = await signSession({ sv: sessionVersion });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function createAccount(passphrase: string): Promise<AuthResult> {
  const strength = checkStrength(passphrase);
  if (!strength.ok) return { ok: false, error: strength.reason! };
  const passphraseHash = await hash(normalisePassphrase(passphrase), ARGON);
  // The CHECK (id = 1) constraint and ON CONFLICT guarantee a single account.
  const rows = await query(
    "INSERT INTO account (id, passphrase_hash) VALUES (1, $1) ON CONFLICT (id) DO NOTHING RETURNING id",
    [passphraseHash],
  );
  if (rows.length === 0) return { ok: false, error: "Frontier already has its owner. Sign in instead." };
  await startSession(1);
  return { ok: true };
}

async function isLocked(): Promise<boolean> {
  const rows = await query<{ failures: number }>(
    `SELECT count(*)::int AS failures FROM auth_attempts
     WHERE NOT ok
       AND at > now() - make_interval(mins => $1)
       AND at > coalesce((SELECT max(at) FROM auth_attempts WHERE ok), 'epoch')`,
    [LOCK_MINUTES],
  );
  return (rows[0]?.failures ?? 0) >= MAX_FAILURES;
}

export async function signIn(passphrase: string): Promise<AuthResult> {
  if (await isLocked()) {
    return { ok: false, error: `Too many attempts. Try again in ${LOCK_MINUTES} minutes.` };
  }
  const account = await getAccount();
  const ok = account !== null && (await verify(account.passphrase_hash, normalisePassphrase(passphrase)));
  await query("INSERT INTO auth_attempts (ok) VALUES ($1)", [ok]);
  await query("DELETE FROM auth_attempts WHERE at < now() - interval '30 days'");
  if (!ok || !account) return { ok: false, error: "That passphrase doesn't match." };
  await startSession(account.session_version);
  return { ok: true };
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function signOutEverywhere() {
  await query("UPDATE account SET session_version = session_version + 1 WHERE id = 1");
  await signOut();
}

export async function changePassphrase(current: string, next: string): Promise<AuthResult> {
  const account = await getAccount();
  if (!account || !(await verify(account.passphrase_hash, normalisePassphrase(current)))) {
    return { ok: false, error: "Your current passphrase doesn't match." };
  }
  const strength = checkStrength(next);
  if (!strength.ok) return { ok: false, error: strength.reason! };
  const rows = await query<{ session_version: number }>(
    "UPDATE account SET passphrase_hash = $1, session_version = session_version + 1 WHERE id = 1 RETURNING session_version",
    [await hash(normalisePassphrase(next), ARGON)],
  );
  await startSession(rows[0].session_version);
  return { ok: true };
}

/** Full check for protected pages: valid cookie AND not revoked by "sign out everywhere". */
export async function isSignedIn(): Promise<boolean> {
  const claims = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!claims) return false;
  const account = await getAccount();
  return account !== null && account.session_version === claims.sv;
}

export async function requireOwner() {
  if (!(await isSignedIn())) redirect("/signin");
}
