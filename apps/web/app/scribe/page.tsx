"use client";

import { FormEvent, useMemo, useState } from "react";
import PageShell from "@/components/ui/page-shell";
import { SoapSections, createSoap, normalizeSoapSections } from "@/lib/scribe";

function joinSoap(sections: SoapSections): string {
  return [
    `S: ${sections.subjective || "Chưa có dữ liệu"}`,
    `O: ${sections.objective || "Chưa có dữ liệu"}`,
    `A: ${sections.assessment || "Chưa có dữ liệu"}`,
    `P: ${sections.plan || "Chưa có dữ liệu"}`
  ].join("\n\n");
}

export default function ScribePage() {
  const [transcript, setTranscript] = useState("");
  const [sections, setSections] = useState<SoapSections | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placeholderNotice, setPlaceholderNotice] = useState("");

  const hasSoapContent = useMemo(() => {
    if (!sections) return false;
    return Boolean(sections.subjective || sections.objective || sections.assessment || sections.plan);
  }, [sections]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTranscript = transcript.trim();
    if (!nextTranscript) return;

    setError("");
    setIsSubmitting(true);
    setSections(null);
    setPlaceholderNotice("");

    try {
      const response = await createSoap({ transcript: nextTranscript });
      setSections(normalizeSoapSections(response));
    } catch (submitError) {
      const fallbackMessage = "Không thể tạo SOAP note. Vui lòng thử lại.";
      if (submitError instanceof Error && submitError.message) {
        setError(submitError.message);
      } else {
        setError(fallbackMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCopyPlaceholder = () => {
    if (!sections) return;
    setPlaceholderNotice("Tính năng sao chép sẽ được bổ sung ở phase sau.");
  };

  const onExportPlaceholder = () => {
    if (!sections) return;
    setPlaceholderNotice("Tính năng xuất file sẽ được bổ sung ở phase sau.");
  };

  return (
    <PageShell title="Trợ lý ghi chép y khoa">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Dán transcript buổi khám để tạo nhanh SOAP draft (S/O/A/P).</p>

        <form className="space-y-3" onSubmit={onSubmit}>
          <textarea
            className="h-44 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Ví dụ: BN nam 56 tuổi, than đau ngực 2 ngày..."
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting || !transcript.trim()}
          >
            {isSubmitting ? "Đang tạo SOAP..." : "Tạo SOAP"}
          </button>
        </form>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        {sections ? (
          <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onCopyPlaceholder}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!hasSoapContent}
              >
                Sao chép (placeholder)
              </button>
              <button
                type="button"
                onClick={onExportPlaceholder}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!hasSoapContent}
              >
                Xuất file (placeholder)
              </button>
            </div>

            {placeholderNotice ? (
              <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">{placeholderNotice}</p>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <article className="rounded-md border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">S - Subjective</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{sections.subjective || "Chưa có dữ liệu"}</p>
              </article>

              <article className="rounded-md border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">O - Objective</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{sections.objective || "Chưa có dữ liệu"}</p>
              </article>

              <article className="rounded-md border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">A - Assessment</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{sections.assessment || "Chưa có dữ liệu"}</p>
              </article>

              <article className="rounded-md border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">P - Plan</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{sections.plan || "Chưa có dữ liệu"}</p>
              </article>
            </div>

            <details className="rounded-md border border-dashed border-slate-300 bg-white p-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
                Xem tổng hợp SOAP
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{joinSoap(sections)}</pre>
            </details>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}
