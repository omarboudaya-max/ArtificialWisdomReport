"use client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PdfData {
  id: string; org: string; createdAt: string; durationMs: number | null; awGti: number | null; rating: string | null; coverage: number;
  technical: number | null; governance: number | null; methodology: string; suite: string; sha: string | null; credentialStatus: string; credentialCode: string | null;
  system: { name: string; system_type: string; version: string | null; url: string | null; provider: string | null; model_name: string | null };
  dims: { label: string; weight: number; score: number | null; tested: number; total: number; coverage: number }[];
  gates: { name: string; passed: boolean; reason: string }[];
  checks: { dimension: string; name: string; status: string; score: number | null; measured: string | null; threshold: string | null; check_key: string }[];
  findings: { severity: string; title: string; measured: string | null; threshold: string | null; projected_uplift: number | null; recommendation: any; dimension: string }[];
  compliance: { short: string; status: string; applicable: boolean; score: number | null; counts: Record<string, number>; requirements: { id: string; title: string; status: string }[] }[];
  bench: { note?: string; percentile?: number | null; median?: number | null; previous?: number | null };
  limitations: string[];
  reviews: { decision: string; comments: string; created_at: string }[];
}

const MAP: Record<string, string> = { "≥": ">=", "≤": "<=", "→": "->", "←": "<-", "₂": "2", "Δ": "delta ", "✓": "v", "✗": "x", "▲": "+", "▼": "-", "×": "x", "’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-", "…": "...", "·": "-", "−": "-", "ō": "o", "é": "e" };
const clean = (s: unknown) =>
  String(s ?? "").replace(/[^\x20-\x7E\n]/g, (c) => MAP[c] ?? (/[À-ÿ]/.test(c) ? c.normalize("NFD").replace(/[̀-ͯ]/g, "") : ""));

const TIER: Record<string, string> = { automated_assessment: "AUTOMATED ASSESSMENT COMPLETED", provisional: "PROVISIONAL TRUST CREDENTIAL", reviewed: "INDEPENDENTLY REVIEWED", independently_certified: "INDEPENDENTLY CERTIFIED" };
const color = (s: number | null): [number, number, number] => (s == null ? [100, 112, 140] : s >= 80 ? [22, 163, 74] : s >= 70 ? [202, 138, 4] : s >= 50 ? [234, 88, 12] : [220, 38, 38]);

