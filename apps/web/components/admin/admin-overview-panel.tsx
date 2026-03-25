"use client";

import { BarBlocks, Sparkline } from "@/components/admin/admin-visuals";
import { FLOW_FLAG_META } from "@/components/admin/admin-config-meta";
import useControlTowerConfig from "@/components/admin/use-control-tower-config";

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function AdminOverviewPanel() {
  const { config, error, isLoading, reload } = useControlTowerConfig();

  const totalSources = config?.rag_sources.length ?? 0;
  const enabledSources = config?.rag_sources.filter((source) => source.enabled).length ?? 0;
  const categoryCount = new Set(config?.rag_sources.map((source) => source.category) ?? []).size;

  const flowEnabledCount = config
    ? Object.keys(FLOW_FLAG_META).filter((key) => config.rag_flow[key as keyof typeof FLOW_FLAG_META]).length
    : 0;
  const flowTotal = Object.keys(FLOW_FLAG_META).length;

  const sourceCoverage = totalSources > 0 ? enabledSources / totalSources : 0;
  const flowCoverage = flowTotal > 0 ? flowEnabledCount / flowTotal : 0;
  const prioritySeries =
    config?.rag_sources.slice(0, 10).map((source) => Math.max(1, 101 - source.priority)) ?? [];
  const thresholdSeries = config
    ? [
        config.rag_flow.low_context_threshold * 100,
        Math.max(0, 100 - config.rag_flow.low_context_threshold * 100),
        flowEnabledCount * 22
      ]
    : [];

  return (
    <div className="space-y-4">
      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-lg border border-rose-300 bg-white px-2 py-1 text-xs font-medium text-rose-700"
          >
            Retry
          </button>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">RAG Configuration Block</p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">Source Matrix</h3>
              <p className="mt-1 text-xs text-slate-600">Theo dõi coverage, taxonomy và mức ưu tiên của nguồn tri thức.</p>
            </div>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-mono text-slate-700">
              sources:{totalSources}
            </span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Enabled</p>
              <p className="mt-1 text-lg font-semibold text-emerald-600">{enabledSources}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Categories</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{categoryCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Coverage</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{pct(sourceCoverage)}</p>
            </div>
          </div>
          <div className="mt-3 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${Math.round(sourceCoverage * 100)}%` }} />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Answer Flow Block</p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">Decision Orchestration</h3>
              <p className="mt-1 text-xs text-slate-600">Giám sát trạng thái các flow flags và ngưỡng low-context của router.</p>
            </div>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-mono text-slate-700">
              flags:{flowEnabledCount}/{flowTotal}
            </span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Flow Flags</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {flowEnabledCount}/{flowTotal}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Flow Coverage</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{pct(flowCoverage)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">low_context_threshold</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{config?.rag_flow.low_context_threshold ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500" style={{ width: `${Math.round(flowCoverage * 100)}%` }} />
          </div>
        </article>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">RAG Sources</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totalSources}</p>
          <p className="mt-1 text-xs text-slate-600">Nguồn dữ liệu đang khai báo</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">Enabled Sources</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{enabledSources}</p>
          <p className="mt-1 text-xs text-slate-600">Coverage {pct(sourceCoverage)}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">Flow Flags</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {flowEnabledCount}/{flowTotal}
          </p>
          <p className="mt-1 text-xs text-slate-600">Router, verification, fallback</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">Categories</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{categoryCount}</p>
          <p className="mt-1 text-xs text-slate-600">Nhóm nguồn dữ liệu</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Source Priority Trend</h3>
            <span className="text-xs text-slate-500">Top 10 sources</span>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <Sparkline points={prioritySeries} stroke="#0284c7" />
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">Điểm cao hơn thể hiện ưu tiên cao hơn (priority gần 1).</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Flow Balance</h3>
            <span className="text-xs text-slate-500">Threshold vs Flags</span>
          </div>
          <div className="mt-3">
            {isLoading ? <div className="h-16 animate-pulse rounded-lg bg-slate-100" /> : <BarBlocks values={thresholdSeries} />}
          </div>
          <p className="mt-2 text-xs text-slate-500">`low_context_threshold` đang là {config?.rag_flow.low_context_threshold ?? 0}.</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Live Snapshot</h3>
        {isLoading ? (
          <div className="mt-3 h-24 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-2 py-2">Source</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Priority</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(config?.rag_sources ?? []).slice(0, 6).map((source) => (
                  <tr key={source.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-2 py-2 font-medium text-slate-800">{source.name}</td>
                    <td className="px-2 py-2 text-slate-600">{source.category}</td>
                    <td className="px-2 py-2 text-slate-600">{source.priority}</td>
                    <td className="px-2 py-2">
                      <span
                        className={[
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          source.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        ].join(" ")}
                      >
                        {source.enabled ? "enabled" : "disabled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
