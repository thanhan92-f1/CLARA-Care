"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import FlowTimelinePanel from "@/components/research/flow-timeline-panel";
import MarkdownAnswer from "@/components/research/markdown-answer";
import ResearchLabNav from "@/components/research/research-lab-nav";
import TelemetryDetailsPanel from "@/components/research/telemetry-details-panel";
import {
  createConversationItem,
  createConversationItemFromPersisted,
  formatHistoryTime,
  resolveFlowModeFromResult
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

const QUICK_LINKS: Array<{ href: string; label: string }> = [
  { href: "/research/deepdive", label: "Deepdive" },
  { href: "/research/analyze", label: "Analyze" },
  { href: "/research/citations", label: "Citations" },
  { href: "/research/details", label: "Details" }
];

const QUICK_PROMPTS: string[] = [
  "So sánh DASH và Địa Trung Hải cho bệnh tim mạch",
  "Tương tác Warfarin với thuốc giảm đau phổ biến",
  "Checklist an toàn khi dùng 5 thuốc cùng lúc",
  "Tóm tắt cảnh báo DDI theo mức độ nguy cơ"
];

function ResultBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex min-h-[30px] items-center rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
      {label}: <span className="ml-1 text-[var(--text-primary)]">{value}</span>
    </span>
  );
}

