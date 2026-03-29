"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import HistoryPanel from "@/components/research/history-panel";
import MarkdownAnswer from "@/components/research/markdown-answer";
import ResearchRightRail from "@/components/research/right-rail";
import PageShell from "@/components/ui/page-shell";
import { UserRole, getRole } from "@/lib/auth-store";
import { ChatResponse, getChatIntentDebug, getChatReply } from "@/lib/chat";
import api from "@/lib/http-client";
import {
  KnowledgeSource,
  ResearchFlowEvent,
  ResearchFlowStage,
  ResearchTier,
  ResearchTier2Result,
  Tier2Citation,
  Tier2Step,
  UploadedResearchFile,
  createKnowledgeSource,
  listKnowledgeSources,
  normalizeResearchTier2,
  runResearchTier2,
  uploadResearchFile
} from "@/lib/research";

const ROLE_LABELS: Record<UserRole, string> = {
  normal: "Người dùng cá nhân",
  researcher: "Nhà nghiên cứu",
  doctor: "Bác sĩ",
  admin: "Quản trị hệ thống",
};

type Tier1Result = {
  tier: "tier1";
  answer: string;
  debug: ReturnType<typeof getChatIntentDebug> | null;
};

type Tier2Result = {
  tier: "tier2";
} & ResearchTier2Result;

type ResearchResult = Tier1Result | Tier2Result;

type ConversationItem = {
  id: string;
  query: string;
  result: ResearchResult;
  createdAt: number;
};

type FlowVisibilityMode = "idle" | "flow-events" | "metadata-stages" | "local-fallback";

const SUGGESTED_QUERIES = [
  "So sánh DASH và Mediterranean cho bệnh tim mạch",
  "Tóm tắt guideline tăng huyết áp mới nhất từ tài liệu đã tải",
  "Liệt kê các cảnh báo tương tác thuốc quan trọng trong dữ liệu"
] as const;

const LOCAL_FLOW_BLUEPRINT: Array<Pick<ResearchFlowStage, "id" | "label" | "detail">> = [
  {
    id: "scope_question",
    label: "Scope Question",
    detail: "Chuẩn hóa truy vấn và xác định phạm vi phân tích."
  },
  {
    id: "collect_evidence",
    label: "Collect Evidence",
    detail: "Tổng hợp nguồn từ knowledge source và tài liệu upload."
  },
  {
    id: "synthesize_findings",
    label: "Synthesize Findings",
    detail: "Tổng hợp các điểm đồng thuận và bất đồng."
  },
  {
    id: "verification",
    label: "Verification",
    detail: "Đối chiếu consistency và độ tin cậy của câu trả lời."
  },
  {
    id: "final_response",
    label: "Final Response",
    detail: "Hoàn thiện câu trả lời có citation và metadata."
  }
];

function mergeUploadedFiles(current: UploadedResearchFile[], incoming: UploadedResearchFile[]): UploadedResearchFile[] {
  const byId = new Map(current.map((item) => [item.id, item]));

  incoming.forEach((item) => {
    const existing = byId.get(item.id);
    byId.set(item.id, {
      id: item.id,
      name: item.name || existing?.name || `File #${item.id}`,
      size: item.size ?? existing?.size
    });
  });

  return Array.from(byId.values());
}

function formatHistoryTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function conversationLabel(item: ConversationItem): string {
  const normalized = item.query.replace(/\s+/g, " ").trim();
  return normalized.length > 56 ? `${normalized.slice(0, 56)}...` : normalized;
}

function resolveFlowModeFromResult(result: Tier2Result): FlowVisibilityMode {
  if (result.flowEvents.length) return "flow-events";
  if (result.flowStages.length) return "metadata-stages";
  return "idle";
}

