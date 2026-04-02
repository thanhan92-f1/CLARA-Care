"use client";

import { useEffect, useMemo, useState } from "react";
import CouncilEmptyState from "@/components/council/council-empty-state";
import CouncilWorkspaceNav from "@/components/council/council-workspace-nav";
import { CouncilSection } from "@/components/council/council-primitives";
import PageShell from "@/components/ui/page-shell";
import { CouncilRunSnapshot, loadCouncilSnapshot } from "@/lib/council";
import { buildCouncilView } from "@/lib/council-view";

export default function CouncilCitationsPage() {
  const [snapshot, setSnapshot] = useState<CouncilRunSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(loadCouncilSnapshot());
  }, []);

  const view = useMemo(() => (snapshot ? buildCouncilView(snapshot) : null), [snapshot]);

  return (
    <PageShell
      title="Council Citations"
      description="Toàn bộ citation/source tách riêng để kiểm chứng nhanh trong quá trình hội chẩn."
      variant="plain"
    >
      <div className="space-y-5">
        <CouncilWorkspaceNav />

        {!view ? (
          <CouncilEmptyState
            title="Chưa có citation để hiển thị"
            description="Chạy hội chẩn trước khi mở trang Citations."
          />
        ) : (
          <CouncilSection eyebrow="Evidence" title="Danh sách nguồn trích dẫn">
            {!view.citations.length ? (
              <p className="text-sm text-[var(--text-secondary)]">Payload hiện tại chưa trả về citation/source cụ thể.</p>
            ) : (
              <ul className="space-y-3">
                {view.citations.map((item, index) => (
                  <li
                    key={`${item.title}-${index}`}
                    className="rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">[{index + 1}] {item.title}</p>
                    {item.source ? (
                      <p className="mt-1 text-xs text-[var(--text-muted)]">source: {item.source}</p>
                    ) : null}
                    {item.snippet ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">{item.snippet}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {item.publishedAt ? (
                        <span className="rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-2 py-0.5 text-[var(--text-secondary)]">
                          published: {item.publishedAt}
                        </span>
                      ) : null}
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-sky-300/60 bg-sky-100/70 px-2 py-0.5 text-sky-800 dark:border-sky-700/50 dark:bg-sky-950/35 dark:text-sky-200"
                        >
                          Open source
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CouncilSection>
        )}
      </div>
    </PageShell>
  );
}
