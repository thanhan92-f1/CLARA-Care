"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type SpecialistOption = {
  id: string;
  label: string;
};

const SPECIALIST_OPTIONS: SpecialistOption[] = [
  { id: "cardiology", label: "Tim mạch" },
  { id: "neurology", label: "Thần kinh" },
  { id: "endocrinology", label: "Nội tiết" },
  { id: "pharmacology", label: "Dược lâm sàng" },
  { id: "nephrology", label: "Thận học" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const DEFAULT_DRAFT: CouncilCaseDraft = {
  symptomsInput: "",
  labsInput: "",
  medicationsInput: "",
  historyInput: "",
  specialistCount: 3,
  selectedSpecialists: SPECIALIST_OPTIONS.slice(0, 3).map((item) => item.id),
};

export default function CouncilNewPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<CouncilCaseDraft>(DEFAULT_DRAFT);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const cached = loadCouncilDraft();
    if (cached) {
      const normalizedCount = clamp(cached.specialistCount || 3, 2, SPECIALIST_OPTIONS.length);
      const selected = (cached.selectedSpecialists || []).filter((id) =>
        SPECIALIST_OPTIONS.some((item) => item.id === id)
      );
      setDraft({
        ...cached,
        specialistCount: normalizedCount,
        selectedSpecialists: selected.slice(0, normalizedCount),
      });
    }
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

  const onSpecialistCountChange = (value: string) => {
    const parsed = Number(value);
    const nextCount = clamp(Number.isFinite(parsed) ? Math.trunc(parsed) : 2, 2, SPECIALIST_OPTIONS.length);
    setDraft((current) => ({
      ...current,
      specialistCount: nextCount,
      selectedSpecialists: current.selectedSpecialists.slice(0, nextCount),
    }));
  };

  const onToggleSpecialist = (specialistId: string) => {
    setDraft((current) => {
      const exists = current.selectedSpecialists.includes(specialistId);
      if (exists) {
        return {
          ...current,
          selectedSpecialists: current.selectedSpecialists.filter((item) => item !== specialistId),
        };
      }
      if (current.selectedSpecialists.length >= current.specialistCount) {
        return current;
      }
      return {
        ...current,
        selectedSpecialists: [...current.selectedSpecialists, specialistId],
      };
    });
  };

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
      title="Tạo Ca Hội Chẩn"
      description="Wizard 2 bước: nhập hồ sơ ca bệnh trước, sau đó chọn chuyên khoa và chạy hội chẩn đa tác nhân."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <section className="chrome-panel rounded-[1.8rem] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Case Builder</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)] sm:text-[2.15rem]">Bước {step}/2</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {step === 1
                  ? "Nhập dữ liệu lâm sàng cốt lõi trước khi phân chuyên khoa."
                  : "Tinh chỉnh chuyên khoa và xác nhận trước khi chạy mô hình hội chẩn."}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`min-h-[44px] rounded-xl border px-4 text-sm font-semibold ${
                  step === 1
                    ? "border-sky-400 bg-sky-100 text-sky-800 dark:border-sky-500 dark:bg-sky-950/45 dark:text-sky-100"
                    : "border-[color:var(--shell-border)] bg-[var(--surface-panel)] text-[var(--text-primary)]"
                }`}
              >
                Bước 1
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`min-h-[44px] rounded-xl border px-4 text-sm font-semibold ${
                  step === 2
                    ? "border-sky-400 bg-sky-100 text-sky-800 dark:border-sky-500 dark:bg-sky-950/45 dark:text-sky-100"
                    : "border-[color:var(--shell-border)] bg-[var(--surface-panel)] text-[var(--text-primary)]"
                }`}
              >
                Bước 2
              </button>
            </div>
          </div>
        </section>

        {step === 1 ? (
          <section className="grid gap-4 md:grid-cols-2">
            <label className="chrome-panel rounded-[1.4rem] p-4">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Triệu chứng</span>
              <textarea
                value={draft.symptomsInput}
                onChange={(event) => setDraft((current) => ({ ...current, symptomsInput: event.target.value }))}
                placeholder="Đau ngực, khó thở, sốt..."
                className="mt-2 min-h-[150px] w-full rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </label>

            <label className="chrome-panel rounded-[1.4rem] p-4">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Chỉ số xét nghiệm</span>
              <textarea
                value={draft.labsInput}
                onChange={(event) => setDraft((current) => ({ ...current, labsInput: event.target.value }))}
                placeholder="troponin=1.2, CRP=45, creatinine=2.0"
                className="mt-2 min-h-[150px] w-full rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </label>

            <label className="chrome-panel rounded-[1.4rem] p-4">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Thuốc đang dùng</span>
              <textarea
                value={draft.medicationsInput}
                onChange={(event) => setDraft((current) => ({ ...current, medicationsInput: event.target.value }))}
                placeholder="Warfarin, Metformin..."
                className="mt-2 min-h-[150px] w-full rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </label>

            <label className="chrome-panel rounded-[1.4rem] p-4">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Bệnh sử</span>
              <textarea
                value={draft.historyInput}
                onChange={(event) => setDraft((current) => ({ ...current, historyInput: event.target.value }))}
                placeholder="Tăng huyết áp, đái tháo đường type 2..."
                className="mt-2 min-h-[150px] w-full rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </label>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex min-h-[48px] items-center rounded-xl border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-5 text-sm font-semibold text-white"
              >
                Tiếp tục bước 2
              </button>
            </div>
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <article className="chrome-panel rounded-[1.4rem] p-5">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Chuyên khoa hội chẩn</h3>
              <label className="mt-3 block space-y-1">
                <span className="text-sm font-medium text-[var(--text-primary)]">Số chuyên khoa (2-5)</span>
                <input
                  type="number"
                  min={2}
                  max={SPECIALIST_OPTIONS.length}
                  value={draft.specialistCount}
                  onChange={(event) => onSpecialistCountChange(event.target.value)}
                  className="min-h-[46px] w-full rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--text-primary)]"
                />
              </label>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {SPECIALIST_OPTIONS.map((option) => {
                  const checked = draft.selectedSpecialists.includes(option.id);
                  const disableUnchecked = !checked && draft.selectedSpecialists.length >= draft.specialistCount;
                  return (
                    <label
                      key={option.id}
                      className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                        checked
                          ? "border-sky-400 bg-sky-100 text-sky-800 dark:border-sky-500 dark:bg-sky-950/45 dark:text-sky-100"
                          : "border-[color:var(--shell-border)] bg-[var(--surface-panel)] text-[var(--text-primary)]"
                      } ${disableUnchecked ? "opacity-60" : "cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleSpecialist(option.id)}
                        disabled={disableUnchecked}
                        className="h-4 w-4"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </article>

            <article className="chrome-panel rounded-[1.4rem] p-5">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Review nhanh trước khi chạy</h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                <li>Triệu chứng: {parsedCase.symptoms.length}</li>
                <li>Chỉ số xét nghiệm: {Object.keys(parsedCase.labs).length}</li>
                <li>Thuốc đang dùng: {parsedCase.medications.length}</li>
                <li>Bệnh sử: {parsedCase.history ? "Đã có" : "Chưa có"}</li>
                <li>
                  Chuyên khoa đã chọn: {draft.selectedSpecialists.length}/{draft.specialistCount}
                </li>
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[44px] rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-4 text-sm font-semibold text-[var(--text-primary)]"
                >
                  Quay lại bước 1
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[48px] rounded-xl border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Đang chạy hội chẩn..." : "Chạy hội chẩn AI"}
                </button>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    clearCouncilDraft();
                    setDraft(DEFAULT_DRAFT);
                  }}
                  className="text-sm font-medium text-[var(--text-secondary)] underline underline-offset-2"
                >
                  Xóa bản nháp
                </button>
              </div>
            </article>
          </section>
        )}

        {error ? (
          <p className="rounded-xl border border-red-300/45 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/45 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <div className="flex justify-between">
          <Link
            href="/council"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-4 text-sm font-semibold text-[var(--text-primary)]"
          >
            Về trang hội chẩn
          </Link>
        </div>
      </form>
    </PageShell>
  );
}
