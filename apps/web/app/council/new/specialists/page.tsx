"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CouncilWorkspaceNav from "@/components/council/council-workspace-nav";
import PageShell from "@/components/ui/page-shell";
import { CouncilCaseDraft, loadCouncilDraft, saveCouncilDraft } from "@/lib/council";
import { clamp, DEFAULT_DRAFT, normalizeDraft, SPECIALIST_OPTIONS } from "@/lib/council-wizard";

export default function CouncilNewSpecialistsPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<CouncilCaseDraft>(DEFAULT_DRAFT);

  useEffect(() => {
    const cached = loadCouncilDraft();
    if (!cached) return;
    setDraft(normalizeDraft(cached));
  }, []);

  useEffect(() => {
    saveCouncilDraft(draft);
  }, [draft]);

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

  return (
    <PageShell
      title="Council Wizard - Specialists"
      description="Bước 2/3: chọn chuyên khoa hội chẩn."
      variant="plain"
    >
      <div className="space-y-5">
        <CouncilWorkspaceNav />

        <section className="chrome-panel rounded-[1.5rem] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Step 2/3</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Chọn chuyên khoa</h2>

          <label className="mt-4 block max-w-xs space-y-1">
            <span className="text-sm font-medium">Số chuyên khoa (2-5)</span>
            <input
              type="number"
              min={2}
              max={SPECIALIST_OPTIONS.length}
              value={draft.specialistCount}
              onChange={(event) => onSpecialistCountChange(event.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-sm"
            />
          </label>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {SPECIALIST_OPTIONS.map((option) => {
              const checked = draft.selectedSpecialists.includes(option.id);
              const disableUnchecked = !checked && draft.selectedSpecialists.length >= draft.specialistCount;
              return (
                <label
                  key={option.id}
                  className={`flex min-h-[44px] items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    checked
                      ? "border-sky-400 bg-sky-100 text-sky-900"
                      : "border-[color:var(--shell-border)] bg-[var(--surface-panel)]"
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

          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Đã chọn {draft.selectedSpecialists.length}/{draft.specialistCount} chuyên khoa.
          </p>
        </section>

        <div className="flex flex-wrap justify-between gap-2">
          <Link href="/council/new/intake" className="inline-flex min-h-[42px] items-center rounded-lg border border-[color:var(--shell-border)] px-4 text-sm font-semibold">
            Quay lại bước 1
          </Link>
          <button
            type="button"
            onClick={() => router.push("/council/new/review")}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-4 text-sm font-semibold text-white"
          >
            Sang bước 3
          </button>
        </div>
      </div>
    </PageShell>
  );
}
