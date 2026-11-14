import "server-only";
import { lookup } from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";

/** Normalise user input into an https URL, or throw. */
export function normalizeUrl(input: string): URL {
  let s = (input || "").trim();
  if (!s) throw new Error("A URL is required");
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  const u = new URL(s);
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Only http(s) URLs are supported");
  if (u.username || u.password) throw new Error("URLs with embedded credentials are not allowed");
  return u;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7));
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

/** SSRF guard: refuse hosts that resolve to private / loopback / link-local ranges. */
export async function assertPublicHost(hostname: string): Promise<void> {
  if (process.env.AW_ALLOW_PRIVATE_HOSTS === "1" && process.env.NODE_ENV !== "production") return; // local testing only
  const h = hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.local|.*\.internal|metadata\.google\.internal)$/i.test(h)) throw new Error("Private hosts cannot be scanned");
  const addrs = net.isIP(h) ? [{ address: h }] : await lookup(h, { all: true });
  if (!addrs.length) throw new Error("Host does not resolve");
  for (const a of addrs) if (isPrivateIp(a.address)) throw new Error("Host resolves to a private network address");
}

export interface FetchResult {
  url: string;
  finalUrl: string;
  status: number;
  headers: Headers;
  setCookies: string[];
  body: string;
  bytes: number;
  ttfbMs: number;
  totalMs: number;
  redirects: string[];
}

/** fetch with manual, SSRF-checked redirects, timeout and a body size cap. */
export async function safeFetch(
  input: string,
  opts: { timeoutMs?: number; maxBytes?: number; method?: string; headers?: Record<string, string>; body?: string } = {},
): Promise<FetchResult> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const maxBytes = opts.maxBytes ?? 3_000_000;
  const signal = AbortSignal.timeout(timeoutMs);
  const redirects: string[] = [];
  let current = normalizeUrl(input);
  const start = performance.now();
  for (let hop = 0; hop < 6; hop++) {
    await assertPublicHost(current.hostname);
    const t0 = performance.now();
    const res = await fetch(current, {
      method: opts.method ?? "GET",
      redirect: "manual",
      signal,
      headers: {
        "user-agent": "ArtificialWisdomAssuranceBot/2.0 (+https://www.auditingartificialwisdom.com/methodology)",
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        ...(opts.headers ?? {}),
      },
      body: opts.body,
      cache: "no-store",
    });
    const ttfb = performance.now() - t0;
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      redirects.push(current.toString());
      current = new URL(res.headers.get("location")!, current);
      if (!["http:", "https:"].includes(current.protocol)) throw new Error("Redirect to unsupported protocol");
      continue;
    }
    // read body with cap
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    if (res.body) {
      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > maxBytes) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    const body = new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks));
    const setCookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    return {
      url: input,
      finalUrl: current.toString(),
      status: res.status,
      headers: res.headers,
      setCookies,
      body,
      bytes,
      ttfbMs: Math.round(ttfb),
      totalMs: Math.round(performance.now() - start),
      redirects,
    };
  }
  throw new Error("Too many redirects");
}

export interface TlsInfo {
  ok: boolean;
  protocol?: string | null;
  validTo?: string;
  daysRemaining?: number;
  issuer?: string;
  authorized?: boolean;
  error?: string;
}

export async function inspectTls(hostname: string, timeoutMs = 5000): Promise<TlsInfo> {
  await assertPublicHost(hostname);
  return new Promise((resolve) => {
    const socket = tls.connect({ host: hostname, port: 443, servername: hostname, rejectUnauthorized: false, timeout: timeoutMs }, () => {
      const cert = socket.getPeerCertificate();
      const validTo = cert?.valid_to ? new Date(cert.valid_to) : null;
      const info: TlsInfo = {
        ok: true,
        protocol: socket.getProtocol(),
        authorized: socket.authorized,
        validTo: validTo?.toISOString(),
        daysRemaining: validTo ? Math.floor((validTo.getTime() - Date.now()) / 86_400_000) : undefined,
        issuer: (cert?.issuer?.O as string) || (cert?.issuer?.CN as string) || undefined,
        error: socket.authorized ? undefined : String(socket.authorizationError ?? ""),
      };
      socket.end();
      resolve(info);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ ok: false, error: "TLS handshake timed out" });
    });
    socket.on("error", (e) => resolve({ ok: false, error: e.message }));
  });
}

export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return s[idx];
}
