import "server-only";
import { inspectTls, normalizeUrl, percentile, safeFetch, type FetchResult } from "./net";
import type { CheckResult, Dimension, Severity, CheckStatus } from "./types";

type Mk = Omit<CheckResult, "source" | "weight" | "severity"> & { weight?: number; severity?: Severity };
const mk = (c: Mk): CheckResult => ({ source: "url_scan", weight: 1, severity: "medium", ...c });

const untested = (key: string, name: string, dimension: Dimension, reason: string, weight = 1): CheckResult =>
  mk({ key, name, dimension, status: "untested", score: null, weight, measured: reason });

const statusOf = (score: number): CheckStatus => (score >= 80 ? "pass" : score >= 50 ? "warn" : "fail");

const SECRET_PATTERNS: { name: string; re: RegExp; critical: boolean }[] = [
  { name: "Anthropic API key", re: /sk-ant-[A-Za-z0-9_-]{20,}/g, critical: true },
  { name: "OpenAI API key", re: /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}/g, critical: true },
  { name: "Groq API key", re: /\bgsk_[A-Za-z0-9]{32,}/g, critical: true },
  { name: "Hugging Face token", re: /\bhf_[A-Za-z]{30,}/g, critical: true },
  { name: "Replicate token", re: /\br8_[A-Za-z0-9]{30,}/g, critical: true },
  { name: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/g, critical: true },
  { name: "Stripe secret key", re: /\bsk_live_[A-Za-z0-9]{20,}/g, critical: true },
  { name: "Supabase service-role JWT", re: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]*cm9sZSI6InNlcnZpY2Vfcm9sZS[A-Za-z0-9_-]*\.[A-Za-z0-9_-]{10,}/g, critical: true },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/g, critical: false },
];

const AI_VENDORS: [string, RegExp][] = [
  ["OpenAI", /openai\.com|api\.openai|chatgpt/i],
  ["Anthropic / Claude", /anthropic\.com|claude\.ai/i],
  ["Google Gemini / Vertex AI", /generativelanguage\.googleapis|gemini|vertexai/i],
  ["Mistral AI", /mistral\.ai/i],
  ["Cohere", /cohere\.(ai|com)/i],
  ["Hugging Face", /huggingface\.co/i],
  ["Groq", /groq\.com/i],
  ["Vercel AI SDK", /@ai-sdk|ai-sdk\.dev/i],
  ["LangChain", /langchain/i],
  ["Intercom (Fin AI)", /intercom(cdn)?\.(io|com)|widget\.intercom/i],
  ["Drift", /js\.driftt\.com|drift\.com/i],
  ["Zendesk", /zdassets\.com|zendesk/i],
  ["Tidio", /tidio\.co/i],
  ["Crisp", /crisp\.chat/i],
  ["Chatbase", /chatbase\.co/i],
  ["Voiceflow", /voiceflow\.com/i],
  ["Botpress", /botpress\.(cloud|com)/i],
  ["Dialogflow", /dialogflow/i],
  ["ElevenLabs", /elevenlabs\.io/i],
  ["TensorFlow.js", /tensorflow|tfjs/i],
  ["ONNX Runtime Web", /onnxruntime/i],
];