function buildLocalFlowStages(activeIndex: number, terminalStatus?: "completed" | "failed"): ResearchFlowStage[] {
  const cappedIndex = Math.max(0, Math.min(activeIndex, LOCAL_FLOW_BLUEPRINT.length - 1));

  return LOCAL_FLOW_BLUEPRINT.map((stage, index) => {
    let status: ResearchFlowStage["status"] = "pending";
    if (index < cappedIndex) status = "completed";
    if (index === cappedIndex) status = terminalStatus ?? "in_progress";
    if (terminalStatus === "completed" && index <= cappedIndex) status = "completed";
    if (terminalStatus === "failed" && index < cappedIndex) status = "completed";

    return {
      ...stage,
      status,
      source: "local"
    };
  });
}

function markTimelineFailed(stages: ResearchFlowStage[]): ResearchFlowStage[] {
  if (!stages.length) {
    return buildLocalFlowStages(0, "failed");
  }

  const activeIndex = stages.findIndex((stage) => stage.status === "in_progress");
  if (activeIndex >= 0) {
    return stages.map((stage, index) => (index === activeIndex ? { ...stage, status: "failed" } : stage));
  }

  const lastCompletedIndex = stages.reduce((acc, stage, index) => {
    if (stage.status === "completed") return index;
    return acc;
  }, 0);

  return stages.map((stage, index) => {
    if (index < lastCompletedIndex) return stage;
    if (index === lastCompletedIndex) return { ...stage, status: "failed" };
    return stage;
  });
}

