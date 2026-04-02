"use client";

import { useEffect, useMemo, useState } from "react";
import CouncilEmptyState from "@/components/council/council-empty-state";
import CouncilWorkspaceNav from "@/components/council/council-workspace-nav";
import { CouncilList, CouncilSection } from "@/components/council/council-primitives";
import PageShell from "@/components/ui/page-shell";
import { CouncilRunSnapshot, loadCouncilSnapshot } from "@/lib/council";
import { buildCouncilView } from "@/lib/council-view";

export default function CouncilDetailsPage() {
  const [snapshot, setSnapshot] = useState<CouncilRunSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(loadCouncilSnapshot());
  }, []);

  const view = useMemo(() => (snapshot ? buildCouncilView(snapshot) : null), [snapshot]);

  return (
    <PageShell
      title="Council Details"
      description="Chi tiết dữ liệu đầu vào và reasoning log của từng chuyên khoa trong ca gần nhất."
      variant="plain"
    >
      <div className="space-y-5">
        <CouncilWorkspaceNav />

        {!view ? (
          <CouncilEmptyState
            title="Chưa có snapshot chi tiết"
            description="Bạn cần chạy hội chẩn trước khi mở trang Details."
          />
        ) : (
          <>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <CouncilSection eyebrow="Input Summary" title="Dữ liệu đầu vào">
                <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]">Symptoms</p>
                    <div className="mt-1">
                      <CouncilList
                        items={view.requestSummary.symptoms}
                        emptyText="Không có triệu chứng được ghi nhận."
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]">Medications</p>
                    <div className="mt-1">
                      <CouncilList
                        items={view.requestSummary.medications}
                        emptyText="Không có thuốc được ghi nhận."
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]">History</p>
                    <p className="mt-1 whitespace-pre-wrap">{view.requestSummary.history || "Không có bệnh sử."}</p>
                  </div>
                </div>
              </CouncilSection>

              <CouncilSection eyebrow="Labs" title="Xét nghiệm và sinh hiệu">
                {!view.requestSummary.labs.length ? (
                  <p className="text-sm text-[var(--text-secondary)]">Không có labs được ghi nhận trong request.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[color:var(--shell-border)] text-[var(--text-muted)]">
                          <th className="px-2 py-2 font-semibold">Marker</th>
                          <th className="px-2 py-2 font-semibold">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {view.requestSummary.labs.map((row) => (
                          <tr key={`${row.name}-${row.value}`} className="border-b border-[color:var(--shell-border)]/60">
                            <td className="px-2 py-2 text-[var(--text-primary)]">{row.name}</td>
                            <td className="px-2 py-2 text-[var(--text-secondary)]">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CouncilSection>
            </div>

            <CouncilSection eyebrow="Specialist Logs" title="Reasoning theo chuyên khoa">
              {!view.details.specialistLogs.length ? (
                <p className="text-sm text-[var(--text-secondary)]">Không có specialist logs trong snapshot hiện tại.</p>
              ) : (
                <ul className="space-y-3">
                  {view.details.specialistLogs.map((log, index) => (
                    <li
                      key={`${log.specialist}-${index}`}
                      className="rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{log.specialist}</p>
                        {log.confidence ? (
                          <span className="rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                            confidence: {log.confidence}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">{log.reasoning}</p>
                      {log.recommendation ? (
                        <p className="mt-2 rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                          Recommendation: {log.recommendation}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CouncilSection>
          </>
        )}
      </div>
    </PageShell>
  );
}
