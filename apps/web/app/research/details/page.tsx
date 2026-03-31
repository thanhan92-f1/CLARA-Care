"use client";

import { useEffect, useState } from "react";
import ResearchEmptyState from "@/components/research/research-empty-state";
import { createConversationItemFromPersisted } from "@/components/research/lib/research-page-helpers";
import { ConversationItem, Tier2Result } from "@/components/research/lib/research-page-types";
import ResearchLabNav from "@/components/research/research-lab-nav";
import PageShell from "@/components/ui/page-shell";
import { listResearchConversations } from "@/lib/research";

type Tier2Conversation = ConversationItem & { result: Tier2Result };

function isTier2Conversation(item: ConversationItem): item is Tier2Conversation {
  return item.result.tier === "tier2";
}

function formatNumber(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function toDisplayTime(value: number): string {
  return new Date(value).toLocaleString("vi-VN");
}

export default function ResearchDetailsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [conversation, setConversation] = useState<Tier2Conversation | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLatest = async () => {
      setIsLoading(true);
      setError("");
      try {
        const rows = await listResearchConversations(120);
        if (cancelled) return;

        const items = rows
          .map((row) => createConversationItemFromPersisted(row))
          .sort((a, b) => b.createdAt - a.createdAt);
        setConversation(items.find((item) => isTier2Conversation(item)) ?? null);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải routing/debug/meta details."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadLatest();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell
      title="Research Details"
      description="Routing, debug và metadata của conversation tier2 mới nhất."
    >
      <div className="space-y-4">
        <ResearchLabNav />

        {isLoading ? (
          <section className="chrome-panel rounded-[1.35rem] p-4 text-sm text-[var(--text-secondary)]">
            Đang tải details...
          </section>
        ) : null}

        {error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </section>
        ) : null}

        {!isLoading && !error && !conversation ? (
          <ResearchEmptyState
            title="Chưa có details để hiển thị"
            description="Chạy Research hoặc Deepdive trước khi mở trang details."
          />
        ) : null}

        {conversation ? (
          <>
            <section className="chrome-panel rounded-[1.35rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Conversation
              </p>
              <div className="mt-2 grid gap-1 text-sm text-[var(--text-primary)]">
                <p>
                  <span className="font-semibold">ID:</span> {conversation.id}
                </p>
                <p>
                  <span className="font-semibold">Created:</span> {toDisplayTime(conversation.createdAt)}
                </p>
                <p>
                  <span className="font-semibold">Query:</span> {conversation.query}
                </p>
              </div>
            </section>

            <section className="chrome-panel rounded-[1.35rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Routing & Meta
              </p>
              <div className="mt-2 grid gap-1 text-sm text-[var(--text-primary)]">
                <p>pipeline: {conversation.result.debug.pipeline ?? "n/a"}</p>
                <p>response_style: {conversation.result.debug.responseStyle ?? "n/a"}</p>
                <p>source_mode: {conversation.result.debug.sourceMode ?? "n/a"}</p>
                <p>research_mode: {conversation.result.researchMode ?? "n/a"}</p>
                <p>deep_pass_count: {formatNumber(conversation.result.deepPassCount)}</p>
                <p>routing_role: {conversation.result.debug.routing?.role ?? "n/a"}</p>
                <p>routing_intent: {conversation.result.debug.routing?.intent ?? "n/a"}</p>
                <p>routing_confidence: {formatNumber(conversation.result.debug.routing?.confidence)}</p>
                <p>
                  routing_emergency:{" "}
                  {typeof conversation.result.debug.routing?.emergency === "boolean"
                    ? String(conversation.result.debug.routing.emergency)
                    : "n/a"}
                </p>
              </div>
            </section>

            <section className="chrome-panel rounded-[1.35rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Runtime Summary
              </p>
              <div className="mt-2 grid gap-1 text-sm text-[var(--text-primary)]">
                <p>policy_action: {conversation.result.policyAction ?? "n/a"}</p>
                <p>
                  fallback_used:{" "}
                  {typeof conversation.result.fallbackUsed === "boolean"
                    ? String(conversation.result.fallbackUsed)
                    : "n/a"}
                </p>
                <p>verification_verdict: {conversation.result.verificationStatus?.verdict ?? "n/a"}</p>
                <p>verification_confidence: {formatNumber(conversation.result.verificationStatus?.confidence)}</p>
                <p>stage_count: {formatNumber(conversation.result.debug.stageCount)}</p>
                <p>flow_event_count: {formatNumber(conversation.result.debug.flowEventCount)}</p>
                <p>telemetry_keyword_count: {formatNumber(conversation.result.debug.telemetryKeywordCount)}</p>
                <p>telemetry_doc_count: {formatNumber(conversation.result.debug.telemetryDocCount)}</p>
                <p>
                  telemetry_source_attempt_count:{" "}
                  {formatNumber(conversation.result.debug.telemetrySourceAttemptCount)}
                </p>
                <p>telemetry_error_count: {formatNumber(conversation.result.debug.telemetryErrorCount)}</p>
                <p>crawl_domain_count: {formatNumber(conversation.result.debug.crawlDomainCount)}</p>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
