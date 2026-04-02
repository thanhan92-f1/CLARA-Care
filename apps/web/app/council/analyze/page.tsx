"use client";

import { useEffect, useMemo, useState } from "react";
import CouncilEmptyState from "@/components/council/council-empty-state";
import CouncilWorkspaceNav from "@/components/council/council-workspace-nav";
import { CouncilList, CouncilMetricCard, CouncilSection } from "@/components/council/council-primitives";
import PageShell from "@/components/ui/page-shell";
import { CouncilRunSnapshot, loadCouncilSnapshot } from "@/lib/council";
import { buildCouncilView } from "@/lib/council-view";

export default function CouncilAnalyzePage() {
  const [snapshot, setSnapshot] = useState<CouncilRunSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(loadCouncilSnapshot());
  }, []);

  const view = useMemo(() => (snapshot ? buildCouncilView(snapshot) : null), [snapshot]);

  return (
    <PageShell
      title="Council Analyze"
      description="Ưu tiên tín hiệu nguy cơ, conflict và action items của ca hội chẩn gần nhất."
      variant="plain"
    >
      <div className="space-y-5">
        <CouncilWorkspaceNav />

        {!view ? (
          <CouncilEmptyState
            title="Chưa có snapshot để phân tích"
            description="Tạo một ca hội chẩn mới trước khi mở Analyze."
          />
        ) : (
          <>
            <CouncilSection eyebrow="Risk Overview" title="Tổng quan rủi ro và độ khẩn">
              <div className="grid gap-3 md:grid-cols-4">
                <CouncilMetricCard label="Urgency" value={view.urgencyLabel} />
                <CouncilMetricCard label="Signals" value={String(view.analyze.keySignals.length)} />
                <CouncilMetricCard label="Risk Drivers" value={String(view.analyze.riskDrivers.length)} />
                <CouncilMetricCard label="Action Items" value={String(view.analyze.actionItems.length)} />
              </div>
            </CouncilSection>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <CouncilSection eyebrow="Key Signals" title="Tín hiệu chính">
                <CouncilList
                  items={view.analyze.keySignals}
                  emptyText="Không thấy key signal rõ ràng trong snapshot hiện tại."
                />
              </CouncilSection>

              <CouncilSection eyebrow="Risk Drivers" title="Yếu tố làm tăng nguy cơ">
                <CouncilList
                  items={view.analyze.riskDrivers}
                  emptyText="Không ghi nhận risk driver nổi bật."
                />
              </CouncilSection>
            </div>

            <CouncilSection eyebrow="Actions" title="Danh sách hành động đề xuất">
              <CouncilList
                items={view.analyze.actionItems}
                emptyText="Chưa có action item cụ thể trong payload này."
              />
            </CouncilSection>
          </>
        )}
      </div>
    </PageShell>
  );
}
