"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarBlocks, Sparkline } from "@/components/admin/admin-visuals";
import {
  getApiHealth,
  getControlTowerConfig,
  getSystemDependencies,
  getSystemMetrics,
  normalizeApiHealth,
  normalizeSystemDependencies,
  normalizeSystemMetrics
} from "@/lib/system";

type ObservabilityState = {
  loading: boolean;
  error: string;
  apiStatus: string;
  apiMessage: string;
  mlReachable: boolean | null;
  mlStatus: string;
  requestCount: number | null;
  errorCount: number | null;
  avgLatencyMs: number | null;
  totalSources: number;
  enabledSources: number;
  flowEnabledCount: number;
  lowContextThreshold: number;
  flow: {
    roleRouter: boolean;
    intentRouter: boolean;
    verificationGate: boolean;
    deepseekFallback: boolean;
    scientificRetrieval: boolean;
    webRetrieval: boolean;
    fileRetrieval: boolean;
  };
};

type TimelinePoint = {
  at: number;
  requests: number;
  errors: number;
  latencyMs: number;
};

type AlertLevel = "info" | "warn" | "critical";

type AlertItem = {
  level: AlertLevel;
  title: string;
  detail: string;
};

const INITIAL_STATE: ObservabilityState = {
  loading: true,
  error: "",
  apiStatus: "unknown",
  apiMessage: "",
  mlReachable: null,
  mlStatus: "unknown",
  requestCount: null,
  errorCount: null,
  avgLatencyMs: null,
  totalSources: 0,
  enabledSources: 0,
  flowEnabledCount: 0,
  lowContextThreshold: 0,
  flow: {
    roleRouter: false,
    intentRouter: false,
    verificationGate: false,
    deepseekFallback: false,
    scientificRetrieval: false,
    webRetrieval: false,
    fileRetrieval: false
  }
};

function toInt(value: number | null): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value ?? 0)) : 0;
}

function formatCount(value: number | null): string {
  if (!Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.max(0, value ?? 0));
}

function formatPercent(value: number): string {
  return `${Math.max(0, value).toFixed(1)}%`;
}

function toneForStatus(status: string): "ok" | "warn" {
  const normalized = status.toLowerCase();
  if (normalized.includes("ok") || normalized.includes("healthy") || normalized.includes("reachable")) return "ok";
  return "warn";
}

function pillClass(enabled: boolean): string {
  return enabled
    ? "border-emerald-300/80 bg-emerald-100/90 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-200"
    : "border-amber-300/80 bg-amber-100/90 text-amber-800 dark:border-amber-700 dark:bg-amber-950/45 dark:text-amber-200";
}

