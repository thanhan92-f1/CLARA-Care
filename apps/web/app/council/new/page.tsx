"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CouncilWorkspaceNav from "@/components/council/council-workspace-nav";
import PageShell from "@/components/ui/page-shell";
import { clearCouncilDraft, CouncilCaseDraft, loadCouncilDraft } from "@/lib/council";

export default function CouncilNewPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<CouncilCaseDraft | null>(null);

  useEffect(() => {
    setDraft(loadCouncilDraft());
  }, []);

  return (
    <PageShell
      title="New Council Case"
      description="Luồng đơn giản: bấm bắt đầu rồi cấu hình tuần tự qua từng trang."
      variant="plain"
    >
      <div className="space-y-5">
        <CouncilWorkspaceNav />

        <section className="chrome-panel rounded-[1.5rem] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Wizard Flow</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Cấu hình từng bước</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
            Bắt đầu từ Intake, sau đó chọn chuyên khoa, review và chạy hội chẩn.
          </p>

          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
            <li>Intake ca bệnh</li>
            <li>Chọn chuyên khoa</li>
            <li>Review và chạy</li>
          </ol>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                clearCouncilDraft();
                router.push("/council/new/intake");
              }}
              className="inline-flex min-h-[46px] items-center rounded-xl border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-5 text-sm font-semibold text-white"
            >
              Bắt đầu cấu hình mới
            </button>

            {draft ? (
              <Link
                href="/council/new/intake"
                className="inline-flex min-h-[46px] items-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-5 text-sm font-semibold text-[var(--text-primary)]"
              >
                Tiếp tục cấu hình dở
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
