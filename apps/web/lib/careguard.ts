import api from "@/lib/http-client";

export type CareguardAnalyzeRequest = {
  symptoms: string[];
  labs: Record<string, number | string>;
  medications: string[];
  allergies: string[];
};

export type CareguardDdiAlert = {
  title: string;
  severity?: string;
  details?: string;
};

export type CareguardAnalyzeRawResponse = {
  risk_tier?: string;
  riskTier?: string;
  tier?: string;
  risk?: string;
  risk_obj?: {
    level?: string;
  };
  ddi_alerts?: unknown;
  ddiAlerts?: unknown;
  recommendations?: unknown;
  recommendation?: unknown;
  [key: string]: unknown;
};

export type CareguardAnalyzeResult = {
  riskTier: string | null;
  ddiAlerts: CareguardDdiAlert[];
  recommendations: string[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const next = value.trim();
  return next ? next : undefined;
}

function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asText(item))
      .filter((item): item is string => Boolean(item));
  }

  const single = asText(value);
  return single ? [single] : [];
}

function parseDdiAlert(value: unknown): CareguardDdiAlert | null {
  if (typeof value === "string") {
    const text = asText(value);
    return text ? { title: text } : null;
  }

  const item = asRecord(value);
  if (!item) return null;

  const title =
    asText(item.title) ??
    asText(item.interaction) ??
    asText(item.pair) ??
    asText(item.summary) ??
    asText(item.message) ??
    asText(item.alert);

  if (!title) return null;

  return {
    title,
    severity: asText(item.severity) ?? asText(item.level) ?? asText(item.risk),
    details:
      asText(item.details) ??
      asText(item.description) ??
      asText(item.recommendation) ??
      asText(item.advice)
  };
}

function parseDdiAlerts(value: unknown): CareguardDdiAlert[] {
  if (!Array.isArray(value)) {
    const single = parseDdiAlert(value);
    return single ? [single] : [];
  }

  return value
    .map((item) => parseDdiAlert(item))
    .filter((item): item is CareguardDdiAlert => Boolean(item));
}

export function parseFreeTextList(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseLabsInput(value: string): Record<string, number | string> {
  const output: Record<string, number | string> = {};
  const tokens = parseFreeTextList(value);
  for (const token of tokens) {
    const [rawKey, rawValue] = token.split(/[:=]/, 2);
    if (!rawKey || !rawValue) continue;
    const key = rawKey.trim().toLowerCase();
    const valueText = rawValue.trim();
    if (!key || !valueText) continue;
    const numeric = Number(valueText);
    output[key] = Number.isFinite(numeric) ? numeric : valueText;
  }
  return output;
}

export async function analyzeCareguard(payload: CareguardAnalyzeRequest): Promise<CareguardAnalyzeRawResponse> {
  const response = await api.post<CareguardAnalyzeRawResponse>("/careguard/analyze", payload);
  return response.data;
}

export function normalizeCareguardResult(data: CareguardAnalyzeRawResponse): CareguardAnalyzeResult {
  const riskRecord = asRecord(data.risk);
  const riskTier =
    asText(data.risk_tier) ??
    asText(data.riskTier) ??
    asText(data.tier) ??
    asText(data.risk) ??
    asText(riskRecord?.level) ??
    null;

  const ddiAlerts = parseDdiAlerts(data.ddi_alerts ?? data.ddiAlerts);

  const recommendations = [
    ...parseStringList(data.recommendations),
    ...parseStringList(data.recommendation)
  ];

  return {
    riskTier,
    ddiAlerts,
    recommendations
  };
}
