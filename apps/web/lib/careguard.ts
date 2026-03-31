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

export type CareguardAttributionSource = {
  id: string;
  name: string;
  category?: string;
  type?: string;
};

export type CareguardAttributionCitation = {
  source: string;
  url?: string;
};

export type CareguardAttribution = {
  channel?: string;
  mode?: string | null;
  sourceCount: number;
  citationCount: number;
  sources: CareguardAttributionSource[];
  citations: CareguardAttributionCitation[];
};

export type CareguardSourceErrors = Record<string, string[]>;

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
  metadata?: unknown;
  attribution?: unknown;
  attributions?: unknown;
  fallback_used?: unknown;
  fallbackUsed?: unknown;
  source_errors?: unknown;
  sourceErrors?: unknown;
  mode?: unknown;
  [key: string]: unknown;
};

export type CareguardAnalyzeResult = {
  riskTier: string | null;
  ddiAlerts: CareguardDdiAlert[];
  recommendations: string[];
  attribution: CareguardAttribution | null;
  mode: string | null;
  fallbackUsed: boolean;
  sourceErrors: CareguardSourceErrors;
  sourceUsed: string[];
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

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined;
  }
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return undefined;
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

function parseAttributionSource(value: unknown): CareguardAttributionSource | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = asText(record.id);
  const name = asText(record.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    category: asText(record.category),
    type: asText(record.type)
  };
}

function parseAttributionCitation(value: unknown): CareguardAttributionCitation | null {
  const record = asRecord(value);
  if (!record) return null;
  const source = asText(record.source);
  if (!source) return null;
  return {
    source,
    url: asText(record.url)
  };
}

function parseAttribution(value: unknown): CareguardAttribution | null {
  const record = asRecord(value);
  if (!record) return null;

  const sources = Array.isArray(record.sources)
    ? record.sources.map((item) => parseAttributionSource(item)).filter((item): item is CareguardAttributionSource => Boolean(item))
    : [];
  const citations = Array.isArray(record.citations)
    ? record.citations
        .map((item) => parseAttributionCitation(item))
        .filter((item): item is CareguardAttributionCitation => Boolean(item))
    : [];

  const sourceCountRaw = record.source_count;
  const citationCountRaw = record.citation_count;
  const sourceCount =
    typeof sourceCountRaw === "number" && Number.isFinite(sourceCountRaw) ? sourceCountRaw : sources.length;
  const citationCount =
    typeof citationCountRaw === "number" && Number.isFinite(citationCountRaw) ? citationCountRaw : citations.length;

  return {
    channel: asText(record.channel),
    mode: asText(record.mode) ?? null,
    sourceCount,
    citationCount,
    sources,
    citations
  };
}

function parseSourceErrors(value: unknown): CareguardSourceErrors {
  const record = asRecord(value);
  if (!record) return {};
  const output: CareguardSourceErrors = {};
  for (const [key, next] of Object.entries(record)) {
    const values = parseStringList(next);
    if (!values.length) continue;
    output[key] = values;
  }
  return output;
}

function mergeSourceErrors(...values: CareguardSourceErrors[]): CareguardSourceErrors {
  const output: CareguardSourceErrors = {};
  for (const value of values) {
    for (const [key, messages] of Object.entries(value)) {
      if (!messages.length) continue;
      const existing = new Set(output[key] ?? []);
      messages.forEach((item) => existing.add(item));
      output[key] = Array.from(existing);
    }
  }
  return output;
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
  const metadata = asRecord(data.metadata);

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

  const attribution =
    parseAttribution(data.attribution) ??
    (Array.isArray(data.attributions) ? parseAttribution(data.attributions[0]) : null);

  const mode =
    attribution?.mode ??
    asText(data.mode) ??
    asText(metadata?.mode) ??
    (asBoolean(metadata?.external_ddi_enabled) === false
      ? "local_only"
      : asBoolean(metadata?.external_ddi_enabled) === true
        ? "external_plus_local"
        : null);

  const fallbackUsed =
    asBoolean(data.fallback_used) ??
    asBoolean(data.fallbackUsed) ??
    asBoolean(metadata?.fallback_used) ??
    asBoolean(metadata?.fallbackUsed) ??
    false;

  const sourceErrors = mergeSourceErrors(
    parseSourceErrors(data.source_errors),
    parseSourceErrors(data.sourceErrors),
    parseSourceErrors(metadata?.source_errors),
    parseSourceErrors(metadata?.sourceErrors)
  );

  const sourceUsed = [
    ...parseStringList((data as Record<string, unknown>).source_used),
    ...parseStringList((data as Record<string, unknown>).sourceUsed),
    ...parseStringList(metadata?.source_used),
    ...parseStringList(metadata?.sourceUsed)
  ].filter((value, index, list) => list.indexOf(value) === index);

  return {
    riskTier,
    ddiAlerts,
    recommendations,
    attribution,
    mode,
    fallbackUsed,
    sourceErrors,
    sourceUsed
  };
}