const TRACKERS: [string, RegExp][] = [
  ["Google Analytics", /google-analytics\.com|gtag\(/i],
  ["Google Tag Manager", /googletagmanager\.com/i],
  ["DoubleClick", /doubleclick\.net/i],
  ["Meta Pixel", /connect\.facebook\.net|fbq\(/i],
  ["Hotjar", /hotjar\.com/i],
  ["Microsoft Clarity", /clarity\.ms/i],
  ["Segment", /cdn\.segment\.com/i],
  ["Mixpanel", /mixpanel/i],
  ["Amplitude", /amplitude\.com/i],
  ["TikTok Pixel", /analytics\.tiktok\.com/i],
  ["LinkedIn Insight", /snap\.licdn\.com/i],
  ["X / Twitter Ads", /static\.ads-twitter\.com/i],
  ["HubSpot", /js\.hs-scripts\.com|hs-analytics/i],
  ["Criteo", /criteo\.(com|net)/i],
  ["Taboola", /taboola\.com/i],
];

const CMP = /cookiebot|onetrust|cookielaw|cookieyes|didomi|usercentrics|quantcast|osano|iubenda|termly|klaro|axeptio|tarteaucitron|complianz|cookie-?consent|cookie-?banner|gdpr-?consent|consentmanager|cookiefirst/i;

interface Link { href: string; text: string }
function extractLinks(html: string, base: string): Link[] {
  const out: Link[] = [];
  const re = /<a\b[^>]*?href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 600) {
    try {
      out.push({ href: new URL(m[1], base).toString(), text: m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) });
    } catch { /* ignore bad href */ }
  }
  return out;
}
const findLink = (links: Link[], re: RegExp) => links.find((l) => re.test(l.href) || re.test(l.text));
const stripHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");

async function settle<T>(p: Promise<T>): Promise<T | null> {
  try { return await p; } catch { return null; }
}

export interface UrlScanOutput {
  checks: CheckResult[];
  meta: {
    finalUrl?: string;
    title?: string;
    vendors: string[];
    trackers: string[];
    latency?: { samples: number[]; p50: number; p95: number };
    bytes?: number;
    tls?: Awaited<ReturnType<typeof inspectTls>>;
    error?: string;
  };
}

