"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import PageShell from "@/components/ui/page-shell";
import api from "@/lib/http-client";
import { UserRole, getRole } from "@/lib/auth-store";
import { ChatResponse, getChatIntentDebug, getChatReply } from "@/lib/chat";
import { ResearchTier, Tier2Citation, Tier2Step, normalizeResearchTier2, runResearchTier2 } from "@/lib/research";

const ROLE_LABELS: Record<UserRole, string> = {
  normal: "Người dùng cá nhân",
  researcher: "Nhà nghiên cứu",
  doctor: "Bác sĩ"
};

type Tier1Result = {
  tier: "tier1";
  answer: string;
  debug: ReturnType<typeof getChatIntentDebug> | null;
};

type Tier2Result = {
  tier: "tier2";
  answer: string;
  citations: Tier2Citation[];
  steps: Tier2Step[];
};

type ResearchResult = Tier1Result | Tier2Result;

const SUGGESTED_QUERIES = [
  "So sánh DASH và Mediterranean trong kiểm soát nguy cơ tim mạch",
  "Khi phối hợp metformin và lợi tiểu cần lưu ý gì?",
  "Tóm tắt guideline tăng huyết áp mới nhất cho người cao tuổi",
  "Bằng chứng vaccine cúm ở người có bệnh nền"
] as const;

