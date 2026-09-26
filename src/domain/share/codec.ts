import type { SharePayload } from "./payload";

/**
 * Share-link codec: JSON → deflate-raw → (optional AES-GCM) → base64url.
 * Layout: [version][flags] then either the deflated bytes, or
 * [salt 16][iv 12][ciphertext] when a password is set. Runs in browsers and
 * Node 18+ (CompressionStream + WebCrypto); nothing ever leaves the client.
 */

const VERSION = 1;
const ENCRYPTED = 1;
const ITERATIONS = 150_000;

export class ShareDecodeError extends Error {
  constructor(message: string, public reason: "corrupt" | "password" | "version") {
    super(message);
  }
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

async function keyFor(password: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function encodeShare(payload: SharePayload, password?: string): Promise<string> {
  const packed = await pipe(new TextEncoder().encode(JSON.stringify(payload)), new CompressionStream("deflate-raw"));
  if (!password) return toBase64Url(new Uint8Array([VERSION, 0, ...packed]));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFor(password, salt), packed as BufferSource));
  return toBase64Url(new Uint8Array([VERSION, ENCRYPTED, ...salt, ...iv, ...sealed]));
}

/** True when the link needs a password before it can be decoded. */
export function needsPassword(encoded: string): boolean {
  try {
    return fromBase64Url(encoded.slice(0, 4))[1] === ENCRYPTED;
  } catch {
    return false;
  }
}

export async function decodeShare(encoded: string, password?: string): Promise<SharePayload> {
  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(encoded.trim());
  } catch {
    throw new ShareDecodeError("This link is damaged or incomplete.", "corrupt");
  }
  if (bytes[0] !== VERSION) throw new ShareDecodeError("This link was made by a newer version of md2slides.", "version");
  let packed = bytes.subarray(2);
  if (bytes[1] === ENCRYPTED) {
    if (!password) throw new ShareDecodeError("This deck is password protected.", "password");
    try {
      const key = await keyFor(password, bytes.subarray(2, 18));
      packed = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.subarray(18, 30) as BufferSource }, key, bytes.subarray(30) as BufferSource));
    } catch {
      throw new ShareDecodeError("Wrong password.", "password");
    }
  }
  try {
    const payload = JSON.parse(new TextDecoder().decode(await pipe(packed, new DecompressionStream("deflate-raw")))) as SharePayload;
    if (payload.v !== 1 || typeof payload.md !== "string") throw new Error("bad payload");
    return payload;
  } catch {
    throw new ShareDecodeError("This link is damaged or incomplete.", "corrupt");
  }
}

/** Link-length guidance: most chat apps handle ~8 KB; browsers far more. */
export const LINK_WARN = 8_000;
export const LINK_MAX = 1_500_000;
export const linkHealth = (url: string) => (url.length > LINK_MAX ? "too-long" : url.length > LINK_WARN ? "long" : "ok");
