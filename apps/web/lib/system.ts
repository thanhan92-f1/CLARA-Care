import api from "@/lib/http-client";

export type ApiHealthRawResponse = {
  status?: string;
  message?: string;
  service?: string;
  detail?: string;
  [key: string]: unknown;
};

export type ApiHealthSnapshot = {
  status: string;
  message: string;
};

export type SystemMetricsRawResponse = {
  requests_total?: number;
  error_total?: number;
  request_count?: number;
  error_count?: number;
  avg_latency_ms?: number;
  [key: string]: unknown;
};

export type SystemMetricsSnapshot = {
  requestCount: number | null;
  errorCount: number | null;
  avgLatencyMs: number | null;
};

export type SystemDependenciesRawResponse = {
  ml_reachable?: boolean;
  ml_status?: string;
  dependencies?: Record<string, unknown>;
  [key: string]: unknown;
};

export type SystemDependenciesSnapshot = {
  mlReachable: boolean | null;
  mlStatus: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asText(value: unknown): string | null {
  if (typeof value === "string") {
    const next = value.trim();
    return next ? next : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const next = value.trim();
    if (!next) return null;
    const parsed = Number(next);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["true", "1", "yes", "y", "ok", "up", "healthy", "reachable"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "down", "unhealthy", "unreachable", "error"].includes(normalized)) return false;
  return null;
}

function pickUnknown(candidates: Array<Record<string, unknown> | null>, keys: string[]): unknown {
  for (const candidate of candidates) {
    if (!candidate) continue;
    for (const key of keys) {
      if (candidate[key] !== undefined && candidate[key] !== null) return candidate[key];
    }
  }
  return undefined;
}

function parseDurationMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const next = value.trim().toLowerCase();
  if (!next) return null;

  const msMatch = next.match(/^(-?\d+(?:\.\d+)?)\s*ms$/);
  if (msMatch) return Number(msMatch[1]);

  const sMatch = next.match(/^(-?\d+(?:\.\d+)?)\s*s(?:ec(?:ond)?s?)?$/);
  if (sMatch) return Number(sMatch[1]) * 1000;

  const parsed = Number(next);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveMlReachable(value: unknown): boolean | null {
  const direct = asBoolean(value);
  if (direct !== null) return direct;

  const text = asText(value)?.toLowerCase();
  if (!text) return null;
  if (text.includes("unreachable") || text.includes("down") || text.includes("error")) return false;
  if (text.includes("reachable") || text.includes("healthy") || text.includes("ok")) return true;
  return null;
}

export async function getApiHealth(): Promise<ApiHealthRawResponse> {
  const response = await api.get<ApiHealthRawResponse>("/health");
  return response.data;
}

export async function getSystemMetrics(): Promise<SystemMetricsRawResponse> {
  const response = await api.get<SystemMetricsRawResponse>("/system/metrics");
  return response.data;
}

export async function getSystemDependencies(): Promise<SystemDependenciesRawResponse> {
  const response = await api.get<SystemDependenciesRawResponse>("/system/dependencies");
  return response.data;
}

export function normalizeApiHealth(data: ApiHealthRawResponse): ApiHealthSnapshot {
  const status = asText(data.status) ?? "unknown";
  const message = asText(data.message) ?? asText(data.detail) ?? asText(data.service) ?? "No details";

  return { status, message };
}

export function normalizeSystemMetrics(data: SystemMetricsRawResponse): SystemMetricsSnapshot {
  const root = asRecord(data) ?? {};
  const candidates: Array<Record<string, unknown> | null> = [
    root,
    asRecord(root.data),
    asRecord(root.metrics),
    asRecord(root.summary),
    asRecord(root.system)
  ];

  const requestCount =
    asNumber(
      pickUnknown(candidates, [
        "requests_total",
        "request_count",
        "requestCount",
        "requests",
        "total_requests",
        "totalRequests",
      ])
    ) ?? null;
  const errorCount =
    asNumber(
      pickUnknown(candidates, ["error_total", "error_count", "errorCount", "errors", "total_errors", "totalErrors"])
    ) ??
    null;

  const avgLatencyMsRaw = pickUnknown(candidates, [
    "avg_latency_ms",
    "avgLatencyMs",
    "average_latency_ms",
    "latency_ms"
  ]);
  const avgLatencySecondsRaw = pickUnknown(candidates, ["avg_latency_s", "avgLatencySeconds", "latency_seconds"]);
  const avgLatencyFallbackRaw = pickUnknown(candidates, ["avg_latency", "avgLatency", "latency"]);
  const avgLatencySeconds = asNumber(avgLatencySecondsRaw);

  const avgLatencyMs =
    parseDurationMs(avgLatencyMsRaw) ??
    (avgLatencySeconds !== null ? avgLatencySeconds * 1000 : null) ??
    parseDurationMs(avgLatencyFallbackRaw);

  return {
    requestCount,
    errorCount,
    avgLatencyMs
  };
}

export function normalizeSystemDependencies(data: SystemDependenciesRawResponse): SystemDependenciesSnapshot {
  const root = asRecord(data) ?? {};
  const rootDependencies = asRecord(root.dependencies);
  const rootServices = asRecord(root.services);
  const rootData = asRecord(root.data);
  const dataDependencies = asRecord(rootData?.dependencies);
  const dataServices = asRecord(rootData?.services);

  const candidates: Array<Record<string, unknown> | null> = [
    root,
    rootData,
    rootDependencies,
    rootServices,
    dataDependencies,
    dataServices
  ];

  const mlObject = asRecord(
    pickUnknown(candidates, ["ml", "ml_service", "mlService", "machine_learning", "model_service"])
  );

  const mlReachable =
    resolveMlReachable(
      pickUnknown(candidates, ["ml_reachable", "mlReachable", "ml_health", "mlHealth", "ml_status", "mlStatus"])
    ) ??
    resolveMlReachable(
      pickUnknown(candidates, ["ml_available", "mlAvailable", "ml_up", "mlUp", "ml_ok", "mlOk"])
    ) ??
    resolveMlReachable(
      mlObject
        ? pickUnknown(
            [mlObject],
            ["reachable", "healthy", "available", "ok", "up", "status", "state", "health", "message"]
          )
        : undefined
    );

  const mlStatusText =
    asText(pickUnknown(candidates, ["ml_status", "mlStatus"])) ??
    asText(
      mlObject
        ? pickUnknown([mlObject], ["status", "state", "health", "message", "detail", "description"])
        : undefined
    );

  const mlStatus =
    mlReachable === true ? "reachable" : mlReachable === false ? "unreachable" : mlStatusText ?? "unknown";

  return { mlReachable, mlStatus };
}