function Composer({
  query,
  setQuery,
  selectedTier,
  setSelectedTier,
  isSubmitting,
  onSubmit,
  compact
}: {
  query: string;
  setQuery: (value: string) => void;
  selectedTier: ResearchTier;
  setSelectedTier: (value: ResearchTier) => void;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  compact?: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="glass-card rounded-3xl p-3 shadow-[0_20px_56px_-42px_rgba(15,23,42,0.55)] sm:p-4">
        <textarea
          className={`w-full resize-none border-0 bg-transparent p-0 text-sm leading-7 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 ${
            compact ? "min-h-[86px]" : "min-h-[112px]"
          }`}
          placeholder="Nhập câu hỏi y tế của bạn..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={isSubmitting}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <fieldset className="inline-flex rounded-full border border-slate-300 bg-slate-50 p-1">
            <legend className="sr-only">Chọn chế độ trả lời</legend>
            <button
              type="button"
              onClick={() => setSelectedTier("tier1")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                selectedTier === "tier1" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Nhanh
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier("tier2")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                selectedTier === "tier2" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Chuyên sâu
            </button>
          </fieldset>
          <button
            type="submit"
            disabled={isSubmitting || !query.trim()}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {isSubmitting ? "Đang xử lý..." : "Gửi câu hỏi"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function ResearchPage() {
  const [role, setRole] = useState<UserRole>("normal");
  const [selectedTier, setSelectedTier] = useState<ResearchTier>("tier1");
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isDev = process.env.NODE_ENV !== "production";
  const roleLabel = useMemo(() => ROLE_LABELS[role] ?? ROLE_LABELS.normal, [role]);
  const showHero = !lastQuery && !result && !isSubmitting;

  useEffect(() => {
    setRole(getRole());
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = query.trim();
    if (!message) return;

    setError("");
    setIsSubmitting(true);
    setLastQuery(message);
    setResult(null);

    try {
      if (selectedTier === "tier1") {
        const response = await api.post<ChatResponse>("/chat", { message });
        const answer = getChatReply(response.data);
        if (!answer) throw new Error("Chưa có nội dung trả lời hợp lệ.");

        setResult({ tier: "tier1", answer, debug: getChatIntentDebug(response.data) });
      } else {
        const response = await runResearchTier2(message);
        const normalized = normalizeResearchTier2(response);
        if (!normalized.answer && !normalized.citations.length) {
          throw new Error("Chưa có phản hồi chuyên sâu hợp lệ.");
        }
        setResult({
          tier: "tier2",
          answer: normalized.answer,
          citations: normalized.citations,
          steps: normalized.steps
        });
      }
      setQuery("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể gửi câu hỏi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell title="Hỏi đáp y tế" variant="plain">
      <div className="space-y-4">
        <section className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">clara research</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Chat theo kiểu đơn giản, rõ nguồn</h2>
              <p className="mt-2 text-sm text-slate-600">
                Chọn chế độ Nhanh hoặc Chuyên sâu. Kết quả ưu tiên dễ đọc: câu trả lời chính, nguồn tham chiếu và bước xử lý.
              </p>
            </div>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Vai trò: {roleLabel}
            </span>
          </div>
        </section>

        {showHero ? (
          <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_24px_70px_-44px_rgba(2,132,199,0.45)] sm:p-7">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">ask. verify. act.</p>
            <h3 className="mt-2 text-center text-3xl font-semibold tracking-tight text-slate-900">Bạn muốn hỏi điều gì hôm nay?</h3>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-slate-600">
              Nhập một câu hỏi rõ ngữ cảnh để nhận phản hồi tốt hơn. Bạn có thể bắt đầu từ các gợi ý dưới đây.
            </p>
            <div className="mt-5">
              <Composer
                query={query}
                setQuery={setQuery}
                selectedTier={selectedTier}
                setSelectedTier={setSelectedTier}
                isSubmitting={isSubmitting}
                onSubmit={onSubmit}
              />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUERIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuery(item)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-sky-300 hover:text-sky-700"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="mx-auto max-w-5xl space-y-4">
              {lastQuery ? (
                <article className="flex justify-end">
                  <div className="max-w-3xl rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Câu hỏi của bạn</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-800">{lastQuery}</p>
                  </div>
                </article>
              ) : null}

              {isSubmitting ? (
                <article className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
                    CLARA đang tổng hợp phản hồi...
                  </span>
                </article>
              ) : null}

              {result?.tier === "tier1" ? (
                <article className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Trả lời nhanh</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-900">{result.answer}</p>
                </article>
              ) : null}

              {result?.tier === "tier2" ? (
                <>
                  <article className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Trả lời chuyên sâu</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-900">{result.answer || "Chưa có nội dung."}</p>
                  </article>

                  <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nguồn tham chiếu</p>
                    {result.citations.length ? (
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {result.citations.map((citation, idx) => (
                          <article key={`${citation.title}-${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-sm font-semibold text-slate-800">{citation.title}</p>
                            {(citation.source || citation.year) && (
                              <p className="mt-1 text-xs text-slate-500">{[citation.source, citation.year].filter(Boolean).join(" | ")}</p>
                            )}
                            {citation.snippet ? <p className="mt-2 text-sm text-slate-600">{citation.snippet}</p> : null}
                            {citation.url ? (
                              <a href={citation.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-sky-700 hover:underline">
                                Mở nguồn
                              </a>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Chưa có nguồn tham chiếu.</p>
                    )}
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Các bước phân tích</p>
                    {result.steps.length ? (
                      <ol className="mt-3 space-y-2">
                        {result.steps.map((step, idx) => (
                          <li key={`${step.title}-${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-sm font-semibold text-slate-900">
                              {idx + 1}. {step.title}
                            </p>
                            {step.detail ? <p className="mt-1 text-sm text-slate-600">{step.detail}</p> : null}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Chưa có chi tiết bước xử lý.</p>
                    )}
                  </section>
                </>
              ) : null}

              {isDev && result?.tier === "tier1" ? (
                <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Intent Debug (dev)</p>
                  <div className="mt-2 grid gap-1 text-sm text-slate-700">
                    <p>role: {result.debug?.role ?? "N/A"}</p>
                    <p>intent: {result.debug?.intent ?? "N/A"}</p>
                    <p>confidence: {result.debug?.confidence ?? "N/A"}</p>
                    <p>model: {result.debug?.model_used ?? "N/A"}</p>
                  </div>
                </section>
              ) : null}
            </section>

            <div className="sticky bottom-0 border-t border-slate-200 bg-gradient-to-t from-white via-white to-white/95 pb-1 pt-4 backdrop-blur">
              <div className="mx-auto max-w-5xl">
                <Composer
                  query={query}
                  setQuery={setQuery}
                  selectedTier={selectedTier}
                  setSelectedTier={setSelectedTier}
                  isSubmitting={isSubmitting}
                  onSubmit={onSubmit}
                  compact
                />
              </div>
            </div>
          </>
        )}

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      </div>
    </PageShell>
  );
}
