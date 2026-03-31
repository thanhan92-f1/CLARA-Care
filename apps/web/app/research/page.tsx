"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import ResearchLabNav from "@/components/research/research-lab-nav";
import ResearchLatestTier2 from "@/components/research/research-latest-tier2";
import {
  createConversationItem,
  createConversationItemFromPersisted,
  formatHistoryTime
} from "@/components/research/lib/research-page-helpers";
import { ConversationItem, ResearchResult } from "@/components/research/lib/research-page-types";
import PageShell from "@/components/ui/page-shell";
import { UserRole, getRole } from "@/lib/auth-store";
import { ChatResponse, getChatIntentDebug, getChatReply } from "@/lib/chat";
import api from "@/lib/http-client";
import {
  ResearchExecutionMode,
  ResearchTier,
  createResearchConversation,
  listResearchConversations,
  normalizeResearchTier2,
  runResearchTier2
} from "@/lib/research";

const QUICK_LINKS: Array<{ href: string; label: string; description: string }> = [
  {
    href: "/research/deepdive",
    label: "Deepdive",
    description: "Luồng nghiên cứu chuyên sâu với deep mode và telemetry." 
  },
  {
    href: "/research/analyze",
    label: "Analyze",
    description: "Đọc verification, flow và quality signal của kết quả gần nhất."
  },
  {
    href: "/research/citations",
    label: "Citations",
    description: "Tập trung vào nguồn tham chiếu, link và snippet bằng chứng."
  },
  {
    href: "/research/details",
    label: "Details",
    description: "Xem metadata/routing/debug chi tiết cho phiên gần nhất."
  }
];

