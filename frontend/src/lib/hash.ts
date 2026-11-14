import { createHash, randomBytes } from "node:crypto";

export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return "[" + v.map(canonicalJson).join(",") + "]";
  const o = v as Record<string, unknown>;
  return "{" + Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => JSON.stringify(k) + ":" + canonicalJson(o[k])).join(",") + "}";
}

export const sha256 = (data: string | Buffer | Uint8Array) => createHash("sha256").update(data).digest("hex");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function credentialCode(): string {
  const b = randomBytes(12);
  const chars = Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join("");
  return `AW-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}
