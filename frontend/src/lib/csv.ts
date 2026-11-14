/** Minimal RFC-4180 CSV parser (quotes, escaped quotes, CRLF). Returns header + rows as objects. */
export function parseCsv(text: string, maxRows = 200_000): { headers: string[]; rows: Record<string, string>[] } {
  const out: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  const s = text.replace(/^﻿/, "");
  while (i < s.length) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === "," || c === ";" || c === "\t") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") {
      row.push(field); field = "";
      if (row.some((x) => x.trim() !== "")) out.push(row);
      row = [];
      if (out.length > maxRows) break;
      i++; continue;
    }
    field += c; i++;
  }
  row.push(field);
  if (row.some((x) => x.trim() !== "")) out.push(row);
  if (!out.length) return { headers: [], rows: [] };
  const headers = out[0].map((h) => h.trim());
  const rows = out.slice(1).map((r) => Object.fromEntries(headers.map((h, j) => [h, (r[j] ?? "").trim()])));
  return { headers, rows };
}