export default function ResearchPage() {
  const [role, setRole] = useState<UserRole>("normal");
  const [selectedTier, setSelectedTier] = useState<ResearchTier>("tier1");
  const [selectedResearchMode, setSelectedResearchMode] = useState<ResearchExecutionMode>("fast");
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ResearchResult | null>(null);

  useEffect(() => {
    setRole(getRole());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const rows = await listResearchConversations(50);
        if (cancelled) return;
        const items = rows.map((row) => createConversationItemFromPersisted(row));
        setHistory(items);
        if (!items.length) return;
        setActiveConversationId(items[0].id);
        setLastResult(items[0].result);
        setSelectedTier(items[0].result.tier);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Không thể tải lịch sử research.");
      }
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeConversation = useMemo(
    () => history.find((item) => item.id === activeConversationId) ?? null,
    [history, activeConversationId]
  );

  const latestTier2 = useMemo(
    () => history.find((item) => item.result.tier === "tier2") ?? null,
    [history]
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = query.trim();
    if (!message || isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      let nextResult: ResearchResult;
      if (selectedTier === "tier1") {
        const response = await api.post<ChatResponse>("/chat", { message });
        const answer = getChatReply(response.data);
        if (!answer) throw new Error("Chưa có nội dung trả lời hợp lệ.");
        nextResult = {
          tier: "tier1",
          answer,
          debug: getChatIntentDebug(response.data)
        };
      } else {
        const response = await runResearchTier2(message, {
          researchMode: selectedResearchMode
        });
        const normalized = normalizeResearchTier2(response);
        if (!normalized.answer && !normalized.citations.length) {
          throw new Error("Chưa có phản hồi chuyên sâu hợp lệ.");
        }
        nextResult = {
          tier: "tier2",
          ...normalized
        };
      }

      setLastResult(nextResult);

      let conversation = createConversationItem(message, nextResult);
      try {
        const persisted = await createResearchConversation(
          message,
          nextResult as unknown as Record<string, unknown>
        );
        conversation = createConversationItemFromPersisted(persisted);
      } catch (persistError) {
        setError(
          persistError instanceof Error
            ? `Đã trả lời nhưng lưu hội thoại thất bại: ${persistError.message}`
            : "Đã trả lời nhưng lưu hội thoại thất bại."
        );
      }

      setHistory((prev) => [conversation, ...prev.filter((item) => item.id !== conversation.id)]);
      setActiveConversationId(conversation.id);
      setQuery("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể xử lý câu hỏi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      title="CLARA Research"
      description="Tách luồng research thành nhiều trang rõ nhiệm vụ: hỏi nhanh, deepdive, analyze, citations và details."
    >
      <div className="space-y-5">
        <ResearchLabNav />

        <section className="chrome-panel rounded-[1.6rem] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">Research Hub</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)] sm:text-[2.2rem]">Một trang chỉ một trọng tâm</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
                Trang này chỉ tập trung đặt câu hỏi và nhận kết quả. Các phần nặng như citations, telemetry,
                flow và debug được tách sang trang riêng để dễ đọc và dễ vận hành.
              </p>
            </div>
            <span className="rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              Vai trò hiện tại: {role}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-3 transition hover:border-[color:var(--shell-border-strong)]"
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">{link.label}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{link.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="chrome-panel rounded-[1.6rem] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">Run Research</h3>
            <div className="flex flex-wrap items-center gap-2">
              <fieldset className="inline-flex rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] p-1">
                <legend className="sr-only">Chọn tier</legend>
                <button
                  type="button"
                  onClick={() => setSelectedTier("tier1")}
                  disabled={isSubmitting}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold transition",
                    selectedTier === "tier1"
                      ? "bg-[var(--text-primary)] text-[var(--surface-panel)]"
                      : "text-[var(--text-secondary)]"
                  ].join(" ")}
                >
                  Nhanh
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTier("tier2")}
                  disabled={isSubmitting}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold transition",
                    selectedTier === "tier2"
                      ? "bg-[var(--text-primary)] text-[var(--surface-panel)]"
                      : "text-[var(--text-secondary)]"
                  ].join(" ")}
                >
                  Chuyên sâu
                </button>
              </fieldset>

              {selectedTier === "tier2" ? (
                <fieldset className="inline-flex rounded-full border border-cyan-300/65 bg-cyan-500/10 p-1">
                  <legend className="sr-only">Chọn mode research</legend>
                  <button
                    type="button"
                    onClick={() => setSelectedResearchMode("fast")}
                    disabled={isSubmitting}
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold transition",
                      selectedResearchMode === "fast"
                        ? "bg-cyan-500 text-white"
                        : "text-cyan-700 dark:text-cyan-200"
                    ].join(" ")}
                  >
                    Fast
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedResearchMode("deep")}
                    disabled={isSubmitting}
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold transition",
                      selectedResearchMode === "deep"
                        ? "bg-cyan-500 text-white"
                        : "text-cyan-700 dark:text-cyan-200"
                    ].join(" ")}
                  >
                    Deep
                  </button>
                </fieldset>
              ) : null}
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-3 space-y-3">
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={isSubmitting}
              placeholder="Nhập câu hỏi y tế bạn cần CLARA xử lý..."
              className="min-h-[140px] w-full rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none transition focus:border-[color:var(--shell-border-strong)]"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[var(--text-muted)]">
                {selectedTier === "tier2"
                  ? `Mode hiện tại: ${selectedResearchMode.toUpperCase()} · cần phân tích sâu hơn thì mở trang Deepdive.`
                  : "Tier nhanh phù hợp cho câu hỏi ngắn và trả lời tức thì."}
              </p>
              <button
                type="submit"
                disabled={isSubmitting || !query.trim()}
                className="inline-flex min-h-[46px] items-center rounded-xl border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "Đang xử lý..." : "Chạy"}
              </button>
            </div>
          </form>

          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

          {lastResult ? (
            <article className="mt-4 rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                  {lastResult.tier === "tier2" ? "Tier 2" : "Tier 1"}
                </span>
                {lastResult.tier === "tier2" && lastResult.researchMode ? (
                  <span className="rounded-full border border-cyan-300/60 bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold text-cyan-100">
                    {lastResult.researchMode.toUpperCase()}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--text-primary)]">
                {lastResult.answer || "Chưa có nội dung trả lời."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/research/citations"
                  className="inline-flex min-h-[40px] items-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--text-primary)]"
                >
                  Mở Citations
                </Link>
                <Link
                  href="/research/details"
                  className="inline-flex min-h-[40px] items-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--text-primary)]"
                >
                  Mở Details
                </Link>
                <Link
                  href="/research/analyze"
                  className="inline-flex min-h-[40px] items-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--text-primary)]"
                >
                  Mở Analyze
                </Link>
              </div>
            </article>
          ) : null}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="chrome-panel rounded-[1.35rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">Lịch sử hội thoại gần đây</h3>
              <span className="text-xs text-[var(--text-muted)]">{history.length} phiên</span>
            </div>
            {!history.length ? (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Chưa có hội thoại research nào được lưu.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {history.slice(0, 8).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveConversationId(item.id);
                        setLastResult(item.result);
                        setSelectedTier(item.result.tier);
                      }}
                      className={[
                        "w-full rounded-xl border px-3 py-2 text-left transition",
                        item.id === activeConversationId
                          ? "border-cyan-300/70 bg-cyan-500/10"
                          : "border-[color:var(--shell-border)] bg-[var(--surface-muted)]"
                      ].join(" ")}
                    >
                      <p className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)]">{item.query}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {formatHistoryTime(item.createdAt)} · {item.result.tier.toUpperCase()}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <ResearchLatestTier2 result={latestTier2?.result.tier === "tier2" ? latestTier2.result : null} />
        </div>

        {activeConversation ? (
          <p className="text-xs text-[var(--text-muted)]">
            Đang xem: <span className="font-semibold text-[var(--text-secondary)]">{activeConversation.query}</span>
          </p>
        ) : null}
      </div>
    </PageShell>
  );
}
