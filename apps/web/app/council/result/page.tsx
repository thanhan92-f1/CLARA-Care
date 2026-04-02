"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CouncilEmptyState from "@/components/council/council-empty-state";
import CouncilWorkspaceNav from "@/components/council/council-workspace-nav";
import { CouncilList, CouncilMetricCard, CouncilSection } from "@/components/council/council-primitives";
import PageShell from "@/components/ui/page-shell";
import { clearCouncilSnapshot, CouncilRunSnapshot, loadCouncilSnapshot } from "@/lib/council";
import { buildCouncilView } from "@/lib/council-view";

const FOCUS_CARDS = [
  {
    href: "/council/analyze",
    title: "Analyze",
    desc: "Ưu tiên rủi ro, tín hiệu cảnh báo và hành động tiếp theo.",
  },
  {
    href: "/council/details",
    title: "Details",
    desc: "Xem lại dữ liệu đầu vào và reasoning theo từng chuyên khoa.",
  },
  {
    href: "/council/citations",
    title: "Citations",
    desc: "Tra cứu nguồn/citation nếu payload có metadata chứng cứ.",
  },
  {
    href: "/council/research",
    title: "Research",
    desc: "Tổng hợp insight, câu hỏi mở và kế hoạch follow-up.",
  },
  {
    href: "/council/deepdive",
    title: "Deep Dive",
    desc: "Đọc trace sâu và cấu trúc dữ liệu mở rộng của snapshot.",
  },
];

export default function CouncilResultPage() {
  const [snapshot, setSnapshot] = useState<CouncilRunSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(loadCouncilSnapshot());
  }, []);

  const view = useMemo(() => (snapshot ? buildCouncilView(snapshot) : null), [snapshot]);

  return (
    <PageShell
      title="Council Result Hub"
      description="Bản tóm tắt kết quả hội chẩn gần nhất với điều hướng thẳng tới từng trang phân tích chuyên biệt."
      variant="plain"
    >
      <div className="space-y-5">
        <CouncilWorkspaceNav />

        {!view ? (
          <CouncilEmptyState
            title="Chưa có dữ liệu hội chẩn"
            description="Result hub cần snapshot cục bộ từ lần chạy gần nhất. Hãy tạo ca mới để mở phân tích đa trang."
          />
        ) : (
          <>
            <CouncilSection
              eyebrow="Latest Snapshot"
              title="Tóm tắt điều phối quyết định"
              action={
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex min-h-[42px] items-center rounded-full border px-3 text-xs font-semibold ${
                      view.urgencyTone === "emergency"
                        ? "border-red-300/55 bg-red-100/80 text-red-800 dark:border-red-700/45 dark:bg-red-950/45 dark:text-red-200"
                        : "border-emerald-300/55 bg-emerald-100/80 text-emerald-800 dark:border-emerald-700/45 dark:bg-emerald-950/45 dark:text-emerald-200"
                    }`}
                  >
                    {view.urgencyLabel}
                  </span>
                  <Link
                    href="/council/new"
                    className="inline-flex min-h-[44px] items-center rounded-xl border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-4 text-sm font-semibold text-white"
                  >
                    Chạy ca mới
                  </Link>
                </div>
              }
            >
              <div className="grid gap-3 md:grid-cols-4">
                <CouncilMetricCard label="Thời gian" value={view.createdAtLabel} />
                <CouncilMetricCard
                  label="Specialists"
                  value={String(view.requestSummary.specialists.length)}
                  hint={view.requestSummary.specialists.join(", ")}
                />
                <CouncilMetricCard label="Conflicts" value={String(view.summary.conflicts.length)} />
                <CouncilMetricCard label="Divergence" value={String(view.summary.divergence.length)} />
              </div>

              {view.summary.escalationReason ? (
                <p className="mt-4 rounded-xl border border-red-300/40 bg-red-50/80 px-3 py-2 text-sm text-red-700 dark:border-red-700/45 dark:bg-red-950/20 dark:text-red-300">
                  Lý do leo thang: {view.summary.escalationReason}
                </p>
              ) : null}

              <article className="mt-4 rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Final Recommendation</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">
                  {view.summary.finalRecommendation || "Không có khuyến nghị cuối trong snapshot này."}
                </p>
              </article>
            </CouncilSection>

            <CouncilSection eyebrow="Focused Navigation" title="Chọn màn phân tích phù hợp câu hỏi hiện tại">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {FOCUS_CARDS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[color:var(--shell-border-strong)] hover:bg-[var(--surface-muted)]"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                    <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">{item.desc}</p>
                    <p className="mt-2 text-xs text-[var(--text-muted)] transition group-hover:translate-x-0.5">Open view →</p>
                  </Link>
                ))}
              </div>
            </CouncilSection>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <CouncilSection eyebrow="Consensus" title="Điểm đồng thuận">
                <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">
                  {view.summary.consensus || "Không có mô tả đồng thuận trong snapshot hiện tại."}
                </p>
              </CouncilSection>

              <CouncilSection eyebrow="Risk Drivers" title="Xung đột và bất đồng nổi bật">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]">Conflict List</p>
                    <div className="mt-2">
                      <CouncilList items={view.summary.conflicts} emptyText="Không ghi nhận conflict đáng kể." />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]">Divergence Points</p>
                    <div className="mt-2">
                      <CouncilList items={view.summary.divergence} emptyText="Không ghi nhận divergence nổi bật." />
                    </div>
                  </div>
                </div>
              </CouncilSection>
            </div>

            <section className="flex flex-wrap gap-2">
              <Link
                href="/council"
                className="inline-flex min-h-[44px] items-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-4 text-sm font-semibold text-[var(--text-primary)]"
              >
                Về landing
              </Link>
              <Link
                href="/council/new"
                className="inline-flex min-h-[44px] items-center rounded-xl border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-4 text-sm font-semibold text-white"
              >
                Hội chẩn ca mới
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearCouncilSnapshot();
                  setSnapshot(null);
                }}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-red-300/55 bg-red-100/80 px-4 text-sm font-semibold text-red-800 dark:border-red-700/45 dark:bg-red-950/30 dark:text-red-200"
              >
                Xóa snapshot cục bộ
              </button>
            </section>
          </>
        )}
      </div>
    </PageShell>
  );
}
