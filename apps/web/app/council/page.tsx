"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CouncilWorkspaceNav, { COUNCIL_WORKSPACE_LINKS } from "@/components/council/council-workspace-nav";
import { CouncilList, CouncilMetricCard, CouncilSection } from "@/components/council/council-primitives";
import PageShell from "@/components/ui/page-shell";
import { CouncilRunSnapshot, loadCouncilSnapshot } from "@/lib/council";
import { buildCouncilView } from "@/lib/council-view";

const FOCUSED_LINKS = COUNCIL_WORKSPACE_LINKS.filter(
  (item) => !["/council", "/council/new", "/council/result"].includes(item.href)
);

export default function CouncilPage() {
  const [snapshot, setSnapshot] = useState<CouncilRunSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(loadCouncilSnapshot());
  }, []);

  const view = useMemo(() => (snapshot ? buildCouncilView(snapshot) : null), [snapshot]);

  return (
    <PageShell
      title="Council Workspace"
      description="Không còn luồng dồn vào một màn hình. Bắt đầu ca mới, chạy hội chẩn, rồi đi thẳng vào các trang phân tích chuyên biệt theo từng góc nhìn."
      variant="plain"
    >
      <div className="space-y-5">
        <CouncilWorkspaceNav />

        <CouncilSection
          eyebrow="Multidisciplinary Caseboard"
          title="Landing tổng quan cho điều hướng nhanh"
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/council/new"
                className="inline-flex min-h-[46px] items-center rounded-xl border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-5 text-sm font-semibold text-white"
              >
                Tạo ca mới
              </Link>
              <Link
                href="/council/result"
                className="inline-flex min-h-[46px] items-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-5 text-sm font-semibold text-[var(--text-primary)]"
              >
                Mở result hub
              </Link>
            </div>
          }
        >
          <div className="grid gap-3 md:grid-cols-3">
            <CouncilMetricCard
              label="Flow"
              value="Intake + Edit + Run"
              hint="Một trang duy nhất cho toàn bộ thao tác tạo ca"
            />
            <CouncilMetricCard
              label="Focused Pages"
              value="5 trang chuyên biệt"
              hint="Analyze, Details, Citations, Research, Deep Dive"
            />
            <CouncilMetricCard
              label="Latest Snapshot"
              value={view ? view.createdAtLabel : "Chưa có dữ liệu"}
              hint={view ? view.urgencyLabel : "Chạy ca mới để mở đầy đủ workspace"}
            />
          </div>
        </CouncilSection>

        <CouncilSection eyebrow="Navigation" title="Đi vào đúng ngữ cảnh chỉ trong 1 lần bấm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {FOCUSED_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[color:var(--shell-border-strong)] hover:bg-[var(--surface-muted)]"
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.hint}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)] transition group-hover:translate-x-0.5">Open page →</p>
              </Link>
            ))}
          </div>
        </CouncilSection>

        <CouncilSection eyebrow="Latest Run" title="Ca gần nhất">
          {!view ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-5 py-7">
              <p className="text-base font-semibold text-[var(--text-primary)]">Chưa có snapshot hội chẩn</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Tạo ca mới ở trang `New Case` để lưu snapshot, sau đó bạn có thể chuyển thẳng qua từng trang chuyên đề.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <article className="rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{view.createdAtLabel}</p>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      view.urgencyTone === "emergency"
                        ? "border-red-300/55 bg-red-100/80 text-red-800 dark:border-red-700/45 dark:bg-red-950/45 dark:text-red-200"
                        : "border-emerald-300/55 bg-emerald-100/80 text-emerald-800 dark:border-emerald-700/45 dark:bg-emerald-950/45 dark:text-emerald-200"
                    }`}
                  >
                    {view.urgencyLabel}
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Khuyến nghị cuối</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">
                  {view.summary.finalRecommendation || "Không có khuyến nghị cuối trong snapshot này."}
                </p>
              </article>

              <article className="rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Risk Drivers</p>
                <div className="mt-2">
                  <CouncilList
                    items={view.analyze.riskDrivers}
                    emptyText="Không có dấu hiệu rủi ro nổi bật trong snapshot hiện tại."
                  />
                </div>
              </article>
            </div>
          )}
        </CouncilSection>
      </div>
    </PageShell>
  );
}