export default function AdminObservabilityPanel() {
  const [state, setState] = useState<ObservabilityState>(INITIAL_STATE);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      const [healthRaw, metricsRaw, dependenciesRaw, config] = await Promise.all([
        getApiHealth(),
        getSystemMetrics(),
        getSystemDependencies(),
        getControlTowerConfig()
      ]);

      const health = normalizeApiHealth(healthRaw);
      const metrics = normalizeSystemMetrics(metricsRaw);
      const dependencies = normalizeSystemDependencies(dependenciesRaw);

      const sources = Array.isArray(config.rag_sources) ? config.rag_sources : [];
      const enabledSources = sources.filter((source) => source.enabled).length;

      const flow = {
        roleRouter: Boolean(config.rag_flow.role_router_enabled),
        intentRouter: Boolean(config.rag_flow.intent_router_enabled),
        verificationGate: Boolean(config.rag_flow.verification_enabled),
        deepseekFallback: Boolean(config.rag_flow.deepseek_fallback_enabled),
        scientificRetrieval: Boolean(config.rag_flow.scientific_retrieval_enabled),
        webRetrieval: Boolean(config.rag_flow.web_retrieval_enabled),
        fileRetrieval: Boolean(config.rag_flow.file_retrieval_enabled)
      };

      const flowEnabledCount = Object.values(flow).filter(Boolean).length;

      setState({
        loading: false,
        error: "",
        apiStatus: health.status,
        apiMessage: health.message,
        mlReachable: dependencies.mlReachable,
        mlStatus: dependencies.mlStatus,
        requestCount: metrics.requestCount,
        errorCount: metrics.errorCount,
        avgLatencyMs: metrics.avgLatencyMs,
        totalSources: sources.length,
        enabledSources,
        flowEnabledCount,
        lowContextThreshold: config.rag_flow.low_context_threshold,
        flow
      });

      setTimeline((prev) => {
        const point: TimelinePoint = {
          at: Date.now(),
          requests: toInt(metrics.requestCount),
          errors: toInt(metrics.errorCount),
          latencyMs: toInt(metrics.avgLatencyMs)
        };
        const next = [...prev, point];
        return next.slice(-24);
      });
    } catch (cause) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: cause instanceof Error ? cause.message : "Unable to load observability snapshot."
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => {
      void load();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, load]);

  const requestCount = toInt(state.requestCount);
  const errorCount = toInt(state.errorCount);
  const successCount = Math.max(0, requestCount - errorCount);
  const latencyMs = toInt(state.avgLatencyMs);
  const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;
  const sourceCoverage = state.totalSources > 0 ? (state.enabledSources / state.totalSources) * 100 : 0;

  const requestSeries = useMemo(() => {
    if (timeline.length === 0) return [Math.max(1, requestCount)];
    return timeline.map((point) => Math.max(1, point.requests));
  }, [timeline, requestCount]);

  const latencySeries = useMemo(() => {
    if (timeline.length === 0) return [Math.max(1, latencyMs)];
    return timeline.map((point) => Math.max(1, point.latencyMs));
  }, [timeline, latencyMs]);

  const loadShape = useMemo(() => {
    const weightedFlow = Math.round(state.flowEnabledCount * 14);
    const thresholdWeight = Math.round(state.lowContextThreshold * 100);
    return [
      Math.max(1, successCount),
      Math.max(1, errorCount),
      Math.max(1, latencyMs),
      Math.max(1, weightedFlow),
      Math.max(1, thresholdWeight)
    ];
  }, [successCount, errorCount, latencyMs, state.flowEnabledCount, state.lowContextThreshold]);

  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = [];

    const apiOk = toneForStatus(state.apiStatus) === "ok";
    if (!apiOk) {
      items.push({
        level: "critical",
        title: "API health degraded",
        detail: state.apiMessage || "API status đang ở trạng thái không ổn định."
      });
    }

    if (state.mlReachable === false) {
      items.push({
        level: "critical",
        title: "ML dependency unreachable",
        detail: state.mlStatus || "Không kết nối được dịch vụ ML."
      });
    }

    if (errorRate >= 15) {
      items.push({
        level: "critical",
        title: "Error rate cao",
        detail: `Tỉ lệ lỗi hiện tại ${formatPercent(errorRate)} vượt ngưỡng cảnh báo.`
      });
    } else if (errorRate >= 8) {
      items.push({
        level: "warn",
        title: "Error rate tăng",
        detail: `Tỉ lệ lỗi ${formatPercent(errorRate)} cần theo dõi thêm.`
      });
    }

    if (latencyMs >= 1200) {
      items.push({
        level: "warn",
        title: "Latency cao",
        detail: `Độ trễ trung bình ${latencyMs}ms đang cao hơn mức vận hành bình thường.`
      });
    }

    if (sourceCoverage < 50 && state.totalSources > 0) {
      items.push({
        level: "warn",
        title: "Nguồn RAG enable thấp",
        detail: `Mới bật ${state.enabledSources}/${state.totalSources} nguồn.`
      });
    }

    if (items.length === 0) {
      items.push({
        level: "info",
        title: "Runtime ổn định",
        detail: "Chưa phát hiện tín hiệu bất thường từ health, dependency và metrics."
      });
    }

    return items;
  }, [errorRate, latencyMs, sourceCoverage, state.apiMessage, state.apiStatus, state.enabledSources, state.mlReachable, state.mlStatus, state.totalSources]);

  const flowRows: Array<{ label: string; enabled: boolean; detail: string }> = [
    { label: "Role Router", enabled: state.flow.roleRouter, detail: "Định tuyến theo vai trò người dùng." },
    { label: "Intent Router", enabled: state.flow.intentRouter, detail: "Tách ý định để chọn pipeline phù hợp." },
    { label: "Verification Gate", enabled: state.flow.verificationGate, detail: "Chặn phản hồi thiếu căn cứ tài liệu." },
    { label: "DeepSeek Fallback", enabled: state.flow.deepseekFallback, detail: "Dự phòng khi đường chính gặp sự cố." },
    { label: "Scientific Retrieval", enabled: state.flow.scientificRetrieval, detail: "Ưu tiên nguồn nghiên cứu y khoa." },
    { label: "Web Retrieval", enabled: state.flow.webRetrieval, detail: "Mở rộng tìm nguồn web khi cần." },
    { label: "File Retrieval", enabled: state.flow.fileRetrieval, detail: "Truy xuất từ tài liệu nội bộ đã upload." }
  ];

  const healthTone = toneForStatus(state.apiStatus);
  const mlTone = state.mlReachable === false ? "warn" : "ok";

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-cyan-300/45 bg-[linear-gradient(150deg,rgba(255,255,255,0.95),rgba(236,254,255,0.84))] p-4 shadow-[0_28px_62px_-44px_rgba(8,47,73,0.45)] dark:border-cyan-500/30 dark:bg-[linear-gradient(150deg,rgba(2,6,23,0.92),rgba(8,47,73,0.76))]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">In-App Monitoring</p>
            <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">Grafana-like Signal Board</h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Giám sát tập trung ngay trong admin: health, dependency, latency, error-rate, coverage và flow gates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300/70 bg-white/80 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
              <input
                type="checkbox"
                className="h-3.5 w-3.5"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
              />
              Auto 15s
            </label>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-cyan-400/60 bg-cyan-100/80 px-3 py-1.5 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-200 dark:border-cyan-500/45 dark:bg-cyan-950/45 dark:text-cyan-200 dark:hover:bg-cyan-900/65"
            >
              Refresh
            </button>
          </div>
        </div>

        {state.error ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/35 dark:text-rose-200">
            {state.error}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-wider text-slate-500">API Health</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{state.apiStatus}</p>
            <span className={["mt-1 inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold", healthTone === "ok" ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-200" : "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-950/45 dark:text-amber-200"].join(" ")}>
              {healthTone === "ok" ? "Stable" : "Investigate"}
            </span>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-wider text-slate-500">ML Dependency</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{state.mlReachable === false ? "unreachable" : "reachable"}</p>
            <span className={["mt-1 inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold", mlTone === "ok" ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-200" : "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-700 dark:bg-rose-950/45 dark:text-rose-200"].join(" ")}>
              {state.mlStatus}
            </span>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-wider text-slate-500">Requests / Errors</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {formatCount(state.requestCount)} <span className="text-sm text-rose-600 dark:text-rose-400">/ {formatCount(state.errorCount)}</span>
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Error rate: {formatPercent(errorRate)}</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-wider text-slate-500">Latency & Coverage</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{latencyMs}ms</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Sources: {state.enabledSources}/{state.totalSources} · Coverage {formatPercent(sourceCoverage)}
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Traffic Trend</h3>
            <span className="text-xs text-slate-500">24 snapshots</span>
          </div>
          <div className="mt-3">
            {state.loading ? <div className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" /> : <Sparkline points={requestSeries} />}
          </div>
          <p className="mt-2 text-xs text-slate-500">Theo dõi xu hướng request theo chu kỳ refresh.</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Latency Trend</h3>
            <span className="text-xs text-slate-500">ms</span>
          </div>
          <div className="mt-3">
            {state.loading ? <div className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" /> : <Sparkline points={latencySeries} stroke="#d97706" />}
          </div>
          <p className="mt-2 text-xs text-slate-500">Độ trễ trung bình để phát hiện phase chậm bất thường.</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Load Blocks</h3>
            <span className="text-xs text-slate-500">success/error/latency/flow/threshold</span>
          </div>
          <div className="mt-3">
            {state.loading ? <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" /> : <BarBlocks values={loadShape} />}
          </div>
          <p className="mt-2 text-xs text-slate-500">Block chart tóm tắt áp lực vận hành hiện tại.</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Flow Gate Matrix</h3>
          <p className="mt-1 text-xs text-slate-500">Kiểm soát các công tắc pipeline để giữ độ chính xác và an toàn.</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {flowRows.map((row) => (
              <div key={row.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.label}</p>
                  <span className={["inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold", pillClass(row.enabled)].join(" ")}>
                    {row.enabled ? "ON" : "OFF"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{row.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
            Flow enabled: <span className="font-semibold text-slate-900 dark:text-slate-100">{state.flowEnabledCount}/7</span> · Low context threshold: <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.round(state.lowContextThreshold * 100)}%</span>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Active Alerts</h3>
          <p className="mt-1 text-xs text-slate-500">Danh sách cảnh báo sinh từ snapshot runtime hiện tại.</p>

          <div className="mt-3 space-y-2">
            {alerts.map((alert, index) => {
              const toneClass = alert.level === "critical"
                ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                : alert.level === "warn"
                  ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  : "border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200";

              return (
                <div key={`${alert.title}-${index}`} className={["rounded-lg border p-3", toneClass].join(" ")}>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em]">{alert.level}</p>
                  <p className="mt-1 text-sm font-semibold">{alert.title}</p>
                  <p className="mt-1 text-xs opacity-90">{alert.detail}</p>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
