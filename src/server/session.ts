import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";

/** Signed-in user + GitHub token, kept only in an encrypted httpOnly cookie. */
export interface Session {
  token: string;
  login: string;
  name: string;
  avatar: string;
  scope: string;
  since: number;
}

const COOKIE = "sw_session";
const MAX_AGE = 60 * 60 * 24 * 14;
const key = () => crypto.createHash("sha256").update(env.sessionSecret()).digest();

export function seal(data: unknown): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(JSON.stringify(data), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString("base64url");
}

export function unseal<T>(value: string): T | null {
  try {
    const raw = Buffer.from(value, "base64url");
    const d = crypto.createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8")) as T;
  } catch {
    return null;
  }
}

const cookieOpts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };

export async function getSession(): Promise<Session | null> {
  const v = (await cookies()).get(COOKIE)?.value;
  return v ? unseal<Session>(v) : null;
}

export async function setSession(s: Session) {
  (await cookies()).set(COOKIE, seal(s), { ...cookieOpts, maxAge: MAX_AGE });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

/** One-time OAuth `state` value (CSRF protection), valid for 10 minutes. */
export async function issueState(): Promise<string> {
  const state = crypto.randomBytes(16).toString("hex");
  (await cookies()).set("sw_oauth_state", state, { ...cookieOpts, maxAge: 600 });
  return state;
}

export async function consumeState(state: string | null): Promise<boolean> {
  const jar = await cookies();
  const expected = jar.get("sw_oauth_state")?.value;
  jar.delete("sw_oauth_state");
  if (!state || !expected || state.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expected));
}