export async function generateReportPdf(d: PdfData, origin: string, opts: { save?: boolean } = {}): Promise<ArrayBuffer | void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  let y = 0;
  const brand: [number, number, number] = [79, 70, 229];
  const last = () => (doc as any).lastAutoTable.finalY as number;
  const ensure = (h: number) => { if (y + h > H - 60) { doc.addPage(); y = 60; } };
  const h2 = (n: string, t: string) => {
    ensure(50);
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...brand).text(`${n}. ${clean(t)}`, M, y);
    doc.setDrawColor(226, 232, 240).line(M, y + 6, W - M, y + 6);
    y += 22;
  };
  const para = (t: string, size = 9.5, col: [number, number, number] = [51, 65, 85]) => {
    doc.setFont("helvetica", "normal").setFontSize(size).setTextColor(...col);
    const lines = doc.splitTextToSize(clean(t), W - 2 * M);
    ensure(lines.length * size * 1.35);
    doc.text(lines, M, y);
    y += lines.length * size * 1.35 + 6;
  };
  const table = (head: string[], body: (string | number)[][], opts: Record<string, any> = {}) => {
    autoTable(doc, {
      startY: y, head: [head.map(clean)], body: body.map((r) => r.map((c) => clean(c))), margin: { left: M, right: M },
      styles: { fontSize: 8, cellPadding: 4, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.5 },
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" }, theme: "grid", ...opts,
    });
    y = last() + 16;
  };

  // ---- Cover header
  doc.setFillColor(10, 14, 26).rect(0, 0, W, 150, "F");
  doc.setFillColor(...brand).rect(0, 150, W, 4, "F");
  doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(255, 255, 255).text("Artificial Wisdom", M, 52);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(165, 180, 252).text("GLOBAL AI ASSURANCE PLATFORM", M, 68);
  doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(255, 255, 255).text("AI Trust Assessment Report", M, 104);
  doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(203, 213, 225).text(clean(`${d.system.name}  -  ${d.org}`), M, 122);
  doc.text(clean(`${new Date(d.createdAt).toUTCString()}  -  ${d.methodology}  -  suite ${d.suite}`), M, 137);
  const verifyUrl = d.credentialCode ? `${origin}/verify/${d.credentialCode}` : null;
  if (verifyUrl) {
    const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 220, color: { dark: "#0a0e1a", light: "#ffffff" } });
    doc.addImage(qr, "PNG", W - M - 96, 28, 96, 96);
    doc.setFontSize(7).setTextColor(203, 213, 225).text("Scan to verify", W - M - 48, 136, { align: "center" });
  }
  y = 186;

  // ---- 1. Executive summary
  h2("1", "Executive Summary");
  doc.setFillColor(248, 250, 252).roundedRect(M, y, W - 2 * M, 84, 6, 6, "F");
  doc.setFont("helvetica", "bold").setFontSize(34).setTextColor(...color(d.awGti)).text(d.awGti == null ? "-" : String(d.awGti), M + 18, y + 50);
  doc.setFontSize(9).setTextColor(100, 116, 139).text("AW-GTI / 100", M + 18, y + 68);
  doc.setFontSize(13).setTextColor(15, 23, 42).text(clean(d.rating ?? ""), M + 140, y + 30);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(71, 85, 105);
  doc.text(clean(`Status: ${TIER[d.credentialStatus] ?? d.credentialStatus}${d.credentialCode ? `  (${d.credentialCode})` : ""}`), M + 140, y + 48);
  doc.text(clean(`Coverage ${d.coverage}%  -  Technical ${d.technical ?? "-"}  -  Governance ${d.governance ?? "-"}  -  Completed in ${((d.durationMs ?? 0) / 1000).toFixed(1)} s`), M + 140, y + 64);
  y += 100;
  const failed = d.gates.filter((g) => !g.passed);
  const fails = d.checks.filter((c) => c.status === "fail").length;
  para(`${d.system.name} (${d.system.system_type.replace("_", " ")}${d.system.version ? `, v${d.system.version}` : ""}) achieved an AW-GTI of ${d.awGti ?? "n/a"} with evidence covering ${d.coverage}% of the index weight. ${failed.length ? `${failed.length} critical gate(s) failed (${failed.map((g) => g.name).join("; ")}), which caps the rating regardless of the aggregate score.` : "All evaluated critical gates passed."} ${fails} checks failed and ${d.findings.length} corrective actions are recommended.`);

  // ---- 2. Dimension scores
  h2("2", "AW-GTI Dimension Scores");
  table(["Dimension", "Weight", "Score", "Tested", "Coverage"], d.dims.map((x) => [x.label, `${x.weight}%`, x.score == null ? "untested" : Math.round(x.score), `${x.tested}/${x.total}`, `${x.coverage}%`]), {
    didParseCell: (h: any) => { if (h.section === "body" && h.column.index === 2) { const v = Number(h.cell.raw); if (!isNaN(v)) { h.cell.styles.textColor = color(v); h.cell.styles.fontStyle = "bold"; } } },
  });

  // ---- 3. Critical gates
  h2("3", "Critical-Risk Gates");
  if (d.gates.length) table(["Gate", "Result", "Evidence"], d.gates.map((g) => [g.name, g.passed ? "PASSED" : "FAILED", g.reason]), {
    didParseCell: (h: any) => { if (h.section === "body" && h.column.index === 1) { h.cell.styles.textColor = h.cell.raw === "FAILED" ? [220, 38, 38] : [22, 163, 74]; h.cell.styles.fontStyle = "bold"; } },
  });
  else para("No gate-bearing checks were in scope for this assessment.");

  // ---- 4. Findings & recommendations
  h2("4", "Critical Findings & Recommendations");
  if (!d.findings.length) para("No failed or deficient checks were identified within scope.");
  for (const f of d.findings) {
    const rec = f.recommendation ?? {};
    ensure(90);
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...(f.severity === "critical" ? [220, 38, 38] : f.severity === "high" ? [234, 88, 12] : [161, 98, 7]) as [number, number, number]);
    doc.text(clean(`[${f.severity.toUpperCase()}] ${f.title}${f.projected_uplift ? `   (projected +${f.projected_uplift})` : ""}`), M, y);
    y += 14;
    para(`Measured: ${f.measured ?? "-"}   |   Target: ${f.threshold ?? "-"}`, 8.5, [71, 85, 105]);
    if (rec.why) para(`Why it matters: ${rec.why}`, 8.5);
    (rec.actions ?? []).forEach((a: string, i: number) => para(`${i + 1}. ${a}`, 8.5));
    if (rec.evidence) para(`Evidence required: ${rec.evidence}`, 8.5, [71, 85, 105]);
    if (rec.retest) para(`Retest: ${rec.retest}`, 8.5, [71, 85, 105]);
    y += 4;
  }

  // ---- 5. Improvement roadmap
  h2("5", "Improvement Roadmap");
  const road = [...d.findings].filter((f) => Number(f.projected_uplift) > 0).sort((a, b) => Number(b.projected_uplift) - Number(a.projected_uplift)).slice(0, 8);
  if (road.length) table(["#", "Action", "Severity", "Projected uplift"], road.map((f, i) => [i + 1, f.title, f.severity, `+${f.projected_uplift}`]));
  para("Projected uplifts re-score the index assuming the check is fully remediated. They are projections, not guaranteed outcomes, and are not additive.", 8, [100, 116, 139]);

  // ---- 6. Compliance
  h2("6", "Regulatory & Standards Gap Analysis");
  table(["Framework", "Legal status", "Applicable", "Score", "Met", "Partial", "Gap", "Not assessed"], d.compliance.map((c) => [c.short, c.status, c.applicable ? "Yes" : "No", c.score ?? "-", c.counts.met, c.counts.partial, c.counts.gap, c.counts.not_assessed]));
  for (const c of d.compliance.filter((x) => x.applicable)) {
    ensure(40);
    doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(15, 23, 42).text(clean(c.short), M, y);
    y += 6;
    table(["Requirement", "Title", "Status"], c.requirements.map((r) => [r.id, r.title, r.status.replace("_", " ")]), {
      didParseCell: (h: any) => { if (h.section === "body" && h.column.index === 2) h.cell.styles.textColor = h.cell.raw === "met" ? [22, 163, 74] : h.cell.raw === "gap" ? [220, 38, 38] : h.cell.raw === "partial" ? [202, 138, 4] : [100, 116, 139]; },
    });
  }

  // ---- 7. Benchmark
  h2("7", "Benchmarking");
  para(d.bench.note ?? "");
  para(`Percentile: ${d.bench.percentile != null ? d.bench.percentile : "n/a"}   |   Peer median: ${d.bench.median ?? "n/a"}   |   Previous assessment: ${d.bench.previous ?? "n/a"}`);

  // ---- 8. Technical evaluation
  h2("8", "Technical Evaluation - Passed, Failed and Untested Metrics");
  table(["Check", "Dimension", "Measured", "Target", "Score", "Status"], d.checks.map((c) => [c.name, c.dimension.replace("_", " "), c.measured ?? "", c.threshold ?? "", c.score ?? "", c.status.toUpperCase()]), {
    columnStyles: { 0: { cellWidth: 120 }, 2: { cellWidth: 150 } },
    didParseCell: (h: any) => { if (h.section === "body" && h.column.index === 5) h.cell.styles.textColor = h.cell.raw === "PASS" ? [22, 163, 74] : h.cell.raw === "FAIL" ? [220, 38, 38] : h.cell.raw === "WARN" ? [202, 138, 4] : [100, 116, 139]; },
  });

  // ---- 9. Verification & scope
  h2("9", "Verification Record, Scope & Limitations");
  table(["Field", "Value"], [
    ["Assessment ID", d.id], ["Report SHA-256", d.sha ?? "-"], ["Methodology", d.methodology], ["Test suite", d.suite], ["System version", d.system.version ?? "not declared"],
    ["Public URL", d.system.url ?? "-"], ["Model", [d.system.provider, d.system.model_name].filter(Boolean).join(" ") || "-"], ["Timestamp", d.createdAt], ["Verification", verifyUrl ?? "-"],
  ], { columnStyles: { 0: { cellWidth: 110, fontStyle: "bold" } } });
  d.limitations.forEach((l) => para(`- ${l}`, 8.5));
  if (d.reviews.length) {
    ensure(30);
    doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(15, 23, 42).text("Human reviews", M, y);
    y += 8;
    table(["Date", "Decision", "Comments"], d.reviews.map((r) => [new Date(r.created_at).toISOString().slice(0, 10), r.decision, r.comments]));
  }
  para("This report was generated automatically by the Artificial Wisdom platform. An automated assessment or provisional credential is a technical assessment within the stated scope; it is not an accredited certification. Formal certification requires an eligible scheme and an independent, accredited certification body.", 8, [100, 116, 139]);

  // ---- footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(148, 163, 184);
    doc.text(clean(`Artificial Wisdom - ${d.system.name} - ${d.id}`), M, H - 24);
    doc.text(`Page ${i} / ${pages}`, W - M, H - 24, { align: "right" });
  }
  if (opts.save === false) return doc.output("arraybuffer");
  doc.save(`ArtificialWisdom-Report-${d.system.name.replace(/[^a-z0-9]+/gi, "-")}-${d.createdAt.slice(0, 10)}.pdf`);
}
