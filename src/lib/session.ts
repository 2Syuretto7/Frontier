import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "pm_session";
export const SESSION_DAYS = 90;

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET is not set.");
    }
    return new TextEncoder().encode("frontier-development-only-secret-do-not-use");
  }
  return new TextEncoder().encode(value);
}

export type SessionClaims = { sv: number };

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ sv: claims.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("owner")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function readSession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.sub !== "owner" || typeof payload.sv !== "number") return null;
    return { sv: payload.sv };
  } catch {
    return null;
  }
}