export default function ResearchPage() {
  const [role, setRole] = useState<UserRole>("normal");
  const [selectedTier, setSelectedTier] = useState<ResearchTier>("tier1");
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedResearchFile[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
  const [newSourceName, setNewSourceName] = useState("");
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isCreatingSource, setIsCreatingSource] = useState(false);
  const [sourceError, setSourceError] = useState("");

  const [liveFlowStages, setLiveFlowStages] = useState<ResearchFlowStage[]>([]);
  const [liveFlowEvents, setLiveFlowEvents] = useState<ResearchFlowEvent[]>([]);
  const [flowMode, setFlowMode] = useState<FlowVisibilityMode>("idle");

  const localFlowIndexRef = useRef(0);
  const localFlowTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isDev = process.env.NODE_ENV !== "production";
  const roleLabel = useMemo(() => ROLE_LABELS[role] ?? ROLE_LABELS.normal, [role]);

  const activeConversation = useMemo(
    () => history.find((item) => item.id === activeConversationId) ?? null,
    [history, activeConversationId]
  );

  const activeTier2Result = useMemo(() => {
    if (activeConversation?.result.tier === "tier2") return activeConversation.result;
    if (result?.tier === "tier2") return result;
    return null;
  }, [activeConversation, result]);

  const evidenceCitations = useMemo<Tier2Citation[]>(() => activeTier2Result?.citations ?? [], [activeTier2Result]);
  const evidenceSteps = useMemo<Tier2Step[]>(() => activeTier2Result?.steps ?? [], [activeTier2Result]);

  const persistedFlowStages = useMemo<ResearchFlowStage[]>(() => activeTier2Result?.flowStages ?? [], [activeTier2Result]);
  const persistedFlowEvents = useMemo<ResearchFlowEvent[]>(() => activeTier2Result?.flowEvents ?? [], [activeTier2Result]);
  const persistedFlowMode = useMemo<FlowVisibilityMode>(() => {
    if (!activeTier2Result) return "idle";
    return resolveFlowModeFromResult(activeTier2Result);
  }, [activeTier2Result]);

  const timelineStages = isSubmitting
    ? liveFlowStages
    : persistedFlowStages.length
      ? persistedFlowStages
      : liveFlowStages;
  const timelineEvents = isSubmitting
    ? liveFlowEvents
    : persistedFlowEvents.length
      ? persistedFlowEvents
      : liveFlowEvents;
  const timelineMode = isSubmitting ? flowMode : persistedFlowMode !== "idle" ? persistedFlowMode : flowMode;

  const historyItems = useMemo(
    () =>
      history.map((item) => ({
        id: item.id,
        label: conversationLabel(item),
        timestamp: formatHistoryTime(item.createdAt),
        tier: item.result.tier,
        active: item.id === activeConversationId
      })),
    [history, activeConversationId]
  );

  const stopLocalFlowSimulation = () => {
    if (localFlowTimerRef.current !== null) {
      window.clearInterval(localFlowTimerRef.current);
      localFlowTimerRef.current = null;
    }
  };

  const startLocalFlowSimulation = () => {
    stopLocalFlowSimulation();
    localFlowIndexRef.current = 0;
    setFlowMode("local-fallback");
    setLiveFlowEvents([]);
    setLiveFlowStages(buildLocalFlowStages(0));

    localFlowTimerRef.current = window.setInterval(() => {
      localFlowIndexRef.current = Math.min(localFlowIndexRef.current + 1, LOCAL_FLOW_BLUEPRINT.length - 1);
      setLiveFlowStages(buildLocalFlowStages(localFlowIndexRef.current));
    }, 1300);
  };

  useEffect(() => {
    setRole(getRole());
  }, []);

  useEffect(() => {
    return () => {
      stopLocalFlowSimulation();
    };
  }, []);

  useEffect(() => {
    const loadSources = async () => {
      setIsLoadingSources(true);
      setSourceError("");
      try {
        const items = await listKnowledgeSources();
        setKnowledgeSources(items);
      } catch (loadError) {
        setSourceError(loadError instanceof Error ? loadError.message : "Không thể tải knowledge sources.");
      } finally {
        setIsLoadingSources(false);
      }
    };

    void loadSources();
  }, []);

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;

    setUploadError("");
    setError("");
    setIsUploading(true);

    const batchIds: string[] = [];
    const batchFiles: UploadedResearchFile[] = [];
    const failedUploads: string[] = [];

    for (const file of files) {
      try {
        const uploaded = await uploadResearchFile(file);

        if (!uploaded.uploadedFileIds.length) {
          throw new Error("Upload thành công nhưng chưa nhận được uploaded_file_ids.");
        }

        batchIds.push(...uploaded.uploadedFileIds);

        if (uploaded.files.length) {
          batchFiles.push(...uploaded.files);
        } else {
          batchFiles.push(
            ...uploaded.uploadedFileIds.map((id) => ({
              id,
              name: file.name,
              size: file.size
            }))
          );
        }
      } catch (uploadException) {
        const message = uploadException instanceof Error ? uploadException.message : "Upload thất bại.";
        failedUploads.push(`${file.name}: ${message}`);
      }
    }

    if (batchIds.length) {
      setUploadedFileIds((prev) => Array.from(new Set([...prev, ...batchIds])));
      setUploadedFiles((prev) => mergeUploadedFiles(prev, batchFiles));
    }

    if (failedUploads.length) {
      setUploadError(
        failedUploads.length === 1
          ? failedUploads[0]
          : `${failedUploads[0]} (+${failedUploads.length - 1} file lỗi khác)`
      );
    }

    if (!batchIds.length && !failedUploads.length) {
      setUploadError("Không nhận được dữ liệu uploaded_file_ids từ server.");
    }

    setIsUploading(false);
  };

  const onUploadInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.currentTarget.value = "";
    void uploadFiles(files);
  };

  const onDropUpload = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    void uploadFiles(files);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = query.trim();
    if (!message || isSubmitting) return;

    setError("");
    setIsSubmitting(true);
    setLastQuery(message);

    try {
      let nextResult: ResearchResult;

      if (selectedTier === "tier1") {
        stopLocalFlowSimulation();
        setFlowMode("idle");
        setLiveFlowStages([]);
        setLiveFlowEvents([]);

        const response = await api.post<ChatResponse>("/chat", { message });
        const answer = getChatReply(response.data);
        if (!answer) throw new Error("Chưa có nội dung trả lời hợp lệ.");

        nextResult = { tier: "tier1", answer, debug: getChatIntentDebug(response.data) };
      } else {
        startLocalFlowSimulation();

        const response = await runResearchTier2(message, { uploadedFileIds, sourceIds: selectedSourceIds });
        const normalized = normalizeResearchTier2(response);
        if (!normalized.answer && !normalized.citations.length) {
          throw new Error("Chưa có phản hồi chuyên sâu hợp lệ.");
        }

        const resolvedMode =
          normalized.flowEvents.length > 0
            ? "flow-events"
            : normalized.flowStages.length > 0
              ? "metadata-stages"
              : "local-fallback";

        const resolvedStages =
          normalized.flowStages.length > 0
            ? normalized.flowStages
            : buildLocalFlowStages(LOCAL_FLOW_BLUEPRINT.length - 1, "completed");

        setFlowMode(resolvedMode);
        setLiveFlowEvents(normalized.flowEvents);
        setLiveFlowStages(resolvedStages);

        nextResult = {
          tier: "tier2",
          ...normalized
        };
      }

      setResult(nextResult);

      const conversation: ConversationItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        query: message,
        result: nextResult,
        createdAt: Date.now()
      };

      setHistory((prev) => [conversation, ...prev]);
      setActiveConversationId(conversation.id);
      setQuery("");
    } catch (submitError) {
      if (selectedTier === "tier2") {
        setLiveFlowStages((prev) => markTimelineFailed(prev));
        setFlowMode("local-fallback");
      }
      setError(submitError instanceof Error ? submitError.message : "Không thể gửi câu hỏi.");
    } finally {
      stopLocalFlowSimulation();
      setIsSubmitting(false);
    }
  };

  const onOpenConversation = (conversationId: string) => {
    const item = history.find((entry) => entry.id === conversationId);
    if (!item) return;

    setActiveConversationId(item.id);
    setLastQuery(item.query);
    setResult(item.result);
    setSelectedTier(item.result.tier);
    setError("");

    if (item.result.tier === "tier2") {
      setLiveFlowStages(item.result.flowStages);
      setLiveFlowEvents(item.result.flowEvents);
      setFlowMode(resolveFlowModeFromResult(item.result));
    } else {
      setLiveFlowStages([]);
      setLiveFlowEvents([]);
      setFlowMode("idle");
    }
  };

  const onRemoveUploadedFile = (fileId: string) => {
    setUploadedFileIds((prev) => prev.filter((id) => id !== fileId));
    setUploadedFiles((prev) => prev.filter((item) => item.id !== fileId));
    setUploadError("");
  };

  const onClearUploadedFiles = () => {
    setUploadedFileIds([]);
    setUploadedFiles([]);
    setUploadError("");
  };

  const onToggleSource = (sourceId: number) => {
    setSelectedSourceIds((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]
    );
  };

  const onCreateSource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newSourceName.trim();
    if (!name || isCreatingSource) return;

    setIsCreatingSource(true);
    setSourceError("");
    try {
      const source = await createKnowledgeSource(name);
      setKnowledgeSources((prev) => [source, ...prev]);
      setSelectedSourceIds((prev) => [source.id, ...prev]);
      setNewSourceName("");
    } catch (createError) {
      setSourceError(createError instanceof Error ? createError.message : "Không thể tạo knowledge source.");
    } finally {
      setIsCreatingSource(false);
    }
  };

  const showDebugHints = role === "admin" || isDev;

  return (
    <PageShell title="Hỏi đáp y tế" variant="plain">
      <div className="grid gap-4 xl:grid-cols-[minmax(16rem,19rem)_minmax(0,1fr)_minmax(20rem,24rem)] 2xl:grid-cols-[18rem_minmax(0,1fr)_24rem] 2xl:gap-5">
        <aside className="order-2 space-y-4 xl:order-1 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-7.5rem)] xl:overflow-y-auto xl:pr-1">
          <HistoryPanel
            items={historyItems}
            suggestions={SUGGESTED_QUERIES}
            onOpenConversation={onOpenConversation}
            onPickSuggestion={setQuery}
          />
        </aside>

        <section className="order-1 space-y-4 xl:order-2">
          <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/70 to-cyan-50/45 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900/90 dark:via-slate-900/75 dark:to-cyan-950/35 sm:p-5">
            <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-sky-200/55 blur-2xl dark:bg-sky-800/35" />
            <div className="pointer-events-none absolute -bottom-12 -left-6 h-32 w-40 rounded-full bg-cyan-100/60 blur-2xl dark:bg-cyan-900/25" />
            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">CLARA Research Workspace</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Chatbot y tế với luồng xử lý minh bạch</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Bố cục tách rõ thread, composer, evidence và timeline để theo dõi quality của câu trả lời theo thời gian thực.
                </p>
              </div>
              <div className="space-y-2 text-right">
                <span className="inline-flex rounded-full border border-slate-300 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-200">
                  Vai trò: {roleLabel}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sources: {selectedSourceIds.length} · Files: {uploadedFiles.length}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/85 sm:p-5 lg:p-6">
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-800/70 sm:p-4">
                <label htmlFor="research-query" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                  Composer
                </label>
                <textarea
                  id="research-query"
                  className="mt-2 min-h-[140px] w-full resize-none border-0 bg-transparent p-0 text-sm leading-7 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-400"
                  placeholder="Hỏi ngay một câu y tế bạn cần làm rõ..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  disabled={isSubmitting}
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isSubmitting}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {isUploading ? "Đang upload..." : "Đính kèm"}
                    </button>

                    <fieldset className="inline-flex rounded-full border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                      <legend className="sr-only">Chọn chế độ trả lời</legend>
                      <button
                        type="button"
                        onClick={() => setSelectedTier("tier1")}
                        className={[
                          "rounded-full px-3 py-1 text-xs font-medium transition",
                          selectedTier === "tier1"
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                            : "text-slate-600 dark:text-slate-300"
                        ].join(" ")}
                      >
                        Nhanh
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTier("tier2")}
                        className={[
                          "rounded-full px-3 py-1 text-xs font-medium transition",
                          selectedTier === "tier2"
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                            : "text-slate-600 dark:text-slate-300"
                        ].join(" ")}
                      >
                        Chuyên sâu
                      </button>
                    </fieldset>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !query.trim()}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  >
                    {isSubmitting ? "Đang xử lý..." : "Gửi"}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,image/*"
                  className="hidden"
                  onChange={onUploadInputChange}
                />
              </div>
            </form>

            <div className="mt-4 space-y-3">
              {lastQuery ? (
                <article className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Câu hỏi</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-800 dark:text-slate-100">{lastQuery}</p>
                </article>
              ) : null}

              {isSubmitting ? (
                <article className="rounded-3xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm text-sky-800 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-200">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
                    CLARA đang tổng hợp phản hồi và cập nhật timeline xử lý...
                  </span>
                </article>
              ) : null}

              {result?.tier === "tier1" ? (
                <article className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">Trả lời nhanh</p>
                  <div className="mt-2">
                    <MarkdownAnswer answer={result.answer} citations={[]} />
                  </div>
                </article>
              ) : null}

              {result?.tier === "tier2" ? (
                <article className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">Trả lời chuyên sâu</p>
                    {result.policyAction ? (
                      <span
                        className={[
                          "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          result.policyAction === "warn"
                            ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        ].join(" ")}
                      >
                        {result.policyAction === "warn" ? "Policy: Warn" : "Policy: Allow"}
                      </span>
                    ) : null}
                    {typeof result.fallbackUsed === "boolean" ? (
                      <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {result.fallbackUsed ? "Fallback mode" : "RAG mode"}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2">
                    <MarkdownAnswer answer={result.answer || "Chưa có nội dung."} citations={result.citations} />
                  </div>

                  {result.citations.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.citations.map((citation, index) => (
                        <a
                          key={`answer-citation-${index + 1}`}
                          href={citation.url || `#citation-${index + 1}`}
                          target={citation.url ? "_blank" : undefined}
                          rel={citation.url ? "noreferrer" : undefined}
                          className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:border-sky-600 dark:hover:bg-sky-900/40"
                        >
                          [{index + 1}] {citation.source ?? citation.title}
                        </a>
                      ))}
                    </div>
                  ) : null}

                  {result.verificationStatus ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                      <p className="font-semibold">
                        FIDES-lite: {result.verificationStatus.verdict ?? "n/a"} | confidence:{" "}
                        {typeof result.verificationStatus.confidence === "number"
                          ? result.verificationStatus.confidence.toFixed(2)
                          : "n/a"}
                        {result.verificationStatus.severity ? ` | severity: ${result.verificationStatus.severity}` : ""}
                      </p>
                      {result.verificationStatus.note ? (
                        <p className="mt-1 text-slate-600 dark:text-slate-300">{result.verificationStatus.note}</p>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ) : null}

              {showDebugHints && result?.tier === "tier1" ? (
                <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-4 dark:border-slate-600 dark:bg-slate-900/85">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Intent Debug</p>
                  <div className="mt-2 grid gap-1 text-sm text-slate-700 dark:text-slate-300">
                    <p>role: {result.debug?.role ?? "N/A"}</p>
                    <p>intent: {result.debug?.intent ?? "N/A"}</p>
                    <p>confidence: {result.debug?.confidence ?? "N/A"}</p>
                    <p>model: {result.debug?.model_used ?? "N/A"}</p>
                  </div>
                </section>
              ) : null}

              {result?.tier === "tier2" && evidenceSteps.length ? (
                <section className="rounded-3xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/85">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Analysis Steps</p>
                  <ol className="mt-3 space-y-2">
                    {evidenceSteps.map((step, index) => (
                      <li key={`${step.title}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/75">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{index + 1}. {step.title}</p>
                        {step.detail ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{step.detail}</p> : null}
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}
            </div>
          </section>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300">
              {error}
            </div>
          ) : null}
        </section>

        <aside className="order-3 space-y-4 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-7.5rem)] xl:overflow-y-auto xl:pl-1">
          <ResearchRightRail
            citations={evidenceCitations}
            flowStages={timelineStages}
            flowEvents={timelineEvents}
            flowMode={timelineMode}
            isSubmitting={isSubmitting}
            knowledgeSources={knowledgeSources}
            selectedSourceIds={selectedSourceIds}
            isLoadingSources={isLoadingSources}
            isCreatingSource={isCreatingSource}
            sourceError={sourceError}
            newSourceName={newSourceName}
            onSourceNameChange={setNewSourceName}
            onToggleSource={onToggleSource}
            onCreateSource={onCreateSource}
            uploadedFiles={uploadedFiles}
            isUploading={isUploading}
            isDragActive={isDragActive}
            uploadError={uploadError}
            onClearUploadedFiles={onClearUploadedFiles}
            onRemoveUploadedFile={onRemoveUploadedFile}
            onDropUpload={onDropUpload}
            onDragOverUpload={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragEnterUpload={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeaveUpload={(event) => {
              event.preventDefault();
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setIsDragActive(false);
              }
            }}
            showDebugHints={showDebugHints}
            debugHints={{
              roleLabel,
              selectedTier,
              conversationCount: history.length,
              selectedSourceCount: selectedSourceIds.length,
              uploadedFileCount: uploadedFiles.length,
              flowMode: timelineMode,
              policyAction: activeTier2Result?.policyAction,
              fallbackUsed: activeTier2Result?.fallbackUsed,
              verificationVerdict: activeTier2Result?.verificationStatus?.verdict,
              verificationConfidence: activeTier2Result?.verificationStatus?.confidence,
              routingRole: activeTier2Result?.debug.routing?.role,
              routingIntent: activeTier2Result?.debug.routing?.intent,
              routingConfidence: activeTier2Result?.debug.routing?.confidence,
              pipeline: activeTier2Result?.debug.pipeline
            }}
          />
        </aside>
      </div>
    </PageShell>
  );
}
