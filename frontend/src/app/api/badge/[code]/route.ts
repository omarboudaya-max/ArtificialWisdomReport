import { getPublicCredential } from "@/lib/credentials";

const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = await getPublicCredential(code.replace(/\.svg$/, ""));
  const valid = !!c && c.status === "active";
  const label = !c ? "NOT FOUND" : !valid ? c.status.toUpperCase() : c.tier === "reviewed" ? "INDEPENDENTLY REVIEWED" : c.tier === "provisional" ? "PROVISIONAL TRUST" : "ASSESSED";
  const score = c?.aw_gti != null ? String(Math.round(c.aw_gti)) : "—";
  const col = !valid ? "#64748b" : c!.tier === "reviewed" ? "#818cf8" : c!.tier === "provisional" ? "#10b981" : "#38bdf8";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="56" viewBox="0 0 240 56" role="img" aria-label="Artificial Wisdom ${esc(label)} ${score}">
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#0a0e1a"/><stop offset="1" stop-color="#121829"/></linearGradient></defs>
<rect width="240" height="56" rx="12" fill="url(#g)" stroke="${col}" stroke-opacity=".6"/>
<path d="M28 9 41 14v9c0 8-5.5 14.3-13 16.2C20.5 37.3 15 31 15 23v-9l13-5Z" fill="${col}" fill-opacity=".18" stroke="${col}" stroke-width="1.5"/>
<path d="M22 31 28 18l6 13M24.5 27h7" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"/>
<text x="52" y="23" fill="#e6eaf2" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="12" font-weight="700">Artificial Wisdom</text>
<text x="52" y="40" fill="${col}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="9.5" font-weight="700" letter-spacing=".5">${esc(label)}</text>
<line x1="186" y1="10" x2="186" y2="46" stroke="#273149"/>
<text x="213" y="31" text-anchor="middle" fill="${col}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="20" font-weight="800">${score}</text>
<text x="213" y="44" text-anchor="middle" fill="#64708c" font-family="Inter,Arial,sans-serif" font-size="7.5" font-weight="700">AW-GTI</text>
</svg>`;
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=300, s-maxage=300" } });
}
