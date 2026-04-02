"use client";

import { useEffect, useMemo, useState } from "react";
import CouncilEmptyState from "@/components/council/council-empty-state";
import CouncilWorkspaceNav from "@/components/council/council-workspace-nav";
import { CouncilList, CouncilSection } from "@/components/council/council-primitives";
import PageShell from "@/components/ui/page-shell";
import { CouncilRunSnapshot, loadCouncilSnapshot } from "@/lib/council";
import { buildCouncilView } from "@/lib/council-view";

export default function CouncilResearchPage() {
  const [snapshot, setSnapshot] = useState<CouncilRunSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(loadCouncilSnapshot());
  }, []);

  const view = useMemo(() => (snapshot ? buildCouncilView(snapshot) : null), [snapshot]);

  return (
    <PageShell
      title="Council Research"
      description="Góc nhìn research sau hội chẩn: highlights, câu hỏi mở và next steps cần theo dõi."
      variant="plain"
    >
      <div className="space-y-5">
        <CouncilWorkspaceNav />

        {!view ? (
          <CouncilEmptyState
            title="Chưa có dữ liệu research"
            description="Hãy chạy hội chẩn trước để tạo dữ liệu cho trang Research."
          />
        ) : (
          <>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <CouncilSection eyebrow="Highlights" title="Tổng hợp insight">
                <CouncilList
                  items={view.research.highlights}
                  emptyText="Không có highlights trong snapshot hiện tại."
                />
              </CouncilSection>

              <CouncilSection eyebrow="Open Questions" title="Câu hỏi cần làm rõ">
                <CouncilList
                  items={view.research.openQuestions}
                  emptyText="Không có câu hỏi mở nổi bật."
                />
              </CouncilSection>
            </div>

            <CouncilSection eyebrow="Next Steps" title="Kế hoạch theo dõi tiếp theo">
              <CouncilList
                items={view.research.nextSteps}
                emptyText="Chưa có next step cụ thể trong payload hiện tại."
              />
            </CouncilSection>
          </>
        )}
      </div>
    </PageShell>
  );
}
