"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageShell from "@/components/ui/page-shell";
import { CouncilRunSnapshot, loadCouncilSnapshot } from "@/lib/council";

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", { hour12: false });
}

export default function CouncilPage() {
  const [snapshot, setSnapshot] = useState<CouncilRunSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(loadCouncilSnapshot());
  }, []);

  return (
    <PageShell
      title="Hội Chẩn AI"
      description="Mô hình hội chẩn đa chuyên khoa theo luồng 2 bước: nhập hồ sơ ca bệnh, chọn chuyên khoa, nhận kết quả tổng hợp có cấu trúc."
    >
      <div className="space-y-5">
        <section className="chrome-panel rounded-[1.8rem] p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Virtual Multidisciplinary Board</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)] sm:text-[2.3rem]">Thiết kế hội chẩn theo case-flow</h2>
              <p className="mt-2 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
                Không nhồi tất cả vào một màn hình. Bạn bắt đầu ở wizard tạo ca, chạy hội chẩn và chuyển sang màn kết quả chuyên biệt để đọc nhanh phần nguy cấp, bất đồng và khuyến nghị cuối.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/council/new"
                className="inline-flex min-h-[48px] items-center rounded-xl border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-5 text-sm font-semibold text-white shadow-[0_16px_36px_-24px_rgba(14,165,233,0.92)]"
              >
                Tạo ca hội chẩn mới
              </Link>
              <Link
                href="/council/result"
                className="inline-flex min-h-[48px] items-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-5 text-sm font-semibold text-[var(--text-primary)]"
              >
                Xem kết quả gần nhất
              </Link>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <article className="rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]">Bước 1</p>
              <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">Nhập dữ liệu ca bệnh</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Triệu chứng, xét nghiệm, thuốc dùng, bệnh sử.</p>
            </article>
            <article className="rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]">Bước 2</p>
              <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">Chọn chuyên khoa</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Điều chỉnh số chuyên khoa và xác nhận trước khi chạy.</p>
            </article>
            <article className="rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]">Bước 3</p>
              <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">Đọc kết quả chuyên sâu</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Nguy cấp, đồng thuận, bất đồng, quyết định cuối.</p>
            </article>
          </div>
        </section>

        <section className="chrome-panel rounded-[1.8rem] p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">Ca chạy gần nhất</h3>
          {!snapshot ? (
            <div className="mt-3 rounded-2xl border border-dashed border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-5 py-7 text-center">
              <p className="text-base font-semibold text-[var(--text-primary)]">Chưa có ca hội chẩn nào gần đây</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Tạo ca mới để lưu kết quả và mở màn phân tích chi tiết.</p>
              <Link
                href="/council/new"
                className="mt-4 inline-flex min-h-[46px] items-center rounded-xl border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-5 text-sm font-semibold text-white"
              >
                Bắt đầu hội chẩn
              </Link>
            </div>
          ) : (
            <article className="mt-3 rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Thời gian chạy: {formatDate(snapshot.createdAt)}</p>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    snapshot.result.isEmergency
                      ? "border-red-300/55 bg-red-100/80 text-red-800 dark:border-red-700/45 dark:bg-red-950/45 dark:text-red-200"
                      : "border-emerald-300/55 bg-emerald-100/80 text-emerald-800 dark:border-emerald-700/45 dark:bg-emerald-950/45 dark:text-emerald-200"
                  }`}
                >
                  {snapshot.result.isEmergency ? "Cần leo thang" : "Ổn định"}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">
                {snapshot.result.finalRecommendation || "Không có khuyến nghị chi tiết."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/council/result"
                  className="inline-flex min-h-[44px] items-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-4 text-sm font-semibold text-[var(--text-primary)]"
                >
                  Mở kết quả đầy đủ
                </Link>
                <Link
                  href="/council/new"
                  className="inline-flex min-h-[44px] items-center rounded-xl border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-4 text-sm font-semibold text-white"
                >
                  Chạy ca mới
                </Link>
              </div>
            </article>
          )}
        </section>
      </div>
    </PageShell>
  );
}
