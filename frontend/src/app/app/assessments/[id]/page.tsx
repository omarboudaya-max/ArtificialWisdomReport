import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Fingerprint, ShieldAlert, ShieldCheck, TrendingUp } from "lucide-react";
import { requireOrg } from "@/lib/session";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Radar } from "@/components/ui/Radar";
import { SeverityBadge, StatusBadge, TierBadge } from "@/components/ui/Badges";
import { BAND_COLOR, scoreColor, ratingFor } from "@/lib/engine/scoring";
import { DIMENSIONS, type DimensionScore, type GateResult, type Recommendation } from "@/lib/engine/types";
import { FRAMEWORKS, type FrameworkResult } from "@/lib/engine/compliance";
import { reviewAssessment } from "@/app/app/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { ReportPdfButton } from "@/components/app/ReportPdfButton";

export const metadata = { title: "Assessment report" };

const REQ_STYLE: Record<string, string> = {
  met: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  partial: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  gap: "bg-red-500/15 text-red-300 border-red-500/30",
  not_assessed: "bg-white/[0.03] text-ink-400 border-white/10",
};

export default async function Report({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ reviewed?: string; review_error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, org, role, user } = await requireOrg();
  const { data: a } = await supabase.from("assessments").select("*, ai_systems(id, name, system_type, version, url, provider, model_name, sector, jurisdictions)").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!a) notFound();
  const [{ data: checks }, { data: findings }, { data: reviews }, { data: creds }] = await Promise.all([
    supabase.from("check_results").select("*").eq("assessment_id", id).order("created_at"),
    supabase.from("findings").select("*").eq("assessment_id", id),
    supabase.from("human_reviews").select("*").eq("assessment_id", id).order("created_at"),
    supabase.from("credentials").select("*").eq("assessment_id", id).order("issued_at", { ascending: false }),
  ]);
  const reviewerIds = [...new Set((reviews ?? []).map((r) => r.reviewer_id))];
  const { data: reviewerProfiles } = reviewerIds.length ? await supabase.from("profiles").select("id, full_name, email").in("id", reviewerIds) : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
  const reviewerName = (rid: string) => reviewerProfiles?.find((p) => p.id === rid)?.full_name ?? "Reviewer";
  const system = a.ai_systems as unknown as { id: string; name: string; system_type: string; version: string | null; url: string | null; provider: string | null; model_name: string | null };
  const scope = (a.scope ?? {}) as { dimensions?: DimensionScore[]; limitations?: string[]; modules?: Record<string, unknown>; model?: string | null; transcript?: { probe: string; prompt: string; response: string; error?: string }[] };
  const dims = scope.dimensions ?? DIMENSIONS.map((d) => ({ key: d.key, label: d.label, weight: d.weight, score: (a.dimension_scores as Record<string, number | null>)[d.key] ?? null, tested: 0, total: 0, coverage: 0 }));
  const gates = (a.gates ?? []) as GateResult[];
  const failedGates = gates.filter((g) => !g.passed);
  const band = ratingFor(a.aw_gti != null ? Number(a.aw_gti) : null, failedGates.length > 0, Number(a.coverage)).ratingBand;
  const compliance = (a.compliance ?? []) as FrameworkResult[];
  const bench = (a.benchmark ?? {}) as { peers?: number; sufficient?: boolean; percentile?: number | null; median?: number | null; previous?: number | null; note?: string; dimensions?: { key: string; percentile: number | null; median: number | null; peers: number }[] };
  const sevRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedFindings = [...(findings ?? [])].sort((x, y) => sevRank[x.severity] - sevRank[y.severity] || Number(y.projected_uplift ?? 0) - Number(x.projected_uplift ?? 0));
  const roadmap = [...sortedFindings].filter((f) => Number(f.projected_uplift) > 0).sort((x, y) => Number(y.projected_uplift) - Number(x.projected_uplift)).slice(0, 6);
  const cumulative = Math.min(100, Number(a.aw_gti ?? 0) + roadmap.reduce((s, f) => s + Number(f.projected_uplift ?? 0), 0));
  const canReview = ["auditor", "admin", "owner"].includes(role) && a.created_by !== user.id;
  const activeCred = (creds ?? []).find((c) => c.status === "active") ?? creds?.[0];
  const counts = { pass: 0, warn: 0, fail: 0, untested: 0, info: 0 } as Record<string, number>;
  (checks ?? []).forEach((c) => counts[c.status]++);

  const pdfData = {
    id: a.id, system, org: org.name, createdAt: a.created_at, durationMs: a.duration_ms, awGti: a.aw_gti != null ? Number(a.aw_gti) : null, rating: a.rating,
    coverage: Number(a.coverage), technical: a.technical_score, governance: a.governance_score, methodology: a.methodology_version, suite: a.suite_version, sha: a.report_sha256,
    credentialStatus: a.credential_status, credentialCode: activeCred?.code ?? null, dims, gates, checks: checks ?? [], findings: sortedFindings, compliance, bench, limitations: scope.limitations ?? [], reviews: reviews ?? [],
  };

  return (
    <div className="space-y-6">
      {sp.reviewed && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Review recorded in the tamper-evident audit trail.</div>}
      {sp.review_error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{sp.review_error}</div>}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={`/app/systems/${system.id}`} className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300 hover:text-white">{system.name}</Link>
          <h1 className="h-display mt-1 text-2xl font-bold sm:text-3xl">AI Trust Assessment Report</h1>
          <p className="mt-1 text-sm text-ink-400">{new Date(a.created_at).toLocaleString()} · {a.profile} profile · completed in {((a.duration_ms ?? 0) / 1000).toFixed(1)}s · {a.methodology_version} · suite {a.suite_version}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ReportPdfButton data={pdfData} />
          {activeCred && <Link href={`/verify/${activeCred.code}`} target="_blank" className="btn-secondary"><ExternalLink size={15} /> Trust passport</Link>}
        </div>
      </div>

      {/* 1. Executive summary */}
      <section className="card grid gap-6 p-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <ScoreRing score={a.aw_gti != null ? Number(a.aw_gti) : null} size={170} sub="AW-GTI / 100" color={BAND_COLOR[band]} />
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">Executive summary</div>
          <div className="h-display mt-1 text-2xl font-bold" style={{ color: BAND_COLOR[band] }}>{a.rating}</div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-300">
            {system.name} achieved an AW-GTI of <b className="text-ink-100">{a.aw_gti ?? "n/a"}</b> with evidence covering <b className="text-ink-100">{a.coverage}%</b> of the index weight.{" "}
            {failedGates.length ? <>It <b className="text-red-300">failed {failedGates.length} critical gate{failedGates.length > 1 ? "s" : ""}</b>, which caps the rating regardless of the aggregate score. </> : <>All evaluated critical gates passed. </>}
            {counts.fail} checks failed, {counts.warn} need attention and {counts.untested} were not in scope. {sortedFindings.filter((f) => f.severity === "critical" || f.severity === "high").length} high-priority corrective actions are recommended.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="chip border-white/10 text-ink-300 normal-case tracking-normal">Technical score {a.technical_score ?? "—"}</span>
            <span className="chip border-white/10 text-ink-300 normal-case tracking-normal">Governance score {a.governance_score ?? "—"}</span>
            <span className="chip border-white/10 text-ink-300 normal-case tracking-normal">{counts.pass} pass · {counts.warn} warn · {counts.fail} fail · {counts.untested} untested</span>
          </div>
        </div>
        <div className="space-y-2 text-sm lg:text-end">
          <div className="text-xs uppercase tracking-wider text-ink-400">Assessment status</div>
          <TierBadge tier={a.credential_status} />
          {activeCred && <div className="font-mono text-xs text-ink-400">{activeCred.code}<br />valid until {new Date(activeCred.expires_at).toLocaleDateString()}</div>}
        </div>
      </section>

      {/* 2. Dimensions + gates */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="card flex items-center justify-center p-4"><Radar values={Object.fromEntries(dims.map((d) => [d.key, d.score]))} size={320} /></div>
        <div className="card p-6">
          <h2 className="mb-4 font-semibold">Dimension scores</h2>
          <div className="space-y-3">
            {dims.map((d) => (
              <div key={d.key}>
                <div className="mb-1 flex justify-between text-sm"><span>{d.label} <span className="text-xs text-ink-500">· {d.weight}% · {d.tested}/{d.total} tested · coverage {d.coverage}%</span></span><span className="font-bold tabular-nums" style={{ color: scoreColor(d.score) }}>{d.score == null ? "untested" : Math.round(d.score)}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full" style={{ width: `${d.score ?? 0}%`, background: scoreColor(d.score) }} /></div>
              </div>
            ))}
          </div>
          <h3 className="mb-2 mt-6 text-sm font-semibold">Critical-risk gates</h3>
          {gates.length ? (
            <ul className="space-y-1.5">
              {gates.map((g) => (
                <li key={g.key} className="flex items-start gap-2 text-sm">{g.passed ? <ShieldCheck size={16} className="mt-0.5 text-emerald-400" /> : <ShieldAlert size={16} className="mt-0.5 text-red-400" />}<span><b className={g.passed ? "" : "text-red-300"}>{g.name}</b> <span className="text-ink-400">— {g.reason}</span></span></li>
              ))}
            </ul>
          ) : <p className="text-sm text-ink-400">No gate-bearing checks were in scope.</p>}
        </div>
      </section>

      {/* 3. Findings & recommendations */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-6 py-4">
          <h2 className="font-semibold">Critical findings & recommendations</h2>
          <Link href="/app/findings" className="text-xs text-brand-300 hover:text-white">Track in corrective actions →</Link>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {sortedFindings.map((f) => {
            const rec = f.recommendation as Recommendation;
            return (
              <details key={f.id} className="group px-6 py-4">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
                  <SeverityBadge severity={f.severity} />
                  <span className="flex-1 font-medium">{f.title}</span>
                  <span className="text-xs text-ink-400">{DIMENSIONS.find((d) => d.key === f.dimension)?.short}</span>
                  {Number(f.projected_uplift) > 0 && <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300 normal-case tracking-normal"><TrendingUp size={11} /> +{f.projected_uplift} projected</span>}
                  <span className="chip border-white/10 text-ink-400">{f.status.replace("_", " ")}</span>
                </summary>
                <div className="mt-4 grid gap-4 text-sm lg:grid-cols-2">
                  <div className="space-y-2">
                    <div><span className="text-ink-400">Measured:</span> {f.measured ?? "—"}</div>
                    <div><span className="text-ink-400">Target / threshold:</span> {f.threshold ?? "—"}</div>
                    <div><span className="text-ink-400">Why it matters:</span> {rec.why}</div>
                    {rec.references?.length ? <div className="text-xs text-ink-500">References: {rec.references.join(" · ")}</div> : null}
                  </div>
                  <div className="space-y-2">
                    <div className="text-ink-400">Recommended corrective actions</div>
                    <ol className="list-decimal space-y-1 ps-5">{rec.actions.map((x) => <li key={x}>{x}</li>)}</ol>
                    <div><span className="text-ink-400">Evidence of remediation:</span> {rec.evidence}</div>
                    <div><span className="text-ink-400">Retest:</span> {rec.retest}</div>
                  </div>
                </div>
              </details>
            );
          })}
          {!sortedFindings.length && <p className="px-6 py-6 text-sm text-ink-400">No failed or deficient checks in scope.</p>}
        </div>
      </section>

      {/* 4. Roadmap + benchmark */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold">Improvement roadmap</h2>
          <p className="mt-1 text-xs text-ink-400">Ordered by projected AW-GTI uplift. Projections re-score the index with the check fully remediated; they are estimates, not guarantees, and do not add linearly.</p>
          <ol className="mt-4 space-y-2">
            {roadmap.map((f, i) => (
              <li key={f.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-200">{i + 1}</span>
                <span className="flex-1">{f.title}</span><span className="font-semibold text-emerald-300">+{f.projected_uplift}</span>
              </li>
            ))}
          </ol>
          {roadmap.length > 0 && <div className="mt-4 text-sm text-ink-300">Upper-bound projection after these fixes: <b className="text-ink-100">≈{cumulative.toFixed(1)}</b> {failedGates.length > 0 && "(gate failures must also be resolved to lift the rating)"}</div>}
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">International & peer benchmarking</h2>
          <p className="mt-1 text-xs text-ink-400">{bench.note}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/[0.06] p-3"><div className="text-[11px] uppercase text-ink-400">Percentile</div><div className="h-display text-2xl font-bold">{bench.percentile != null ? `${bench.percentile}th` : "—"}</div></div>
            <div className="rounded-xl border border-white/[0.06] p-3"><div className="text-[11px] uppercase text-ink-400">Peer median</div><div className="h-display text-2xl font-bold">{bench.median ?? "—"}</div></div>
            <div className="rounded-xl border border-white/[0.06] p-3"><div className="text-[11px] uppercase text-ink-400">Previous run</div><div className="h-display text-2xl font-bold">{bench.previous ?? "—"}</div></div>
          </div>
          <p className="mt-4 text-xs text-ink-500">Published external benchmarks (e.g. HELM, MLCommons AILuminate) use different datasets and conditions and are not directly comparable to this rapid profile; no cross-benchmark ranking is fabricated.</p>
        </div>
      </section>

      {/* 5. Compliance */}
      <section className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Regulatory & standards gap analysis</h2><Link href={`/app/compliance?system=${system.id}`} className="text-xs text-brand-300 hover:text-white">Open compliance center →</Link></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...compliance].sort((x, y) => Number(y.applicable) - Number(x.applicable)).map((f) => (
            <details key={f.key} className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 ${f.applicable ? "" : "opacity-60"}`}>
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="font-semibold">{f.short}</div><div className="text-[11px] text-ink-400">{f.status}{f.applicable ? "" : " · not applicable to declared scope"}</div></div>
                  <div className="h-display text-xl font-bold" style={{ color: scoreColor(f.score) }}>{f.score ?? "—"}</div>
                </div>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full">
                  {(["met", "partial", "gap", "not_assessed"] as const).map((s) => <div key={s} className={REQ_STYLE[s].split(" ")[0]} style={{ width: `${(100 * f.counts[s]) / f.requirements.length}%` }} />)}
                </div>
                <div className="mt-1.5 text-[11px] text-ink-400">{f.counts.met} met · {f.counts.partial} partial · {f.counts.gap} gap · {f.counts.not_assessed} not assessed</div>
              </summary>
              <ul className="mt-3 space-y-1.5">
                {f.requirements.map((r) => <li key={r.id} className="flex items-start gap-2 text-xs"><span className={`chip shrink-0 ${REQ_STYLE[r.status]}`}>{r.status.replace("_", " ")}</span><span><b>{r.id}</b> {r.title}</span></li>)}
              </ul>
            </details>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-500">Instruments have different legal status (binding law, voluntary standard, guidance). Applicability depends on jurisdiction, role, system type and effective date. ISO/IEC 42001 conformity does not by itself demonstrate EU AI Act compliance.</p>
      </section>

      {/* 6. Technical evaluation detail */}
      <section className="card overflow-hidden">
        <h2 className="border-b border-white/[0.06] px-6 py-4 font-semibold">Technical evaluation — all checks</h2>
        {DIMENSIONS.map((d) => {
          const items = (checks ?? []).filter((c) => c.dimension === d.key);
          if (!items.length) return null;
          return (
            <div key={d.key} className="border-b border-white/[0.04] last:border-0">
              <div className="bg-white/[0.02] px-6 py-2 text-xs font-semibold uppercase tracking-wider text-ink-400">{d.label}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-white/[0.03]">
                    {items.map((c) => (
                      <tr key={c.id}>
                        <td className="w-[38%] px-6 py-2.5"><div className="font-medium">{c.name}</div><div className="font-mono text-[10px] text-ink-500">{c.check_key} · {c.source}{(c.evidence as { gate?: boolean })?.gate ? " · gate" : ""}</div></td>
                        <td className="px-3 py-2.5 text-ink-300">{c.measured}{c.threshold && <div className="text-[11px] text-ink-500">target: {c.threshold}</div>}</td>
                        <td className="w-16 px-3 py-2.5 text-end font-bold tabular-nums" style={{ color: scoreColor(c.score != null ? Number(c.score) : null) }}>{c.score ?? ""}</td>
                        <td className="w-28 px-3 py-2.5 text-end"><StatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>

      {/* 7. Verification record, scope, review */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6 text-sm">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Fingerprint size={16} /> Verification record</h2>
          <dl className="space-y-1.5">
            {[["Assessment ID", a.id], ["Report SHA-256", a.report_sha256], ["Methodology", a.methodology_version], ["Test suite", a.suite_version], ["System version", a.system_version ?? "not declared"], ["Model tested", scope.model ?? "none"], ["Timestamp (UTC)", a.completed_at], ["Credential", activeCred ? `${activeCred.code} (${activeCred.status})` : "—"]].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[130px_1fr] gap-2"><dt className="text-ink-400">{k}</dt><dd className="break-all font-mono text-xs">{v}</dd></div>
            ))}
          </dl>
          <h3 className="mb-2 mt-5 font-semibold">Scope & limitations</h3>
          <ul className="list-disc space-y-1 ps-5 text-ink-300">{(scope.limitations ?? []).map((l) => <li key={l}>{l}</li>)}</ul>
          {scope.transcript && scope.transcript.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-ink-300">Probe transcript sample ({scope.transcript.length} exchanges)</summary>
              <div className="mt-2 max-h-80 space-y-2 overflow-y-auto">
                {scope.transcript.map((t, i) => (
                  <div key={i} className="rounded-lg border border-white/[0.05] bg-ink-950/60 p-2 text-xs"><div className="font-mono text-brand-300">{t.probe}</div><div className="text-ink-400">› {t.prompt}</div><div className="mt-1 whitespace-pre-wrap text-ink-200" dir="auto">{t.error ? `error: ${t.error}` : t.response}</div></div>
                ))}
              </div>
            </details>
          )}
        </div>
        <div id="review" className="card scroll-mt-6 p-6">
          <h2 className="mb-1 font-semibold">Independent human review</h2>
          <p className="mb-4 text-xs text-ink-400">Reviewers must be auditors or admins, cannot review assessments they initiated, and must declare no conflict of interest. Approval of a gate-clean assessment with AW-GTI ≥ 70 issues an &quot;Independently reviewed&quot; credential. Formal certification additionally requires an eligible scheme and accredited body.</p>
          <ul className="mb-4 space-y-2">
            {(reviews ?? []).map((r) => (
              <li key={r.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
                <div className="flex items-center justify-between"><b className="capitalize">{r.decision.replace("_", " ")}</b><span className="text-xs text-ink-400">{new Date(r.created_at).toLocaleString()}</span></div>
                <div className="text-xs text-ink-400">{reviewerName(r.reviewer_id)}</div>
                <p className="mt-1 text-ink-300">{r.comments}</p>
              </li>
            ))}
            {!reviews?.length && <li className="text-sm text-ink-400">No reviews yet.</li>}
          </ul>
          {canReview ? (
            <form action={reviewAssessment} className="space-y-3">
              <input type="hidden" name="assessment_id" value={a.id} />
              <select name="decision" className="input"><option value="approve">Approve</option><option value="request_changes">Request changes</option><option value="reject">Reject</option></select>
              <textarea name="comments" rows={3} className="input" placeholder="Review conclusions, evidence examined, conditions" required minLength={10} />
              <label className="flex items-start gap-2 text-xs text-ink-300"><input type="checkbox" name="coi" className="mt-0.5 accent-brand-500" /> I declare I have no conflict of interest and did not develop, operate or consult on this system.</label>
              <SubmitButton>Submit review</SubmitButton>
            </form>
          ) : <p className="text-xs text-ink-500">{a.created_by === user.id ? "You initiated this assessment, so another auditor must review it." : "Only auditors and admins can review."}</p>}
        </div>
      </section>
      <p className="text-center text-xs text-ink-500">Frameworks referenced: {FRAMEWORKS.map((f) => f.short).join(" · ")}</p>
    </div>
  );
}
