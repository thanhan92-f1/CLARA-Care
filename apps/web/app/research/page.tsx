"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import PageShell from "@/components/ui/page-shell";
import api from "@/lib/http-client";
import { UserRole, getRole } from "@/lib/auth-store";
import { ChatResponse, getChatIntentDebug, getChatReply } from "@/lib/chat";
import {
  ResearchTier,
  Tier2Citation,
  Tier2Step,
  normalizeResearchTier2,
  runResearchTier2
} from "@/lib/research";

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

export default function ResearchPage() {
  const [role, setRole] = useState<UserRole>("normal");
  const [selectedTier, setSelectedTier] = useState<ResearchTier>("tier1");
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRole(getRole());
  }, []);

  const roleLabel = useMemo(() => ROLE_LABELS[role] ?? "Người dùng cá nhân", [role]);
  const isDev = process.env.NODE_ENV !== "production";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) return;

    setError("");
    setIsSubmitting(true);
    setLastQuery(nextQuery);
    setResult(null);

    try {
      if (selectedTier === "tier1") {
        const response = await api.post<ChatResponse>("/chat", { message: nextQuery });
        const nextAnswer = getChatReply(response.data);

        if (!nextAnswer) {
          throw new Error("Phản hồi Tier1 không có nội dung.");
        }

        setResult({
          tier: "tier1",
          answer: nextAnswer,
          debug: getChatIntentDebug(response.data)
        });
      } else {
        const response = await runResearchTier2(nextQuery);
        const normalized = normalizeResearchTier2(response);

        if (!normalized.answer && normalized.citations.length === 0 && normalized.steps.length === 0) {
          throw new Error("Tier2 không trả về nội dung hợp lệ.");
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
      const fallbackMessage = "Không thể gửi câu hỏi nghiên cứu. Vui lòng thử lại.";
      if (submitError instanceof Error && submitError.message) {
        setError(submitError.message);
      } else {
        setError(fallbackMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell title="Không gian hỏi đáp nghiên cứu">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            Chế độ nhanh trả lời trực tiếp; chế độ chuyên sâu trả lời kèm nguồn tham chiếu và các bước phân tích.
          </p>
          <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Vai trò: {roleLabel}
          </span>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700">Mức độ phản hồi</legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                selectedTier === "tier1"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              onClick={() => setSelectedTier("tier1")}
              disabled={isSubmitting}
            >
              Nhanh
            </button>
            <button
              type="button"
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                selectedTier === "tier2"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              onClick={() => setSelectedTier("tier2")}
              disabled={isSubmitting}
            >
              Chuyên sâu
            </button>
          </div>
        </fieldset>

        <form className="space-y-3" onSubmit={onSubmit}>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Nhập câu hỏi nghiên cứu..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !query.trim()}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Đang xử lý..." : selectedTier === "tier1" ? "Gửi câu hỏi (Nhanh)" : "Gửi câu hỏi (Chuyên sâu)"}
          </button>
        </form>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        {isSubmitting ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            CLARA đang phân tích câu hỏi...
          </div>
        ) : null}

        {result?.tier === "tier1" ? (
          <article className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Q</p>
            <p className="text-sm text-slate-700">{lastQuery}</p>
            <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">A (Nhanh)</p>
            <p className="whitespace-pre-wrap text-sm text-slate-900">{result.answer}</p>
          </article>
        ) : null}

        {result?.tier === "tier2" ? (
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <article className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Câu hỏi</p>
                <p className="text-sm leading-7 text-slate-700">{lastQuery}</p>
                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Trả lời chuyên sâu</p>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-900">
                  {result.answer || "Chưa có nội dung trả lời."}
                </p>
              </article>

              <aside className="space-y-3">
                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nguồn tham chiếu</p>
                  {result.citations.length ? (
                    <ul className="mt-2 space-y-2">
                      {result.citations.map((citation, index) => (
                        <li key={`${citation.title}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                          <p className="font-medium text-slate-800">{citation.title}</p>
                          {citation.source || citation.year ? (
                            <p className="mt-1 text-xs text-slate-500">
                              {[citation.source, citation.year].filter(Boolean).join(" | ")}
                            </p>
                          ) : null}
                          {citation.snippet ? <p className="mt-1 text-slate-600">{citation.snippet}</p> : null}
                          {citation.url ? (
                            <a
                              href={citation.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                            >
                              Mở nguồn tham chiếu
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">Chưa có nguồn tham chiếu trong phản hồi hiện tại.</p>
                  )}
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Các bước phân tích</p>
                  {result.steps.length ? (
                    <ol className="mt-2 space-y-2">
                      {result.steps.map((step, index) => (
                        <li key={`${step.title}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                          <p className="font-medium text-slate-800">
                            {index + 1}. {step.title}
                          </p>
                          {step.detail ? <p className="mt-1 text-slate-600">{step.detail}</p> : null}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">Chưa có chi tiết các bước phân tích.</p>
                  )}
                </div>
              </aside>
            </div>
          </section>
        ) : null}

        {isDev && result?.tier === "tier1" ? (
          <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Intent Debug (chỉ môi trường dev)</p>
            <div className="mt-2 grid gap-1 text-sm text-slate-700">
              <p>vai trò: {result.debug?.role ?? "N/A"}</p>
              <p>intent: {result.debug?.intent ?? "N/A"}</p>
              <p>độ tin cậy: {result.debug?.confidence ?? "N/A"}</p>
              <p>khẩn cấp: {result.debug?.emergency === undefined ? "N/A" : String(result.debug.emergency)}</p>
              <p>mô hình: {result.debug?.model_used ?? "N/A"}</p>
            </div>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}
