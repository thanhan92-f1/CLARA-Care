"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/ui/page-shell";
import { clearCouncilSnapshot, CouncilRunSnapshot, loadCouncilSnapshot } from "@/lib/council";

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", { hour12: false });
}

export default function CouncilResultPage() {
  const [snapshot, setSnapshot] = useState<CouncilRunSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(loadCouncilSnapshot());
  }, []);

  const emergencyClass = useMemo(() => {
    if (!snapshot?.result.isEmergency) {
      return "border-emerald-300/55 bg-emerald-100/80 text-emerald-800 dark:border-emerald-700/45 dark:bg-emerald-950/45 dark:text-emerald-200";
    }
    return "border-red-300/55 bg-red-100/80 text-red-800 dark:border-red-700/45 dark:bg-red-950/45 dark:text-red-200";
  }, [snapshot?.result.isEmergency]);

  if (!snapshot) {
    return (
      <PageShell
        title="Kết Quả Hội Chẩn"
        description="Không tìm thấy kết quả gần nhất. Vui lòng chạy ca hội chẩn mới để xem màn phân tích chi tiết."
      >
        <section className="chrome-panel rounded-[1.7rem] p-6 text-center">
          <p className="text-base font-semibold text-[var(--text-primary)]">Chưa có dữ liệu hội chẩn</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Bạn cần chạy ít nhất 1 ca mới để mở trang kết quả.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/council/new"
              className="inline-flex min-h-[46px] items-center rounded-xl border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-5 text-sm font-semibold text-white"
            >
              Tạo ca mới
            </Link>
            <Link
              href="/council"
              className="inline-flex min-h-[46px] items-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-5 text-sm font-semibold text-[var(--text-primary)]"
            >
              Về trang hội chẩn
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Kết Quả Hội Chẩn"
      description="Bản tóm tắt đa chuyên khoa: tình trạng nguy cấp, reasoning từng chuyên khoa, xung đột và khuyến nghị cuối cùng."
    >
      <div className="space-y-5">
        <section className="chrome-panel rounded-[1.8rem] p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Case Result</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)] sm:text-[2.2rem]">Tổng hợp hội chẩn gần nhất</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Thời gian chạy: {formatDate(snapshot.createdAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex min-h-[42px] items-center rounded-full border px-3 text-xs font-semibold ${emergencyClass}`}>
                {snapshot.result.isEmergency ? "Cần leo thang khẩn" : "Tạm ổn định"}
              </span>
              <Link
                href="/council/new"
                className="inline-flex min-h-[44px] items-center rounded-xl border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-4 text-sm font-semibold text-white"
              >
                Chạy ca mới
              </Link>
            </div>
          </div>

          {snapshot.result.escalationReason ? (
            <p className="mt-3 rounded-xl border border-red-300/35 bg-red-50/75 px-3 py-2 text-sm text-red-700 dark:border-red-700/45 dark:bg-red-950/20 dark:text-red-300">
              Lý do leo thang: {snapshot.result.escalationReason}
            </p>
          ) : null}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className="chrome-panel rounded-[1.6rem] p-5">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Khuyến nghị cuối cùng</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">
              {snapshot.result.finalRecommendation || "Không có khuyến nghị cuối trong phản hồi hiện tại."}
            </p>
          </article>

          <article className="chrome-panel rounded-[1.6rem] p-5">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Điểm đồng thuận</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">
              {snapshot.result.consensus || "Không có mô tả đồng thuận."}
            </p>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className="chrome-panel rounded-[1.6rem] p-5">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Điểm xung đột</h3>
            {snapshot.result.conflicts.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                {snapshot.result.conflicts.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Không ghi nhận xung đột nổi bật.</p>
            )}
          </article>

          <article className="chrome-panel rounded-[1.6rem] p-5">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Điểm bất đồng</h3>
            {snapshot.result.divergence.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                {snapshot.result.divergence.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Không có điểm bất đồng đáng kể.</p>
            )}
          </article>
        </section>

        <section className="chrome-panel rounded-[1.6rem] p-5">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Reasoning theo chuyên khoa</h3>
          {snapshot.result.specialistReasoningLogs.length ? (
            <ul className="mt-3 space-y-3">
              {snapshot.result.specialistReasoningLogs.map((log, index) => (
                <li key={`${log.specialist}-${index}`} className="rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{log.specialist}</p>
                    {log.confidence ? (
                      <span className="rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                        độ tin cậy: {log.confidence}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">{log.reasoning}</p>
                  {log.recommendation ? (
                    <p className="mt-2 rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                      Khuyến nghị chuyên khoa: {log.recommendation}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">Không có log phân tích chuyên khoa trong phản hồi này.</p>
          )}
        </section>

        <section className="flex flex-wrap gap-2">
          <Link
            href="/council"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-4 text-sm font-semibold text-[var(--text-primary)]"
          >
            Về overview
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
            Xóa kết quả lưu cục bộ
          </button>
        </section>
      </div>
    </PageShell>
  );
}