export default function ResearchPage() {
  const [role, setRole] = useState<UserRole>("normal");
  const [selectedTier, setSelectedTier] = useState<ResearchTier>("tier1");
  const [selectedResearchMode, setSelectedResearchMode] = useState<ResearchExecutionMode>("fast");
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [rightTab, setRightTab] = useState<"insights" | "timeline" | "telemetry">("insights");

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
        const rows = await listResearchConversations(60);
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

  const latestTier2Result = latestTier2?.result.tier === "tier2" ? latestTier2.result : null;
  const flowMode = useMemo(
    () => (lastResult?.tier === "tier2" ? resolveFlowModeFromResult(lastResult) : "idle"),
    [lastResult]
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

  const answerText =
    lastResult?.tier === "tier2"
      ? lastResult.answer || "Chưa có nội dung trả lời."
      : lastResult?.answer || "Chưa có nội dung trả lời.";

  const answerCitations =
    lastResult?.tier === "tier2" ? lastResult.citations : [];

  const copyAnswer = async () => {
    const content = answerText.trim();
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopyMessage("Đã copy câu trả lời.");
    } catch {
      setCopyMessage("Không thể copy tự động trên trình duyệt này.");
    }
    window.setTimeout(() => setCopyMessage(""), 2000);
  };

  return (
    <PageShell
      title="CLARA Research Studio"
      description="Một workspace duy nhất cho hỏi nhanh, deep research, citation tracking và debug flow."
    >
      <div className="space-y-4">
        <ResearchLabNav />

        <section className="chrome-panel relative overflow-hidden rounded-[1.6rem] p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-12 top-[-3.5rem] h-36 w-36 rounded-full bg-cyan-300/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-[-4.5rem] h-40 w-40 rounded-full bg-sky-300/20 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                Research cockpit
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)] sm:text-[2.2rem]">
                Hôm nay bạn muốn research gì?
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
                Composer ở giữa, lịch sử bên trái, insight và shortcuts bên phải. Tập trung câu hỏi,
                không bị loãng bởi quá nhiều khối thông tin.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-[38px] items-center rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--text-secondary)]">
                Vai trò: {role}
              </span>
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-[38px] items-center rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-3 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[color:var(--shell-border-strong)] hover:bg-[var(--surface-muted)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[17rem_minmax(0,1fr)_20rem]">
          <aside className="chrome-panel rounded-[1.35rem] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Conversations</h3>
              <span className="rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                {history.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveConversationId(null);
                setLastResult(null);
                setQuery("");
              }}
              className="mt-3 inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[color:var(--shell-border-strong)]"
            >
              + Cuộc hội thoại mới
            </button>

            {!history.length ? (
              <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">
                Chưa có lịch sử. Hãy chạy câu hỏi đầu tiên.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {history.slice(0, 10).map((item) => {
                  const active = item.id === activeConversationId;
                  return (
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
                          active
                            ? "border-cyan-300/70 bg-cyan-500/10"
                            : "border-[color:var(--shell-border)] bg-[var(--surface-muted)]"
                        ].join(" ")}
                      >
                        <p className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">{item.query}</p>
                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                          {formatHistoryTime(item.createdAt)} · {item.result.tier.toUpperCase()}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section className="chrome-panel rounded-[1.35rem] p-4 sm:p-5 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
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
                    Quick
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
                    Research
                  </button>
                </fieldset>

                {selectedTier === "tier2" ? (
                  <fieldset className="inline-flex rounded-full border border-cyan-300/70 bg-cyan-500/10 p-1">
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

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  disabled={isSubmitting}
                  className="inline-flex min-h-[36px] items-center rounded-lg border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--text-secondary)]"
                >
                  Xóa prompt
                </button>
                <Link
                  href="/research/deepdive"
                  className="inline-flex min-h-[36px] items-center rounded-lg border border-cyan-300/70 bg-cyan-500/15 px-3 text-xs font-semibold text-cyan-800 dark:text-cyan-200"
                >
                  Mở Deepdive
                </Link>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setQuery(prompt)}
                  className="inline-flex min-h-[34px] items-center rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-3 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[color:var(--shell-border-strong)] hover:text-[var(--text-primary)]"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="mt-3 space-y-3">
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={isSubmitting}
                placeholder="Nhập câu hỏi nghiên cứu... ví dụ: so sánh guideline điều trị và mức độ bằng chứng"
                className="min-h-[160px] w-full rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none transition focus:border-[color:var(--shell-border-strong)]"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[var(--text-muted)]">
                  {selectedTier === "tier2"
                    ? `Research mode: ${selectedResearchMode.toUpperCase()} · hệ thống sẽ trả lời kèm nguồn và telemetry.`
                    : "Quick mode: trả lời nhanh với guard an toàn."}
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting || !query.trim()}
                  className="inline-flex min-h-[46px] items-center rounded-xl border border-cyan-300/65 bg-gradient-to-r from-sky-600 to-cyan-500 px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Đang nghiên cứu..." : "Run Research"}
                </button>
              </div>
            </form>

            {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}

            <article className="mt-4 rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <ResultBadge label="tier" value={lastResult?.tier === "tier2" ? "research" : "quick"} />
                {lastResult?.tier === "tier2" && lastResult.researchMode ? (
                  <ResultBadge label="mode" value={lastResult.researchMode.toUpperCase()} />
                ) : null}
                {lastResult?.tier === "tier2" && lastResult.verificationStatus?.verdict ? (
                  <ResultBadge label="fides" value={lastResult.verificationStatus.verdict} />
                ) : null}
                {lastResult?.tier === "tier2" && typeof lastResult.fallbackUsed === "boolean" ? (
                  <ResultBadge label="path" value={lastResult.fallbackUsed ? "fallback" : "rag"} />
                ) : null}
                <div className="ml-auto flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setQuery(activeConversation?.query ?? query)}
                    className="inline-flex min-h-[34px] items-center rounded-lg border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    Reuse query
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyAnswer()}
                    className="inline-flex min-h-[34px] items-center rounded-lg border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    Copy answer
                  </button>
                </div>
              </div>

              <div className="mt-3 max-h-[33rem] overflow-y-auto pr-1">
                {lastResult ? (
                  <MarkdownAnswer answer={answerText} citations={answerCitations} />
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Chưa có kết quả. Hãy nhập câu hỏi và bấm <span className="font-semibold">Run Research</span>.
                  </p>
                )}
              </div>

              {lastResult?.tier === "tier1" && lastResult.debug ? (
                <div className="mt-3 rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                  role={lastResult.debug.role ?? "n/a"} · intent={lastResult.debug.intent ?? "n/a"} · confidence={
                    typeof lastResult.debug.confidence === "number"
                      ? lastResult.debug.confidence.toFixed(2)
                      : "n/a"
                  }
                </div>
              ) : null}
              {copyMessage ? (
                <p className="mt-2 text-xs text-cyan-700 dark:text-cyan-300">{copyMessage}</p>
              ) : null}
            </article>
          </section>

          <aside className="space-y-4">
            <section className="chrome-panel rounded-[1.35rem] p-3 sm:p-4">
              <div className="inline-flex w-full rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] p-1">
                {(["insights", "timeline", "telemetry"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setRightTab(tab)}
                    className={[
                      "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition",
                      rightTab === tab
                        ? "bg-[var(--text-primary)] text-[var(--surface-panel)]"
                        : "text-[var(--text-secondary)]"
                    ].join(" ")}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </section>

            {rightTab === "timeline" ? (
              <FlowTimelinePanel
                stages={lastResult?.tier === "tier2" ? lastResult.flowStages : []}
                events={lastResult?.tier === "tier2" ? lastResult.flowEvents : []}
                mode={flowMode}
                isProcessing={isSubmitting && selectedTier === "tier2"}
              />
            ) : null}

            {rightTab === "telemetry" ? (
              <TelemetryDetailsPanel
                telemetry={
                  lastResult?.tier === "tier2"
                    ? lastResult.telemetry
                    : {
                        keywords: [],
                        searchPlan: { keywords: [], subqueries: [], connectors: [] },
                        sourceAttempts: [],
                        indexSummary: {},
                        crawlSummary: { domains: [] },
                        docs: [],
                        scores: [],
                        sourceReasoning: [],
                        errors: []
                      }
                }
                isProcessing={isSubmitting && selectedTier === "tier2"}
              />
            ) : null}

            {rightTab === "insights" ? (
              <>
            <section className="chrome-panel rounded-[1.35rem] p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Session snapshot</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Citations</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                    {lastResult?.tier === "tier2" ? lastResult.citations.length : 0}
                  </p>
                </div>
                <div className="rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Flow events</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                    {lastResult?.tier === "tier2" ? lastResult.debug.flowEventCount : 0}
                  </p>
                </div>
                <div className="rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Telemetry docs</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                    {lastResult?.tier === "tier2" ? lastResult.debug.telemetryDocCount : 0}
                  </p>
                </div>
                <div className="rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Errors</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                    {lastResult?.tier === "tier2" ? lastResult.debug.telemetryErrorCount : 0}
                  </p>
                </div>
              </div>
            </section>

            <section className="chrome-panel rounded-[1.35rem] p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Latest deep run</p>
              {!latestTier2Result ? (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Chưa có run deep nào.</p>
              ) : (
                <>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-primary)]">
                    {latestTier2?.query}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <ResultBadge label="pass" value={latestTier2Result.deepPassCount ?? 1} />
                    <ResultBadge
                      label="confidence"
                      value={
                        typeof latestTier2Result.verificationStatus?.confidence === "number"
                          ? latestTier2Result.verificationStatus.confidence.toFixed(2)
                          : "n/a"
                      }
                    />
                  </div>
                </>
              )}
            </section>

            <section className="chrome-panel rounded-[1.35rem] p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Now viewing</p>
              {activeConversation ? (
                <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{activeConversation.query}</p>
              ) : (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Không có conversation đang chọn.</p>
              )}
            </section>
              </>
            ) : null}
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
