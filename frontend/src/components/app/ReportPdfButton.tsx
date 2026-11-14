"use client";
import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import type { PdfData } from "@/lib/pdf/report-pdf";

export function ReportPdfButton({ data }: { data: PdfData }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn-primary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const { generateReportPdf } = await import("@/lib/pdf/report-pdf");
          await generateReportPdf(data, window.location.origin);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />} Download PDF report
    </button>
  );
}
