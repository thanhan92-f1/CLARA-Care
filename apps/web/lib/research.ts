import api from "@/lib/http-client";

export type ResearchTier = "tier1" | "tier2";

export type Tier2Citation = {
  title: string;
  source?: string;
  url?: string;
  snippet?: string;
  year?: string;
};

export type Tier2Step = {
  title: string;
  detail?: string;
};

export type ResearchTier2RawResponse = {
  answer?: string;
  summary?: string;
  message?: string;
  citations?: unknown;
  sources?: unknown;
  steps?: unknown;
  workflow_steps?: unknown;
  [key: string]: unknown;
};

export type ResearchTier2Result = {
  answer: string;
  citations: Tier2Citation[];
  steps: Tier2Step[];
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

function parseCitation(value: unknown): Tier2Citation | null {
  if (typeof value === "string") {
    const title = asText(value);
    return title ? { title } : null;
  }

  const item = asRecord(value);
  if (!item) return null;

  const title =
    asText(item.title) ??
    asText(item.name) ??
    asText(item.source) ??
    asText(item.url) ??
    asText(item.id);

  if (!title) return null;

  return {
    title,
    source: asText(item.source) ?? asText(item.publisher) ?? asText(item.source_id),
    url: asText(item.url),
    snippet: asText(item.snippet) ?? asText(item.summary) ?? asText(item.relevance),
    year: asText(item.year)
  };
}

function parseStep(value: unknown): Tier2Step | null {
  if (typeof value === "string") {
    const title = asText(value);
    return title ? { title } : null;
  }

  const item = asRecord(value);
  if (!item) return null;

  const title =
    asText(item.title) ??
    asText(item.step) ??
    asText(item.name) ??
    asText(item.label) ??
    asText(item.action);

  if (!title) return null;

  return {
    title,
    detail:
      asText(item.detail) ??
      asText(item.description) ??
      asText(item.result) ??
      asText(item.notes) ??
      asText(item.objective) ??
      asText(item.output)
  };
}

function parseList<T>(value: unknown, parser: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) {
    const single = parser(value);
    return single ? [single] : [];
  }

  return value.map((item) => parser(item)).filter((item): item is T => Boolean(item));
}

export async function runResearchTier2(query: string): Promise<ResearchTier2RawResponse> {
  const response = await api.post<ResearchTier2RawResponse>("/research/tier2", { query, message: query });
  return response.data;
}

export function normalizeResearchTier2(data: ResearchTier2RawResponse): ResearchTier2Result {
  const answer = asText(data.answer) ?? asText(data.summary) ?? asText(data.message) ?? "";
  const citations = parseList(data.citations ?? data.sources, parseCitation);
  const steps = parseList(data.steps ?? data.workflow_steps, parseStep);

  return { answer, citations, steps };
}
