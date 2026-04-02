"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CouncilWorkspaceNav from "@/components/council/council-workspace-nav";
import PageShell from "@/components/ui/page-shell";
import { parseFreeTextList, parseLabsInput } from "@/lib/careguard";
import {
  clearCouncilDraft,
  CouncilCaseDraft,
  loadCouncilDraft,
  normalizeCouncilRunResult,
  runCouncil,
  saveCouncilDraft,
  saveCouncilSnapshot,
} from "@/lib/council";
import { DEFAULT_DRAFT, normalizeDraft } from "@/lib/council-wizard";

export default function CouncilNewReviewPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<CouncilCaseDraft>(DEFAULT_DRAFT);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const cached = loadCouncilDraft();
    if (!cached) return;
    setDraft(normalizeDraft(cached));
  }, []);

  useEffect(() => {
    saveCouncilDraft(draft);
  }, [draft]);

  const parsedCase = useMemo(
    () => ({
      symptoms: parseFreeTextList(draft.symptomsInput),
      labs: parseLabsInput(draft.labsInput),
      medications: parseFreeTextList(draft.medicationsInput),
      history: draft.historyInput.trim(),
    }),
    [draft]
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      parsedCase.symptoms.length === 0 &&
      Object.keys(parsedCase.labs).length === 0 &&
      parsedCase.medications.length === 0 &&
      !parsedCase.history
    ) {
      setError("Vui lòng nhập dữ liệu ca bệnh trước khi chạy hội chẩn.");
      return;
    }

    if (draft.selectedSpecialists.length < 2) {
      setError("Vui lòng chọn tối thiểu 2 chuyên khoa.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const requestPayload = {
        symptoms: parsedCase.symptoms,
        labs: parsedCase.labs,
        medications: parsedCase.medications,
        history: parsedCase.history,
        specialistCount: draft.specialistCount,
        specialists: draft.selectedSpecialists,
      };

      const raw = await runCouncil(requestPayload);
      const normalized = normalizeCouncilRunResult(raw);

      saveCouncilSnapshot({
        request: requestPayload,
        result: normalized,
        raw,
        createdAt: new Date().toISOString(),
      });

      clearCouncilDraft();
      router.push("/council/result");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể chạy hội chẩn lúc này.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Council Wizard - Review"
      description="Bước 3/3: kiểm tra lại cấu hình rồi chạy hội chẩn."
      variant="plain"
    >
      <div className="space-y-5">
        <CouncilWorkspaceNav />

        <form onSubmit={onSubmit} className="space-y-5">
          <section className="chrome-panel rounded-[1.5rem] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Step 3/3</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Review trước khi chạy</h2>

            <ul className="mt-4 grid gap-2 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
              <li>Triệu chứng: {parsedCase.symptoms.length}</li>
              <li>Xét nghiệm: {Object.keys(parsedCase.labs).length}</li>
              <li>Thuốc: {parsedCase.medications.length}</li>
              <li>Bệnh sử: {parsedCase.history ? "Đã có" : "Chưa có"}</li>
              <li className="sm:col-span-2">
                Chuyên khoa: {draft.selectedSpecialists.length}/{draft.specialistCount} ({draft.selectedSpecialists.join(", ") || "chưa chọn"})
              </li>
            </ul>
          </section>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="flex flex-wrap justify-between gap-2">
            <Link href="/council/new/specialists" className="inline-flex min-h-[42px] items-center rounded-lg border border-[color:var(--shell-border)] px-4 text-sm font-semibold">
              Quay lại bước 2
            </Link>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  clearCouncilDraft();
                  setDraft(DEFAULT_DRAFT);
                  setError("");
                }}
                className="inline-flex min-h-[42px] items-center rounded-lg border border-[color:var(--shell-border)] px-4 text-sm font-semibold"
              >
                Xóa bản nháp
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "Đang chạy hội chẩn..." : "Chạy hội chẩn AI"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