export async function runUrlScan(rawUrl: string, onCheck?: (c: CheckResult) => void): Promise<UrlScanOutput> {
  const checks: CheckResult[] = [];
  const push = (c: CheckResult) => { checks.push(c); onCheck?.(c); };
  let url: URL;
  try {
    url = normalizeUrl(rawUrl);
  } catch (e) {
    return { checks: [], meta: { vendors: [], trackers: [], error: (e as Error).message } };
  }
  const origin = `https://${url.host}`;
  const httpsUrl = `https://${url.host}${url.pathname}${url.search}`;

  // ---- parallel network phase ----------------------------------------
  const [main, httpProbe, tlsInfo, robots, llms, secTxt, green] = await Promise.all([
    settle(safeFetch(httpsUrl, { timeoutMs: 9000 })),
    settle(safeFetch(`http://${url.host}/`, { timeoutMs: 5000, maxBytes: 1 })),
    settle(inspectTls(url.hostname)),
    settle(safeFetch(`${origin}/robots.txt`, { timeoutMs: 4000, maxBytes: 200_000 })),
    settle(safeFetch(`${origin}/llms.txt`, { timeoutMs: 4000, maxBytes: 200_000 })),
    settle(safeFetch(`${origin}/.well-known/security.txt`, { timeoutMs: 4000, maxBytes: 50_000 })),
    settle(
      fetch(`https://api.thegreenwebfoundation.org/api/v3/greencheck/${url.hostname}`, { signal: AbortSignal.timeout(4000) }).then((r) =>
        r.ok ? (r.json() as Promise<{ green?: boolean; hosted_by?: string }>) : null,
      ),
    ),
  ]);

  // ---- Reliability: availability ----------------------------------------
  if (!main) {
    push(mk({ key: "rel.availability", name: "Availability over HTTPS", dimension: "reliability", status: "fail", score: 0, severity: "critical", weight: 3, measured: "Unreachable over HTTPS", threshold: "HTTP 2xx within 9s" }));
    push(mk({ key: "sec.tls_valid", name: "Valid TLS certificate", dimension: "safety_security", status: tlsInfo?.authorized ? "pass" : "fail", score: tlsInfo?.authorized ? 100 : 0, severity: "critical", gate: true, weight: 3, measured: tlsInfo?.error || (tlsInfo?.authorized ? "Valid" : "No valid TLS"), threshold: "Publicly trusted certificate" }));
    return { checks, meta: { vendors: [], trackers: [], tls: tlsInfo ?? undefined, error: "Site unreachable over HTTPS" } };
  }
  const ok = main.status >= 200 && main.status < 400;
  push(mk({ key: "rel.availability", name: "Availability over HTTPS", dimension: "reliability", status: ok ? "pass" : "fail", score: ok ? 100 : 10, severity: ok ? "info" : "high", weight: 3, measured: `HTTP ${main.status}`, threshold: "HTTP 2xx", evidence: { finalUrl: main.finalUrl, redirects: main.redirects } }));

  const h = main.headers;
  const html = main.body;

  // ---- Security ----------------------------------------------------------
  const tlsOk = !!tlsInfo?.ok && !!tlsInfo.authorized && (tlsInfo.daysRemaining ?? 0) > 0;
  push(mk({ key: "sec.tls_valid", name: "Valid TLS certificate", dimension: "safety_security", status: tlsOk ? "pass" : "fail", score: tlsOk ? 100 : 0, severity: "critical", gate: true, weight: 3, measured: tlsOk ? `Valid, issued by ${tlsInfo?.issuer ?? "unknown CA"}` : tlsInfo?.error || "Invalid certificate", threshold: "Publicly trusted, unexpired certificate", evidence: { ...tlsInfo } }));
  if (tlsInfo?.ok) {
    const proto = tlsInfo.protocol ?? "";
    const s = proto === "TLSv1.3" ? 100 : proto === "TLSv1.2" ? 85 : 20;
    push(mk({ key: "sec.tls_modern", name: "Modern TLS protocol", dimension: "safety_security", status: statusOf(s), score: s, severity: s < 50 ? "high" : "low", measured: proto || "unknown", threshold: "TLS 1.2 minimum, TLS 1.3 preferred" }));
    const d = tlsInfo.daysRemaining ?? 0;
    const sc = d >= 21 ? 100 : d >= 7 ? 60 : 10;
    push(mk({ key: "sec.cert_expiry", name: "Certificate expiry horizon", dimension: "reliability", status: statusOf(sc), score: sc, severity: d < 7 ? "high" : "low", measured: `${d} days remaining`, threshold: "≥ 21 days", evidence: { validTo: tlsInfo.validTo } }));
  }

  const redirectsToHttps = !!httpProbe && httpProbe.finalUrl.startsWith("https://");
  push(mk({ key: "sec.https_enforced", name: "HTTP → HTTPS redirect", dimension: "safety_security", status: redirectsToHttps ? "pass" : httpProbe ? "fail" : "warn", score: redirectsToHttps ? 100 : httpProbe ? 20 : 60, severity: "high", measured: httpProbe ? (redirectsToHttps ? "Redirects to HTTPS" : `Served over HTTP (${httpProbe.status})`) : "Port 80 not reachable", threshold: "All HTTP traffic redirected to HTTPS" }));

  const hsts = h.get("strict-transport-security") ?? "";
  const maxAge = Number(/max-age=(\d+)/i.exec(hsts)?.[1] ?? 0);
  const hstsScore = maxAge >= 15552000 ? 100 : maxAge > 0 ? 60 : 0;
  push(mk({ key: "sec.hsts", name: "HSTS policy", dimension: "safety_security", status: statusOf(hstsScore), score: hstsScore, severity: "medium", measured: hsts || "Missing", threshold: "max-age ≥ 15552000 (180 days)" }));

  const csp = h.get("content-security-policy") ?? "";
  const cspScore = !csp ? 0 : /unsafe-inline|unsafe-eval|\*/.test(csp) ? 60 : 100;
  push(mk({ key: "sec.csp", name: "Content-Security-Policy", dimension: "safety_security", status: statusOf(cspScore), score: cspScore, severity: "medium", measured: csp ? csp.slice(0, 140) + (csp.length > 140 ? "…" : "") : "Missing", threshold: "CSP present without unsafe-inline / unsafe-eval / wildcards" }));

  const xfo = h.get("x-frame-options");
  const frameOk = !!xfo || /frame-ancestors/i.test(csp);
  push(mk({ key: "sec.frame_protection", name: "Clickjacking protection", dimension: "safety_security", status: frameOk ? "pass" : "fail", score: frameOk ? 100 : 0, severity: "low", measured: xfo ? `X-Frame-Options: ${xfo}` : frameOk ? "CSP frame-ancestors" : "Missing", threshold: "X-Frame-Options or CSP frame-ancestors" }));

  const nosniff = (h.get("x-content-type-options") ?? "").toLowerCase() === "nosniff";
  push(mk({ key: "sec.nosniff", name: "MIME sniffing protection", dimension: "safety_security", status: nosniff ? "pass" : "fail", score: nosniff ? 100 : 0, severity: "low", weight: 0.5, measured: nosniff ? "nosniff" : "Missing", threshold: "X-Content-Type-Options: nosniff" }));

  const rp = h.get("referrer-policy");
  push(mk({ key: "sec.referrer_policy", name: "Referrer-Policy", dimension: "privacy", status: rp ? "pass" : "warn", score: rp ? 100 : 50, severity: "low", weight: 0.5, measured: rp ?? "Missing (browser default)", threshold: "strict-origin-when-cross-origin or stricter" }));

  const pp = h.get("permissions-policy");
  push(mk({ key: "sec.permissions_policy", name: "Permissions-Policy", dimension: "safety_security", status: pp ? "pass" : "warn", score: pp ? 100 : 50, severity: "low", weight: 0.5, measured: pp ? pp.slice(0, 100) : "Missing", threshold: "Restricts camera, microphone, geolocation" }));

  if (main.setCookies.length) {
    const weak = main.setCookies.filter((c) => !/;\s*secure/i.test(c) || !/;\s*samesite/i.test(c));
    const s = Math.round(100 * (1 - weak.length / main.setCookies.length));
    push(mk({ key: "sec.cookie_flags", name: "Cookie security flags", dimension: "privacy", status: statusOf(s), score: s, severity: "medium", measured: `${main.setCookies.length - weak.length}/${main.setCookies.length} cookies set Secure + SameSite`, threshold: "All cookies Secure and SameSite", evidence: { weak: weak.map((c) => c.split("=")[0]) } }));
  } else {
    push(mk({ key: "sec.cookie_flags", name: "Cookie security flags", dimension: "privacy", status: "info", score: null, severity: "info", measured: "No cookies set on first load" }));
  }

  const server = [h.get("server"), h.get("x-powered-by")].filter(Boolean).join(" · ");
  const leaksVersion = /\d+\.\d+/.test(server);
  push(mk({ key: "sec.server_disclosure", name: "Server version disclosure", dimension: "safety_security", status: leaksVersion ? "warn" : "pass", score: leaksVersion ? 50 : 100, severity: "low", weight: 0.5, measured: server || "Not disclosed", threshold: "No software versions in response headers" }));

  const secTxtOk = !!secTxt && secTxt.status === 200 && /contact:/i.test(secTxt.body);
  push(mk({ key: "sec.security_txt", name: "Vulnerability disclosure (security.txt)", dimension: "safety_security", status: secTxtOk ? "pass" : "warn", score: secTxtOk ? 100 : 40, severity: "low", measured: secTxtOk ? "Published" : "Not found", threshold: "RFC 9116 security.txt with Contact field" }));

  const mixed = (html.match(/\s(?:src|href)\s*=\s*["']http:\/\/[^"']+\.(?:js|css|png|jpg|jpeg|gif|svg|webp)/gi) ?? []).length;
  push(mk({ key: "sec.mixed_content", name: "Mixed content", dimension: "safety_security", status: mixed ? "fail" : "pass", score: mixed ? 30 : 100, severity: "medium", weight: 0.5, measured: mixed ? `${mixed} insecure sub-resources` : "None detected", threshold: "No HTTP sub-resources on HTTPS pages" }));

  // ---- Exposed AI / cloud secrets in client code (gate) ------------------
  const scriptSrcs = Array.from(html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi))
    .map((m) => { try { return new URL(m[1], main.finalUrl); } catch { return null; } })
    .filter((u): u is URL => !!u && u.host === new URL(main.finalUrl).host)
    .slice(0, 6);
  const scripts = await Promise.all(scriptSrcs.map((s) => settle(safeFetch(s.toString(), { timeoutMs: 4000, maxBytes: 1_500_000 }))));
  const corpus: { where: string; text: string }[] = [{ where: main.finalUrl, text: html }, ...scripts.filter((s): s is FetchResult => !!s).map((s) => ({ where: s.finalUrl, text: s.body }))];
  const hits: { type: string; where: string; preview: string; critical: boolean }[] = [];
  for (const { where, text } of corpus)
    for (const p of SECRET_PATTERNS)
      for (const m of text.matchAll(p.re)) {
        if (hits.length > 20) break;
        hits.push({ type: p.name, where, preview: m[0].slice(0, 8) + "…" + m[0].slice(-4), critical: p.critical });
      }
  const crit = hits.filter((x) => x.critical);
  push(mk({
    key: "sec.exposed_secrets", name: "Exposed AI / cloud credentials in client code", dimension: "safety_security",
    status: crit.length ? "fail" : hits.length ? "warn" : "pass", score: crit.length ? 0 : hits.length ? 70 : 100,
    severity: crit.length ? "critical" : hits.length ? "low" : "info", gate: true, weight: 4,
    measured: crit.length ? `${crit.length} secret key(s) exposed: ${[...new Set(crit.map((x) => x.type))].join(", ")}` : hits.length ? `${hits.length} restricted-use public key(s) (e.g. Google/Firebase)` : `No secrets in HTML + ${scripts.filter(Boolean).length} first-party scripts`,
    threshold: "No secret API keys shipped to browsers", evidence: { hits, scanned: corpus.map((c) => c.where) },
  }));

  // ---- Reliability: latency, compression, caching -----------------------
  const samples = [main.ttfbMs];
  for (let i = 0; i < 4; i++) {
    const r = await settle(safeFetch(httpsUrl, { timeoutMs: 4000, maxBytes: 1 }));
    if (r) samples.push(r.ttfbMs);
  }
  const p50 = percentile(samples, 50), p95 = percentile(samples, 95);
  const latScore = p95 <= 300 ? 100 : p95 <= 800 ? 85 : p95 <= 1500 ? 65 : p95 <= 3000 ? 40 : 15;
  push(mk({ key: "rel.latency_p95", name: "Server response latency (TTFB P95)", dimension: "reliability", status: statusOf(latScore), score: latScore, severity: latScore < 50 ? "medium" : "low", weight: 2, measured: `P50 ${p50} ms · P95 ${p95} ms (n=${samples.length})`, threshold: "P95 TTFB ≤ 800 ms", evidence: { samples, region: process.env.VERCEL_REGION ?? "local" } }));

  const enc = h.get("content-encoding");
  push(mk({ key: "rel.compression", name: "Response compression", dimension: "sustainability", status: enc ? "pass" : "warn", score: enc ? 100 : 40, severity: "low", measured: enc ?? "Uncompressed", threshold: "gzip, br or zstd" }));

  const cache = [h.get("cache-control"), h.get("cf-cache-status") && `cf:${h.get("cf-cache-status")}`, h.get("x-vercel-cache") && `vercel:${h.get("x-vercel-cache")}`, h.get("x-cache")].filter(Boolean).join(" · ");
  const cdn = /cloudflare|vercel|akamai|fastly|cloudfront|netlify/i.test([h.get("server"), h.get("via"), cache].join(" "));
  push(mk({ key: "rel.cdn", name: "Edge caching / CDN", dimension: "reliability", status: cdn || /max-age|s-maxage/.test(cache) ? "pass" : "warn", score: cdn ? 100 : /max-age|s-maxage/.test(cache) ? 80 : 50, severity: "low", weight: 0.5, measured: cache || "No cache headers", threshold: "CDN or explicit caching policy" }));

  // ---- Ethics: accessibility basics -------------------------------------
  const lang = /<html[^>]*\blang\s*=\s*["']([^"']+)["']/i.exec(html)?.[1];
  push(mk({ key: "eth.lang_attr", name: "Declared page language (a11y)", dimension: "ethics_fairness", status: lang ? "pass" : "fail", score: lang ? 100 : 20, severity: "low", weight: 0.5, measured: lang ?? "Missing", threshold: "<html lang> set (WCAG 3.1.1)" }));
  const imgs = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map((m) => m[0]);
  if (imgs.length) {
    const withAlt = imgs.filter((t) => /\balt\s*=/i.test(t)).length;
    const s = Math.round((100 * withAlt) / imgs.length);
    push(mk({ key: "eth.img_alt", name: "Image text alternatives (a11y)", dimension: "ethics_fairness", status: statusOf(s), score: s, severity: "low", measured: `${withAlt}/${imgs.length} images have alt text`, threshold: "100% (WCAG 1.1.1)" }));
  }
  const viewport = /<meta[^>]+name\s*=\s*["']viewport["']/i.test(html);
  push(mk({ key: "eth.viewport", name: "Mobile-accessible viewport", dimension: "ethics_fairness", status: viewport ? "pass" : "warn", score: viewport ? 100 : 40, severity: "low", weight: 0.5, measured: viewport ? "Responsive viewport" : "No viewport meta", threshold: "Responsive layout" }));

  // ---- Transparency ---------------------------------------------------------
  const links = extractLinks(html, main.finalUrl);
  const text = stripHtml(html).toLowerCase();
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim();

  const vendors = AI_VENDORS.filter(([, re]) => re.test(html) || scripts.some((s) => s && re.test(s.body.slice(0, 400_000)))).map(([n]) => n);
  push(mk({ key: "tr.ai_vendors", name: "AI supply chain detected", dimension: "transparency", status: "info", score: null, severity: "info", measured: vendors.length ? vendors.join(", ") : "No third-party AI SDKs or widgets detected client-side", evidence: { vendors } }));

  const aiDisclosure = /\b(artificial intelligence|ai[- ]powered|ai[- ]generated|generated by ai|ai assistant|chatbot|machine learning|intelligence artificielle|ذكاء اصطناعي|ذكاء الاصطناعي|large language model|llm)\b/i.test(text);
  push(mk({ key: "tr.ai_disclosure", name: "AI use disclosed to users", dimension: "transparency", status: aiDisclosure ? "pass" : vendors.length ? "fail" : "warn", score: aiDisclosure ? 100 : vendors.length ? 20 : 50, severity: vendors.length && !aiDisclosure ? "high" : "medium", weight: 2, measured: aiDisclosure ? "AI use is mentioned on the page" : "No AI disclosure found on the page", threshold: "Users informed they interact with AI (EU AI Act Art. 50)" }));

  const aiPolicy = findLink(links, /model[- ]card|system[- ]card|responsible[- ]ai|ai[- ]policy|ai[- ]principles|ai[- ]ethics|trust[- ]center|transparency/i);
  push(mk({ key: "tr.ai_policy", name: "Published AI policy / model documentation", dimension: "transparency", status: aiPolicy ? "pass" : "warn", score: aiPolicy ? 100 : 30, severity: "medium", weight: 1.5, measured: aiPolicy ? aiPolicy.href : "No AI policy, model card or trust page linked", threshold: "Public AI policy or model/system card" }));

  const terms = findLink(links, /terms|conditions|\bcgu\b|\bcgv\b|mentions[- ]l[ée]gales|legal|شروط/i);
  push(mk({ key: "tr.terms", name: "Terms of service", dimension: "transparency", status: terms ? "pass" : "warn", score: terms ? 100 : 40, severity: "low", measured: terms?.href ?? "Not linked from page" }));
  const contact = findLink(links, /contact|imprint|impressum|about|à-propos|a-propos|اتصل/i);
  push(mk({ key: "tr.contact", name: "Accountable entity & contact", dimension: "governance", status: contact ? "pass" : "warn", score: contact ? 100 : 40, severity: "low", weight: 0.5, measured: contact?.href ?? "No contact / imprint link" }));

  const robotsTxt = robots && robots.status === 200 ? robots.body : "";
  const aiBots = ["GPTBot", "ClaudeBot", "anthropic-ai", "Google-Extended", "CCBot", "PerplexityBot", "Bytespider", "Applebot-Extended"].filter((b) => robotsTxt.toLowerCase().includes(b.toLowerCase()));
  const hasLlms = !!llms && llms.status === 200 && llms.body.length > 20 && !/<html/i.test(llms.body);
  const crawlerScore = aiBots.length || hasLlms ? 100 : robotsTxt ? 60 : 30;
  push(mk({ key: "tr.ai_crawler_policy", name: "AI crawler & content-use policy", dimension: "transparency", status: statusOf(crawlerScore), score: crawlerScore, severity: "low", weight: 0.5, measured: [aiBots.length ? `robots.txt addresses ${aiBots.join(", ")}` : robotsTxt ? "robots.txt has no AI-crawler rules" : "No robots.txt", hasLlms ? "llms.txt published" : ""].filter(Boolean).join(" · "), threshold: "Explicit AI crawler rules or llms.txt" }));

  // ---- Privacy ---------------------------------------------------------------
  const privacy = findLink(links, /privacy|confidentialit|datenschutz|protection[- ]des[- ]donn|données[- ]personnelles|خصوصية/i);
  push(mk({ key: "priv.policy_link", name: "Privacy notice published", dimension: "privacy", status: privacy ? "pass" : "fail", score: privacy ? 100 : 0, severity: "high", weight: 2, measured: privacy?.href ?? "No privacy notice linked", threshold: "Privacy notice accessible from every page (GDPR Art. 12–13)" }));

  const trackers = TRACKERS.filter(([, re]) => re.test(html)).map(([n]) => n);
  const consent = CMP.test(html) || scripts.some((s) => s && CMP.test(s.body.slice(0, 300_000)));
  const consentScore = consent ? 100 : trackers.length ? 10 : 80;
  push(mk({ key: "priv.consent", name: "Consent management for tracking", dimension: "privacy", status: statusOf(consentScore), score: consentScore, severity: trackers.length && !consent ? "high" : "low", weight: 1.5, measured: consent ? "Consent platform detected" : trackers.length ? `${trackers.length} tracker(s) loaded with no consent platform detected` : "No trackers, no consent platform required", threshold: "Prior consent before non-essential tracking (ePrivacy / GDPR)", evidence: { trackers } }));
  const trScore = trackers.length === 0 ? 100 : trackers.length <= 2 ? 80 : trackers.length <= 5 ? 55 : 30;
  push(mk({ key: "priv.trackers", name: "Third-party tracker exposure", dimension: "privacy", status: statusOf(trScore), score: trScore, severity: "low", measured: trackers.length ? trackers.join(", ") : "None detected", threshold: "≤ 2 third-party trackers" }));

  if (privacy) {
    const pp = await settle(safeFetch(privacy.href, { timeoutMs: 5000, maxBytes: 1_500_000 }));
    if (pp && pp.status < 400) {
      const t = stripHtml(pp.body).toLowerCase();
      const rights = [
        ["legal basis", /legal basis|lawful basis|base légale|base juridique|article 6/],
        ["data subject rights", /right to (access|erasure|rectification|object|portability)|droit d'accès|droit à l'effacement|droits? des personnes/],
        ["controller / DPO contact", /data protection officer|\bdpo\b|délégué à la protection|controller|responsable du traitement/],
        ["retention period", /retention|retain|conserv(ation|ons)|durée de conservation/],
        ["international transfers", /transfer|standard contractual|transfert/],
        ["supervisory authority / complaint", /supervisory authority|lodge a complaint|cnil|ico\b|inpdp|autorité de contrôle|réclamation/],
      ] as const;
      const found = rights.filter(([, re]) => re.test(t)).map(([n]) => n);
      const s = Math.round((100 * found.length) / rights.length);
      push(mk({ key: "priv.gdpr_rights", name: "Privacy notice completeness", dimension: "privacy", status: statusOf(s), score: s, severity: "medium", weight: 1.5, measured: `${found.length}/${rights.length} required elements found`, threshold: "All GDPR Art. 13 elements", evidence: { found, missing: rights.filter(([n]) => !found.includes(n)).map(([n]) => n) } }));
      const aiPriv = /automated decision|profiling|artificial intelligence|machine learning|\bai\b|décision automatisée|profilage/.test(t);
      push(mk({ key: "priv.ai_processing", name: "AI / automated decision-making disclosed in privacy notice", dimension: "privacy", status: aiPriv ? "pass" : vendors.length ? "fail" : "warn", score: aiPriv ? 100 : vendors.length ? 25 : 60, severity: "medium", measured: aiPriv ? "AI processing or automated decisions disclosed" : "Not mentioned", threshold: "Disclose AI processing & Art. 22 automated decisions" }));
    } else {
      push(untested("priv.gdpr_rights", "Privacy notice completeness", "privacy", "Privacy page could not be retrieved", 1.5));
    }
  } else {
    push(untested("priv.gdpr_rights", "Privacy notice completeness", "privacy", "No privacy notice to analyse", 1.5));
  }

  // ---- Sustainability ---------------------------------------------------------
  const kb = Math.round(main.bytes / 1024);
  const pwScore = kb <= 100 ? 100 : kb <= 300 ? 85 : kb <= 700 ? 65 : kb <= 1500 ? 40 : 20;
  push(mk({ key: "sus.page_weight", name: "HTML document weight", dimension: "sustainability", status: statusOf(pwScore), score: pwScore, severity: "low", measured: `${kb} KB (decoded HTML)`, threshold: "≤ 300 KB" }));
  // Sustainable Web Design model (v4 coefficients, approximate): 0.30 kWh/GB, 494 gCO2e/kWh global grid.
  const gb = main.bytes / 1e9;
  const grams = gb * 0.3 * (green?.green ? 50 : 494);
  push(mk({ key: "sus.co2_per_view", name: "Estimated CO₂e per page view (document only)", dimension: "sustainability", status: "info", score: null, severity: "info", measured: `${(grams * 1000).toFixed(2)} mgCO₂e per view · ${(grams * 1000).toFixed(1)} g per 1,000 views`, evidence: { method: "Sustainable Web Design model, approx. v4 coefficients (0.30 kWh/GB; 494 gCO2e/kWh global average, 50 g if verified green hosting). Boundary: first-load HTML document only — lower bound." } }));
  if (green) {
    push(mk({ key: "sus.green_hosting", name: "Verified green hosting", dimension: "sustainability", status: green.green ? "pass" : "warn", score: green.green ? 100 : 40, severity: "low", measured: green.green ? `Green (${green.hosted_by ?? "verified"})` : "Not verified by the Green Web Foundation", threshold: "Renewable-powered hosting" }));
  } else {
    push(untested("sus.green_hosting", "Verified green hosting", "sustainability", "Green Web Foundation lookup unavailable"));
  }

  return {
    checks,
    meta: { finalUrl: main.finalUrl, title, vendors, trackers, latency: { samples, p50, p95 }, bytes: main.bytes, tls: tlsInfo ?? undefined },
  };
}
