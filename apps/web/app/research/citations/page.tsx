"use client";

import { useEffect, useState } from "react";
import EvidencePanel from "@/components/research/evidence-panel";
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

export default function ResearchCitationsPage() {
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
            : "Không thể tải citations từ conversation tier2 mới nhất."
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
      title="Research Citations"
      description="Danh sách citations từ conversation tier2 mới nhất, kèm link nguồn."
    >
      <div className="space-y-4">
        <ResearchLabNav />

        {isLoading ? (
          <section className="chrome-panel rounded-[1.35rem] p-4 text-sm text-[var(--text-secondary)]">
            Đang tải citations...
          </section>
        ) : null}

        {error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </section>
        ) : null}

        {!isLoading && !error && !conversation ? (
          <ResearchEmptyState
            title="Chưa có citations để hiển thị"
            description="Chạy Research hoặc Deepdive trước để tạo danh sách nguồn dẫn."
          />
        ) : null}

        {conversation ? (
          <>
            <section className="chrome-panel rounded-[1.35rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Latest Tier2 Conversation
              </p>
              <p className="mt-2 text-sm text-[var(--text-primary)]">
                <span className="font-semibold">Query:</span> {conversation.query}
              </p>
            </section>

            <EvidencePanel citations={conversation.result.citations} />
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
