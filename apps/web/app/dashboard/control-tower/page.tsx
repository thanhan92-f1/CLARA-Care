"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/ui/page-shell";
import {
  ControlTowerConfig,
  ControlTowerRagSource,
  getControlTowerConfig,
  updateControlTowerConfig
} from "@/lib/system";

function sortSources(sources: ControlTowerRagSource[]): ControlTowerRagSource[] {
  return [...sources].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
}

export default function ControlTowerPage() {
  const [config, setConfig] = useState<ControlTowerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await getControlTowerConfig();
        setConfig({
          rag_sources: sortSources(response.rag_sources ?? []),
          rag_flow: response.rag_flow
        });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Không thể tải cấu hình control tower.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const onToggleSource = (sourceId: string) => {
    if (!config) return;
    const next = config.rag_sources.map((source) =>
      source.id === sourceId ? { ...source, enabled: !source.enabled } : source
    );
    setConfig({ ...config, rag_sources: sortSources(next) });
  };

  const onPriorityChange = (sourceId: string, value: string) => {
    if (!config) return;
    const priority = Number(value);
    const next = config.rag_sources.map((source) =>
      source.id === sourceId
        ? {
            ...source,
            priority: Number.isFinite(priority) ? Math.min(100, Math.max(1, Math.trunc(priority))) : source.priority
          }
        : source
    );
    setConfig({ ...config, rag_sources: sortSources(next) });
  };

  const onSave = async () => {
    if (!config) return;
    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const updated = await updateControlTowerConfig(config);
      setConfig({
        rag_sources: sortSources(updated.rag_sources ?? []),
        rag_flow: updated.rag_flow
      });
      setMessage("Đã lưu cấu hình nguồn RAG và flow trả lời.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu cấu hình.");
    } finally {
      setIsSaving(false);
    }
  };

  const onToggleFlow = (key: keyof ControlTowerConfig["rag_flow"]) => {
    if (!config || key === "low_context_threshold") return;
    setConfig({
      ...config,
      rag_flow: {
        ...config.rag_flow,
        [key]: !config.rag_flow[key]
      }
    });
  };

  if (isLoading) {
    return (
      <PageShell title="Control Tower">
        <p className="text-sm text-slate-600">Đang tải cấu hình...</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Control Tower">
      <div className="space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Dashboard điều phối RAG và flow trả lời</h2>
          <p className="mt-1 text-sm text-slate-600">
            Mô phỏng kiểu Dify: bật/tắt nguồn dữ liệu, điều chỉnh ưu tiên và kiểm soát luồng route/verify/fallback.
          </p>
        </section>

        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">RAG flow</p>
          {config ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                ["role_router_enabled", "Role Router lớp 1"],
                ["intent_router_enabled", "Intent Router lớp 2"],
                ["verification_enabled", "FIDES verification"],
                ["deepseek_fallback_enabled", "Fallback DeepSeek khi RAG yếu"]
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-sm text-slate-700">{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(config.rag_flow[key as keyof typeof config.rag_flow])}
                    onChange={() => onToggleFlow(key as keyof typeof config.rag_flow)}
                  />
                </label>
              ))}
              <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:col-span-2">
                <span className="text-sm text-slate-700">Ngưỡng low-context (0-1)</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  className="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  value={config.rag_flow.low_context_threshold}
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      rag_flow: {
                        ...config.rag_flow,
                        low_context_threshold: Number(event.target.value)
                      }
                    })
                  }
                />
              </label>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nguồn RAG</p>
          {config?.rag_sources?.length ? (
            <ul className="mt-3 space-y-2">
              {config.rag_sources.map((source) => (
                <li key={source.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{source.name}</p>
                      <p className="text-xs text-slate-600">
                        id: {source.id} | category: {source.category}
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      Bật nguồn
                      <input type="checkbox" checked={source.enabled} onChange={() => onToggleSource(source.id)} />
                    </label>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs text-slate-600">Ưu tiên</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={source.priority}
                      className="mt-1 w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                      onChange={(event) => onPriorityChange(source.id, event.target.value)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">Chưa có nguồn nào.</p>
          )}
        </section>

        <button
          type="button"
          disabled={isSaving || !config}
          onClick={onSave}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
      </div>
    </PageShell>
  );
}
